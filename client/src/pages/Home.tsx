import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { LLMModel, formatBytes } from '@/lib/utils';
import { Send, Upload, X, FileText, Trash2, FileUp, RefreshCw, Eye } from 'lucide-react';
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
  
  // Track all uploaded documents for the sidebar
  const [allDocuments, setAllDocuments] = useState<{name: string, content: string}[]>([]);
  
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
    
    // Clear form
    setPrompt('');
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    
    try {
      // Create FormData and append prompt and model
      const formData = new FormData();
      formData.append('prompt', userContent);
      formData.append('model', selectedModel);
      
      // Append each file to form data
      for (const file of files) {
        formData.append('files', file);
      }
      
      // Make request to API
      const response = await fetch('/api/llm/prompt', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to process request');
      }
      
      const data = await response.json();
      
      // Create AI response message
      const aiMessage: Message = {
        id: Date.now(),
        content: data.content,
        role: 'assistant',
        timestamp: new Date(),
      };
      
      // Add AI message to history
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error processing request:', error);
      
      // Create error message
      const errorMessage: Message = {
        id: Date.now(),
        content: `Error: ${error instanceof Error ? error.message : 'Failed to process your request'}. Please try again.`,
        role: 'assistant',
        timestamp: new Date(),
      };
      
      // Add error message to history
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setFiles([]); // Clear files after sending
    }
  };
  
  // Process file upload
  const processFile = async () => {
    if (files.length === 0) return;

    setIsLoading(true);
    
    // Create a combined message for all files
    let combinedMessage = "Processing files:\n";
    for (const file of files) {
      combinedMessage += `- ${file.name} (${formatBytes(file.size)})\n`;
    }
    
    const userMessage: Message = {
      id: Date.now(),
      content: combinedMessage,
      role: 'user',
      timestamp: new Date(),
      files: [...files]
    };
    
    // Add user message to conversation
    setMessages(prev => [...prev, userMessage]);
    
    try {
      // Process each file
      for (const file of files) {
        await processIndividualFile(file);
      }
    } catch (error) {
      console.error("Error processing files:", error);
      const errorMessage: Message = {
        id: Date.now(),
        content: `Error processing files: ${error instanceof Error ? error.message : String(error)}`,
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setFiles([]); // Clear files after processing
    }
  };
  
  // Process individual file upload
  const processIndividualFile = async (file: File) => {
    try {
      console.log(`Processing file: ${file.name}`);
      
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
      
      // Store the document in our uploadedDocuments object and allDocuments array for the sidebar
      setAllDocuments(prev => [...prev, {name: file.name, content: extractedText}]);
      
      console.log(`Extracted ${extractedText.length} characters from ${file.name}`);
      
      // Store the extracted text for the document rewriter
      setUploadedDocuments(prev => ({
        ...prev,
        [file.name]: extractedText
      }));
      
      // Create user message to indicate file was processed
      const userMessage: Message = {
        id: Date.now(),
        content: `Processed file: ${file.name}`,
        role: 'user',
        timestamp: new Date()
      };
      
      // Generate a summary of the document
      const formData = new FormData();
      formData.append('prompt', `Please provide a concise summary of this document: ${extractedText.substring(0, 2000)}${extractedText.length > 2000 ? '...' : ''}`);
      formData.append('model', selectedModel);
      
      // Send request to get summary
      const summaryResponse = await fetch('/api/llm/prompt', {
        method: 'POST',
        body: formData,
      });
      
      let summaryContent = '';
      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        summaryContent = summaryData.content || '';
      }
      
      // Add AI message with content overview and summary
      const aiMessage: Message = {
        id: Date.now() + 1,
        content: `I've extracted the content from ${file.name}. Here's a summary:\n\n${summaryContent || extractedText.substring(0, 200) + (extractedText.length > 200 ? '...' : '')}\n\n${extractedText.length} characters total. You can ask me questions about this document or upload more files.`,
        role: 'assistant',
        timestamp: new Date()
      };
      
      // Add messages to conversation
      setMessages(prev => [...prev, userMessage, aiMessage]);
    } catch (error) {
      console.error(`Error processing file ${file.name}:`, error);
      
      // Create user message about failed file
      const userMessage: Message = {
        id: Date.now(),
        content: `Failed to process file: ${file.name}`,
        role: 'user',
        timestamp: new Date()
      };
      
      // Create error message
      const errorMessage: Message = {
        id: Date.now() + 1,
        content: `I was unable to process ${file.name}. Error: ${error instanceof Error ? error.message : String(error)}`,
        role: 'assistant',
        timestamp: new Date()
      };
      
      // Add messages to conversation
      setMessages(prev => [...prev, userMessage, errorMessage]);
    }
  };
  
  // Format markdown
  const formatMessage = (content: string) => {
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
    <main className="container mx-auto px-4 py-6 flex">
      {/* Document Sidebar */}
      {allDocuments.length > 0 && (
        <div className="w-16 bg-slate-50 rounded-lg flex flex-col items-center py-4 mr-4 h-[calc(100vh-3rem)] overflow-y-auto sticky top-6">
          {allDocuments.map((doc, index) => (
            <div 
              key={index}
              className="relative group cursor-pointer mb-4"
              onClick={() => {
                setViewingDocumentContent(doc.content);
                setViewingDocumentName(doc.name);
                setIsDocumentViewerOpen(true);
              }}
            >
              <div className="w-10 h-10 flex items-center justify-center bg-white rounded-lg border-2 border-slate-200 hover:border-blue-500 transition-colors">
                <FileText className="h-5 w-5 text-slate-700" />
              </div>
              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 hidden group-hover:block bg-slate-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap z-50">
                {doc.name}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="flex-1">
        <h1 className="text-2xl font-bold mb-6">TextMind Chat</h1>
        
        <Card className="shadow-sm flex flex-col mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Chat with AI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
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
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      
                      {/* File list for messages with attachments */}
                      {message.files && message.files.length > 0 && (
                        <div className="flex flex-col">
                          <div className="text-xs text-muted-foreground mb-1">Attached files:</div>
                          <div className="flex flex-wrap gap-2">
                            {message.files.map((file, index) => (
                              <div key={index} className="flex items-center bg-slate-100 rounded px-2 py-1 text-xs">
                                <FileText className="h-3 w-3 mr-1" />
                                {file.name.length > 20 ? file.name.substring(0, 17) + '...' : file.name}
                                
                                {/* View Document Button */}
                                {uploadedDocuments[file.name] && (
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-5 w-5 ml-1"
                                    onClick={() => {
                                      setViewingDocumentContent(uploadedDocuments[file.name]);
                                      setViewingDocumentName(file.name);
                                      setIsDocumentViewerOpen(true);
                                    }}
                                  >
                                    <Eye className="h-3 w-3" />
                                  </Button>
                                )}
                                
                                {/* Rewrite Document Button */}
                                {uploadedDocuments[file.name] && (
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-5 w-5"
                                    onClick={() => {
                                      setDocumentContent(uploadedDocuments[file.name]);
                                      setDocumentName(file.name);
                                      setIsRewriterOpen(true);
                                    }}
                                  >
                                    <RefreshCw className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className={`p-4 rounded-lg ${message.role === "user" ? "bg-primary-foreground" : "bg-accent"}`}>
                      {formatMessage(message.content)}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          <CardFooter className="pt-0 pb-4 border-t">
            <div className="flex flex-col w-full space-y-4 mt-4">
              {/* File preview */}
              {files.length > 0 && (
                <div className="bg-slate-50 p-3 rounded-lg">
                  <div className="text-sm font-medium mb-2">Selected files:</div>
                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-slate-400" />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {formatBytes(file.size)}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setFiles(files.filter((_, i) => i !== index));
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex space-x-2 mt-3">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setFiles([])}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Clear All
                    </Button>
                    
                    <Button 
                      variant="default" 
                      size="sm"
                      onClick={processFile}
                      disabled={isLoading}
                    >
                      <FileUp className="h-4 w-4 mr-1" />
                      Process Files
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Input area */}
              <div className="flex space-x-2 items-end">
                <div className="flex-1">
                  <textarea
                    ref={textareaRef}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px] resize-none"
                    placeholder="Type your message here..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleProcessRequest();
                      }
                    }}
                    disabled={isLoading}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="default"
                    size="icon"
                    onClick={handleProcessRequest}
                    disabled={isLoading || (!prompt.trim() && files.length === 0)}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  multiple
                  accept=".pdf,.docx,.txt,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    if (e.target.files) {
                      setFiles(Array.from(e.target.files));
                    }
                  }}
                />
              </div>
              
              {/* Action buttons */}
              <div className="flex justify-between">
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setLocation('/analytics')}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View Analytics
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setMessages([])}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Chat
                  </Button>
                </div>
                
                {/* Document Actions */}
                {Object.keys(uploadedDocuments).length > 0 && (
                  <div className="flex space-x-2">
                    <div className="text-xs text-slate-500 self-center mr-2">
                      {Object.entries(uploadedDocuments).length} document(s) uploaded
                    </div>
                    
                    <Dialog>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Select Document to Rewrite</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          {Object.entries(uploadedDocuments).map(([filename, content]) => (
                            <div key={filename} className="flex items-center justify-between border p-3 rounded-lg">
                              <div className="flex items-center">
                                <FileText className="h-5 w-5 mr-2 text-slate-500" />
                                <span>{filename}</span>
                              </div>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setViewingDocumentContent(content);
                                    setViewingDocumentName(filename);
                                    setIsDocumentViewerOpen(true);
                                  }}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </Button>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => {
                                    setDocumentContent(content);
                                    setDocumentName(filename);
                                    setIsRewriterOpen(true);
                                  }}
                                >
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Rewrite
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex flex-col items-center px-3 py-2 h-auto"
                      onClick={() => {
                        if (Object.entries(uploadedDocuments).length > 0) {
                          const [[firstFilename, firstContent]] = Object.entries(uploadedDocuments);
                          setDocumentContent(firstContent);
                          setDocumentName(firstFilename);
                          setIsRewriterOpen(true);
                        }
                      }}
                    >
                      <FileText className="h-6 w-6 mb-1" />
                      <span className="text-xs">Rewrite</span>
                    </Button>
                  </div>
                )}
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
                </div>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
      
      {/* Document Viewer Dialog */}
      <Dialog open={isDocumentViewerOpen} onOpenChange={setIsDocumentViewerOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{viewingDocumentName}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            <div className="p-4 whitespace-pre-wrap">
              {viewingDocumentContent}
            </div>
          </ScrollArea>
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