import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';

interface DocumentChunk {
  id: number;
  title: string;
  content: string;
}

interface DocumentChunkSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  documentName: string;
  documentContent: string;
  onChunkSelected: (chunk: DocumentChunk) => void;
}

export default function DocumentChunkSelector({
  isOpen,
  onClose,
  documentName,
  documentContent,
  onChunkSelected
}: DocumentChunkSelectorProps) {
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Split document into chunks when opened
  useEffect(() => {
    if (isOpen && documentContent) {
      splitDocumentIntoChunks();
    }
  }, [isOpen, documentContent]);

  // Split document into chunks based on headings or fixed size
  const splitDocumentIntoChunks = async () => {
    setIsLoading(true);
    
    try {
      // First try to split by headings (markdown style or numbered sections)
      const headingPattern = /(?:^|\n)(?:#{1,6}\s+|(?:\d+\.)+\s+)(.+?)(?=\n|$)/g;
      const headingMatches = Array.from(documentContent.matchAll(headingPattern));
      
      if (headingMatches.length >= 2) {
        // We have enough headings to create meaningful chunks
        const extractedChunks: DocumentChunk[] = [];
        
        // Get the positions of headings
        const headingPositions = headingMatches.map(match => match.index);
        
        // Add document end position
        headingPositions.push(documentContent.length);
        
        // Create chunks based on heading positions
        for (let i = 0; i < headingMatches.length; i++) {
          const startPos = headingMatches[i].index;
          const endPos = i < headingMatches.length - 1 
            ? headingMatches[i + 1].index 
            : documentContent.length;
          
          const chunkContent = documentContent.substring(startPos, endPos).trim();
          const title = headingMatches[i][1].trim();
          
          extractedChunks.push({
            id: i,
            title,
            content: chunkContent
          });
        }
        
        // If we have chunks, generate summaries and set them
        if (extractedChunks.length > 0) {
          const chunksWithSummaries = await generateChunkSummaries(extractedChunks);
          setChunks(chunksWithSummaries);
          setIsLoading(false);
          return;
        }
      }
      
      // If heading-based splitting didn't work, split by fixed size (approximately 1000 words)
      const words = documentContent.split(/\s+/);
      const chunkSize = 1000; // words per chunk
      const extractedChunks: DocumentChunk[] = [];
      
      for (let i = 0; i < words.length; i += chunkSize) {
        const chunkWords = words.slice(i, i + chunkSize);
        const chunkContent = chunkWords.join(' ');
        
        extractedChunks.push({
          id: i / chunkSize,
          title: `Section ${(i / chunkSize) + 1}`,
          content: chunkContent
        });
      }
      
      // Generate summaries for fixed-size chunks
      const chunksWithSummaries = await generateChunkSummaries(extractedChunks);
      setChunks(chunksWithSummaries);
    } catch (error) {
      console.error('Error splitting document:', error);
      
      // Fallback: create a single chunk with the entire document
      setChunks([{
        id: 0,
        title: documentName,
        content: documentContent
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate summaries for chunks using OpenAI
  const generateChunkSummaries = async (chunks: DocumentChunk[]): Promise<DocumentChunk[]> => {
    try {
      // Make parallel requests to get summaries
      const summaryPromises = chunks.map(async chunk => {
        // Take first 3000 chars for summary generation to avoid token limits
        const truncatedContent = chunk.content.substring(0, 3000);
        
        const response = await fetch('/api/llm/summarize-chunk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content: truncatedContent
          })
        });
        
        if (!response.ok) {
          // If there's an error, use the first 50 chars of content as fallback title
          return {
            ...chunk,
            title: chunk.title || truncatedContent.substring(0, 50).replace(/\n/g, ' ') + '...'
          };
        }
        
        const data = await response.json();
        return {
          ...chunk,
          title: data.summary || chunk.title
        };
      });
      
      return await Promise.all(summaryPromises);
    } catch (error) {
      console.error('Error generating summaries:', error);
      return chunks; // Return original chunks if summarization fails
    }
  };

  // Handle chunk selection
  const handleChunkSelect = (chunk: DocumentChunk) => {
    onChunkSelected(chunk);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select a Section to Process</DialogTitle>
          <DialogDescription>
            The document "{documentName}" has been split into {chunks.length} sections.
            Select which section you would like to focus on:
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-[50vh] my-4">
          <div className="space-y-4 pr-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                <span className="ml-2">Analyzing document sections...</span>
              </div>
            ) : (
              chunks.map(chunk => (
                <Card
                  key={chunk.id}
                  className="p-4 cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => handleChunkSelect(chunk)}
                >
                  <h3 className="font-medium mb-2">{chunk.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {chunk.content.substring(0, 100).replace(/\n/g, ' ')}...
                  </p>
                  <div className="text-xs text-muted-foreground mt-2">
                    {Math.round(chunk.content.split(/\s+/).length)} words
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}