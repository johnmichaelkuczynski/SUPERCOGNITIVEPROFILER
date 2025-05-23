import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Fingerprint, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AIDetectionButtonProps {
  selectedText: string;
  onDetectionResult: (result: AIDetectionResult) => void;
}

export interface AIDetectionResult {
  aiProbability: number;
  humanProbability: number;
  detailedAnalysis?: Array<{
    sentence: string;
    aiProbability: number;
  }>;
  mostAISentence?: {
    sentence: string;
    aiProbability: number;
  };
  mostHumanSentence?: {
    sentence: string;
    aiProbability: number;
  };
}

export default function AIDetectionButton({ selectedText, onDetectionResult }: AIDetectionButtonProps) {
  const [isDetecting, setIsDetecting] = useState(false);
  const { toast } = useToast();

  const runAIDetection = async () => {
    if (!selectedText.trim()) {
      toast({
        title: "No text selected",
        description: "Please select some text to analyze for AI detection.",
        variant: "destructive"
      });
      return;
    }

    if (selectedText.length < 100) {
      toast({
        title: "Text too short",
        description: "Please select at least 100 characters for accurate AI detection.",
        variant: "destructive"
      });
      return;
    }

    setIsDetecting(true);
    
    try {
      const response = await fetch('/api/ai-detection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: selectedText }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const result = await response.json();
      onDetectionResult(result);
      
      toast({
        title: "AI Detection Complete",
        description: `Analysis shows ${Math.round(result.aiProbability * 100)}% probability of AI-generated content.`,
      });
    } catch (error) {
      console.error('Error detecting AI content:', error);
      toast({
        title: "Detection Failed",
        description: "Failed to analyze the selected text. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-1 h-8"
          disabled={isDetecting || !selectedText.trim()}
        >
          {isDetecting ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Fingerprint className="h-4 w-4 mr-1" />
          )}
          {isDetecting ? "Analyzing..." : "Detect AI"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-3">
          <h4 className="font-medium">AI Detection</h4>
          <p className="text-sm text-muted-foreground">
            Analyze selected text to determine if it was written by AI or a human.
          </p>
          <Button 
            onClick={runAIDetection} 
            className="w-full"
            disabled={isDetecting || !selectedText.trim()}
          >
            {isDetecting ? "Analyzing..." : "Run Detection"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}