import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, Upload, Download, Send, AlertTriangle, Check, X, FileDown, MailIcon, Loader2, 
  Shield, FilePlus, ArrowLeft, Fingerprint, RefreshCw, Eye, EyeOff, Layers, Split, ChevronDown, ChevronUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Define types for document and settings
interface Document {
  id: string;
  name: string;
  content: string;
  size: number;
}

interface RewriteSettings {
  model: 'claude' | 'gpt4' | 'perplexity';
  instructions: string;
  detectionProtection: boolean;
}

interface AIDetectionResult {
  aiProbability: number;
  humanProbability: number;
  mostAISentence?: {
    sentence: string;
    aiProbability: number;
  };
  mostHumanSentence?: {
    sentence: string;
    aiProbability: number;
  };
  error?: string;
}

// Check if a document is already in the conversation from localStorage or in session storage
const getLastUploadedDocument = (): Document | null => {
  try {
    // First check if there's a recently uploaded file in session storage
    const recentFileString = sessionStorage.getItem('recentlyUploadedFile');
    if (recentFileString) {
      return JSON.parse(recentFileString);
    }
    
    // Next try to get from local storage recent documents
    const recentDocString = localStorage.getItem('recentDocument');
    if (recentDocString) {
      return JSON.parse(recentDocString);
    }
    
    // Look for recently uploaded files from API
    const filesString = localStorage.getItem('uploadedFiles');
    if (filesString) {
      const files = JSON.parse(filesString);
      if (files && files.length > 0) {
        // Get the most recent file
        const lastFile = files[files.length - 1];
        return {
          id: lastFile.id || Date.now().toString(),
          name: lastFile.name,
          content: lastFile.content || lastFile.text,
          size: lastFile.size || (lastFile.content ? lastFile.content.length : 0)
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting last uploaded document:', error);
    return null;
  }
};

// Define a chunk interface for document splitting
interface DocumentChunk {
  id: number;
  content: string;
  selected: boolean;
  rewritten?: string;
}

export default function DocumentRewrite() {
  // State
  const [document, setDocument] = useState<Document | null>(null);
  const [originalDocument, setOriginalDocument] = useState<Document | null>(null);
  const [settings, setSettings] = useState<RewriteSettings>({
    model: 'claude',
    instructions: '',
    detectionProtection: true
  });
  const [rewrittenContent, setRewrittenContent] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [aiDetectionResult, setAiDetectionResult] = useState<AIDetectionResult | null>(null);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [emailRecipient, setEmailRecipient] = useState<string>('');
  const [senderEmail, setSenderEmail] = useState<string>('JM@ANALYTICPHILOSOPHY.AI');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('rewrite'); // Keep only for compatibility with existing code
  const [, setLocation] = useLocation();
  
  // Chunking state
  const [documentChunks, setDocumentChunks] = useState<DocumentChunk[]>([]);
  const [chunkMode, setChunkMode] = useState<boolean>(false);
  const [selectedChunkIds, setSelectedChunkIds] = useState<number[]>([]);
  const [previewChunkId, setPreviewChunkId] = useState<number | null>(null);
  const [chunkSize, setChunkSize] = useState<number>(3000); // Default chunk size in characters
  const [isProcessingChunks, setIsProcessingChunks] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Store the conversation ID to return to
  const [previousConversationId, setPreviousConversationId] = useState<string | null>(null);

  // Split document content into chunks
  const splitIntoChunks = (content: string, size: number): DocumentChunk[] => {
    // Check if document is large enough to need chunking
    if (content.length < size) {
      return [{ id: 0, content, selected: false }];
    }
    
    // Split by paragraphs first to maintain coherence
    const paragraphs = content.split(/\n\s*\n/);
    const chunks: DocumentChunk[] = [];
    let currentChunk = '';
    let chunkId = 0;
    
    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i];
      
      // If adding this paragraph would exceed chunk size, create a new chunk
      if (currentChunk.length + paragraph.length + 2 > size && currentChunk.length > 0) {
        chunks.push({ id: chunkId++, content: currentChunk, selected: false });
        currentChunk = paragraph;
      } else {
        // Add paragraph to current chunk
        if (currentChunk.length > 0) {
          currentChunk += '\n\n';
        }
        currentChunk += paragraph;
      }
    }
    
    // Add the last chunk if it's not empty
    if (currentChunk.length > 0) {
      chunks.push({ id: chunkId, content: currentChunk, selected: false });
    }
    
    return chunks;
  };

  // Toggle chunk selection
  const toggleChunkSelection = (id: number) => {
    setDocumentChunks(prev => 
      prev.map(chunk => 
        chunk.id === id ? { ...chunk, selected: !chunk.selected } : chunk
      )
    );
    
    setSelectedChunkIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(chunkId => chunkId !== id);
      } else {
        return [...prev, id];
      }
    });
  };
  
  // Toggle preview for a chunk
  const toggleChunkPreview = (id: number | null) => {
    setPreviewChunkId(prevId => prevId === id ? null : id);
  };
  
  // Get combined content of selected chunks
  const getSelectedChunksContent = (): string => {
    return documentChunks
      .filter(chunk => chunk.selected)
      .map(chunk => chunk.content)
      .join('\n\n');
  };
  
  // Get combined rewritten content
  const getRewrittenContent = (): string => {
    let result = '';
    
    // For chunk mode, combine original and rewritten chunks in proper order
    if (chunkMode) {
      const chunksInOrder = [...documentChunks].sort((a, b) => a.id - b.id);
      
      for (const chunk of chunksInOrder) {
        if (result.length > 0) result += '\n\n';
        result += chunk.rewritten || chunk.content;
      }
      
      return result;
    }
    
    // Otherwise use the full rewritten content
    return rewrittenContent;
  };

  // Load the last document from conversation on initial load and save previous conversation ID
  useEffect(() => {
    // Save the current conversation ID to return to later
    const currentConversationId = localStorage.getItem('currentConversationId');
    if (currentConversationId) {
      setPreviousConversationId(currentConversationId);
    }
    
    // Get the last document
    const lastDocument = getLastUploadedDocument();
    if (lastDocument) {
      setDocument(lastDocument);
      setOriginalDocument(lastDocument);
      
      // Check if document is large enough to suggest chunk mode
      if (lastDocument.content.length > 10000) { // Suggest chunking for docs over 10k chars
        // Create chunks but don't enable chunk mode automatically
        const chunks = splitIntoChunks(lastDocument.content, chunkSize);
        setDocumentChunks(chunks);
        setSelectedChunkIds(chunks.map(chunk => chunk.id));
        
        toast({
          title: "Large Document Loaded",
          description: `This document is large (${formatBytes(lastDocument.size)}). You can use chunk mode to process specific sections.`,
        });
      }
      
      toast({
        title: "Document Loaded",
        description: `Loaded document "${lastDocument.name}" from your conversation.`,
      });
    }
    
    // Load any saved sender email
    try {
      const savedSenderEmail = localStorage.getItem('lastUsedSenderEmail');
      if (savedSenderEmail) {
        setSenderEmail(savedSenderEmail);
      }
    } catch (e) {
      console.warn('Could not load sender email from localStorage', e);
    }
  }, []);

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setIsUploading(true);
    
    // For binary file types, use the API to process them
    const extension = file.name.split('.').pop()?.toLowerCase();
    const binaryTypes = ['docx', 'pdf', 'doc', 'png', 'jpg', 'jpeg'];
    
    if (binaryTypes.includes(extension || '')) {
      // Create FormData to send the file to the server
      const formData = new FormData();
      formData.append('file', file);
      
      // Send the file to the document processing API
      fetch('/api/documents/process', {
        method: 'POST',
        body: formData
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Server Error: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        // Create document object from processed text
        const newDocument: Document = {
          id: Date.now().toString(),
          name: file.name,
          content: data.text || data.content, // Handle different response formats
          size: file.size
        };
        
        // Store the document in session storage for persistence
        try {
          sessionStorage.setItem('recentlyUploadedFile', JSON.stringify(newDocument));
        } catch (storageError) {
          console.warn('Could not save to session storage:', storageError);
        }
        
        setDocument(newDocument);
        setOriginalDocument(newDocument);
        
        toast({
          title: "Document Uploaded",
          description: `Successfully processed ${file.name}.`,
        });
      })
      .catch(error => {
        console.error('Error processing file:', error);
        toast({
          title: "Processing Failed",
          description: "The server couldn't process this document. Try a different format.",
          variant: "destructive"
        });
      })
      .finally(() => {
        setIsUploading(false);
      });
    } else {
      // For text files, use the FileReader approach
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          
          // Create document object
          const newDocument: Document = {
            id: Date.now().toString(),
            name: file.name,
            content: content,
            size: file.size
          };
          
          // Store the document in session storage for persistence
          try {
            sessionStorage.setItem('recentlyUploadedFile', JSON.stringify(newDocument));
          } catch (storageError) {
            console.warn('Could not save to session storage:', storageError);
          }
          
          setDocument(newDocument);
          setOriginalDocument(newDocument);
          
          toast({
            title: "Document Uploaded",
            description: `Successfully uploaded ${file.name}.`,
          });
        } catch (error) {
          console.error('Error processing file:', error);
          toast({
            title: "Upload Failed",
            description: "Failed to process the document. Please try again.",
            variant: "destructive"
          });
        } finally {
          setIsUploading(false);
        }
      };
      
      reader.onerror = () => {
        setIsUploading(false);
        toast({
          title: "Upload Failed",
          description: "Failed to read the document. Please try again.",
          variant: "destructive"
        });
      };
      
      reader.readAsText(file);
    }
  };

  // Handle document rewrite
  const handleRewrite = async () => {
    if (!document || !settings.instructions) {
      toast({
        title: "Missing Information",
        description: "Please upload a document and provide rewrite instructions.",
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      console.log("Sending rewrite request with document:", document.name, "content length:", document.content.length);
      
      // Make API request to rewrite using JSON instead of FormData
      const response = await fetch('/api/rewrite-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: `Please rewrite the following document according to these instructions: ${settings.instructions}`,
          model: settings.model,
          documentContent: document.content,
          documentName: document.name,
          detectionProtection: settings.detectionProtection
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Server response:", response.status, errorData);
        throw new Error(`Server error: ${errorData.error || response.statusText || response.status}`);
      }
      
      const data = await response.json();
      
      if (!data || !data.content) {
        throw new Error("The server returned an empty response");
      }
      
      setRewrittenContent(data.content);
      
      // Automatically switch to the review tab
      setActiveTab('review');
      
      toast({
        title: "Rewrite Complete",
        description: "Your document has been rewritten. You can now review, download, or share it.",
      });
    } catch (error) {
      console.error('Error rewriting document:', error);
      toast({
        title: "Rewrite Failed",
        description: error instanceof Error ? error.message : "Failed to rewrite the document. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle AI detection
  const runAIDetection = async () => {
    if (!rewrittenContent) {
      toast({
        title: "No Content",
        description: "Please rewrite the document first before running AI detection.",
        variant: "destructive"
      });
      return;
    }
    
    setIsDetecting(true);
    setAiDetectionResult(null);
    
    try {
      const response = await fetch('/api/ai-detection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rewrittenContent }),
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      setAiDetectionResult(result);
    } catch (error) {
      console.error('Error detecting AI content:', error);
      toast({
        title: "Detection Failed",
        description: "Failed to analyze the rewritten content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDetecting(false);
    }
  };

  // Handle document download
  const handleDownload = async (format: 'docx' | 'pdf') => {
    if (!rewrittenContent || rewrittenContent.trim() === '') {
      toast({
        title: "No Content",
        description: "Please rewrite the document first before downloading.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Original document name without extension
      const originalName = document?.name ? document.name.split('.')[0] : 'document';
      const filename = `${originalName}-rewritten`;
      
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: rewrittenContent,
          format,
          filename
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      // Create a blob from the response
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${filename}.${format}`;
      
      // Add to the DOM, trigger download, and clean up
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
      
      toast({
        title: "Download Started",
        description: `Your document is being downloaded as ${format.toUpperCase()}.`,
      });
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download the document. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle email sharing
  const handleShareViaEmail = async () => {
    if (!rewrittenContent || !emailRecipient || !senderEmail) {
      toast({
        title: "Missing Information",
        description: "Please provide both recipient and sender email addresses, and rewrite the document first.",
        variant: "destructive"
      });
      return;
    }
    
    // Validate recipient email
    if (!emailRecipient.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast({
        title: "Invalid Recipient Email",
        description: "Please enter a valid recipient email address.",
        variant: "destructive"
      });
      return;
    }
    
    // Validate sender email
    if (!senderEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast({
        title: "Invalid Sender Email",
        description: "Please enter a valid sender email address.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSending(true);
    
    try {
      console.log("Sending email with params:", {
        content: rewrittenContent ? rewrittenContent.substring(0, 50) + "..." : "missing",
        recipient: emailRecipient,
        sender: senderEmail,
        documentName: document?.name || 'Document'
      });
      
      const response = await fetch('/api/share-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: rewrittenContent,
          recipient: emailRecipient,
          senderEmail: senderEmail,
          documentName: document?.name || 'Document',
          format: 'pdf' // Default format for sharing
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.details || errorData.error || `Error: ${response.status}`;
        throw new Error(errorMsg);
      }
      
      toast({
        title: "Document Shared",
        description: `Your document has been sent to ${emailRecipient}.`,
      });
      
      // Clear recipient email for next use
      setEmailRecipient('');
    } catch (error) {
      console.error('Error sharing document:', error);
      toast({
        title: "Sharing Failed",
        description: error instanceof Error 
          ? error.message 
          : "Failed to share the document. Make sure your sender email is verified in SendGrid.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  // Format file size
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Get AI label based on probability
  const getAILabel = (probability: number) => {
    if (probability >= 0.8) return 'Very likely AI';
    if (probability >= 0.6) return 'Likely AI';
    if (probability >= 0.4) return 'Uncertain';
    if (probability >= 0.2) return 'Likely human';
    return 'Very likely human';
  };

  return (
    <main className="container mx-auto px-4 py-6">
      <div className="flex items-center mb-6">
        <Button 
          variant="outline"
          size="sm"
          onClick={() => {
            // Return to the previous conversation if available
            if (previousConversationId) {
              // Set the current conversation ID before navigating
              localStorage.setItem('currentConversationId', previousConversationId);
              
              // Navigate to the home page, which will load the current conversation
              setLocation('/');
            } else {
              // Otherwise just go to the home page
              setLocation('/');
            }
          }}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Chat
        </Button>
        <h1 className="text-2xl font-bold">Document Rewriter</h1>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="rewrite">
            <RefreshCw className="h-4 w-4 mr-2" />
            Rewrite
          </TabsTrigger>
          <TabsTrigger value="edit">
            <FileText className="h-4 w-4 mr-2" />
            Edit Document
          </TabsTrigger>
          <TabsTrigger value="review" disabled={!rewrittenContent}>
            <FileText className="h-4 w-4 mr-2" />
            Review
          </TabsTrigger>
          <TabsTrigger value="share" disabled={!rewrittenContent}>
            <Send className="h-4 w-4 mr-2" />
            Export & Share
          </TabsTrigger>
        </TabsList>
        
        {/* Rewrite Tab */}
        <TabsContent value="rewrite" className="space-y-6">
          {/* Document Upload/Selection Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Document
              </CardTitle>
            </CardHeader>
            <CardContent>
              {document ? (
                <div className="bg-slate-50 p-4 rounded-md">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{document.name}</div>
                      <div className="text-sm text-slate-500 mt-1">{formatBytes(document.size)}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDocument(null);
                          setOriginalDocument(null);
                          sessionStorage.removeItem('recentlyUploadedFile');
                          toast({
                            title: "Document Cleared",
                            description: "You can now upload a new document."
                          });
                        }}
                        disabled={isProcessing || isUploading}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Clear
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessing || isUploading}
                      >
                        <FilePlus className="h-4 w-4 mr-1" />
                        Change
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div 
                      className="text-sm text-slate-700 max-h-96 overflow-y-auto border rounded-md p-3 bg-white cursor-pointer hover:bg-slate-50"
                      onClick={() => setActiveTab('edit')}
                      title="Click to edit this document"
                    >
                      {document.content}
                    </div>
                    <div className="mt-2 flex justify-end">
                      <div className="text-xs text-slate-500">
                        Click document to edit before rewriting
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div 
                    className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-slate-50"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                    <p className="text-slate-600">Upload a document to rewrite</p>
                    <p className="text-xs text-slate-500 mt-1">Upload text files, DOC, DOCX, or PDF</p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload}
                    accept=".txt,.doc,.docx,.pdf"
                  />
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Rewrite Settings Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Rewrite Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Model Selection */}
              <div>
                <Label htmlFor="model">AI Model</Label>
                <Select 
                  value={settings.model} 
                  onValueChange={(value: any) => setSettings({...settings, model: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="claude">Claude (Balanced)</SelectItem>
                    <SelectItem value="gpt4">GPT-4 (Most Powerful)</SelectItem>
                    <SelectItem value="perplexity">Perplexity (Fast)</SelectItem>
                    <SelectItem value="deepseek">DeepSeek (Efficient)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Rewrite Instructions */}
              <div>
                <Label htmlFor="instructions">Rewrite Instructions</Label>
                <Textarea 
                  id="instructions"
                  placeholder="e.g., Make the text more academic, add more examples, improve the structure, etc."
                  className="min-h-[120px]"
                  value={settings.instructions}
                  onChange={(e) => setSettings({...settings, instructions: e.target.value})}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Be specific about how you want the document to be rewritten. 
                  The more details you provide, the better the results.
                </p>
              </div>
              
              {/* AI Detection Protection */}
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="detection-protection" 
                  checked={settings.detectionProtection}
                  onCheckedChange={(checked) => 
                    setSettings({...settings, detectionProtection: checked as boolean})
                  }
                />
                <Label htmlFor="detection-protection" className="cursor-pointer">
                  Optimize for AI detection resistance
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-slate-400 cursor-help">
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="w-80 text-xs">
                        Makes the output less detectable by AI detection systems, 
                        but may slightly reduce quality. For academic or professional use, 
                        we recommend keeping this enabled.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleRewrite} 
                disabled={!document || !settings.instructions || isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Rewrite Document
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Document Edit Tab */}
        <TabsContent value="edit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Edit Document Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              {document ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{document.name}</div>
                      <div className="text-sm text-slate-500 mt-1">{formatBytes(document.size)}</div>
                    </div>
                  </div>
                  
                  <Textarea 
                    value={document.content}
                    onChange={(e) => setDocument({
                      ...document,
                      content: e.target.value
                    })}
                    className="min-h-[500px] font-mono text-sm"
                    placeholder="Document content"
                  />
                  
                  <div className="flex justify-between">
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveTab('rewrite')}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline"
                        onClick={() => {
                          if (originalDocument) {
                            setDocument(originalDocument);
                            toast({
                              title: "Changes Discarded",
                              description: "Document restored to original version.",
                            });
                          }
                        }}
                      >
                        Reset to Original
                      </Button>
                      <Button 
                        onClick={() => {
                          // Save document to session storage to make it persistent
                          if (document) {
                            try {
                              sessionStorage.setItem('recentlyUploadedFile', JSON.stringify(document));
                            } catch (err) {
                              console.warn('Failed to save to session storage:', err);
                            }
                          }
                          
                          toast({
                            title: "Document Updated",
                            description: "Your changes have been saved. You can now proceed with rewriting.",
                          });
                          setActiveTab('rewrite');
                        }}
                      >
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center">
                  <p className="text-slate-600">No document uploaded yet. Please upload a document first.</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setActiveTab('rewrite')}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Upload
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Review Tab */}
        <TabsContent value="review" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Rewritten Document</CardTitle>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={runAIDetection}
                  disabled={isDetecting || !rewrittenContent}
                >
                  {isDetecting ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Fingerprint className="h-4 w-4 mr-1" />
                  )}
                  {isDetecting ? "Analyzing..." : "Run AI Detection"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* AI Detection Results */}
              {aiDetectionResult && !aiDetectionResult.error && (
                <Card className="bg-slate-50">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold flex items-center">
                        <Shield className="h-4 w-4 mr-2 text-primary" />
                        AI Detection Results
                      </h3>
                      <Badge 
                        variant={aiDetectionResult.aiProbability < 0.5 ? "outline" : "destructive"}
                        className="ml-2"
                      >
                        {getAILabel(aiDetectionResult.aiProbability)}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>AI Probability</span>
                        <span className="font-medium">{Math.round(aiDetectionResult.aiProbability * 100)}%</span>
                      </div>
                      <Progress value={aiDetectionResult.aiProbability * 100} className="h-2" />
                    </div>
                    
                    {aiDetectionResult.mostAISentence && (
                      <div className="text-xs">
                        <p className="font-medium text-red-600 mb-1">Most AI-like sentence:</p>
                        <p className="italic bg-slate-100 p-2 rounded text-slate-800">
                          "{aiDetectionResult.mostAISentence.sentence}"
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              
              {/* Error message if AI detection failed */}
              {aiDetectionResult?.error && (
                <div className="bg-red-50 p-3 rounded-md border border-red-200 text-red-800 text-sm">
                  <div className="flex items-center font-medium">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    AI Detection Error
                  </div>
                  <p className="mt-1">{aiDetectionResult.error}</p>
                </div>
              )}
              
              {/* Rewritten Content */}
              <div 
                className="bg-white border rounded-md p-4 max-h-[500px] overflow-y-auto cursor-pointer hover:bg-slate-50"
                onClick={() => {
                  // Copy to clipboard
                  navigator.clipboard.writeText(rewrittenContent)
                    .then(() => {
                      toast({
                        title: "Content Copied",
                        description: "Document content copied to clipboard",
                      });
                    })
                    .catch(err => {
                      console.error('Failed to copy:', err);
                      toast({
                        title: "Copy Failed",
                        description: "Could not copy content to clipboard",
                        variant: "destructive"
                      });
                    });
                }}
                title="Click to copy content to clipboard"
              >
                <div className="prose prose-sm max-w-none">
                  {rewrittenContent.split('\n').map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
              <div className="mt-2 flex justify-end">
                <div className="text-xs text-slate-500">
                  Click content to copy to clipboard
                </div>
              </div>
              
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab('rewrite')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Rewrite
                </Button>
                <Button 
                  onClick={() => setActiveTab('share')}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Continue to Export
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Share Tab */}
        <TabsContent value="share" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Export & Share</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Download Section */}
              <div>
                <h3 className="font-medium mb-3">Download Document</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => handleDownload('docx')}
                    className="flex-1"
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    Download as DOCX
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => handleDownload('pdf')}
                    className="flex-1"
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    Download as PDF
                  </Button>
                </div>
              </div>
              
              {/* Email Sharing */}
              <div>
                <Separator className="my-4" />
                <h3 className="font-medium mb-3">Share via Email</h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="recipient-email">Recipient Email</Label>
                    <Input 
                      id="recipient-email" 
                      type="email" 
                      placeholder="recipient@example.com"
                      value={emailRecipient}
                      onChange={(e) => setEmailRecipient(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="sender-email">Verified Sender Email</Label>
                    <Input 
                      id="sender-email" 
                      type="email" 
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                      placeholder="JM@ANALYTICPHILOSOPHY.AI"
                    />
                    <p className="text-xs text-green-700 mt-1">
                      Use your verified SendGrid sender address
                    </p>
                  </div>
                  <Button 
                    onClick={handleShareViaEmail} 
                    disabled={!emailRecipient || !senderEmail || isSending}
                    className="w-full"
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <MailIcon className="h-4 w-4 mr-2" />
                        Send Document
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-between mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab('review')}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Review
                </Button>
                <Button 
                  onClick={() => {
                    if (previousConversationId) {
                      // Set the current conversation ID before navigating
                      localStorage.setItem('currentConversationId', previousConversationId);
                      
                      // Go to specific conversation
                      setLocation(`/conversation/${previousConversationId}`);
                    } else {
                      // Otherwise return to home
                      setLocation('/');
                    }
                  }}
                >
                  Return to Chat
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}