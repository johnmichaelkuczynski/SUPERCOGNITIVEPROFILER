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
import DocumentRewriteTab from '@/components/DocumentRewriteTab';

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
  
  // Tabs state
  const [activeTab, setActiveTab] = useState<string>('chat');
  
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
      
      const response = await fetch('/api/llm/prompt', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });
      
      if (!response.ok) {
        throw new Error('Failed to process request');
      }
      
      const data = await response.json();
      
      // Replace the loading message with the actual response
      setMessages(prev => prev.map(msg => 
        msg.id === loadingMessageId 
          ? { ...msg, content: data.content } 
          : msg
      ));
      
      // Clear uploaded files after processing
      setFiles([]);
      
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('Request was cancelled');
        // Remove the loading message
        setMessages(prev => prev.filter(msg => msg.id !== (Date.now() + 1)));
        
        // Add a cancellation message
        setMessages(prev => [...prev, {
          id: Date.now() + 2,
          content: 'Request was cancelled.',
          role: 'assistant',
          timestamp: new Date()
        }]);
      } else {
        console.error('Error processing request:', error);
        
        // Replace loading message with error message
        setMessages(prev => prev.map(msg => 
          msg.id === (Date.now() + 1)
            ? { 
                ...msg, 
                content: 'Sorry, there was an error processing your request. Please try again.' 
              } 
            : msg
        ));
      }
    } finally {
      setIsLoading(false);
      setIsProcessing(false);
      setCurrentRequest(null);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };
  
  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const cancelRequest = () => {
    if (currentRequest) {
      currentRequest.abort();
    }
  };
  
  const clearChat = () => {
    setMessages([]);
    setFiles([]);
    setPrompt('');
  };
  
  // Render message bubble with optional file attachments
  const renderMessage = (message: Message) => {
    return (
      <div 
        key={message.id}
        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
      >
        <div 
          className={`max-w-[80%] p-3 rounded-lg
            ${message.role === 'user' 
              ? 'bg-blue-600 text-white ml-12' 
              : 'bg-gray-200 text-gray-800 mr-12'
            }`}
        >
          {message.files && message.files.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {message.files.map((file, index) => (
                <div 
                  key={index} 
                  className="flex items-center bg-white/10 text-xs rounded px-2 py-1"
                >
                  <FileText className="h-3 w-3 mr-1" />
                  <span className="truncate max-w-[100px]">{file.name}</span>
                </div>
              ))}
            </div>
          )}
          
          {message.role === 'assistant' ? (
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <ReactMarkdown 
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="whitespace-pre-wrap">{message.content}</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <main className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">TextMind Chat</h1>
        
        {/* Tab navigation */}
        <div className="flex gap-4">
          <Button 
            variant={activeTab === 'chat' ? 'default' : 'outline'}
            onClick={() => setActiveTab('chat')}
          >
            Chat
          </Button>
          <Button 
            variant={activeTab === 'rewrite' ? 'default' : 'outline'}
            onClick={() => setActiveTab('rewrite')}
          >
            Rewrite Large Document
          </Button>
        </div>
      </div>
      
      {/* Add a prominent cancellation bar at the top when processing */}
      {isProcessing && activeTab === 'chat' && (
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
      
      {/* Tab content */}
      {activeTab === 'chat' ? (
        /* Chat Tab */
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
              
              {/* Message History */}
              <div className="mt-6">
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-4">
                    {messages.map(renderMessage)}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </div>
              
              <Separator className="my-4" />
              
              {/* Input Area */}
              <div className="space-y-4">
                <div className="relative">
                  <textarea
                    className="min-h-[80px] resize-none w-full rounded-md border border-input p-3 pr-12 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    placeholder="Ask a question or send a document..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    ref={textareaRef}
                    disabled={isLoading}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleProcessRequest();
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    className="absolute right-1 top-1 h-8 w-8"
                    disabled={isLoading || (!prompt.trim() && files.length === 0)}
                    onClick={handleProcessRequest}
                  >
                    {isLoading ? (
                      <span className="animate-spin">⏳</span>
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
                  
                  {/* Document Rewrite Button */}
                  <Button 
                    variant="outline" 
                    className="flex items-center gap-2"
                    onClick={() => setActiveTab('rewrite')}
                  >
                    <FileText className="h-4 w-4" />
                    Rewrite Large Document
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Document Rewrite Tab */
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Document Rewriter</CardTitle>
          </CardHeader>
          <CardContent>
            <DocumentRewriteTab
              selectedModel={selectedModel}
              messages={messages}
            />
          </CardContent>
        </Card>
      )}
    </main>
  );
}