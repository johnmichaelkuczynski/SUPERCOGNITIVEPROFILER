import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { LLMModel, formatBytes } from '@/lib/utils';
import { Send, Upload, X, FileText, Trash2, FileUp, RefreshCw, FileTextIcon, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import 'katex/dist/katex.min.css';
import AIDetectionPopover from '@/components/AIDetectionPopover';
import { useLocation } from 'wouter';
import DocumentRewriterModal from '@/components/DocumentRewriterModal';

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
  const [files, setFiles] = useState<File[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [, setLocation] = useLocation();
  
  // Document rewriter modal state
  const [isRewriterOpen, setIsRewriterOpen] = useState(false);
  const [documentContent, setDocumentContent] = useState<string>('');
  const [documentName, setDocumentName] = useState<string>('');
  const [uploadedDocuments, setUploadedDocuments] = useState<{[filename: string]: string}>({});
  
  // Document viewer modal state
  const [isDocumentViewerOpen, setIsDocumentViewerOpen] = useState(false);
  const [viewingDocumentContent, setViewingDocumentContent] = useState<string>('');
  const [viewingDocumentName, setViewingDocumentName] = useState<string>('');
  
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
    setPrompt(''); // Clear the input immediately
    
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
      
      const res = await fetch('/api/llm/prompt', {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        throw new Error('Failed to process request');
      }
      
      const data = await res.json();
      
      // Add AI response to messages
      const aiMessage: Message = {
        id: Date.now(),
        content: data.content,
        role: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setFiles([]); // Clear files after successful response
    } catch (error) {
      console.error('Error processing request:', error);
      
      // Add error message
      const errorMessage: Message = {
        id: Date.now(),
        content: 'Error: Failed to get a response. Please try again.',
        role: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
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
      
      // Process each file individually
      selectedFiles.forEach(file => {
        // Add the file to the state
        setFiles(prevFiles => [...prevFiles, file]);
        
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
      
      // First, we need to extract the actual text content from the document
      // For PDFs and other complex formats, we need to use the server to extract text properly
      // Create form data for document processing
      const processFormData = new FormData();
      processFormData.append('file', file);
      
      // Send the file to be processed by the server to extract text
      const processResponse = await fetch('/api/documents/process', {
        method: 'POST',
        body: processFormData,
      });
      
      if (!processResponse.ok) {
        throw new Error('Failed to extract text from document');
      }
      
      const processedData = await processResponse.json();
      const extractedText = processedData.content || '';
      
      console.log(`Extracted ${extractedText.length} characters from ${file.name}`);
      
      // Store the extracted text for the document rewriter
      setUploadedDocuments(prev => ({
        ...prev,
        [file.name]: extractedText
      }));
      
      // Create a message showing we're processing this file
      const userMessage: Message = {
        id: Date.now(),
        content: `Please analyze this document: ${file.name}`,
        role: 'user',
        timestamp: new Date(),
        files: [file]
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      // Create form data for the AI analysis
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
      
      // Make the API call for AI analysis
      const res = await fetch('/api/llm/prompt', {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        throw new Error('Failed to process document with AI');
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
  };
  
  const renderMessageContent = (content: string) => {
    return (
      <div className="prose dark:prose-invert prose-sm max-w-none">
        <ReactMarkdown
          rehypePlugins={[rehypeKatex]}
          remarkPlugins={[remarkMath]}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  };

  // Handle when rewritten content is received from the modal
  const handleRewriteComplete = (rewrittenContent: string) => {
    // Add the rewritten content as a new user message
    const userMessage: Message = {
      id: Date.now(),
      content: "I've rewritten my document:",
      role: 'user',
      timestamp: new Date()
    };
    
    const aiMessage: Message = {
      id: Date.now() + 1,
      content: rewrittenContent,
      role: 'assistant',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage, aiMessage]);
  };

  return (
    <main className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">TextMind Chat</h1>
      
      {/* Document Rewriter Modal */}
      <DocumentRewriterModal 
        isOpen={isRewriterOpen}
        onClose={() => setIsRewriterOpen(false)}
        initialContent={documentContent}
        onRewriteComplete={handleRewriteComplete}
      />
      
      <div className="grid grid-cols-1 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Model Selection</CardTitle>
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
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">
                          {message.role === "user" ? "You" : "AI"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      {message.role === "assistant" && (
                        <AIDetectionPopover />
                      )}
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
              <div className="space-y-2">
                <div className="flex items-center gap-4">
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
                  
                  <div className="flex flex-col gap-3">
                    {/* SEND BUTTON */}
                    <Button 
                      onClick={handleProcessRequest} 
                      className="w-16 h-16"
                      disabled={isLoading || (!prompt.trim() && files.length === 0)}
                    >
                      {isLoading ? (
                        <div className="animate-spin h-6 w-6 border-2 border-b-transparent border-white rounded-full"></div>
                      ) : (
                        <Send className="h-6 w-6" />
                      )}
                    </Button>
                    
                    {/* REWRITE BUTTON - LARGE AND PROMINENT */}
                    <Button 
                      variant="secondary"
                      className="flex flex-col items-center justify-center h-16 w-16 bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={async () => {
                        // Find the most recent user message with a file attached
                        const recentFileMessage = [...messages]
                          .reverse()
                          .find(msg => msg.role === 'user' && msg.files && msg.files.length > 0);
                        
                        if (recentFileMessage && recentFileMessage.files && recentFileMessage.files.length > 0) {
                          try {
                            // Get the first file from the message
                            const file = recentFileMessage.files[0];
                            const fileName = file.name;
                            
                            // We need to ensure we have the extracted text
                            // If we don't already have it, extract it now
                            if (!uploadedDocuments[fileName] || uploadedDocuments[fileName].length < 100) {
                              console.log('Need to extract text from', fileName);
                              
                              // Create a form to send the file for text extraction
                              const formData = new FormData();
                              formData.append('file', file);
                              
                              // Send file for processing to get text content
                              const res = await fetch('/api/documents/process', {
                                method: 'POST',
                                body: formData
                              });
                              
                              if (res.ok) {
                                const data = await res.json();
                                if (data.text && data.text.length > 10) {
                                  // Store the extracted text
                                  setUploadedDocuments(prev => ({
                                    ...prev,
                                    [fileName]: data.text
                                  }));
                                  console.log(`Extracted ${data.text.length} characters of text for rewriting`);
                                  
                                  // Use this text in the document rewriter
                                  setDocumentContent(data.text);
                                  setDocumentName(fileName);
                                  
                                  // Open the rewriter
                                  setIsRewriterOpen(true);
                                  return;
                                }
                              }
                            } else {
                              // We already have the content
                              console.log(`Using uploaded document: ${fileName} with ${uploadedDocuments[fileName].length} characters`);
                              setDocumentContent(uploadedDocuments[fileName]);
                              setDocumentName(fileName);
                              setIsRewriterOpen(true);
                              return;
                            }
                          } catch (error) {
                            console.error('Error preparing file for rewrite:', error);
                          }
                        }
                        
                        // Fallback to AI message if document extraction failed or no file message
                        const lastAIMessage = [...messages]
                          .reverse()
                          .find(msg => msg.role === 'assistant');
                        
                        if (lastAIMessage) {
                          setDocumentContent(lastAIMessage.content);
                          setDocumentName('AI Response');
                        } else {
                          setDocumentContent('');
                          setDocumentName('');
                        }
                        
                        setIsRewriterOpen(true);
                      }}
                    >
                      <FileText className="h-6 w-6 mb-1" />
                      <span className="text-xs">Rewrite</span>
                    </Button>
                  </div>
                </div>
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
                        <div className="flex gap-1">
                          {uploadedDocuments[file.name] && (
                            <button 
                              className="text-blue-500 hover:text-blue-700 flex-shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingDocumentContent(uploadedDocuments[file.name]);
                                setViewingDocumentName(file.name);
                                setIsDocumentViewerOpen(true);
                              }}
                            >
                              <Eye className="h-3 w-3" />
                            </button>
                          )}
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
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <p className="text-xs text-muted-foreground">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </div>
        </Card>
      </div>
    
      {/* Document Viewer Dialog */}
      <Dialog open={isDocumentViewerOpen} onOpenChange={setIsDocumentViewerOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Document: {viewingDocumentName}</DialogTitle>
          </DialogHeader>
          <div className="mt-2 overflow-auto max-h-[60vh]">
            <div className="border rounded p-4 bg-white font-mono text-sm whitespace-pre-wrap">
              {viewingDocumentContent}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsDocumentViewerOpen(false)}>Close</Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setDocumentContent(viewingDocumentContent);
                setDocumentName(viewingDocumentName);
                setIsRewriterOpen(true);
                setIsDocumentViewerOpen(false);
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Rewrite Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Document Viewer Dialog */}
      <Dialog open={isDocumentViewerOpen} onOpenChange={setIsDocumentViewerOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Document: {viewingDocumentName}</DialogTitle>
          </DialogHeader>
          <div className="mt-2 overflow-auto max-h-[60vh]">
            <div className="border rounded p-4 bg-white font-mono text-sm whitespace-pre-wrap">
              {viewingDocumentContent}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsDocumentViewerOpen(false)}>Close</Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setDocumentContent(viewingDocumentContent);
                setDocumentName(viewingDocumentName);
                setIsRewriterOpen(true);
                setIsDocumentViewerOpen(false);
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Rewrite Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Document Rewriter Modal */}
      <DocumentRewriterModal
        isOpen={isRewriterOpen}
        onClose={() => setIsRewriterOpen(false)}
        initialContent={documentContent}
        onRewriteComplete={(rewrittenContent) => {
          // Add the rewritten content as a user message
          const userMessage: Message = {
            id: Date.now(),
            content: `Here's my rewritten version of ${documentName}:\n\n${rewrittenContent.substring(0, 100)}...`,
            role: 'user',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, userMessage]);
        }}
      />
    </main>
  );
}
