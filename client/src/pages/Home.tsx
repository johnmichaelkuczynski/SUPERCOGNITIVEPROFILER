import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { LLMModel, formatBytes } from '@/lib/utils';
import { Send, Upload, X, FileText, Trash2, FileUp, RefreshCw, Eye, Download, Plus } from 'lucide-react';
import { downloadOutput } from '@/lib/llm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import ReactMarkdown from 'react-markdown';
import { MathJaxContext, MathJax } from 'better-react-mathjax';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import 'katex/dist/katex.min.css';
import AIDetectionPopover from '@/components/AIDetectionPopover';
import { useLocation } from 'wouter';
import DocumentRewriterModal from '@/components/DocumentRewriterModal';
import DocumentChunkSelector from '@/components/DocumentChunkSelector';

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
  
  // Document chunk selector state
  const [isChunkSelectorOpen, setIsChunkSelectorOpen] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>('');
  const [selectedDocumentTitle, setSelectedDocumentTitle] = useState<string>('');
  const [documentChunks, setDocumentChunks] = useState<any[]>([]);
  const [selectedChunks, setSelectedChunks] = useState<number[]>([]);
  const [selectedChunk, setSelectedChunk] = useState<{id: number, title: string, content: string} | null>(null);
  
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
      console.log("Sending request with content:", userContent);
      
      // Create FormData and append prompt and model
      const formData = new FormData();
      
      // Include focused document context for questions
      let fullPrompt = userContent;
      
      // Add context from uploaded documents for questions
      if (Object.keys(uploadedDocuments).length > 0) {
        // Check if we should focus on a specific document
        const docNameMatch = userContent.match(/document\s*[:"]?\s*"?([^"]+)"?/i) || 
                             userContent.match(/focus\s+on\s+(?:the\s+)?(?:document\s+)?(?:titled\s+)?["]?([^"]+)["]?/i) ||
                             userContent.match(/about\s+(?:the\s+)?([^?.,]+?)(?:\s+document)?[\s,.?]/i);
        
        let focusedDocuments = [];
        
        if (docNameMatch && docNameMatch[1]) {
          const docName = docNameMatch[1].trim();
          // Find best matching document by name
          const matchingDocs = Object.keys(uploadedDocuments).filter(
            filename => filename.toLowerCase().includes(docName.toLowerCase())
          );
          
          if (matchingDocs.length > 0) {
            console.log(`Focusing on specific document: ${matchingDocs[0]}`);
            // Only use the matched document
            focusedDocuments = matchingDocs.map(filename => ({
              filename,
              content: uploadedDocuments[filename]
            }));
          }
        }
        
        // If no specific document was identified, include all documents
        if (focusedDocuments.length === 0) {
          focusedDocuments = Object.entries(uploadedDocuments).map(([filename, content]) => ({
            filename,
            content
          }));
        }
        
        // Format document contexts with proper titles
        const documentContexts = focusedDocuments
          .map(({filename, content}) => {
            // Limit each document's content to prevent tokens overflow
            const truncatedContent = content.length > 4000 ? 
              content.substring(0, 4000) + "..." : 
              content;
            
            // Extract possible title from first line
            const firstLine = content.split('\n')[0].trim();
            const title = firstLine.length < 100 ? firstLine : filename;
            
            return `Document title: ${title}\nFilename: ${filename}\nContent: ${truncatedContent}\n\n`;
          })
          .join("\n");
        
        // Create a context-aware prompt with clear document focus
        fullPrompt = `You are an expert writing assistant. Focus on the following document(s) to answer this question: "${userContent}"\n\n${documentContexts}`;
        
        console.log(`Added context from ${focusedDocuments.length} document(s) to prompt`);
      }
      
      formData.append('content', fullPrompt);
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
    
    // Add immediate initial response message
    const initialResponseMessage: Message = {
      id: Date.now() + 1,
      content: "I'm analyzing your document(s)...",
      role: 'assistant',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, initialResponseMessage]);
    
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
      
      // Immediately show a message saying we're analyzing the document
      const processingMessage: Message = {
        id: Date.now(),
        content: `Analyzing ${file.name}...`,
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, processingMessage]);
      
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
      
      // Also get AI detection metadata if available
      const aiDetection = processedData.aiDetection || null;
      
      // Store the document in our uploadedDocuments object and allDocuments array for the sidebar
      setAllDocuments(prev => [...prev, {name: file.name, content: extractedText}]);
      
      console.log(`Extracted ${extractedText.length} characters from ${file.name}`);
      
      // Store the extracted text for the document rewriter
      setUploadedDocuments(prev => ({
        ...prev,
        [file.name]: extractedText
      }));
      
      // For larger documents (over 2000 words), we'll use the chunk selector
      const documentWords = extractedText.split(/\s+/).length;
      if (documentWords > 2000) {
        // Set the document content for chunking
        setDocumentContent(extractedText);
        setDocumentName(file.name);
        
        // Create initial analysis message
        const initialAnalysisMessage: Message = {
          id: Date.now() + 1,
          content: `## ${file.name} (${documentWords} words)\n\nThis is a large document with approximately ${documentWords} words. Would you like to:\n\n1. Analyze specific sections of the document\n2. View a summary of the entire document\n\nFor more focused analysis, use the document sidebar to select specific sections.`,
          role: 'assistant',
          timestamp: new Date()
        };
        
        // Add AI detection info if available
        let aiDetectionInfo = '';
        if (aiDetection) {
          const aiProbability = Math.round(aiDetection.aiProbability * 100);
          const humanProbability = Math.round(aiDetection.humanProbability * 100);
          
          if (aiProbability > 70) {
            aiDetectionInfo = `\n\n**AI Content Detection**: This document appears to be AI-generated (${aiProbability}% probability).`;
          } else if (humanProbability > 70) {
            aiDetectionInfo = `\n\n**AI Content Detection**: This document appears to be human-written (${humanProbability}% probability human).`;
          } else {
            aiDetectionInfo = `\n\n**AI Content Detection**: This document has a mix of human and AI-like content (${aiProbability}% AI probability).`;
          }
          
          initialAnalysisMessage.content += aiDetectionInfo;
        }
        
        // Replace the processing message with the initial analysis
        setMessages(prev => {
          // Remove the processing message
          const filteredMessages = prev.filter(msg => msg.id !== processingMessage.id);
          return [...filteredMessages, initialAnalysisMessage];
        });
        
        return;
      }
      
      // For smaller documents, proceed with regular analysis
      // Create the prompt for analysis
      let analysisPrompt = '';
      if (extractedText.length > 5000) {
        analysisPrompt = `Please analyze this document (${extractedText.length} characters) and provide:
1. A concise summary of the main points (3-4 sentences)
2. Key topics and themes
3. The most important insights or conclusions
4. Any notable patterns or writing style observations

Document text: ${extractedText.substring(0, 5000)}...`;
      } else {
        analysisPrompt = `Please analyze this document and provide:
1. A concise summary of the main points (3-4 sentences)
2. Key topics and themes
3. The most important insights or conclusions
4. Any notable patterns or writing style observations

Document text: ${extractedText}`;
      }
      
      // Send analysis request
      const analysisFormData = new FormData();
      analysisFormData.append('content', analysisPrompt);
      analysisFormData.append('model', selectedModel);
      
      // Send request to get analysis
      const analysisResponse = await fetch('/api/llm/prompt', {
        method: 'POST',
        body: analysisFormData,
      });
      
      let analysisContent = '';
      if (analysisResponse.ok) {
        const analysisData = await analysisResponse.json();
        analysisContent = analysisData.content || '';
      }
      
      // Add AI detection info if available
      let aiDetectionInfo = '';
      if (aiDetection) {
        const aiProbability = Math.round(aiDetection.aiProbability * 100);
        const humanProbability = Math.round(aiDetection.humanProbability * 100);
        
        if (aiProbability > 70) {
          aiDetectionInfo = `\n\n**AI Content Detection**: This document appears to be AI-generated (${aiProbability}% probability).`;
        } else if (humanProbability > 70) {
          aiDetectionInfo = `\n\n**AI Content Detection**: This document appears to be human-written (${humanProbability}% probability human).`;
        } else {
          aiDetectionInfo = `\n\n**AI Content Detection**: This document has a mix of human and AI-like content (${aiProbability}% AI probability).`;
        }
      }
      
      // Format the complete analysis response
      const responseContent = analysisContent ? 
        `## Analysis of ${file.name}\n\n${analysisContent}${aiDetectionInfo}\n\n_Document contains ${extractedText.length} characters total._` :
        `I've extracted the content from ${file.name}.\n\n${extractedText.substring(0, 300)}${extractedText.length > 300 ? '...' : ''}\n\n${extractedText.length} characters total.${aiDetectionInfo}`;
      
      // Add AI message with content overview and analysis
      const aiMessage: Message = {
        id: Date.now() + 1,
        content: responseContent,
        role: 'assistant',
        timestamp: new Date()
      };
      
      // Replace the processing message with the analysis
      setMessages(prev => {
        // Remove the processing message
        const filteredMessages = prev.filter(msg => msg.id !== processingMessage.id);
        return [...filteredMessages, aiMessage];
      });
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
  
  // Format markdown with MathJax support
  const formatMessage = (content: string) => {
    return (
      <div className="prose dark:prose-invert prose-sm max-w-none">
        <MathJax>
          <ReactMarkdown
            rehypePlugins={[rehypeKatex]}
            remarkPlugins={[remarkMath]}
          >
            {content}
          </ReactMarkdown>
        </MathJax>
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
                                
                                {/* Section Analysis Button */}
                                {uploadedDocuments[file.name] && (
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-5 w-5 ml-1"
                                    onClick={() => {
                                      setDocumentContent(uploadedDocuments[file.name]);
                                      setDocumentName(file.name);
                                      setIsChunkSelectorOpen(true);
                                    }}
                                    title="Analyze sections"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sections">
                                      <rect width="8" height="8" x="2" y="2" rx="1" />
                                      <rect width="8" height="8" x="14" y="2" rx="1" />
                                      <rect width="8" height="8" x="2" y="14" rx="1" />
                                      <rect width="8" height="8" x="14" y="14" rx="1" />
                                    </svg>
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
                  onChange={async (e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      const newFiles = Array.from(e.target.files);
                      
                      // Process each file individually and immediately
                      for (const file of newFiles) {
                        try {
                          console.log(`Processing file directly: ${file.name}`);
                          
                          // Immediately show a message saying we're analyzing the document
                          const processingMessage: Message = {
                            id: Date.now(),
                            content: `Analyzing ${file.name}...`,
                            role: 'assistant',
                            timestamp: new Date()
                          };
                          setMessages(prev => [...prev, processingMessage]);
                          
                          // Extract text from the document
                          const processFormData = new FormData();
                          processFormData.append('file', file);
                          
                          const processResponse = await fetch('/api/documents/process', {
                            method: 'POST',
                            body: processFormData,
                          });
                          
                          if (!processResponse.ok) {
                            throw new Error('Failed to extract text from document');
                          }
                          
                          const processedData = await processResponse.json();
                          const extractedText = processedData.content || '';
                          const aiDetection = processedData.aiDetection || null;
                          
                          // Store document for sidebar and rewriter
                          setAllDocuments(prev => [...prev, {name: file.name, content: extractedText}]);
                          setUploadedDocuments(prev => ({...prev, [file.name]: extractedText}));
                          
                          console.log(`Extracted ${extractedText.length} characters from ${file.name}`);
                          
                          // Create analysis prompt
                          let analysisPrompt = '';
                          if (extractedText.length > 5000) {
                            analysisPrompt = `Please analyze this document (${extractedText.length} characters) and provide:
1. A concise summary of the main points (3-4 sentences)
2. Key topics and themes
3. The most important insights or conclusions
4. Any notable patterns or writing style observations

Document text: ${extractedText.substring(0, 5000)}...`;
                          } else {
                            analysisPrompt = `Please analyze this document and provide:
1. A concise summary of the main points (3-4 sentences)
2. Key topics and themes
3. The most important insights or conclusions
4. Any notable patterns or writing style observations

Document text: ${extractedText}`;
                          }
                          
                          // Get analysis from AI
                          const analysisFormData = new FormData();
                          analysisFormData.append('content', analysisPrompt);
                          analysisFormData.append('model', selectedModel);
                          
                          const analysisResponse = await fetch('/api/llm/prompt', {
                            method: 'POST',
                            body: analysisFormData,
                          });
                          
                          let analysisContent = '';
                          if (analysisResponse.ok) {
                            const analysisData = await analysisResponse.json();
                            analysisContent = analysisData.content || '';
                          }
                          
                          // Format AI detection info
                          let aiDetectionInfo = '';
                          if (aiDetection) {
                            const aiProbability = Math.round(aiDetection.aiProbability * 100);
                            const humanProbability = Math.round(aiDetection.humanProbability * 100);
                            
                            if (aiProbability > 70) {
                              aiDetectionInfo = `\n\n**AI Content Detection**: This document appears to be AI-generated (${aiProbability}% probability).`;
                            } else if (humanProbability > 70) {
                              aiDetectionInfo = `\n\n**AI Content Detection**: This document appears to be human-written (${humanProbability}% probability human).`;
                            } else {
                              aiDetectionInfo = `\n\n**AI Content Detection**: This document has a mix of human and AI-like content (${aiProbability}% AI probability).`;
                            }
                          }
                          
                          // Format the complete analysis response
                          const responseContent = analysisContent ? 
                            `## Analysis of ${file.name}\n\n${analysisContent}${aiDetectionInfo}\n\n_Document contains ${extractedText.length} characters total._` :
                            `I've extracted the content from ${file.name}.\n\n${extractedText.substring(0, 300)}${extractedText.length > 300 ? '...' : ''}\n\n${extractedText.length} characters total.${aiDetectionInfo}`;
                          
                          // Replace processing message with analysis
                          const aiMessage: Message = {
                            id: Date.now() + 1,
                            content: responseContent,
                            role: 'assistant',
                            timestamp: new Date()
                          };
                          
                          setMessages(prev => {
                            const filteredMessages = prev.filter(msg => msg.id !== processingMessage.id);
                            return [...filteredMessages, aiMessage];
                          });
                          
                        } catch (error) {
                          console.error(`Error processing file ${file.name}:`, error);
                          const errorMessage: Message = {
                            id: Date.now(),
                            content: `Error processing ${file.name}: ${error instanceof Error ? error.message : String(error)}`,
                            role: 'assistant',
                            timestamp: new Date()
                          };
                          setMessages(prev => [...prev, errorMessage]);
                        }
                      }
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
                    onClick={() => {
                      setMessages([]);
                      setUploadedDocuments({});
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Chat
                  </Button>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        disabled={messages.length === 0}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export Chat
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Export Conversation</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <p className="text-sm text-slate-600">Choose a format to export your conversation:</p>
                        <div className="flex flex-col gap-2">
                          <Button 
                            onClick={() => {
                              if (messages.length > 0) {
                                const chatContent = messages.map(msg => 
                                  `[${msg.role.toUpperCase()} - ${new Date(msg.timestamp).toLocaleString()}]\n${msg.content}\n\n`
                                ).join('---\n\n');
                                
                                downloadOutput(chatContent, 'txt', `chat-export-${new Date().toISOString().split('T')[0]}`);
                              }
                            }}
                            variant="outline"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Export as Text (.txt)
                          </Button>
                          
                          <Button 
                            onClick={() => {
                              if (messages.length > 0) {
                                const chatContent = messages.map(msg => 
                                  `[${msg.role.toUpperCase()} - ${new Date(msg.timestamp).toLocaleString()}]\n${msg.content}\n\n`
                                ).join('---\n\n');
                                
                                downloadOutput(chatContent, 'docx', `chat-export-${new Date().toISOString().split('T')[0]}`);
                              }
                            }}
                            variant="outline"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Export as Word (.docx)
                          </Button>
                          
                          <Button 
                            onClick={() => {
                              if (messages.length > 0) {
                                const chatContent = messages.map(msg => 
                                  `[${msg.role.toUpperCase()} - ${new Date(msg.timestamp).toLocaleString()}]\n${msg.content}\n\n`
                                ).join('---\n\n');
                                
                                downloadOutput(chatContent, 'pdf', `chat-export-${new Date().toISOString().split('T')[0]}`);
                              }
                            }}
                            variant="outline"
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Export as PDF (.pdf)
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  
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
                  <p className="text-xs text-slate-600">Upload files for automatic analysis</p>
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
      
      {/* Document Chunk Selector */}
      {documentChunks.length > 0 && (
        <Dialog open={isChunkSelectorOpen} onOpenChange={setIsChunkSelectorOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Document Sections</DialogTitle>
            </DialogHeader>
            <DocumentChunkSelector
              documentId={selectedDocumentId}
              documentTitle={selectedDocumentTitle}
              chunks={documentChunks}
              onSelectChunks={(selectedChunkIndices) => {
                setSelectedChunks(selectedChunkIndices);
                setIsChunkSelectorOpen(false);
                
                // Inform the user about selected chunks
                if (selectedChunkIndices.length > 0) {
                  setMessages(prev => [
                    ...prev,
                    {
                      id: Date.now(),
                      role: 'assistant',
                      content: `I'll focus on the ${selectedChunkIndices.length} section${selectedChunkIndices.length === 1 ? '' : 's'} you selected. You can now ask specific questions about this content.`,
                      timestamp: new Date()
                    }
                  ]);
                }
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </main>
  );
}