import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Fingerprint, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
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

export default function AIDetectionButton() {
  const [selectedText, setSelectedText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [result, setResult] = useState<AIDetectionResult | null>(null);
  const { toast } = useToast();

  const handleOpenDialog = () => {
    setShowDialog(true);
    setResult(null);
    
    // Get the selected text if any
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      setSelectedText(selection.toString().trim());
    } else {
      setSelectedText('');
    }
  };

  const analyzeText = async () => {
    if (selectedText.length < 100) {
      toast({
        title: "Text too short",
        description: "Please enter at least 100 characters to analyze.",
        variant: "destructive"
      });
      return;
    }
    
    setIsAnalyzing(true);
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
    }
  };

  const getAILabel = (probability: number) => {
    if (probability >= 0.8) return 'Very likely AI';
    if (probability >= 0.6) return 'Likely AI';
    if (probability >= 0.4) return 'Uncertain';
    if (probability >= 0.2) return 'Likely human';
    return 'Very likely human';
  };

  return (
    <>
      <Button 
        size="default" 
        variant="default" 
        className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-4 py-2"
        onClick={handleOpenDialog}
      >
        <Fingerprint className="h-5 w-5" />
        <span className="font-medium">Detect AI</span>
      </Button>
      
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>AI Content Detection</DialogTitle>
            <DialogDescription>
              Paste or type text to analyze if it was written by AI
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-2">
            <Textarea
              placeholder="Paste text to analyze (minimum 100 characters)"
              className="min-h-[120px]"
              value={selectedText}
              onChange={(e) => setSelectedText(e.target.value)}
            />
            
            <div className="flex justify-end">
              <Button 
                onClick={analyzeText}
                disabled={isAnalyzing || selectedText.length < 100}
                className="flex items-center gap-1"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Fingerprint className="h-4 w-4" />
                    <span>Analyze Text</span>
                  </>
                )}
              </Button>
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