import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Edit3, X, FileText, Download, Loader2, Share2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

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
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && documentId) {
      loadChunks();
    }
  }, [isOpen, documentId]);

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

    setIsRewriting(true);
    setRewriteResults([]);

    try {
      const selectedChunkData = chunks.filter(chunk => selectedChunks.has(chunk.id));
      const results = [];

      for (const chunk of selectedChunkData) {
        const response = await fetch('/api/rewrite-chunk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: chunk.content,
            instructions: customInstructions || 'Improve clarity, style, and readability while maintaining the original meaning and tone.',
            model: 'claude',
            chunkIndex: selectedChunkData.indexOf(chunk),
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

  const shareRewrite = async () => {
    if (rewriteResults.length === 0) return;

    try {
      const response = await fetch('/api/share-rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          results: rewriteResults,
          documentName: documentName
        })
      });

      if (response.ok) {
        const data = await response.json();
        navigator.clipboard.writeText(data.shareUrl);
        toast({
          title: "Share Link Copied",
          description: "Share link has been copied to clipboard"
        });
      } else {
        throw new Error('Failed to create share link');
      }
    } catch (error) {
      console.error('Error sharing rewrite:', error);
      toast({
        title: "Share Failed",
        description: "Failed to create share link",
        variant: "destructive"
      });
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Rewrite Document: {documentName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col flex-1 space-y-4 overflow-hidden">
          {/* Instructions Section */}
          <Card>
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

          <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-hidden">
            {/* Chunks Selection Panel */}
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle className="text-sm">Select Chunks to Rewrite</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
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
            <Card className="flex flex-col">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="text-sm flex items-center justify-between">
                  Rewrite Results
                  {rewriteResults.length > 0 && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={downloadRewrite}>
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      <Button size="sm" variant="outline" onClick={shareRewrite}>
                        <Share2 className="h-4 w-4 mr-1" />
                        Share
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
                        <Card key={index}>
                          <CardHeader>
                            <CardTitle className="text-sm">
                              {result.originalChunk.title}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div>
                              <h5 className="text-xs font-medium text-gray-600 mb-1">
                                Original ({result.originalChunk.wordCount} words):
                              </h5>
                              <div className="text-xs text-gray-700 bg-gray-50 p-2 rounded">
                                {result.originalChunk.content.substring(0, 150)}...
                              </div>
                            </div>
                            <Separator />
                            <div>
                              <h5 className="text-xs font-medium text-green-600 mb-1">
                                Rewritten:
                              </h5>
                              <div className="text-xs whitespace-pre-wrap prose max-w-none">
                                <ReactMarkdown
                                  remarkPlugins={[remarkMath]}
                                  rehypePlugins={[rehypeKatex]}
                                >
                                  {result.rewrittenContent}
                                </ReactMarkdown>
                              </div>
                            </div>
                            {result.explanation && (
                              <>
                                <Separator />
                                <div>
                                  <h5 className="text-xs font-medium text-blue-600 mb-1">
                                    Explanation:
                                  </h5>
                                  <div className="text-xs text-blue-700 bg-blue-50 p-2 rounded">
                                    {result.explanation}
                                  </div>
                                </div>
                              </>
                            )}
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
      </DialogContent>
    </Dialog>
  );
}