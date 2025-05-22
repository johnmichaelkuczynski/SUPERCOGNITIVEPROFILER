import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Fingerprint, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

export default function TextSelectionToolbar() {
  const [selectedText, setSelectedText] = useState('');
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [result, setResult] = useState<AIDetectionResult | null>(null);
  const { toast } = useToast();
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 0) {
        const selectedStr = selection.toString().trim();
        setSelectedText(selectedStr);
        
        if (selectedStr.length > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          
          // Position above the selection
          setPosition({
            x: rect.left + rect.width / 2,
            y: rect.top - 10
          });
          
          setIsVisible(true);
        }
      } else {
        setIsVisible(false);
      }
    };
    
    const handleClick = (e: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setIsVisible(false);
      }
    };

    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('click', handleClick);
    
    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('click', handleClick);
    };
  }, []);

  const analyzeText = async () => {
    if (selectedText.length < 100) {
      toast({
        title: "Text too short",
        description: "Please select at least 100 characters to analyze.",
        variant: "destructive"
      });
      return;
    }
    
    setIsAnalyzing(true);
    setShowDialog(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/ai-detection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: selectedText }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error detecting AI content:', error);
      setResult({
        aiProbability: 0,
        humanProbability: 0,
        error: error instanceof Error ? error.message : 'Failed to analyze text'
      });
      
      toast({
        title: "Detection Failed",
        description: "There was an error analyzing the selected text. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
      setIsVisible(false); // Hide the toolbar once dialog is open
    }
  };

  const getAILabel = (probability: number) => {
    if (probability >= 0.8) return 'Very likely AI';
    if (probability >= 0.6) return 'Likely AI';
    if (probability >= 0.4) return 'Uncertain';
    if (probability >= 0.2) return 'Likely human';
    return 'Very likely human';
  };

  if (!isVisible) {
    return null;
  }

  return (
    <>
      <div 
        ref={toolbarRef}
        className="fixed z-50 bg-white shadow-md rounded-md border border-slate-200 px-2 py-1 transform -translate-x-1/2 -translate-y-full" 
        style={{ 
          left: `${position.x}px`, 
          top: `${position.y}px`,
          opacity: isVisible ? 1 : 0,
          pointerEvents: isVisible ? 'auto' : 'none',
        }}
      >
        <Button 
          size="sm" 
          variant="outline" 
          className="h-8 flex items-center gap-1"
          onClick={analyzeText}
          disabled={selectedText.length < 100 || isAnalyzing}
        >
          {isAnalyzing ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Fingerprint className="h-3 w-3" />
          )}
          <span className="text-xs">Detect AI</span>
        </Button>
      </div>
      
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>AI Content Detection</DialogTitle>
            <DialogDescription>
              Analysis of the selected text to determine if it was written by AI
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-2">
            <div className="bg-slate-50 p-3 rounded-md text-sm max-h-32 overflow-y-auto">
              <p className="text-slate-700">{selectedText.substring(0, 300)}{selectedText.length > 300 ? '...' : ''}</p>
              <div className="text-xs text-slate-500 mt-1">{selectedText.length} characters selected</div>
            </div>
            
            {isAnalyzing && (
              <div className="flex flex-col items-center justify-center py-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                <p className="text-sm text-slate-500">Analyzing text...</p>
              </div>
            )}
            
            {result && !result.error && !isAnalyzing && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-sm font-medium">
                    <span>AI Probability</span>
                    <span className="font-bold">{Math.round(result.aiProbability * 100)}%</span>
                  </div>
                  <Progress value={result.aiProbability * 100} className="h-2" />
                  <div className="flex justify-end">
                    <Badge variant={result.aiProbability > 0.5 ? "destructive" : "outline"}>
                      {getAILabel(result.aiProbability)}
                    </Badge>
                  </div>
                </div>
                
                {result.mostAISentence && (
                  <div className="text-sm">
                    <p className="font-medium text-red-600 mb-1">Most AI-like sentence:</p>
                    <p className="italic text-slate-700 bg-slate-100 p-2 rounded">"{result.mostAISentence.sentence}"</p>
                  </div>
                )}
                
                {result.mostHumanSentence && (
                  <div className="text-sm">
                    <p className="font-medium text-green-600 mb-1">Most human-like sentence:</p>
                    <p className="italic text-slate-700 bg-slate-100 p-2 rounded">"{result.mostHumanSentence.sentence}"</p>
                  </div>
                )}
              </div>
            )}
            
            {result?.error && !isAnalyzing && (
              <div className="text-red-600 p-2 bg-red-50 rounded border border-red-200 text-sm">
                <p className="font-medium">Error: {result.error}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}