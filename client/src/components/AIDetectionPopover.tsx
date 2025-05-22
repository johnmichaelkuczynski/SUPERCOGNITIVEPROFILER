import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Fingerprint, Shield, Check, X, AlertTriangle, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface AIDetectionPopoverProps {
  onDetectionRequest?: () => void;
}

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

export default function AIDetectionPopover({ onDetectionRequest }: AIDetectionPopoverProps) {
  const [selectedText, setSelectedText] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [result, setResult] = useState<AIDetectionResult | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 0) {
        setSelectedText(selection.toString());
      }
    };

    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('keyup', handleSelection);

    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('keyup', handleSelection);
    };
  }, []);

  const runAIDetection = async () => {
    if (!selectedText || selectedText.length < 100) {
      toast({
        title: "Text selection too short",
        description: "Please select at least 100 characters of text to analyze.",
        variant: "destructive"
      });
      return;
    }

    setIsDetecting(true);
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
      
      if (onDetectionRequest) {
        onDetectionRequest();
      }
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
      setIsDetecting(false);
    }
  };

  const getAILabel = (probability: number) => {
    if (probability >= 0.8) return 'Very likely AI';
    if (probability >= 0.6) return 'Likely AI';
    if (probability >= 0.4) return 'Uncertain';
    if (probability >= 0.2) return 'Likely human';
    return 'Very likely human';
  };

  const isButtonDisabled = selectedText.length < 100 || isDetecting;
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-1 h-8"
          disabled={isButtonDisabled}
          onClick={() => !isButtonDisabled && setIsOpen(true)}
        >
          {isDetecting ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Fingerprint className="h-4 w-4 mr-1" />
          )}
          Detect AI
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              AI Content Detection
            </CardTitle>
            <CardDescription>
              Analyze selected text to determine if it was written by AI or a human.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 space-y-4">
            {selectedText.length < 100 ? (
              <div className="text-amber-600 flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>Please select at least 100 characters of text to analyze.</span>
              </div>
            ) : (
              <div className="bg-slate-50 p-3 rounded-md text-sm max-h-40 overflow-y-auto">
                <p className="text-slate-700">{selectedText.substring(0, 500)}{selectedText.length > 500 ? '...' : ''}</p>
                <div className="text-xs text-slate-500 mt-1">{selectedText.length} characters selected</div>
              </div>
            )}
            
            {result && !result.error && (
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
            
            {result?.error && (
              <div className="text-red-600 p-2 bg-red-50 rounded border border-red-200 text-sm">
                <p className="font-medium">Error: {result.error}</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="px-0 pt-0 flex justify-between">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              Close
            </Button>
            <Button 
              size="sm" 
              onClick={runAIDetection} 
              disabled={isButtonDisabled}
            >
              {isDetecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Fingerprint className="h-4 w-4 mr-1" />
                  Analyze Text
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </PopoverContent>
    </Popover>
  );
}