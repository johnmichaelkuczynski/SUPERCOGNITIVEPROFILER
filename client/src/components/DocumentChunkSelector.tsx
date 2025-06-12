import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface DocumentChunk {
  index: number;
  title: string;
  summary: string;
  wordCount: number;
}

interface DocumentChunkSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  documentId: string;
  documentTitle: string;
  chunks: DocumentChunk[];
  selectedChunks: number[];
  onChunksSelected: (selectedChunks: number[]) => void;
}

export default function DocumentChunkSelector({
  isOpen,
  onClose,
  documentId,
  documentTitle,
  chunks,
  selectedChunks: initialSelectedChunks,
  onChunksSelected
}: DocumentChunkSelectorProps) {
  const [selectedChunks, setSelectedChunks] = useState<number[]>(initialSelectedChunks);
  
  const handleToggleChunk = (index: number) => {
    setSelectedChunks(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };
  
  const handleSelectAll = () => {
    if (selectedChunks.length === chunks.length) {
      // If all are selected, deselect all
      setSelectedChunks([]);
    } else {
      // Otherwise, select all
      setSelectedChunks(chunks.map(chunk => chunk.index));
    }
  };
  
  const handleApply = () => {
    onChunksSelected(selectedChunks);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Document Sections</DialogTitle>
          <DialogDescription>
            Select specific sections of "{documentTitle}" to analyze instead of the entire document
          </DialogDescription>
        </DialogHeader>
        <Card className="w-full border-0 shadow-none">
      <CardHeader>
        <CardTitle>Document Sections</CardTitle>
        <CardDescription>
          Select specific sections of "{documentTitle}" to analyze instead of the entire document
        </CardDescription>
      </CardHeader>
      
      <div className="px-6 py-2 flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {selectedChunks.length} of {chunks.length} sections selected
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleSelectAll}
        >
          {selectedChunks.length === chunks.length ? "Deselect All" : "Select All"}
        </Button>
      </div>
      
      <Separator />
      
      <CardContent className="p-4">
        <ScrollArea className="h-[350px] pr-4">
          <div className="space-y-3">
            {chunks.map((chunk) => (
              <div 
                key={chunk.index} 
                className="flex items-start space-x-3 p-3 rounded-md border hover:bg-muted/50 transition-colors"
              >
                <Checkbox 
                  id={`chunk-${chunk.index}`}
                  checked={selectedChunks.includes(chunk.index)}
                  onCheckedChange={() => handleToggleChunk(chunk.index)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <label 
                    htmlFor={`chunk-${chunk.index}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {chunk.title}
                  </label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {chunk.summary}
                  </p>
                  <div className="text-xs text-muted-foreground mt-1">
                    {chunk.wordCount} words
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={() => onChunksSelected([])}
        >
          Cancel
        </Button>
        <Button onClick={handleApply}>
          Analyze Selected Sections
        </Button>
      </CardFooter>
        </Card>
      </DialogContent>
    </Dialog>
  );
}