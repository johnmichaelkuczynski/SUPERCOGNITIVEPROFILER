import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Upload, FileText, Download, Share, Trash2, X } from 'lucide-react';
import { SpeechInput, useSpeechInput } from '@/components/ui/speech-input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { LLMModel, formatBytes } from '@/lib/utils';
import { downloadOutput } from '@/lib/llm';
import ReactMarkdown from 'react-markdown';
import { MathJaxContext, MathJax } from 'better-react-mathjax';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import 'katex/dist/katex.min.css';

interface ChatMessage {
  id: number;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  files?: File[];
  isRewriteChunk?: boolean;
  chunkIndex?: number;
  totalChunks?: number;
}

interface ChatDialogueProps {
  onRewriteChunk?: (chunk: string, index: number, total: number) => void;
  onSendToInput?: (content: string) => void;
}

export interface ChatDialogueRef {
  addRewriteChunk: (chunk: string, index: number, total: number) => void;
  addMessage: (content: string, metadata?: any) => void;
}

const ChatDialogue = React.forwardRef<ChatDialogueRef, ChatDialogueProps>(
  ({ onRewriteChunk, onSendToInput }, ref) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [selectedModel, setSelectedModel] = useState<LLMModel>('deepseek');
  const [isLoading, setIsLoading] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [messageToShare, setMessageToShare] = useState<ChatMessage | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showMathView, setShowMathView] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(1); // Default ID for auxiliary chat
  const [conversationShareEmail, setConversationShareEmail] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Speech input functionality
  const { SpeechButton } = useSpeechInput(
    (text: string) => setInput(text),
    () => input,
    { onAppend: true }
  );



  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only set to false if we're leaving the entire card area
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    const allowedTypes = ['.pdf', '.docx', '.txt', '.jpg', '.jpeg', '.png'];
    
    const validFiles = droppedFiles.filter(file => {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      return allowedTypes.includes(extension);
    });
    
    if (validFiles.length > 0) {
      setFiles(prev => [...prev, ...validFiles]);
    }
  };







  // Expose methods via ref
  React.useImperativeHandle(ref, () => ({
    addRewriteChunk: (chunk: string, index: number, total: number) => {
      const chunkMessage: ChatMessage = {
        id: Date.now() + index,
        content: `**Rewrite Chunk ${index + 1}/${total}:**\n\n${chunk}`,
        role: 'assistant',
        timestamp: new Date(),
        isRewriteChunk: true,
        chunkIndex: index,
        totalChunks: total
      };
      setMessages(prev => [...prev, chunkMessage]);
    },
    addMessage: (content: string, metadata?: any) => {
      const message: ChatMessage = {
        id: Date.now(),
        content,
        role: 'assistant',
        timestamp: new Date(),
        ...metadata
      };
      setMessages(prev => [...prev, message]);
    }
  }));

  const formatMessage = (content: string) => {
    // Clean up markdown formatting but PRESERVE LaTeX mathematical notation
    const cleanContent = content
      .replace(/#{1,6}\s+/g, '') // Remove headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italics
      .replace(/`(.*?)`/g, '$1') // Remove inline code
      .replace(/```[\s\S]*?```/g, (match) => {
        // Extract code from code blocks and format simply
        return match.replace(/```\w*\n?/g, '').replace(/```/g, '');
      })
      .replace(/>\s+/g, '') // Remove blockquotes
      .replace(/^\s*[-*+]\s+/gm, '• ') // Convert list markers to bullets
      .replace(/^\s*\d+\.\s+/gm, (match, offset, string) => {
        // Convert numbered lists to simple numbers
        const lineStart = string.lastIndexOf('\n', offset) + 1;
        const lineNum = string.substring(lineStart, offset).match(/^\s*(\d+)\./)?.[1] || '1';
        return `${lineNum}. `;
      })
      .replace(/\n{3,}/g, '\n\n') // Normalize line breaks
      .trim();

    return (
      <div className="whitespace-pre-wrap">
        {cleanContent}
      </div>
    );
  };

  const handleSend = async () => {
    if (!input.trim() && files.length === 0) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      content: input,
      role: 'user',
      timestamp: new Date(),
      files: files.length > 0 ? [...files] : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setFiles([]);
    setIsLoading(true);

    try {
      // Process files if any
      let extractedTexts: string[] = [];
      if (files.length > 0) {
        for (const file of files) {
          try {
            const formData = new FormData();
            formData.append('file', file);
            
            const response = await fetch('/api/documents/process', {
              method: 'POST',
              body: formData,
            });

            if (response.ok) {
              const data = await response.json();
              extractedTexts.push(`**${file.name}:**\n${data.content}`);
            }
          } catch (error) {
            extractedTexts.push(`**Error processing ${file.name}:** ${error}`);
          }
        }
      }

      // Prepare prompt with file content
      let fullPrompt = input;
      if (extractedTexts.length > 0) {
        fullPrompt = `${input}\n\n**Uploaded Files:**\n${extractedTexts.join('\n\n')}`;
      }

      // Build conversation context with previous messages
      const conversationContext = messages.map(msg => 
        `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`
      ).join('\n\n');
      
      // Include conversation history in the prompt
      const contextualPrompt = conversationContext.length > 0 
        ? `Previous conversation:\n${conversationContext}\n\nHuman: ${fullPrompt}`
        : `Human: ${fullPrompt}`;

      // Send to AI
      const formData = new FormData();
      formData.append('content', contextualPrompt);
      formData.append('model', selectedModel);

      const response = await fetch('/api/llm/prompt', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const aiMessage: ChatMessage = {
          id: Date.now() + 1,
          content: data.content,
          role: 'assistant',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error('Failed to get AI response');
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: Date.now() + 1,
        content: `Error: ${error instanceof Error ? error.message : String(error)}`,
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const exportMessage = async (message: ChatMessage, format: 'pdf' | 'docx' | 'txt') => {
    const content = `[${message.role.toUpperCase()} - ${message.timestamp.toLocaleString()}]\n\n${message.content}`;
    const filename = `chat-message-${message.id}`;
    
    try {
      const response = await fetch('/api/export-chat-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          format,
          filename
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.${format === 'pdf' ? 'html' : format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting message:', error);
    }
  };

  const shareMessage = async (message: ChatMessage) => {
    if (!shareEmail.trim()) return;

    try {
      const content = `[${message.role.toUpperCase()} - ${message.timestamp.toLocaleString()}]\n\n${message.content}`;
      
      const response = await fetch('/api/share-chat-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          email: shareEmail,
          subject: 'Chat Message from TextMind'
        })
      });

      if (response.ok) {
        setIsShareOpen(false);
        setShareEmail('');
        setMessageToShare(null);
      } else {
        throw new Error('Failed to share message');
      }
    } catch (error) {
      console.error('Error sharing message:', error);
    }
  };

  return (
    <div className="h-full" data-chat-container="true">
      <Card 
        className={`h-full flex flex-col shadow-sm relative ${isDragging ? 'border-2 border-dashed border-blue-400' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div className="absolute inset-0 bg-blue-50 bg-opacity-90 flex items-center justify-center z-50 rounded-lg">
            <div className="text-center">
              <Upload className="h-12 w-12 mx-auto mb-2 text-blue-500" />
              <p className="text-lg font-medium text-blue-700">Drop files here to upload</p>
              <p className="text-sm text-blue-600">PDF, DOCX, TXT, JPG, PNG supported</p>
            </div>
          </div>
        )}
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Auxiliary AI Chat</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <Button
                  size="sm"
                  variant={!showMathView ? "default" : "outline"}
                  onClick={() => setShowMathView(false)}
                  className="text-xs h-7 px-2"
                >
                  Text
                </Button>
                <Button
                  size="sm"
                  variant={showMathView ? "default" : "outline"}
                  onClick={() => setShowMathView(true)}
                  className="text-xs h-7 px-2"
                >
                  Math
                </Button>
              </div>
              <Select value={selectedModel} onValueChange={(value) => setSelectedModel(value as LLMModel)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deepseek">DeepSeek</SelectItem>
                  <SelectItem value="claude">Claude</SelectItem>
                  <SelectItem value="gpt4">GPT-4</SelectItem>
                  <SelectItem value="perplexity">Perplexity</SelectItem>
                </SelectContent>
              </Select>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={messages.length === 0}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Export Auxiliary Chat</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <p className="text-sm text-slate-600">Export your entire auxiliary chat conversation with perfect mathematical notation:</p>
                    <div className="flex flex-col gap-2">
                      <Button 
                        onClick={async () => {
                          if (messages.length > 0) {
                            try {
                              const response = await fetch('/api/export-auxiliary-chat', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  messages: messages,
                                  format: 'txt'
                                })
                              });

                              if (response.ok) {
                                const blob = await response.blob();
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `auxiliary-chat-export-${new Date().toISOString().split('T')[0]}.txt`;
                                document.body.appendChild(a);
                                a.click();
                                window.URL.revokeObjectURL(url);
                                document.body.removeChild(a);
                              }
                            } catch (error) {
                              console.error('Error exporting chat:', error);
                            }
                          }
                        }}
                        variant="outline"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Export as Text (Clean)
                      </Button>
                      
                      <Button 
                        onClick={async () => {
                          if (messages.length > 0) {
                            try {
                              const response = await fetch('/api/export-auxiliary-chat', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  messages: messages,
                                  format: 'docx'
                                })
                              });

                              if (response.ok) {
                                const blob = await response.blob();
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `auxiliary-chat-export-${new Date().toISOString().split('T')[0]}.docx`;
                                document.body.appendChild(a);
                                a.click();
                                window.URL.revokeObjectURL(url);
                                document.body.removeChild(a);
                              }
                            } catch (error) {
                              console.error('Error exporting chat:', error);
                            }
                          }
                        }}
                        variant="outline"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Export as Word Document
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-1" />
                Upload File
              </Button>

              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={messages.length === 0}
                  >
                    <Share className="h-4 w-4 mr-1" />
                    Share
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Share Auxiliary Chat</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <p className="text-sm text-slate-600">Share your entire auxiliary chat conversation via email:</p>
                    <div className="flex flex-col gap-3">
                      <Input
                        type="email"
                        placeholder="Enter email address"
                        value={conversationShareEmail}
                        onChange={(e) => setConversationShareEmail(e.target.value)}
                      />
                      <Button 
                        onClick={async () => {
                          if (conversationShareEmail && messages.length > 0) {
                            try {
                              const response = await fetch('/api/share-auxiliary-chat', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  messages: messages,
                                  email: conversationShareEmail,
                                  subject: `Auxiliary Chat Conversation - ${new Date().toLocaleDateString()}`
                                })
                              });

                              if (response.ok) {
                                alert('Conversation shared successfully!');
                                setConversationShareEmail('');
                              } else {
                                alert('Failed to share conversation');
                              }
                            } catch (error) {
                              console.error('Error sharing conversation:', error);
                              alert('Error sharing conversation');
                            }
                          }
                        }}
                        disabled={!conversationShareEmail || messages.length === 0}
                      >
                        <Share className="h-4 w-4 mr-2" />
                        Send Email
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setMessages([])}
                disabled={messages.length === 0}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 flex-1 flex flex-col">
          {/* Messages */}
          <ScrollArea className="flex-1 px-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <p>Start a conversation with the AI</p>
                  <p className="text-sm mt-1">Ask questions, upload files, or discuss document content</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'} rounded-lg p-3 relative group`}>
                      {/* Message actions */}
                      <div className="absolute -top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex space-x-1">
                          {/* Export dropdown */}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <Download className="h-3 w-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Export Message</DialogTitle>
                              </DialogHeader>
                              <div className="grid gap-2">
                                <Button onClick={() => exportMessage(message, 'pdf')} variant="outline">
                                  <FileText className="h-4 w-4 mr-2" />
                                  Export as PDF
                                </Button>
                                <Button onClick={() => exportMessage(message, 'docx')} variant="outline">
                                  <FileText className="h-4 w-4 mr-2" />
                                  Export as Word
                                </Button>
                                <Button onClick={() => exportMessage(message, 'txt')} variant="outline">
                                  <FileText className="h-4 w-4 mr-2" />
                                  Export as Text
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>

                          {/* Share button */}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => {
                              setMessageToShare(message);
                              setIsShareOpen(true);
                            }}
                          >
                            <Share className="h-3 w-3" />
                          </Button>

                          {/* Send to Input button */}
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="h-7 px-2 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                            onClick={() => {
                              if (onSendToInput) {
                                // Strip markdown formatting before sending to input
                                const cleanContent = message.content
                                  .replace(/#{1,6}\s+/g, '') // Remove headers
                                  .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
                                  .replace(/\*(.*?)\*/g, '$1') // Remove italics
                                  .replace(/`(.*?)`/g, '$1') // Remove inline code
                                  .replace(/```[\s\S]*?```/g, '') // Remove code blocks
                                  .replace(/>\s+/g, '') // Remove blockquotes
                                  .replace(/^\s*[-*+]\s+/gm, '') // Remove list markers
                                  .replace(/^\s*\d+\.\s+/gm, '') // Remove numbered list markers
                                  .replace(/\n{3,}/g, '\n\n') // Normalize line breaks
                                  .trim();
                                onSendToInput(cleanContent);
                              }
                            }}
                            title="Send to Input"
                          >
                            <Upload className="h-3 w-3 mr-1" />
                            Send
                          </Button>
                        </div>
                      </div>

                      {/* Message content */}
                      <div className="text-sm">
                        {message.isRewriteChunk && (
                          <div className="text-xs opacity-70 mb-2">
                            Rewrite Progress: {message.chunkIndex! + 1}/{message.totalChunks}
                          </div>
                        )}
                        {showMathView ? (
                          <div className="whitespace-pre-wrap">
                            <MathJax>
                              {message.content}
                            </MathJax>
                          </div>
                        ) : (
                          formatMessage(message.content)
                        )}
                      </div>

                      {/* File attachments */}
                      {message.files && message.files.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <div className="text-xs opacity-70 mb-1">Attachments:</div>
                          {message.files.map((file, index) => (
                            <div key={index} className="flex items-center text-xs">
                              <FileText className="h-3 w-3 mr-1" />
                              <span>{file.name}</span>
                              <span className="ml-2 opacity-70">({formatBytes(file.size)})</span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="text-xs opacity-50 mt-2">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                        <span className="text-sm">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div ref={messagesEndRef} />
          </ScrollArea>

          {/* Input area */}
          <div className="border-t p-4">
            {/* File preview */}
            {files.length > 0 && (
              <div className="mb-3 p-2 bg-muted rounded-lg">
                <div className="text-sm font-medium mb-2">Files to upload:</div>
                <div className="space-y-1">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2" />
                        <span>{file.name}</span>
                        <span className="text-muted-foreground ml-2">({formatBytes(file.size)})</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setFiles(files.filter((_, i) => i !== index))}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Input controls */}
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <Textarea
                  id="chat-input"
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Ask anything about your documents or chat with the AI..."
                  className="min-h-[120px] max-h-[400px] pr-24 resize-y"
                  disabled={isLoading}
                />
                <div className="absolute bottom-2 right-2 flex space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                  <SpeechButton className="h-8 w-8" />
                  <Button
                    size="icon"
                    className="h-8 w-8"
                    onClick={handleSend}
                    disabled={isLoading || (!input.trim() && files.length === 0)}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept=".pdf,.docx,.txt,.jpg,.jpeg,.png"
              onChange={(e) => {
                if (e.target.files) {
                  setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                }
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Share dialog */}
      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Message</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              placeholder="Enter email address"
              value={shareEmail}
              onChange={(e) => setShareEmail(e.target.value)}
            />
            <Button onClick={() => messageToShare && shareMessage(messageToShare)}>
              <Share className="h-4 w-4 mr-2" />
              Send Email
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});

ChatDialogue.displayName = 'ChatDialogue';

export default ChatDialogue;