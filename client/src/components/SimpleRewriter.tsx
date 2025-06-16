import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Edit3, X, FileText, Download, Loader2, Share2, RefreshCw, Eye } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import RewriteViewer from './RewriteViewer';

interface DocumentChunk {
  id: number;
  title: string;
  content: string;
  wordCount: number;
}

interface SimpleRewriterProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentName: string;
}

export default function SimpleRewriter({
  isOpen,
  onClose,
  documentId,
  documentName
}: SimpleRewriterProps) {
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [selectedChunks, setSelectedChunks] = useState<Set<number>>(new Set());
  const [customInstructions, setCustomInstructions] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewriteResults, setRewriteResults] = useState<any[]>([]);
  const [availableDocuments, setAvailableDocuments] = useState<any[]>([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>(documentId || '');
  const [currentDocumentName, setCurrentDocumentName] = useState<string>(documentName || '');
  const [rewritingIndex, setRewritingIndex] = useState<number | null>(null);
  const [selectedResult, setSelectedResult] = useState<any | null>(null);
  const [showRewriteViewer, setShowRewriteViewer] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'claude' | 'gpt4' | 'perplexity' | 'deepseek'>('claude');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadAvailableDocuments();
      if (documentId) {
        loadChunks();
      }
    }
  }, [isOpen, documentId]);

  useEffect(() => {
    if (selectedDocumentId && selectedDocumentId !== documentId) {
      // Clear previous results when switching documents
      setRewriteResults([]);
      setSelectedChunks(new Set());
      loadChunksForDocument(selectedDocumentId);
    }
  }, [selectedDocumentId]);

  const loadAvailableDocuments = async () => {
    try {
      const response = await fetch('/api/documents');
      if (response.ok) {
        const documents = await response.json();
        setAvailableDocuments(documents);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  const loadChunksForDocument = async (docId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/documents/chunk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: docId })
      });

      if (response.ok) {
        const data = await response.json();
        setChunks(data);
        setSelectedChunks(new Set());
        setRewriteResults([]);
        
        // Get document name
        const doc = availableDocuments.find(d => d.id === docId);
        if (doc) {
          setCurrentDocumentName(doc.title);
        }
      }
    } catch (error) {
      console.error('Error loading chunks:', error);
      toast({
        title: "Error",
        description: "Failed to load document chunks",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadChunks = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/documents/chunk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId })
      });

      if (response.ok) {
        const data = await response.json();
        const formattedChunks = data.map((chunk: any, index: number) => ({
          id: index,
          title: chunk.title || `Section ${index + 1}`,
          content: chunk.content,
          wordCount: chunk.content.split(/\s+/).length
        }));
        setChunks(formattedChunks);
      } else {
        throw new Error('Failed to load document chunks');
      }
    } catch (error) {
      console.error('Error loading chunks:', error);
      toast({
        title: "Error",
        description: "Failed to load document chunks",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChunkSelection = (chunkId: number) => {
    setSelectedChunks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chunkId)) {
        newSet.delete(chunkId);
      } else {
        newSet.add(chunkId);
      }
      return newSet;
    });
  };

  const selectAllChunks = () => {
    setSelectedChunks(new Set(chunks.map(chunk => chunk.id)));
  };

  const deselectAllChunks = () => {
    setSelectedChunks(new Set());
  };

  const handleRewrite = async () => {
    if (selectedChunks.size === 0) {
      toast({
        title: "No chunks selected",
        description: "Please select at least one chunk to rewrite",
        variant: "destructive"
      });
      return;
    }

    // Always start completely fresh - clear any previous results
    setRewriteResults([]);

    setIsRewriting(true);

    try {
      const selectedChunkData = chunks.filter(chunk => selectedChunks.has(chunk.id));
      const results = [];

      for (let i = 0; i < selectedChunkData.length; i++) {
        const chunk = selectedChunkData[i];
        
        const response = await fetch('/api/rewrite-chunk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: chunk.content,
            instructions: customInstructions || 'Improve clarity, style, and readability while maintaining the original meaning and tone.',
            model: selectedModel,
            chunkIndex: i,
            totalChunks: selectedChunkData.length
          })
        });

        if (response.ok) {
          const result = await response.json();
          results.push({
            originalChunk: chunk,
            rewrittenContent: result.rewrittenContent,
            explanation: result.explanation
          });
        } else {
          throw new Error(`Failed to rewrite chunk: ${chunk.title}`);
        }

        // Add 15-second pause between requests to prevent rate limiting (except for last chunk)
        if (i < selectedChunkData.length - 1) {
          console.log(`Pausing 15 seconds before processing next chunk to prevent rate limiting...`);
          await new Promise(resolve => setTimeout(resolve, 15000));
        }
      }

      setRewriteResults(results);
      toast({
        title: "Rewrite Complete",
        description: `Successfully rewrote ${results.length} chunks`
      });

    } catch (error) {
      console.error('Error rewriting chunks:', error);
      toast({
        title: "Rewrite Failed",
        description: error instanceof Error ? error.message : "Failed to rewrite selected chunks",
        variant: "destructive"
      });
    } finally {
      setIsRewriting(false);
    }
  };

  const downloadRewrite = async () => {
    if (rewriteResults.length === 0) return;

    try {
      // Combine all rewritten content
      const combinedContent = rewriteResults.map(result => 
        `## ${result.originalChunk.title}\n\n${result.rewrittenContent}\n\n`
      ).join('');

      const response = await fetch('/api/download-rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: combinedContent,
          format: 'docx',
          title: `${documentName}_rewritten`
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${documentName}_rewritten.docx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Download Complete",
          description: "Rewritten document downloaded successfully"
        });
      } else {
        throw new Error('Failed to download rewrite');
      }
    } catch (error) {
      console.error('Error downloading rewrite:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download rewritten document",
        variant: "destructive"
      });
    }
  };

  const printToPdf = async () => {
    if (rewriteResults.length === 0) return;

    try {
      const response = await fetch('/api/print-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          results: rewriteResults,
          documentName: currentDocumentName
        })
      });

      if (response.ok) {
        const htmlContent = await response.text();
        
        // Open formatted HTML in new window for printing/saving as PDF
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          
          // Trigger print dialog after content loads
          printWindow.onload = () => {
            setTimeout(() => {
              printWindow.print();
            }, 500);
          };
          
          toast({
            title: "Print Ready",
            description: "Document opened in new window. Use Print > Save as PDF."
          });
        } else {
          throw new Error('Could not open print window');
        }
      } else {
        throw new Error('Failed to generate print format');
      }
    } catch (error) {
      console.error('Print error:', error);
      toast({
        title: "Print Failed",
        description: "Please allow popups and try again.",
        variant: "destructive"
      });
    }
  };

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailForm, setEmailForm] = useState({
    fromEmail: '',
    toEmail: '',
    subject: ''
  });

  const emailRewrite = () => {
    if (rewriteResults.length === 0) return;
    setShowEmailForm(true);
    setEmailForm({
      fromEmail: '',
      toEmail: '',
      subject: `Rewritten Document: ${currentDocumentName}`
    });
  };

  const sendEmail = async () => {
    if (!emailForm.fromEmail || !emailForm.toEmail) {
      toast({
        title: "Missing Information",
        description: "Both sender and recipient emails are required",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/email-rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          results: rewriteResults,
          documentName: currentDocumentName,
          fromEmail: emailForm.fromEmail,
          toEmail: emailForm.toEmail,
          subject: emailForm.subject
        })
      });

      if (response.ok) {
        toast({
          title: "Email Sent",
          description: `Document sent from ${emailForm.fromEmail} to ${emailForm.toEmail}`
        });
        setShowEmailForm(false);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Email Failed",
        description: error instanceof Error ? error.message : "Failed to send email",
        variant: "destructive"
      });
    }
  };

  const clearResults = () => {
    setRewriteResults([]);
    setSelectedChunks(new Set());
    toast({
      title: "Results Cleared",
      description: "Previous rewrite results have been cleared"
    });
  };

  const rewriteTheRewrite = async (resultIndex: number) => {
    const instructionsElement = document.getElementById(`rewrite-instructions-${resultIndex}`) as HTMLTextAreaElement;
    const modelElement = document.getElementById(`rewrite-model-${resultIndex}`) as HTMLSelectElement;
    
    const customInstructions = instructionsElement?.value || '';
    const selectedModel = modelElement?.value || 'claude';
    
    if (!customInstructions.trim()) {
      toast({
        title: "Instructions Required",
        description: "Please provide specific instructions for how you want to rewrite this content",
        variant: "destructive"
      });
      return;
    }

    const currentResult = rewriteResults[resultIndex];
    if (!currentResult) return;

    setRewritingIndex(resultIndex);

    try {
      // Call the rewrite API with the current rewritten content as input
      const response = await fetch('/api/rewrite-chunk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: currentResult.rewrittenContent,
          instructions: customInstructions,
          model: selectedModel,
          chunkIndex: 0,
          totalChunks: 1
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        // Update the result in place with the new rewritten content
        const updatedResults = [...rewriteResults];
        updatedResults[resultIndex] = {
          ...currentResult,
          rewrittenContent: result.rewrittenContent,
          explanation: result.explanation || undefined
        };
        
        setRewriteResults(updatedResults);
        
        // Clear the instructions field
        if (instructionsElement) {
          instructionsElement.value = '';
        }
        
        toast({
          title: "Re-rewrite Complete",
          description: "Content has been successfully rewritten with your custom instructions"
        });
      } else {
        throw new Error('Failed to rewrite content');
      }
    } catch (error) {
      console.error('Error in rewrite-the-rewrite:', error);
      toast({
        title: "Re-rewrite Failed",
        description: error instanceof Error ? error.message : "Failed to rewrite content",
        variant: "destructive"
      });
    } finally {
      setRewritingIndex(null);
    }
  };

  const openRewriteViewer = (result: any) => {
    setSelectedResult(result);
    setShowRewriteViewer(true);
  };

  const handleRewriteUpdate = (updatedResult: any) => {
    const resultIndex = rewriteResults.findIndex(r => 
      r.originalChunk.id === updatedResult.originalChunk.id
    );
    
    if (resultIndex !== -1) {
      const updatedResults = [...rewriteResults];
      updatedResults[resultIndex] = updatedResult;
      setRewriteResults(updatedResults);
      setSelectedResult(updatedResult);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Rewrite Document: {currentDocumentName}
          </DialogTitle>
          
          {/* Document Selector */}
          {availableDocuments.length > 0 && (
            <div className="mt-3">
              <label className="block text-sm font-medium mb-2">
                Select Document to Process
              </label>
              <select
                value={selectedDocumentId}
                onChange={(e) => {
                  const newDocId = e.target.value;
                  setSelectedDocumentId(newDocId);
                  // Clear all previous results when switching documents
                  setRewriteResults([]);
                  setSelectedChunks(new Set());
                  setCustomInstructions('');
                }}
                className="w-full p-2 border border-gray-300 rounded-md bg-white dark:bg-gray-800 dark:border-gray-600"
              >
                <option value="">Choose a document...</option>
                {availableDocuments.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.title} ({new Date(doc.date).toLocaleDateString()})
                  </option>
                ))}
              </select>
            </div>
          )}
        </DialogHeader>

        <div className="flex flex-col flex-1 space-y-4 overflow-hidden">
          {/* Instructions and Model Selection */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm">Custom Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Enter specific instructions for how you want the selected chunks rewritten (optional)"
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  rows={3}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">AI Model</CardTitle>
              </CardHeader>
              <CardContent>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value as 'claude' | 'gpt4' | 'perplexity' | 'deepseek')}
                  className="w-full p-2 border border-gray-300 rounded-md bg-white dark:bg-gray-800 dark:border-gray-600"
                >
                  <option value="claude">Claude (Balanced)</option>
                  <option value="gpt4">GPT-4 (Most Powerful)</option>
                  <option value="perplexity">Perplexity (Fast)</option>
                  <option value="deepseek">DeepSeek (Efficient)</option>
                </select>
              </CardContent>
            </Card>
          </div>

          {/* Chunk Selection Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {selectedChunks.size} of {chunks.length} chunks selected
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAllChunks}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={deselectAllChunks}>
                Deselect All
              </Button>
              <Button 
                onClick={handleRewrite}
                disabled={isRewriting || selectedChunks.size === 0}
                className="ml-4"
              >
                {isRewriting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Rewriting...
                  </>
                ) : (
                  <>
                    <Edit3 className="mr-2 h-4 w-4" />
                    Rewrite Selected
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
            {/* Chunks Selection Panel */}
            <Card className="flex flex-col min-h-0">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="text-sm">Select Chunks to Rewrite</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full p-6">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {chunks.map((chunk) => (
                        <Card 
                          key={chunk.id}
                          className={`cursor-pointer transition-colors ${
                            selectedChunks.has(chunk.id) 
                              ? 'ring-2 ring-blue-500 bg-blue-50' 
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => toggleChunkSelection(chunk.id)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-start gap-3">
                              <Checkbox
                                checked={selectedChunks.has(chunk.id)}
                                onChange={() => toggleChunkSelection(chunk.id)}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-medium text-sm truncate">
                                    {chunk.title}
                                  </h4>
                                  <Badge variant="secondary" className="text-xs">
                                    {chunk.wordCount} words
                                  </Badge>
                                </div>
                                <div className="text-xs text-gray-600 line-clamp-3">
                                  {chunk.content.substring(0, 200)}...
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Results Panel */}
            <Card className="flex flex-col min-h-0">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="text-sm flex items-center justify-between">
                  Rewrite Results
                  {rewriteResults.length > 0 && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={downloadRewrite}>
                        <Download className="h-4 w-4 mr-1" />
                        Download DOCX
                      </Button>
                      <Button size="sm" variant="outline" onClick={printToPdf}>
                        <FileText className="h-4 w-4 mr-1" />
                        Print to PDF
                      </Button>
                      <Button size="sm" variant="outline" onClick={emailRewrite}>
                        <Share2 className="h-4 w-4 mr-1" />
                        Email Document
                      </Button>
                      <Button size="sm" variant="destructive" onClick={clearResults}>
                        <X className="h-4 w-4 mr-1" />
                        Clear Results
                      </Button>
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                <ScrollArea className="h-full p-6">
                  {rewriteResults.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-gray-500">
                      <div className="text-center">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Rewrite results will appear here</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {rewriteResults.map((result, index) => (
                        <Card 
                          key={index} 
                          className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-green-500"
                          onClick={() => openRewriteViewer(result)}
                        >
                          <CardHeader>
                            <CardTitle className="text-sm flex items-center justify-between">
                              <span>{result.originalChunk.title}</span>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  {result.originalChunk.wordCount} words
                                </Badge>
                                <Eye className="h-4 w-4 text-gray-500" />
                              </div>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div>
                              <h5 className="text-xs font-medium text-gray-600 mb-1">
                                Original Preview:
                              </h5>
                              <div className="text-xs text-gray-700 bg-gray-50 p-2 rounded">
                                {result.originalChunk.content.substring(0, 120)}...
                              </div>
                            </div>
                            <Separator />
                            <div>
                              <h5 className="text-xs font-medium text-green-600 mb-1">
                                Rewritten Preview:
                              </h5>
                              <div className="text-xs text-green-700 bg-green-50 p-2 rounded">
                                {result.rewrittenContent.substring(0, 120)}...
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-2">
                              <span className="text-xs text-gray-500">Click to view full rewrite</span>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openRewriteViewer(result);
                                }}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View Full
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Email Form Modal */}
        {showEmailForm && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
              <h3 className="text-lg font-semibold mb-4">Email Document</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    From Email (SendGrid Verified):
                  </label>
                  <input
                    type="email"
                    placeholder="your-verified@domain.com"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={emailForm.fromEmail}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, fromEmail: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    To Email:
                  </label>
                  <input
                    type="email"
                    placeholder="recipient@example.com"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={emailForm.toEmail}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, toEmail: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Subject:
                  </label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={emailForm.subject}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={sendEmail}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
                  >
                    Send Email
                  </button>
                  <button
                    onClick={() => setShowEmailForm(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>

      <RewriteViewer
        isOpen={showRewriteViewer}
        onClose={() => setShowRewriteViewer(false)}
        result={selectedResult}
        onUpdate={handleRewriteUpdate}
      />
    </Dialog>
  );
}