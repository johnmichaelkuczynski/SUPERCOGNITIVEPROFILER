import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LLMModel } from '@/lib/utils';
import { Send, Upload, X, FileText, Trash2, RefreshCw, Eye, Edit3 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useLocation } from 'wouter';
import DocumentRewriterModal from '@/components/DocumentRewriterModal';
import DocumentChunkSelector from '@/components/DocumentChunkSelector';
import ChunkedRewriter from '@/components/ChunkedRewriter';
import ChatDialogue, { ChatDialogueRef } from '@/components/ChatDialogue';
import { useSpeechInput } from '@/components/ui/speech-input';
import MindProfiler from '@/components/MindProfiler';

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
  const chatDialogueRef = useRef<ChatDialogueRef>(null);
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
  
  // Chunked rewriter state
  const [isChunkedRewriterOpen, setIsChunkedRewriterOpen] = useState(false);
  const [rewriterText, setRewriterText] = useState<string>('');
  const [rewriterTitle, setRewriterTitle] = useState<string>('');
  const [rewriterProcessingMode, setRewriterProcessingMode] = useState<'rewrite' | 'homework'>('rewrite');
  
  // Track all uploaded documents for the sidebar
  const [allDocuments, setAllDocuments] = useState<{name: string, content: string}[]>([]);
  
  // Direct text processor state
  const [processingMode, setProcessingMode] = useState<'rewrite' | 'homework'>('rewrite');
  const [directInputText, setDirectInputText] = useState<string>('');
  const [isDirectProcessing, setIsDirectProcessing] = useState(false);

  // Speech input functionality for direct text input
  const { SpeechButton: DirectSpeechButton } = useSpeechInput(
    (text: string) => setDirectInputText(text),
    () => directInputText,
    { onAppend: true }
  );

  // Drag and drop functionality for main textarea
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Process document files (PDF, Word, images) via API
  const processDocumentFile = async (file: File) => {
    try {
      console.log('Processing document file:', file.name);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/documents/process', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to process document: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Document processed successfully:', result);
      console.log('Result content length:', result.content ? result.content.length : 'NO CONTENT');
      console.log('Result content preview:', result.content ? result.content.substring(0, 200) : 'NO CONTENT');
      console.log('Current directInputText before update:', directInputText.length, 'characters');
      
      if (result.content) {
        console.log('Setting directInputText with content');
        setDirectInputText(prev => {
          const newValue = prev ? prev + '\n\n' + result.content : result.content;
          console.log('New directInputText length:', newValue.length);
          console.log('About to set textarea value to:', newValue.substring(0, 100) + '...');
          
          // Alert user that content was added
          alert(`Successfully added ${result.content.length} characters from ${file.name} to the text area.`);
          
          return newValue;
        });
      } else {
        console.log('NO CONTENT IN RESULT - checking result structure:', Object.keys(result));
      }
    } catch (error) {
      console.error('Processing error:', error);
      alert(`Failed to process file "${file.name}". Please try again or use a different file format.`);
    }
  };
  
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      textarea.style.border = "2px dashed #3b82f6";
      textarea.style.backgroundColor = "#eff6ff";
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      textarea.style.border = "";
      textarea.style.backgroundColor = "";
    };

    const handleDrop = (e: DragEvent) => {
      console.log('Main textarea drop detected');
      e.preventDefault();
      e.stopPropagation();
      textarea.style.border = "";
      textarea.style.backgroundColor = "";

      // Handle plain text drag
      if (e.dataTransfer?.types && e.dataTransfer.types.includes('text/plain')) {
        const text = e.dataTransfer.getData('text/plain');
        console.log('Dropped text:', text);
        if (text && text.trim()) {
          setDirectInputText(prev => prev ? prev + '\n\n' + text : text);
          return;
        }
      }
      
      // Handle file drag
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        const droppedFiles = Array.from(e.dataTransfer.files);
        console.log('Dropped files:', droppedFiles);
        
        for (const file of droppedFiles) {
          console.log('Processing file:', file.name, 'type:', file.type);
          
          if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
            // Handle text files directly
            const reader = new FileReader();
            reader.onload = (event) => {
              const text = event.target?.result as string;
              if (text) {
                console.log('File text content loaded');
                setDirectInputText(prev => prev ? prev + '\n\n' + text : text);
              }
            };
            reader.readAsText(file);
          } else if (file.type === 'application/pdf' || 
                     file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                     file.type === 'application/msword' ||
                     file.type.startsWith('image/')) {
            // Handle PDF, Word, and image files via document processing API
            console.log('Document file detected:', file.name, 'type:', file.type);
            processDocumentFile(file);
          }
        }
      }
    };

    // Add textarea-specific listeners only
    textarea.addEventListener('dragover', handleDragOver);
    textarea.addEventListener('dragleave', handleDragLeave);
    textarea.addEventListener('drop', handleDrop);

    return () => {
      textarea.removeEventListener('dragover', handleDragOver);
      textarea.removeEventListener('dragleave', handleDragLeave);
      textarea.removeEventListener('drop', handleDrop);
    };
  }, [processDocumentFile]);

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

  // Handle chunked rewriter completion
  const handleChunkedRewriteComplete = async (rewrittenText: string, metadata: any) => {
    console.log("handleChunkedRewriteComplete called with:", rewrittenText.length, "characters");
    console.log("Current messages length:", messages.length);
    
    // FIRST: Add to chat BEFORE closing modal
    const userMessage: Message = {
      id: Date.now(),
      content: `I've completed a chunked rewrite of "${rewriterTitle}" using ${metadata.model}.`,
      role: 'user',
      timestamp: new Date()
    };
    
    const aiMessage: Message = {
      id: Date.now() + 1,
      content: rewrittenText,
      role: 'assistant',
      timestamp: new Date()
    };
    
    // Add both messages to chat
    setMessages(prev => [...prev, userMessage, aiMessage]);
    
    // Close the modal after adding to chat
    setIsChunkedRewriterOpen(false);
    
    console.log("Messages added to chat, modal closed");
  };

  const handleAddChunkedRewriteToChat = (content: string, metadata: any) => {
    console.log("handleAddChunkedRewriteToChat called with:", content.length, "characters");
    
    if (chatDialogueRef.current) {
      chatDialogueRef.current.addMessage(content, metadata);
    }
  };

  // Process homework directly without opening modal
  const processHomeworkDirectly = async () => {
    if (!directInputText.trim()) return;
    
    setIsDirectProcessing(true);
    
    try {
      const response = await fetch('/api/homework-mode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instructions: directInputText,
          model: 'claude'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process homework');
      }

      const result = await response.json();
      
      // Add homework and solution to chat
      const userMessage: Message = {
        id: Date.now(),
        content: `**Homework Assignment:**\n\n${directInputText}`,
        role: 'user',
        timestamp: new Date()
      };
      
      const aiMessage: Message = {
        id: Date.now() + 1,
        content: `**Complete Solution:**\n\n${result.response}`,
        role: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, userMessage, aiMessage]);
      
      // Clear the input after successful processing
      setDirectInputText('');
      
    } catch (error) {
      console.error('Homework processing error:', error);
      alert('Failed to process homework. Please try again.');
    } finally {
      setIsDirectProcessing(false);
    }
  };

  // Open chunked rewriter with document content
  const openChunkedRewriter = (content: string, title: string) => {
    setRewriterText(content);
    setRewriterTitle(title);
    setRewriterProcessingMode(processingMode);
    setIsChunkedRewriterOpen(true);
  };

  return (
    <main className="container mx-auto px-4 py-6">
      {/* Mind Profiler - Heart of the App */}
      <MindProfiler userId={1} />
      
      {/* Direct Text Processing Interface */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>AI Text Processor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mode Selection */}
          <div className="grid grid-cols-2 gap-4">
            <Card 
              className={`cursor-pointer transition-all ${processingMode === 'rewrite' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
              onClick={() => setProcessingMode('rewrite')}
            >
              <CardContent className="p-4 text-center">
                <h3 className="font-semibold">Rewrite Mode</h3>
                <p className="text-sm text-muted-foreground mt-2">Transform and improve existing text</p>
              </CardContent>
            </Card>
            <Card 
              className={`cursor-pointer transition-all ${processingMode === 'homework' ? 'ring-2 ring-green-500 bg-green-50' : 'hover:bg-gray-50'}`}
              onClick={() => setProcessingMode('homework')}
            >
              <CardContent className="p-4 text-center">
                <h3 className="font-semibold">Homework Mode</h3>
                <p className="text-sm text-muted-foreground mt-2">Complete assignments, answer questions, follow instructions</p>
              </CardContent>
            </Card>
          </div>

          {/* Text Input Area */}
          <div className="space-y-2">
            <div className="relative">
              <textarea
                ref={textareaRef}
                className="w-full min-h-[200px] p-3 border rounded-lg resize-none"
                placeholder={processingMode === 'rewrite' 
                  ? "Paste your text here to rewrite and improve it..."
                  : "Paste your homework questions or instructions here..."
                }
                value={directInputText}
                onChange={(e) => setDirectInputText(e.target.value)}
              />
              <div className="absolute bottom-2 right-2">
                <DirectSpeechButton className="h-8 w-8" />
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDirectInputText('')}
                  disabled={!directInputText.trim()}
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('text-file-input')?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Text
                </Button>
                <input
                  id="text-file-input"
                  type="file"
                  accept=".txt,.md,.rtf,text/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const text = event.target?.result as string;
                        if (text) {
                          setDirectInputText(prev => prev ? prev + '\n\n' + text : text);
                        }
                      };
                      reader.readAsText(file);
                    }
                  }}
                />
              </div>
              
              <Button
                onClick={() => {
                  console.log('Button clicked! Processing mode:', processingMode);
                  if (processingMode === 'homework') {
                    console.log('Calling processHomeworkDirectly...');
                    processHomeworkDirectly();
                  } else {
                    console.log('Calling openChunkedRewriter...');
                    openChunkedRewriter(directInputText, `${processingMode === 'rewrite' ? 'Rewrite' : 'Homework'} Task`);
                  }
                }}
                disabled={!directInputText.trim() || isDirectProcessing}
                className={processingMode === 'homework' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {processingMode === 'rewrite' ? 'Smart Rewrite' : 'Complete Homework'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Sidebar and Chat */}
      <div className="flex gap-6">
        {/* Document Sidebar */}
        {allDocuments.length > 0 && (
          <div className="w-80 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Documents</h2>
              <span className="text-sm text-muted-foreground">{allDocuments.length} files</span>
            </div>
            
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {allDocuments.map((doc, index) => (
                <div 
                  key={index} 
                  className="group relative bg-white border rounded-lg p-3 hover:shadow-sm transition-shadow"
                >
                  <div className="pr-12">
                    <h3 className="font-medium text-sm truncate">{doc.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {doc.content.length.toLocaleString()} characters
                    </p>
                  </div>
                  
                  <div className="absolute right-2 top-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div
                      className="w-10 h-6 flex items-center justify-center bg-slate-50 rounded border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
                      onClick={() => {
                        setViewingDocumentContent(doc.content);
                        setViewingDocumentName(doc.name);
                        setIsDocumentViewerOpen(true);
                      }}
                    >
                      <FileText className="h-5 w-5 text-slate-700" />
                    </div>
                    <button
                      className="w-10 h-6 flex items-center justify-center bg-blue-50 rounded border border-blue-200 hover:bg-blue-100 transition-colors"
                      onClick={() => openChunkedRewriter(doc.content, doc.name)}
                      title="Smart Rewrite"
                    >
                      <Edit3 className="h-3 w-3 text-blue-600" />
                    </button>
                    <button
                      className="w-10 h-6 flex items-center justify-center bg-green-50 rounded border border-green-200 hover:bg-green-100 transition-colors"
                      onClick={() => {
                        if (chatDialogueRef.current) {
                          chatDialogueRef.current.addMessage(
                            `Document "${doc.name}" content:\n\n${doc.content.substring(0, 2000)}${doc.content.length > 2000 ? '...\n\n[Document truncated for chat - click to view full content]' : ''}`,
                            { type: 'document_content', documentName: doc.name, fullContent: doc.content }
                          );
                        }
                      }}
                      title="Send to Chat"
                    >
                      <Send className="h-3 w-3 text-green-600" />
                    </button>
                  </div>
                  <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 hidden group-hover:block bg-slate-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap z-50">
                    {doc.name}
                    <br />
                    <span className="text-blue-200">Click icon to view • Click rewrite to edit</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-6">TextMind Chat</h1>
          
          <div className="h-full" style={{ minHeight: '600px' }}>
            <ChatDialogue 
              ref={chatDialogueRef}
              onRewriteChunk={(chunk: string, index: number, total: number) => {
                // Handle rewrite chunks if needed
              }}
              onSendToInput={(content: string) => {
                setPrompt(content);
              }}
            />
          </div>
        </div>
      </div>

      {/* Document Viewer Modal */}
      <Dialog open={isDocumentViewerOpen} onOpenChange={setIsDocumentViewerOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{viewingDocumentName}</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] p-4 bg-gray-50 rounded">
            <pre className="whitespace-pre-wrap text-sm">{viewingDocumentContent}</pre>
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Rewriter Modal */}
      <DocumentRewriterModal 
        isOpen={isRewriterOpen}
        onClose={() => setIsRewriterOpen(false)}
        initialContent={documentContent}
        onRewriteComplete={(rewrittenContent: string) => {
          // Add to chat conversation
          const userMessage: Message = {
            id: Date.now(),
            content: `Rewritten "${documentName}":`,
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
          setIsRewriterOpen(false);
        }}
      />

      {/* Document Chunk Selector */}
      <DocumentChunkSelector
        isOpen={isChunkSelectorOpen}
        onClose={() => setIsChunkSelectorOpen(false)}
        documentId={selectedDocumentId}
        documentTitle={selectedDocumentTitle}
        chunks={documentChunks}
        selectedChunks={selectedChunks}
        onChunksSelected={(chunks) => {
          setSelectedChunks(chunks);
          setIsChunkSelectorOpen(false);
          
          // Add selected chunks to chat
          const userMessage: Message = {
            id: Date.now(),
            content: `Selected ${chunks.length} sections from "${selectedDocumentTitle}"`,
            role: 'user',
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, userMessage]);
        }}
      />

      {/* Chunked Rewriter Modal */}
      <ChunkedRewriter 
        key={`${rewriterTitle}-${rewriterText.substring(0, 50)}`}
        isOpen={isChunkedRewriterOpen}
        onClose={() => setIsChunkedRewriterOpen(false)}
        title={rewriterTitle}
        originalText={rewriterText}
        onRewriteComplete={handleChunkedRewriteComplete}
        onAddToChat={handleAddChunkedRewriteToChat}
        chatHistory={messages.map(msg => ({ role: msg.role, content: msg.content }))}
        initialProcessingMode={rewriterProcessingMode}
      />
    </main>
  );
}