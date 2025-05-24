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

  // When modal opens, check if we have initial content to use
  useEffect(() => {
    if (isOpen && initialContent) {
      const newDoc: DocumentData = {
        id: Date.now().toString(),
        name: 'Chat Document.txt',
        content: initialContent,
        size: initialContent.length
      };
      
      setDocumentData(newDoc);
      setOriginalDocument(newDoc);
      
      // Check if document is large enough to suggest chunk mode
      if (initialContent.length > 10000) { // Suggest chunking for docs over 10k chars
        // Create chunks
        const chunks = splitIntoChunks(initialContent, chunkSize);
        setDocumentChunks(chunks);
        setSelectedChunkIds(chunks.map(chunk => chunk.id));
        
        toast({
          title: "Large Document Detected",
          description: `This document is large (${formatBytes(initialContent.length)}). You can use chunk mode to process specific sections.`,
        });
      } else {
        // For smaller documents, still create chunks but don't suggest chunking
        setDocumentChunks(splitIntoChunks(initialContent, chunkSize));
      }
    }
  }, [isOpen, initialContent, chunkSize]);

  // Split document content into chunks
  const splitIntoChunks = (content: string, size: number): DocumentChunk[] => {
    // Check if document is large enough to need chunking
    if (content.length < size) {
      return [{ id: 0, content, selected: true }];
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
        chunks.push({ id: chunkId++, content: currentChunk, selected: true });
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
      chunks.push({ id: chunkId, content: currentChunk, selected: true });
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
    if (!documentData || !settings.instructions) {
      toast({
        title: "Missing Information",
        description: "Please upload a document and provide rewriting instructions.",
        variant: "destructive"
      });
      return;
    }
    
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
          
          const response = await fetch('/api/rewrite-document', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: chunk.content,
              filename: `${documentData.name} (Chunk ${chunk.id + 1})`,
              model: settings.model,
              instructions: settings.instructions,
              detectionProtection: settings.detectionProtection
            }),
          });
          
          if (!response.ok) {
            throw new Error(`Error ${response.status} rewriting chunk ${chunk.id + 1}`);
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
        
        const response = await fetch('/api/rewrite-document', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: documentData.content,
            filename: documentData.name,
            model: settings.model,
            instructions: settings.instructions,
            detectionProtection: settings.detectionProtection
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
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
          title: "AI Detection Passed",
          description: "The content reads as human-written. Low probability of AI detection.",
        });
      } else if (result.aiProbability < 0.6) {
        toast({
          title: "AI Detection Warning",
          description: "Moderate chance of being detected as AI-generated. Consider further edits.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "AI Detection Failed",
          description: "High probability of being detected as AI-generated. Try rewriting with different settings.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error running AI detection:', error);
      setAiDetectionResult({
        aiProbability: 0,
        humanProbability: 0,
        error: error instanceof Error ? error.message : "Unknown error"
      });
      
      toast({
        title: "AI Detection Failed",
        description: "Could not analyze the text. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDetecting(false);
    }
  };
  
  // Get AI label based on probability
  const getAILabel = (probability: number) => {
    if (probability >= 0.8) return 'Very likely AI';
    if (probability >= 0.6) return 'Likely AI';
    if (probability >= 0.4) return 'Uncertain';
    if (probability >= 0.2) return 'Likely human';
    return 'Very likely human';
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
    
    try {
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
        throw new Error(`Download failed: ${response.status}`);
      }
      
      // Get the blob data
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      const filename = documentData?.name ? documentData.name.replace(/\.[^/.]+$/, '') : 'document';
      
      a.href = url;
      a.download = `${filename}.${format}`;
      
      // Add to the DOM, trigger download, and clean up
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
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

  // Format file size
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Handle dialog close
  const handleCloseDialog = () => {
    // If we have rewritten content and a callback, send the result back
    if (rewrittenContent && onRewriteComplete) {
      onRewriteComplete(rewrittenContent);
    }
    
    // Reset state
    setViewMode('rewrite');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Rewriter
            {documentData && documentData.content.length > 10000 && (
              <Button
                variant={chunkMode ? "secondary" : "outline"} 
                size="sm"
                onClick={() => setChunkMode(!chunkMode)}
                className="ml-2"
              >
                <Layers className="h-4 w-4 mr-1" />
                {chunkMode ? "Chunk Mode Active" : "Enable Chunk Mode"}
              </Button>
            )}
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
                  <p className="text-center text-slate-500 mb-4">
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
                          Upload Document
                        </>
                      )}
                    </Button>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileUpload}
                    accept=".txt,.md,.doc,.docx,.pdf,.jpg,.jpeg,.png"
                  />
                </div>
              ) : (
                <>
                  {/* Document Info */}
                  <div className="bg-slate-50 p-4 rounded-md">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{documentData.name}</div>
                        <div className="text-sm text-slate-500 mt-1">{formatBytes(documentData.size)}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDocumentData(null);
                            setOriginalDocument(null);
                            setDocumentChunks([]);
                            setChunkMode(false);
                            setPreviewChunkId(null);
                            toast({
                              title: "Document Cleared",
                              description: "You can now upload a new document."
                            });
                          }}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Clear
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Chunk Selection (if in chunk mode) */}
                  {chunkMode && documentChunks.length > 0 && (
                    <div className="border p-4 rounded-md">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-medium">Document Chunks</h3>
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
                      
                      <div className="space-y-2 max-h-80 overflow-y-auto p-2 border rounded-md bg-white">
                        {documentChunks.map((chunk) => (
                          <div 
                            key={chunk.id}
                            className={`p-3 border rounded-md cursor-pointer transition-colors ${
                              chunk.selected ? 'border-primary bg-primary/5' : 'border-gray-200'
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
                                  className="font-medium cursor-pointer"
                                >
                                  Chunk {chunk.id + 1}
                                </label>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => toggleChunkPreview(chunk.id)}
                                >
                                  {previewChunkId === chunk.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                              </div>
                            </div>
                            
                            {/* Chunk Preview */}
                            {previewChunkId === chunk.id && (
                              <div className="mt-2 pt-2 border-t text-sm">
                                <div className="max-h-40 overflow-y-auto p-2 bg-white rounded border">
                                  {chunk.content.split('\n').map((line, i) => (
                                    <p key={i} className="mb-1">{line || ' '}</p>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-2 text-xs text-slate-500">
                        <p>Click a chunk to preview its content. Selected chunks will be rewritten.</p>
                        <p className="font-medium mt-1">Total: {documentChunks.length} chunks, {selectedChunkIds.length} selected</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Rewrite Settings */}
                  <div className="space-y-4 border p-4 rounded-md">
                    <h3 className="font-medium">Rewrite Settings</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="model-select">Model</Label>
                      <Select
                        value={settings.model}
                        onValueChange={(value: any) => setSettings({ ...settings, model: value })}
                      >
                        <SelectTrigger id="model-select">
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="claude">Claude</SelectItem>
                          <SelectItem value="gpt4">GPT-4</SelectItem>
                          <SelectItem value="perplexity">Perplexity</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="instructions">Rewrite Instructions</Label>
                      <Textarea
                        id="instructions"
                        placeholder="Enter detailed instructions for rewriting the document..."
                        value={settings.instructions}
                        onChange={(e) => setSettings({ ...settings, instructions: e.target.value })}
                        className="min-h-[100px]"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="detection-protection"
                        checked={settings.detectionProtection}
                        onCheckedChange={(checked) => 
                          setSettings({ ...settings, detectionProtection: checked as boolean })
                        }
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor="detection-protection"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          AI Detection Protection
                        </label>
                        <p className="text-xs text-slate-500">
                          Optimize the text to avoid detection by AI content detectors.
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
              <div className="flex justify-between items-center">
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
                </div>
              </div>
              
              {/* AI Detection Result */}
              {aiDetectionResult && !aiDetectionResult.error && (
                <Card className="mb-4">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">AI Detection Result</div>
                      <Badge 
                        className={`${
                          aiDetectionResult.aiProbability < 0.3 
                            ? 'bg-green-100 text-green-800' 
                            : aiDetectionResult.aiProbability < 0.6 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {getAILabel(aiDetectionResult.aiProbability)}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span>AI Probability</span>
                      <span className="font-medium">{Math.round(aiDetectionResult.aiProbability * 100)}%</span>
                    </div>
                    <Progress value={aiDetectionResult.aiProbability * 100} className="h-2 mb-4" />
                    
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
                <div className="bg-red-50 p-3 rounded-md border border-red-200 text-red-800 text-sm mb-4">
                  <div className="flex items-center font-medium">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    AI Detection Error
                  </div>
                  <p className="mt-1">{aiDetectionResult.error}</p>
                </div>
              )}
              
              <div 
                className="bg-white border rounded-md p-4 max-h-[500px] overflow-y-auto cursor-pointer hover:bg-slate-50"
                onClick={() => {
                  navigator.clipboard.writeText(rewrittenContent);
                  toast({
                    title: "Copied",
                    description: "Content copied to clipboard",
                  });
                }}
              >
                <div className="prose prose-sm max-w-none">
                  {rewrittenContent.split('\n').map((line, i) => (
                    <p key={i}>{line || ' '}</p>
                  ))}
                </div>
              </div>
              
              {/* Back to Edit */}
              <Button 
                variant="outline" 
                onClick={() => setViewMode('rewrite')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Edit
              </Button>
            </div>
          )}
        </div>
        
        <DialogFooter>
          {viewMode === 'rewrite' ? (
            <>
              <Button 
                variant="outline" 
                onClick={handleCloseDialog}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleRewrite} 
                disabled={!documentData || !settings.instructions || isProcessing}
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