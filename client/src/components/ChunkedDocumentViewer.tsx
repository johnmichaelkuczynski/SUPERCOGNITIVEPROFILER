import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Edit3, X, FileText, Download, Loader2, Share2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface DocumentChunk {
  id: number;
  title: string;
  content: string;
  startPosition: number;
  endPosition: number;
  wordCount: number;
}

interface ChunkedDocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  documentName: string;
  documentContent: string;
  onEditChunk?: (chunkId: number, title: string, content: string) => void;
  onRewriteChunk?: (chunkId: number, title: string, content: string) => void;
}

export default function ChunkedDocumentViewer({
  isOpen,
  onClose,
  documentName,
  documentContent,
  onEditChunk,
  onRewriteChunk
}: ChunkedDocumentViewerProps) {
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [selectedChunks, setSelectedChunks] = useState<Set<number>>(new Set());
  const [customInstructions, setCustomInstructions] = useState('');
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewriteResults, setRewriteResults] = useState<any[]>([]);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Split document into logical chunks
  useEffect(() => {
    if (documentContent && isOpen) {
      setIsLoading(true);
      createChunks(documentContent);
      setIsLoading(false);
    }
  }, [documentContent, isOpen]);

  const createChunks = async (content: string) => {
    try {
      // First try to get server-generated chunks
      const response = await fetch('/api/documents/chunk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, filename: documentName })
      });

      if (response.ok) {
        const serverChunks = await response.json();
        setChunks(serverChunks.map((chunk: any, index: number) => ({
          id: index,
          title: chunk.title || `Section ${index + 1}`,
          content: chunk.content,
          startPosition: chunk.startPosition || 0,
          endPosition: chunk.endPosition || content.length,
          wordCount: chunk.content.split(/\s+/).length
        })));
        return;
      }
    } catch (error) {
      console.log('Server chunking failed, using client-side chunking');
    }

    // Fallback to client-side chunking
    const localChunks = createLocalChunks(content);
    setChunks(localChunks);
  };

  const createLocalChunks = (content: string): DocumentChunk[] => {
    const maxChunkSize = 2000; // words
    const words = content.split(/\s+/);
    const chunks: DocumentChunk[] = [];
    
    // Try to split by headings first
    const lines = content.split('\n');
    const headings = lines.filter(line => 
      line.match(/^#{1,6}\s/) || 
      line.match(/^[A-Z][^a-z]*$/) ||
      line.length < 100 && line.trim().length > 5 && !line.includes('.')
    );

    if (headings.length > 1) {
      // Split by headings
      let currentChunk = '';
      let currentTitle = 'Introduction';
      let chunkIndex = 0;
      let startPos = 0;

      for (const line of lines) {
        const isHeading = headings.includes(line);
        
        if (isHeading && currentChunk.trim()) {
          // Save previous chunk
          chunks.push({
            id: chunkIndex++,
            title: currentTitle,
            content: currentChunk.trim(),
            startPosition: startPos,
            endPosition: startPos + currentChunk.length,
            wordCount: currentChunk.split(/\s+/).length
          });
          startPos += currentChunk.length;
          currentChunk = '';
        }
        
        if (isHeading) {
          currentTitle = line.replace(/^#+\s*/, '').trim() || `Section ${chunkIndex + 1}`;
        }
        
        currentChunk += line + '\n';
      }

      // Add final chunk
      if (currentChunk.trim()) {
        chunks.push({
          id: chunkIndex,
          title: currentTitle,
          content: currentChunk.trim(),
          startPosition: startPos,
          endPosition: content.length,
          wordCount: currentChunk.split(/\s+/).length
        });
      }
    } else {
      // Split by word count
      for (let i = 0; i < words.length; i += maxChunkSize) {
        const chunkWords = words.slice(i, i + maxChunkSize);
        const chunkContent = chunkWords.join(' ');
        chunks.push({
          id: chunks.length,
          title: `Section ${chunks.length + 1}`,
          content: chunkContent,
          startPosition: i,
          endPosition: Math.min(i + maxChunkSize, words.length),
          wordCount: chunkWords.length
        });
      }
    }

    return chunks;
  };

  const currentChunk = chunks[currentChunkIndex];

  const renderMathContent = (content: string) => {
    // Check if content contains math notation
    if (content.includes('\\') || content.includes('$')) {
      return (
        <div className="whitespace-pre-wrap">
          <MathJax>
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {content}
            </ReactMarkdown>
          </MathJax>
        </div>
      );
    }
    
    // Regular content
    return (
      <div className="whitespace-pre-wrap leading-relaxed">
        {content}
      </div>
    );
  };

  const handleDownloadChunk = () => {
    if (!currentChunk) return;
    
    const blob = new Blob([currentChunk.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentName}_${currentChunk.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>{documentName}</span>
              {chunks.length > 0 && (
                <Badge variant="secondary">
                  {chunks.length} sections
                </Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-muted-foreground">Processing document chunks...</div>
          </div>
        ) : (
          <div className="flex-1 flex gap-4 min-h-0">
            {/* Chunk Navigation Sidebar */}
            <div className="w-80 border-r">
              <div className="p-4 border-b">
                <h3 className="font-semibold">Document Sections</h3>
                <p className="text-sm text-muted-foreground">
                  Click any section to view and edit
                </p>
              </div>
              <ScrollArea className="h-full">
                <div className="p-4 space-y-2">
                  {chunks.map((chunk, index) => (
                    <Card 
                      key={chunk.id}
                      className={`cursor-pointer transition-all ${
                        currentChunkIndex === index 
                          ? 'ring-2 ring-primary bg-primary/5' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setCurrentChunkIndex(index)}
                    >
                      <CardContent className="p-3">
                        <div className="font-medium text-sm mb-1">
                          {chunk.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {chunk.wordCount} words
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {chunk.content.substring(0, 100)}...
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Current Chunk Display */}
            <div className="flex-1 flex flex-col min-h-0">
              {currentChunk && (
                <>
                  {/* Chunk Header */}
                  <div className="p-4 border-b flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold">{currentChunk.title}</h2>
                      <p className="text-sm text-muted-foreground">
                        Section {currentChunkIndex + 1} of {chunks.length} • {currentChunk.wordCount} words
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleDownloadChunk}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const textarea = document.createElement('textarea');
                          textarea.value = currentChunk.content;
                          document.body.appendChild(textarea);
                          textarea.select();
                          document.execCommand('copy');
                          document.body.removeChild(textarea);
                        }}
                      >
                        <FileText className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                      {onEditChunk && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onEditChunk(currentChunk.id, currentChunk.title, currentChunk.content)}
                        >
                          <Edit3 className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      )}
                      {onRewriteChunk && (
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => onRewriteChunk(currentChunk.id, currentChunk.title, currentChunk.content)}
                        >
                          <Edit3 className="h-4 w-4 mr-1" />
                          Rewrite
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Chunk Content */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="prose prose-sm max-w-none">
                      {renderMathContent(currentChunk.content)}
                    </div>
                  </ScrollArea>

                  {/* Navigation Footer */}
                  <div className="p-4 border-t flex items-center justify-between">
                    <Button 
                      variant="outline" 
                      onClick={() => setCurrentChunkIndex(Math.max(0, currentChunkIndex - 1))}
                      disabled={currentChunkIndex === 0}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    
                    <span className="text-sm text-muted-foreground">
                      {currentChunkIndex + 1} / {chunks.length}
                    </span>
                    
                    <Button 
                      variant="outline" 
                      onClick={() => setCurrentChunkIndex(Math.min(chunks.length - 1, currentChunkIndex + 1))}
                      disabled={currentChunkIndex === chunks.length - 1}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}