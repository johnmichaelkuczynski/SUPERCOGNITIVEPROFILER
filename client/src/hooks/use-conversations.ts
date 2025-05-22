import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef, useCallback } from "react";

interface Message {
  id: number;
  conversationId: number;
  content: string;
  role: string;
  timestamp: Date | null;
  metadata: string | null;
  documentReferences: string | null;
}

interface Conversation {
  id: number;
  title: string;
  userId: number;
  model: string | null;
  metadata: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  contextDocumentIds: string | null;
}

type WebSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'failed';

export function useConversations() {
  const queryClient = useQueryClient();
  const [wsStatus, setWsStatus] = useState<WebSocketStatus>('disconnected');
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [streamingMessage, setStreamingMessage] = useState<string>('');
  const socket = useRef<WebSocket | null>(null);
  
  // Connect to WebSocket
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    socket.current = new WebSocket(wsUrl);
    setWsStatus('connecting');
    
    socket.current.onopen = () => {
      setWsStatus('connected');
      console.log('Connected to WebSocket server');
    };
    
    socket.current.onclose = () => {
      setWsStatus('disconnected');
      console.log('Disconnected from WebSocket server');
    };
    
    socket.current.onerror = (error) => {
      setWsStatus('failed');
      console.error('WebSocket error:', error);
    };
    
    socket.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'chat_response') {
          // Invalidate messages query to refresh the list
          if (currentConversation) {
            queryClient.invalidateQueries({ queryKey: [`/api/conversations/${data.conversationId}/messages`] });
          }
          
          // Handle streaming response
          setStreamingMessage(data.content);
        } else if (data.type === 'error') {
          console.error('WebSocket error message:', data.message);
        } else if (data.type === 'message_received') {
          // Confirmation that a message was received
          console.log('Message received by server, ID:', data.messageId);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    return () => {
      if (socket.current) {
        socket.current.close();
      }
    };
  }, [queryClient]);
  
  // Get all conversations
  const { data: conversations, isLoading: conversationsLoading, error: conversationsError, refetch: refetchConversations } = useQuery({
    queryKey: ['/api/conversations'],
    retry: 3,
    refetchOnWindowFocus: true,
    refetchInterval: 30000 // Refetch every 30 seconds
  });
  
  // Get messages for the current conversation
  const { data: messages, isLoading: messagesLoading, error: messagesError } = useQuery({
    queryKey: [`/api/conversations/${currentConversation?.id}/messages`],
    enabled: !!currentConversation,
    retry: false
  });
  
  // Create a new conversation
  const createConversationMutation = useMutation({
    mutationFn: async ({ title, model, contextDocumentIds }: { 
      title: string; 
      model?: string; 
      contextDocumentIds?: string[];
    }) => {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          model,
          contextDocumentIds: contextDocumentIds && contextDocumentIds.length > 0 
            ? contextDocumentIds 
            : null
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create conversation');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
  });
  
  // Send a message
  const sendMessage = useCallback(
    (content: string, options?: { temperature?: number; chunkSize?: string; maxTokens?: number; stream?: boolean }) => {
      if (!currentConversation || !socket.current || socket.current.readyState !== WebSocket.OPEN) {
        console.error('Cannot send message: No active conversation or WebSocket not connected');
        return;
      }
      
      // Clear any previous streaming message
      setStreamingMessage('');
      
      // Send the message through WebSocket
      socket.current.send(
        JSON.stringify({
          type: 'chat_message',
          conversationId: currentConversation.id,
          content,
          ...options
        })
      );
      
      // Immediately invalidate to show user message
      queryClient.invalidateQueries({ queryKey: [`/api/conversations/${currentConversation.id}/messages`] });
    },
    [currentConversation, queryClient]
  );
  
  // Select a conversation
  const selectConversation = useCallback((conversation: Conversation) => {
    setCurrentConversation(conversation);
    // Clear streaming message when changing conversations
    setStreamingMessage('');
  }, []);
  
  // Delete a conversation
  const deleteConversationMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete conversation');
      }
      
      return response.json();
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      
      // If the deleted conversation was the current one, clear it
      if (currentConversation?.id === id) {
        setCurrentConversation(null);
      }
    },
  });
  
  return {
    conversations,
    conversationsLoading,
    conversationsError,
    currentConversation,
    messages,
    messagesLoading,
    messagesError,
    streamingMessage,
    wsStatus,
    createConversation: createConversationMutation.mutate,
    isCreatingConversation: createConversationMutation.isPending,
    selectConversation,
    sendMessage,
    deleteConversation: deleteConversationMutation.mutate,
    isDeletingConversation: deleteConversationMutation.isPending,
  };
}