import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LLMModel, formatBytes } from '@/lib/utils';
import { Send, Upload, X, FileText, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import 'katex/dist/katex.min.css';
import DocumentExportButtons from '@/components/DocumentExportButtons';
import LargeDocumentRewrite from '@/components/LargeDocumentRewrite';

interface Message {
  id: number;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  files?: File[];
}

export default function Home() {
  // Basic state
  const [selectedModel, setSelectedModel] = useState<LLMModel>('claude');
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<AbortController | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Auto-resize textarea as content grows
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [prompt]);
  
  const handleProcessRequest = async () => {
    // Allow empty prompts if files are uploaded
    if (!prompt.trim() && files.length === 0) return;
    
    // Save user message
    const userContent = prompt.trim() || "Please analyze these documents";
    const userMessage: Message = {
      id: Date.now(),
      content: userContent,
      role: 'user',
      timestamp: new Date(),
      files: files.length > 0 ? [...files] : undefined
    };
    
    // Add user message to message history
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setIsProcessing(true); // Set processing flag for cancel button
    setPrompt(''); // Clear the input immediately
    
    // Create abort controller for cancellation
    const controller = new AbortController();
    setCurrentRequest(controller);
    
    try {
      const formData = new FormData();
      formData.append('content', userContent);
      formData.append('model', selectedModel);
      formData.append('stream', 'false');
      formData.append('temperature', '0.7');
      
      // Create context from previous messages for conversation memory
      // This helps the model remember previous interactions
      const conversationContext = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Add conversation history to the request
      formData.append('conversation_history', JSON.stringify(conversationContext));
      
      // Add any uploaded files to the request
      if (files.length > 0) {
        files.forEach(file => {
          formData.append('files', file);
        });
      }
      
      // Start a loading message that shows while processing
      const loadingMessageId = Date.now() + 1;
      const loadingMessage: Message = {
        id: loadingMessageId,
        content: `Processing your request... ${files.length > 0 ? 'This document may take some time to process. You can cancel at any time using the Cancel button above.' : ''}`,
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, loadingMessage]);
      
      const res = await fetch('/api/llm/prompt', {
        method: 'POST',
        body: formData,
        signal: controller.signal // Add abort signal
      });
      
      if (!res.ok) {
        throw new Error('Failed to process request');
      }
      
      const data = await res.json();
      
      // Replace loading message with actual response
      setMessages(prev => prev.filter(msg => msg.id !== loadingMessageId));
      
      // Add AI response to messages
      const aiMessage: Message = {
        id: Date.now() + 2,
        content: data.content,
        role: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setFiles([]); // Clear files after successful response
    } catch (error) {
      console.error('Error processing request:', error);
      
      // Check if this was an abort error
      if ((error as Error).name === 'AbortError') {
        // Don't add an error message for user-initiated cancellations
        console.log('Request was cancelled by user');
      } else {
        // Add error message for real errors
        const errorMessage: Message = {
          id: Date.now() + 3,
          content: 'Error: Failed to get a response. Please try again.',
          role: 'assistant',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
      setIsProcessing(false);
      setCurrentRequest(null);
    }
  };

  // Cancel any ongoing request
  const cancelRequest = () => {
    console.log("Cancelling request...");
    
    // Only try to abort if there's an active request
    if (currentRequest) {
      try {
        currentRequest.abort();
        console.log("Request aborted successfully");
      } catch (e) {
        console.error("Error aborting request:", e);
      }
    }
    
    // Reset all state related to processing
    setIsLoading(false);
    setIsProcessing(false);
    setCurrentRequest(null);
    
    // Add cancellation message
    const cancelMessage: Message = {
      id: Date.now(),
      content: '⚠️ Processing cancelled. You can start a new chat or upload another document.',
      role: 'assistant',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, cancelMessage]);
  };
  
  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Allow submission on Enter if either there's text OR files have been uploaded
    if (e.key === 'Enter' && !e.shiftKey && (prompt.trim() || files.length > 0)) {
      e.preventDefault();
      handleProcessRequest();
    }
  };
  
  // File upload handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      
      // Clear any previously staged files since we're processing immediately
      setFiles([]);
      
      // Process each file individually immediately upon upload
      selectedFiles.forEach(file => {
        // Process this individual file immediately
        processIndividualFile(file);
      });
      
      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // Process a single file with AI
  const processIndividualFile = async (file: File) => {
    try {
      setIsLoading(true);
      
      // Create a message showing we're processing this file
      const userMessage: Message = {
        id: Date.now(),
        content: `Please analyze this document: ${file.name}`,
        role: 'user',
        timestamp: new Date(),
        files: [file]
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      // Create form data
      const formData = new FormData();
      formData.append('content', `Please analyze this document: ${file.name}`);
      formData.append('model', selectedModel);
      formData.append('stream', 'false');
      formData.append('temperature', '0.7');
      formData.append('files', file);
      
      // Add conversation history to keep context
      const conversationContext = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      formData.append('conversation_history', JSON.stringify(conversationContext));
      
      // Make the API call
      const res = await fetch('/api/llm/prompt', {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        throw new Error('Failed to process document');
      }
      
      const data = await res.json();
      
      // Add AI response to messages
      const aiMessage: Message = {
        id: Date.now() + 1,
        content: data.content,
        role: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error processing file:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: Date.now() + 1,
        content: `Error processing document: ${file.name}. Please try again.`,
        role: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRemoveFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };
  
  const clearChat = () => {
    setPrompt('');
    setMessages([]);
    setFiles([]);
    setIsLoading(false);
    setIsProcessing(false);
    // Cancel any ongoing request
    if (currentRequest) {
      try {
        currentRequest.abort();
      } catch (e) {
        console.error("Error aborting request:", e);
      }
      setCurrentRequest(null);
    }
  };
  
  const renderMessageContent = (content: string) => {
    // If content is extremely large (over 50,000 characters), truncate it for display
    const isVeryLarge = content.length > 50000;
    const displayContent = isVeryLarge 
      ? content.substring(0, 50000) + "...\n\n**Note:** This document is very large ("+content.length+" characters). The full content is available for download."
      : content;
      
    return (
      <div className="prose dark:prose-invert prose-sm max-w-none">
        <ReactMarkdown
          rehypePlugins={[rehypeKatex]}
          remarkPlugins={[remarkMath]}
        >
          {displayContent}
        </ReactMarkdown>
        
        {/* Document export options - show for all messages over 1000 characters or very large documents */}
        {(isVeryLarge || content.length > 1000) && (
          <div className="mt-4 flex space-x-2 items-center">
            {isVeryLarge && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  // Create and download text file with full content
                  const blob = new Blob([content], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'full_document.txt';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
              >
                Download Full Document
              </Button>
            )}
            
            {/* Advanced export and email options */}
            <DocumentExportButtons 
              content={content} 
              filename={`document_${new Date().toISOString().split('T')[0]}`} 
            />
          </div>
        )}
      </div>
    );
  };

  // Get the current state of files and document for the document rewriter
  const getLastUploadedDocument = () => {
    if (files.length > 0) {
      // Return the first file in the current files array
      return {
        name: files[0].name,
        content: "Loading..." // This will be read by the component on upload
      };
    }
    
    // Look for the last document in the conversation
    const lastDocMessage = [...messages].reverse().find(msg => msg.files && msg.files.length > 0);
    if (lastDocMessage?.files && lastDocMessage.files.length > 0) {
      return {
        name: lastDocMessage.files[0].name,
        content: "Loading..." // This will be read by the component on upload
      };
    }
    
    return undefined;
  };
  
  // Get conversation insights for document rewriting
  const getConversationInsights = () => {
    // Filter for assistant responses that might contain insights
    const assistantMessages = messages.filter(msg => msg.role === 'assistant');
    if (assistantMessages.length === 0) return '';
    
    // Get the last 3 assistant messages for insights
    const recentMessages = assistantMessages.slice(-3);
    return recentMessages.map(msg => msg.content).join('\n\n');
  };

  return (
    <main className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">TextMind Chat</h1>
      
      {/* Add a prominent cancellation bar at the top when processing */}
      {isProcessing && (
        <div className="bg-red-100 p-3 mb-4 rounded-lg flex justify-between items-center">
          <div className="flex items-center">
            <div className="animate-spin mr-2">⏳</div>
            <span className="font-medium">Processing document... This may take some time.</span>
          </div>
          <Button 
            variant="destructive" 
            onClick={cancelRequest}
            className="bg-red-600 hover:bg-red-700"
          >
            Cancel Processing
          </Button>
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Model Selection</CardTitle>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearChat}
                  className="hover:bg-blue-100"
                >
                  New Chat
                </Button>
                
                {messages.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearChat}
                    className="text-muted-foreground hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear Chat
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant={selectedModel === 'claude' ? 'default' : 'outline'} 
                onClick={() => setSelectedModel('claude')}
              >
                Claude
              </Button>
              <Button 
                variant={selectedModel === 'gpt4' ? 'default' : 'outline'} 
                onClick={() => setSelectedModel('gpt4')}
              >
                GPT-4
              </Button>
              <Button 
                variant={selectedModel === 'perplexity' ? 'default' : 'outline'} 
                onClick={() => setSelectedModel('perplexity')}
              >
                Perplexity
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm flex flex-col" style={{ minHeight: '600px' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Conversation</CardTitle>
          </CardHeader>
          
          <ScrollArea className="flex-1 p-4 pb-0">
            <div className="space-y-6">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Your conversation will appear here</p>
                  <p className="text-sm">Start typing below to chat with the AI</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">
                        {message.role === "user" ? "You" : "AI"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    
                    <Card className={`${
                      message.role === "user" 
                        ? "bg-primary-foreground" 
                        : "bg-card"
                    }`}>
                      <CardContent className="p-4">
                        {renderMessageContent(message.content)}
                        
                        {/* Display files attached to user messages */}
                        {message.files && message.files.length > 0 && (
                          <div className="mt-3 border-t pt-3">
                            <p className="text-xs font-medium mb-2">Attached files:</p>
                            <div className="space-y-1">
                              {message.files.map((file, index) => (
                                <div key={index} className="flex items-center text-xs">
                                  <FileText className="h-3 w-3 mr-1 text-blue-500" />
                                  <span className="truncate">{file.name}</span>
                                  <span className="ml-1 text-muted-foreground">({formatBytes(file.size)})</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ))
              )}
              
              {isLoading && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">AI</span>
                  </div>
                  
                  <Card>
                    <CardContent className="p-4 flex items-center justify-center py-12">
                      <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
                        <p className="text-muted-foreground">AI is thinking...</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          <Separator className="mt-auto" />
          
          <div className="p-4">
            <div className="space-y-4">
              <div className="flex space-x-4">
                <textarea 
                  ref={textareaRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 min-h-[100px] p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Type your question or prompt here and press Enter to send..."
                  disabled={isLoading}
                  rows={3}
                />
                <Button 
                  onClick={handleProcessRequest} 
                  size="icon"
                  disabled={isLoading || (!prompt.trim() && files.length === 0)}
                >
                  {isLoading ? (
                    <div className="animate-spin h-4 w-4 border-2 border-b-transparent border-white rounded-full"></div>
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {/* File Upload UI */}
              <div>
                <div 
                  className="border-2 border-dashed rounded-lg p-3 text-center cursor-pointer hover:bg-slate-50"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mx-auto text-slate-400 mb-1" />
                  <p className="text-xs text-slate-600">Upload files for context</p>
                  <p className="text-xs text-slate-500">PDF, DOCX, TXT, JPG, PNG</p>
                  <input 
                    type="file" 
                    className="hidden" 
                    multiple 
                    accept=".pdf,.docx,.txt,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                  />
                </div>
                
                {files.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-slate-100 rounded-lg px-2 py-1 text-xs">
                        <div className="flex items-center gap-1 overflow-hidden">
                          <FileText className="h-3 w-3 text-blue-500" />
                          <span className="truncate">{file.name}</span>
                          <span className="text-xs text-slate-500 whitespace-nowrap">({formatBytes(file.size)})</span>
                        </div>
                        <button 
                          className="text-slate-500 hover:text-red-500 flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFile(index);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Press Enter to send, Shift+Enter for new line
                </p>
                
                {/* Large Document Rewrite Button */}
                <LargeDocumentRewrite 
                  lastUploadedDocument={getLastUploadedDocument()}
                  selectedModel={selectedModel}
                  conversationInsights={getConversationInsights()}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
