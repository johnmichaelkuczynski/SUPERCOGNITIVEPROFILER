import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, Upload, Download, Send, AlertTriangle, Check, X, FileDown, MailIcon, Loader2, 
  Shield, FilePlus, ArrowLeft, Fingerprint, RefreshCw, Eye, EyeOff, Layers, Split, ChevronDown, ChevronUp
} from 'lucide-react';

// Define interfaces for the component
interface DocumentRewriterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialContent?: string;
  onRewriteComplete?: (rewrittenContent: string) => void;
}

// AI Detection Result interface
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

// Define our own document type for the rewriter
interface DocumentData {
  id: string;
  name: string;
  content: string;
  size: number;
}

// Define chunk interface for document splitting
interface DocumentChunk {
  id: number;
  content: string;
  selected: boolean;
  rewritten?: string;
}

// Define settings interface
interface RewriteSettings {
  model: 'claude' | 'gpt4' | 'perplexity';
  instructions: string;
  detectionProtection: boolean;
}

export default function DocumentRewriterModal({ 
  isOpen, 
  onClose, 
  initialContent = '',
  onRewriteComplete
}: DocumentRewriterModalProps) {
  // State for document handling
  const [documentData, setDocumentData] = useState<DocumentData | null>(null);
  const [originalDocument, setOriginalDocument] = useState<DocumentData | null>(null);
  const [rewrittenContent, setRewrittenContent] = useState<string>('');
  
  // State for processing
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [aiDetectionResult, setAiDetectionResult] = useState<AIDetectionResult | null>(null);
  
  // State for document sharing and download
  const [downloading, setDownloading] = useState<boolean>(false);
  const [showEmailForm, setShowEmailForm] = useState<boolean>(false);
  const [emailAddress, setEmailAddress] = useState<string>('');
  const [sendingEmail, setSendingEmail] = useState<boolean>(false);
  
  // State for settings
  const [settings, setSettings] = useState<RewriteSettings>({
    model: 'claude',
    instructions: '',
    detectionProtection: true
  });
  
  // State for chunking
  const [documentChunks, setDocumentChunks] = useState<DocumentChunk[]>([]);
  const [chunkMode, setChunkMode] = useState<boolean>(false);
  const [selectedChunkIds, setSelectedChunkIds] = useState<number[]>([]);
  const [previewChunkId, setPreviewChunkId] = useState<number | null>(null);
  const [chunkSize, setChunkSize] = useState<number>(5000); // Default chunk size in characters
  const [isProcessingChunks, setIsProcessingChunks] = useState<boolean>(false);
  
  // State for view mode
  const [viewMode, setViewMode] = useState<'rewrite' | 'result'>('rewrite');
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Format file size
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // When modal opens, check if we have initial content to use
  useEffect(() => {
    if (isOpen && initialContent) {
      console.log("DOCUMENT LENGTH:", initialContent.length);
      console.log("FIRST 100 CHARS:", initialContent.substring(0, 100));
      
      // If we have initial content, create a document immediately
      const newDoc: DocumentData = {
        id: Date.now().toString(),
        name: 'Document from Chat.txt',
        content: initialContent,
        size: initialContent.length
      };
      
      setDocumentData(newDoc);
      setOriginalDocument(newDoc);
      setChunkMode(true); // Always enable chunk mode
      
      // Pre-populate with a default instruction for better UX
      setSettings(prev => ({
        ...prev,
        instructions: "Rewrite this content to make it more professional while keeping the same meaning."
      }));
      
      // Force document into chunks regardless of size
      const chunks = splitIntoChunks(initialContent, chunkSize);
      setDocumentChunks(chunks);
      setSelectedChunkIds(chunks.map(chunk => chunk.id));
      
      console.log(`Document loaded with ${chunks.length} chunks`);
      
      toast({
        title: "Document Processing Complete",
        description: `Your document has been split into ${chunks.length} sections. Select which ones to rewrite.`,
      });
    }
  }, [isOpen, initialContent, chunkSize]);

  // Split document into chunks for easier processing
  const splitIntoChunks = (content: string, size: number): DocumentChunk[] => {
    // ALWAYS create multiple chunks - minimum of 20 chunks
    
    // Calculate how many chunks to create
    // For large documents, we want at least 20 chunks, but not more than 100
    const documentLength = content.length;
    let numChunks = 20; // Default minimum number of chunks
    
    // For really large documents, create more chunks
    if (documentLength > 100000) {
      numChunks = 50;
    }
    if (documentLength > 500000) {
      numChunks = 75;
    }
    
    // Simple math - divide the document into roughly equal chunks
    const chunkLength = Math.floor(documentLength / numChunks);
    console.log(`Document length: ${documentLength}, creating ${numChunks} chunks of ~${chunkLength} characters each`);
    
    const chunks: DocumentChunk[] = [];
    
    // Create chunks by character count, but try to break at paragraph boundaries
    let startPos = 0;
    let chunkId = 0;
    
    while (startPos < content.length) {
      // Calculate ideal end position for this chunk
      let endPos = startPos + chunkLength;
      
      // Don't go past end of text
      if (endPos >= content.length) {
        endPos = content.length;
      } else {
        // Try to find a paragraph break near the target position
        const nextParagraph = content.indexOf("\n\n", endPos - 200);
        if (nextParagraph !== -1 && nextParagraph < endPos + 200) {
          // If we can find a paragraph break within reasonable distance, use it
          endPos = nextParagraph;
        } else {
          // Otherwise try to find a sentence end
          const nextSentence = content.indexOf(". ", endPos - 100);
          if (nextSentence !== -1 && nextSentence < endPos + 100) {
            endPos = nextSentence + 1; // Include the period
          }
        }
      }
      
      // Extract the chunk
      const chunkContent = content.substring(startPos, endPos).trim();
      
      // Add non-empty chunks to the list
      if (chunkContent.length > 0) {
        chunks.push({ 
          id: chunkId++, 
          content: chunkContent, 
          selected: true 
        });
      }
      
      // Move to next chunk position
      startPos = endPos;
    }
    
    console.log(`CREATED ${chunks.length} CHUNKS FROM DOCUMENT`);
    
    // Ensure we have at least some chunks
    if (chunks.length === 0) {
      // Fallback: just create 20 equal-sized chunks
      const simpleChunkSize = Math.ceil(content.length / 20);
      for (let i = 0; i < 20; i++) {
        const start = i * simpleChunkSize;
        const end = Math.min(start + simpleChunkSize, content.length);
        chunks.push({
          id: i,
          content: content.substring(start, end),
          selected: true
        });
      }
      console.log(`Created ${chunks.length} simple chunks as fallback`);
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
  
  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setIsUploading(true);
    
    // Read the file content
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target) {
        const content = event.target.result as string;
        
        const newDoc: DocumentData = {
          id: Date.now().toString(),
          name: file.name,
          content,
          size: file.size
        };
        
        setDocumentData(newDoc);
        setOriginalDocument(newDoc);
        
        // Check if document is large enough to suggest chunk mode
        if (content.length > 10000) { // Suggest chunking for docs over 10k chars
          // Create chunks
          const chunks = splitIntoChunks(content, chunkSize);
          setDocumentChunks(chunks);
          setSelectedChunkIds(chunks.map(chunk => chunk.id));
          
          toast({
            title: "Large Document Detected",
            description: `This document is large (${formatBytes(file.size)}). You can use chunk mode to process specific sections.`,
          });
        } else {
          // For smaller documents, still create chunks but don't suggest chunking
          setDocumentChunks(splitIntoChunks(content, chunkSize));
        }
        
        setIsUploading(false);
      }
    };
    
    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      setIsUploading(false);
      toast({
        title: "File Upload Failed",
        description: "Could not read the file. Please try again.",
        variant: "destructive"
      });
    };
    
    reader.readAsText(file);
  };

  // Handle rewrite
  const handleRewrite = async () => {
    console.log("Rewrite button clicked");
    console.log("Document data:", documentData?.name, documentData?.size);
    console.log("Instructions:", settings.instructions);
    console.log("Selected model:", settings.model);
    
    if (!documentData || !settings.instructions) {
      console.log("Missing required data for rewrite");
      toast({
        title: "Missing Information",
        description: "Please upload a document and provide rewriting instructions.",
        variant: "destructive"
      });
      return;
    }
    
    console.log("Starting rewrite process...");
    setIsProcessing(true);
    
    try {
      // Check if we're in chunk mode and have selected chunks
      if (chunkMode) {
        const selectedChunks = documentChunks.filter(chunk => chunk.selected);
        
        if (selectedChunks.length === 0) {
          toast({
            title: "No Chunks Selected",
            description: "Please select at least one chunk to rewrite.",
            variant: "destructive"
          });
          setIsProcessing(false);
          return;
        }
        
        // Process each selected chunk individually
        const updatedChunks = [...documentChunks];
        let processedCount = 0;
        
        for (const chunk of selectedChunks) {
          toast({
            title: "Processing Chunks",
            description: `Rewriting chunk ${++processedCount} of ${selectedChunks.length}...`,
          });
          
          console.log(`Rewriting chunk ${chunk.id}, content length: ${chunk.content.length}`);
          
          try {
            const response = await fetch('/api/rewrite-document', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify({
                content: chunk.content,
                filename: `${documentData.name} (Chunk ${chunk.id + 1})`,
                model: settings.model,
                instructions: settings.instructions,
                detectionProtection: settings.detectionProtection
              }),
            });
            
            console.log(`Chunk ${chunk.id} response status:`, response.status);
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error(`Chunk ${chunk.id} error:`, errorText);
              throw new Error(`Error ${response.status} rewriting chunk ${chunk.id + 1}: ${errorText}`);
            }
            
            const data = await response.json();
            
            if (!data.content) {
              throw new Error(`Server returned empty content for chunk ${chunk.id + 1}`);
            }
            
            // Update the chunk's rewritten content
            const index = updatedChunks.findIndex(c => c.id === chunk.id);
            if (index !== -1) {
              updatedChunks[index].rewritten = data.content;
            }
          } catch (chunkError) {
            console.error(`Error processing chunk ${chunk.id}:`, chunkError);
            toast({
              title: `Error Processing Chunk ${chunk.id + 1}`,
              description: chunkError instanceof Error ? chunkError.message : "Unknown error",
              variant: "destructive"
            });
          }
        }
        
        // Update all chunks with their rewritten content
        setDocumentChunks(updatedChunks);
        
        // Combine all chunks (rewritten ones and original unselected ones)
        const combinedContent = updatedChunks
          .sort((a, b) => a.id - b.id) // Ensure chunks are in the right order
          .map(chunk => chunk.rewritten || chunk.content)
          .join('\n\n');
        
        setRewrittenContent(combinedContent);
        
        toast({
          title: "Chunks Rewritten",
          description: `Successfully rewrote ${selectedChunks.length} chunk${selectedChunks.length > 1 ? 's' : ''}.`,
        });
      } else {
        // Regular full document rewrite
        console.log('Sending rewrite request with document:', documentData.name, 'content length:', documentData.content.length);
        
        // Add more debugging for the fetch request
        console.log('Preparing API request with:', {
          contentLength: documentData.content.length,
          model: settings.model,
          instructionsLength: settings.instructions.length
        });
        
        const response = await fetch('/api/rewrite-document', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            content: documentData.content,
            filename: documentData.name,
            model: settings.model,
            instructions: settings.instructions,
            detectionProtection: settings.detectionProtection
          }),
        });
        
        console.log('Fetch response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API error response:', errorText);
          throw new Error(`Server error: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        
        if (!data.content) {
          throw new Error("Server returned an empty response");
        }
        
        setRewrittenContent(data.content);
        
        toast({
          title: "Rewrite Complete",
          description: "Your document has been rewritten. You can now review the result.",
        });
      }
      
      // Switch to result view
      setViewMode('result');
    } catch (error) {
      console.error('Error rewriting document:', error);
      toast({
        title: "Rewrite Failed",
        description: error instanceof Error ? error.message : "Failed to rewrite document",
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
      
      if (result.aiProbability < 0.3) {
        toast({
          title: "AI Detection Complete",
          description: "This text appears to be mainly human-written.",
        });
      } else if (result.aiProbability > 0.7) {
        toast({
          title: "AI Detection Complete",
          description: "This text has strong indicators of AI generation.",
        });
      } else {
        toast({
          title: "AI Detection Complete",
          description: "This text has mixed human and AI characteristics.",
        });
      }
    } catch (error) {
      console.error('Error running AI detection:', error);
      toast({
        title: "AI Detection Failed",
        description: error instanceof Error ? error.message : "Failed to analyze the text",
        variant: "destructive"
      });
    } finally {
      setIsDetecting(false);
    }
  };
  
  // Get AI probability classification
  const getAIProbabilityClass = (probability: number): string => {
    if (probability >= 0.8) return 'Very likely AI';
    if (probability >= 0.6) return 'Likely AI';
    if (probability >= 0.4) return 'Uncertain';
    if (probability >= 0.2) return 'Likely human';
    return 'Very likely human';
  };

  // Handle email sharing
  const handleShareEmail = async () => {
    if (!rewrittenContent) {
      toast({
        title: "No Content",
        description: "There is no rewritten content to share.",
        variant: "destructive"
      });
      return;
    }
    
    // If email form is not showing yet, just show it
    if (!showEmailForm) {
      setShowEmailForm(true);
      return;
    }
    
    // Validate email
    if (!emailAddress || !emailAddress.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setSendingEmail(true);
      
      const response = await fetch('/api/share-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailAddress,
          content: rewrittenContent,
          subject: `Rewritten Document: ${documentData?.name || 'Document'}`
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to send email');
      }
      
      toast({
        title: "Email Sent",
        description: `Your document has been sent to ${emailAddress}`,
      });
      
      // Reset email form
      setShowEmailForm(false);
      setEmailAddress('');
      
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Email Failed",
        description: error instanceof Error ? error.message : "Failed to send the email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSendingEmail(false);
    }
  };

  // Handle download
  const handleDownload = async (format: 'txt' | 'docx' | 'pdf') => {
    if (!rewrittenContent) {
      toast({
        title: "No Content",
        description: "Please rewrite the document first before downloading.",
        variant: "destructive"
      });
      return;
    }
    
    // For large documents (>200K characters), handle more gracefully
    if (rewrittenContent.length > 200000) {
      // For TXT format, download client-side to avoid size issues
      if (format === 'txt') {
        try {
          // Create text file directly on client
          const blob = new Blob([rewrittenContent], { type: 'text/plain' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          const filename = documentData?.name ? documentData.name.replace(/\.[^/.]+$/, '') : 'document';
          
          a.href = url;
          a.download = `${filename}.txt`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          toast({
            title: "Download Complete",
            description: "Your document has been downloaded as a text file.",
          });
          return;
        } catch (error) {
          console.error('Error creating text file:', error);
          toast({
            title: "Download Failed",
            description: "Failed to create text file. Please try again.",
            variant: "destructive"
          });
          return;
        }
      } else {
        // For other formats with large content, warn user
        toast({
          title: "Document Too Large",
          description: `The document is too large to download as ${format}. Try with a smaller section or use TXT format.`,
          variant: "destructive"
        });
        return;
      }
    }
    
    try {
      setDownloading(true);
      
      // For txt format, do it client-side for better reliability
      if (format === 'txt') {
        const blob = new Blob([rewrittenContent], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        const filename = documentData?.name ? documentData.name.replace(/\.[^/.]+$/, '') : 'document';
        
        a.href = url;
        a.download = `${filename}.txt`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Download Complete",
          description: "Your document has been downloaded as a text file.",
        });
        setDownloading(false);
        return;
      }
      
      // For DOCX and PDF, use the server
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: rewrittenContent,
          format,
          filename: documentData?.name ? documentData.name.replace(/\.[^/.]+$/, '') : 'document'
        }),
      });
      
      if (!response.ok) {
        // Try to get detailed error from response
        let errorMessage = `Download failed (${response.status})`;
        try {
          const errorData = await response.json();
          if (errorData && errorData.error) {
            errorMessage = errorData.error;
          }
        } catch (e) {
          // If we can't parse the error JSON, use the default message
        }
        
        throw new Error(errorMessage);
      }
      
      // Handle the blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const filename = documentData?.name ? documentData.name.replace(/\.[^/.]+$/, '') : 'document';
      
      a.href = url;
      a.download = `${filename}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Download Complete",
        description: `Your document has been downloaded as a ${format.toUpperCase()} file.`,
      });
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Failed to download the document. Please try again.",
        variant: "destructive"
      });
    } finally {
      setDownloading(false);
    }
  };
  
  // Close dialog handler
  const handleCloseDialog = () => {
    // If we have rewritten content and onRewriteComplete callback, call it
    if (rewrittenContent && onRewriteComplete) {
      onRewriteComplete(rewrittenContent);
    }
    
    // Reset state
    setDocumentData(null);
    setOriginalDocument(null);
    setRewrittenContent('');
    setViewMode('rewrite');
    setAiDetectionResult(null);
    setShowEmailForm(false);
    setEmailAddress('');
    
    // Close the dialog
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Rewriter
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-grow overflow-auto">
          {viewMode === 'rewrite' ? (
            <div className="space-y-4">
              {/* Document Upload Section */}
              {!documentData ? (
                <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-md">
                  <div className="mb-4">
                    <FilePlus className="h-10 w-10 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Upload Document</h3>
                  <p className="text-slate-500 text-center mb-4">
                    {initialContent ? 
                      "Using content from chat. You can also upload a different document." :
                      "Upload a document to rewrite, or create a new document directly in the editor."}
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Upload File
                        </>
                      )}
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept=".txt,.doc,.docx,.pdf"
                      onChange={handleFileUpload}
                    />
                  </div>
                </div>
              ) : (
                <>
                  {/* Document Info */}
                  <div className="bg-slate-50 p-4 rounded-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-lg">{documentData.name}</div>
                        <div className="text-sm text-slate-500 mt-1">{formatBytes(documentData.size)}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDocumentData(null);
                            setOriginalDocument(null);
                            if (fileInputRef.current) {
                              fileInputRef.current.value = '';
                            }
                          }}
                        >
                          <ArrowLeft className="h-4 w-4 mr-1" />
                          Change Document
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Chunk Selection - ALWAYS VISIBLE */}
                  <div className="border-2 border-blue-500 p-4 rounded-md bg-blue-50 mb-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-medium text-lg text-blue-800">Document Chunks</h3>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedChunkIds(documentChunks.map(chunk => chunk.id));
                            setDocumentChunks(prev => prev.map(chunk => ({...chunk, selected: true})));
                          }}
                        >
                          Select All
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedChunkIds([]);
                            setDocumentChunks(prev => prev.map(chunk => ({...chunk, selected: false})));
                          }}
                        >
                          Clear All
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2 max-h-[240px] overflow-y-auto">
                      {documentChunks.map(chunk => (
                        <div 
                          key={chunk.id}
                          className={`p-3 border rounded-md transition-all ${
                            chunk.selected ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <Checkbox 
                                checked={chunk.selected}
                                onCheckedChange={() => toggleChunkSelection(chunk.id)}
                                id={`chunk-${chunk.id}`}
                              />
                              <label 
                                htmlFor={`chunk-${chunk.id}`}
                                className="text-sm font-medium cursor-pointer"
                              >
                                Section {chunk.id + 1}
                              </label>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant={previewChunkId === chunk.id ? "secondary" : "outline"}
                                size="sm"
                                onClick={() => toggleChunkPreview(chunk.id)}
                              >
                                {previewChunkId === chunk.id ? (
                                  <>
                                    <EyeOff className="h-3 w-3 mr-1" />
                                    Hide
                                  </>
                                ) : (
                                  <>
                                    <Eye className="h-3 w-3 mr-1" />
                                    Preview
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                          
                          {previewChunkId === chunk.id && (
                            <div className="mt-2 p-2 bg-white rounded border text-sm">
                              {chunk.content.length > 200 
                                ? `${chunk.content.substring(0, 200)}...` 
                                : chunk.content}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Rewrite Settings */}
                  <div className="border p-4 rounded-md">
                    <h3 className="font-medium mb-4">Rewrite Settings</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="model">AI Model</Label>
                        <Select 
                          value={settings.model} 
                          onValueChange={(value: 'claude' | 'gpt4' | 'perplexity') => 
                            setSettings(prev => ({ ...prev, model: value }))
                          }
                        >
                          <SelectTrigger id="model">
                            <SelectValue placeholder="Select a model" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="claude">Claude (Recommended)</SelectItem>
                            <SelectItem value="gpt4">GPT-4</SelectItem>
                            <SelectItem value="perplexity">Perplexity</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="instructions">Rewrite Instructions</Label>
                        <Textarea
                          id="instructions"
                          placeholder="Enter detailed instructions for rewriting the document..."
                          value={settings.instructions}
                          onChange={(e) => setSettings(prev => ({ ...prev, instructions: e.target.value }))}
                          className="h-24"
                        />
                      </div>
                      
                      <div className="p-3 bg-white rounded border">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="detection-protection"
                            checked={settings.detectionProtection}
                            onCheckedChange={(checked) => 
                              setSettings(prev => ({ ...prev, detectionProtection: checked === true }))
                            }
                          />
                          <Label htmlFor="detection-protection" className="text-sm cursor-pointer">
                            Enable AI detection protection
                          </Label>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 ml-6">
                          Makes rewritten content less detectable by AI detection tools (may reduce quality)
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Result View */
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">Rewritten Content</h3>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={runAIDetection}
                    disabled={isDetecting || !rewrittenContent}
                  >
                    {isDetecting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        Detecting...
                      </>
                    ) : (
                      <>
                        <Fingerprint className="h-4 w-4 mr-1" />
                        AI Detection
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(rewrittenContent);
                      toast({
                        title: "Copied",
                        description: "Content copied to clipboard",
                      });
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDownload('docx')}
                >
                  <FileDown className="h-4 w-4 mr-1" />
                  Download DOCX
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDownload('pdf')}
                >
                  <FileDown className="h-4 w-4 mr-1" />
                  Download PDF
                </Button>
                <Button 
                  variant="outline"
                  size="sm" 
                  disabled={isProcessing || !rewrittenContent || sendingEmail}
                  onClick={() => setShowEmailForm(!showEmailForm)}
                >
                  <MailIcon className="h-4 w-4 mr-1" />
                  Email
                </Button>
              </div>
              
              <Textarea 
                value={rewrittenContent}
                readOnly
                className="font-mono text-sm h-72"
              />
              
              {/* Email form */}
              {showEmailForm && (
                <div className="mt-4 p-4 border rounded-md bg-gray-50">
                  <h3 className="text-sm font-medium mb-2">Send Document via Email</h3>
                  <div className="flex space-x-2">
                    <Input
                      type="email"
                      placeholder="recipient@example.com"
                      value={emailAddress}
                      onChange={(e) => setEmailAddress(e.target.value)}
                      disabled={sendingEmail}
                      className="flex-1"
                    />
                    <Button 
                      size="sm"
                      disabled={sendingEmail || !emailAddress}
                      onClick={handleShareEmail}
                    >
                      {sendingEmail ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <Send className="h-4 w-4 mr-1" />
                      )}
                      Send
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowEmailForm(false)}
                      disabled={sendingEmail}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              
              {/* AI Detection Result */}
              {aiDetectionResult && !aiDetectionResult.error && (
                <Card className="mb-4">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">AI Detection Result</div>
                      <Badge 
                        className={`${
                          aiDetectionResult.aiProbability < 0.3 ? 'bg-green-500' :
                          aiDetectionResult.aiProbability > 0.7 ? 'bg-red-500' :
                          'bg-amber-500'
                        }`}
                      >
                        {getAIProbabilityClass(aiDetectionResult.aiProbability)}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span>AI Probability</span>
                      <span className="font-medium">{Math.round(aiDetectionResult.aiProbability * 100)}%</span>
                    </div>
                    <Progress
                      value={aiDetectionResult.aiProbability * 100}
                      className="h-2 mt-1 mb-4"
                    />
                    
                    {aiDetectionResult.mostAISentence && (
                      <div className="border-t pt-2 mt-4 text-sm">
                        <div className="font-medium mb-1">Most AI-like section:</div>
                        <div className="p-2 bg-red-50 rounded-sm border border-red-100 text-sm">
                          "{aiDetectionResult.mostAISentence.sentence}"
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
              
              {/* Error message if AI detection failed */}
              {aiDetectionResult?.error && (
                <div className="bg-red-50 p-3 rounded-md border border-red-200 text-red-800 text-sm mb-4">
                  <div className="flex items-center font-medium">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    AI Detection Error
                  </div>
                  <p className="mt-1">{aiDetectionResult.error}</p>
                </div>
              )}
              
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setViewMode('rewrite')}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Back to Edit
                </Button>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter>
          {viewMode === 'rewrite' ? (
            <>
              <Button 
                type="submit"
                disabled={
                  isProcessing || 
                  !documentData || 
                  !settings.instructions || 
                  (chunkMode && selectedChunkIds.length === 0)
                }
                onClick={handleRewrite}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    PROCESSING...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2" />
                    REWRITE DOCUMENT
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button 
              onClick={handleCloseDialog}
            >
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
