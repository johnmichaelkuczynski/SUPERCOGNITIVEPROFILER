import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { X, RefreshCw, Loader2, Download, Share2, Copy, Check, BarChart3, Calculator } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import MathRenderer from './MathRenderer';
import 'katex/dist/katex.min.css';

interface RewriteResult {
  originalChunk: {
    id: number;
    title: string;
    content: string;
    wordCount: number;
  };
  rewrittenContent: string;
  explanation?: string;
}

interface RewriteViewerProps {
  isOpen: boolean;
  onClose: () => void;
  result: RewriteResult | null;
  onUpdate: (updatedResult: RewriteResult) => void;
}

export default function RewriteViewer({ 
  isOpen, 
  onClose, 
  result, 
  onUpdate 
}: RewriteViewerProps) {
  const [customInstructions, setCustomInstructions] = useState('');
  const [selectedModel, setSelectedModel] = useState('claude');
  const [isRewriting, setIsRewriting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isEnhancingWithGraphs, setIsEnhancingWithGraphs] = useState(false);
  const [isConvertingToMath, setIsConvertingToMath] = useState(false);
  const { toast } = useToast();

  if (!result) return null;

  const rewriteTheRewrite = async () => {
    if (!customInstructions.trim()) {
      toast({
        title: "Instructions Required",
        description: "Please provide specific instructions for how you want to rewrite this content",
        variant: "destructive"
      });
      return;
    }

    setIsRewriting(true);

    try {
      const response = await fetch('/api/rewrite-chunk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: result.rewrittenContent,
          instructions: customInstructions,
          model: selectedModel,
          chunkIndex: 0,
          totalChunks: 1
        })
      });

      if (response.ok) {
        const newResult = await response.json();
        
        const updatedResult = {
          ...result,
          rewrittenContent: newResult.rewrittenContent,
          explanation: newResult.explanation || undefined
        };
        
        onUpdate(updatedResult);
        setCustomInstructions('');
        
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
      setIsRewriting(false);
    }
  };

  const enhanceWithGraphs = async () => {
    if (!result?.rewrittenContent) return;
    
    setIsEnhancingWithGraphs(true);
    try {
      const response = await fetch('/api/enhance-with-graphs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: result.rewrittenContent,
          context: 'academic'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to enhance content with graphs');
      }

      const data = await response.json();
      
      const updatedResult = {
        ...result,
        rewrittenContent: data.enhancedContent
      };
      
      onUpdate(updatedResult);
      
      toast({
        title: "Content Enhanced",
        description: "Graphs have been automatically generated and inserted into your content",
      });
    } catch (error) {
      console.error('Error enhancing with graphs:', error);
      toast({
        title: "Enhancement Failed",
        description: "Failed to generate graphs for this content",
        variant: "destructive"
      });
    } finally {
      setIsEnhancingWithGraphs(false);
    }
  };

  const convertToMath = async () => {
    if (!result?.rewrittenContent) return;
    
    setIsConvertingToMath(true);
    try {
      const response = await fetch('/api/text-to-math', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: result.rewrittenContent,
          model: selectedModel,
          instructions: 'Convert all mathematical content to proper LaTeX notation'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to convert to mathematical notation');
      }

      const data = await response.json();
      
      const updatedResult = {
        ...result,
        rewrittenContent: data.mathContent
      };
      
      onUpdate(updatedResult);
      
      toast({
        title: "Content Converted",
        description: "Mathematical notation has been properly formatted with LaTeX",
      });
    } catch (error) {
      console.error('Error converting to math:', error);
      toast({
        title: "Conversion Failed",
        description: "Failed to convert content to mathematical notation",
        variant: "destructive"
      });
    } finally {
      setIsConvertingToMath(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.rewrittenContent);
      setIsCopied(true);
      
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
      
      toast({
        title: "Copied to clipboard",
        description: "The rewritten content has been copied to your clipboard",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy text to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: result.rewrittenContent,
          format: 'docx',
          filename: `${result.originalChunk.title}_rewritten`
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${result.originalChunk.title}_rewritten.docx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Download Complete",
          description: "Document downloaded successfully"
        });
      } else {
        throw new Error('Failed to download');
      }
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download document",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center justify-between">
            <span>{result.originalChunk.title} - Rewrite Result</span>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={convertToMath}
                disabled={isConvertingToMath}
              >
                {isConvertingToMath ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Converting
                  </>
                ) : (
                  <>
                    <Calculator className="h-4 w-4 mr-1" />
                    Fix Math
                  </>
                )}
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={enhanceWithGraphs}
                disabled={isEnhancingWithGraphs}
              >
                {isEnhancingWithGraphs ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Adding Graphs
                  </>
                ) : (
                  <>
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Add Graphs
                  </>
                )}
              </Button>
              <Button size="sm" variant="outline" onClick={handleDownload}>
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
              <Button size="sm" variant="outline" onClick={handleCopy}>
                {isCopied ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* Original Content */}
            <Card className="flex flex-col h-full">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="text-sm text-gray-600">
                  Original ({result.originalChunk.wordCount} words)
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto">
                <div className="text-sm text-gray-700 whitespace-pre-wrap">
                  {result.originalChunk.content}
                </div>
              </CardContent>
            </Card>

            {/* Rewritten Content */}
            <Card className="flex flex-col h-full">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="text-sm text-green-600">
                  Rewritten Content
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden space-y-4">
                <div className="h-64 border rounded-lg p-4 overflow-y-auto">
                  <MathRenderer 
                    content={result.rewrittenContent}
                    className="w-full text-sm leading-relaxed"
                  />
                </div>
                
                <div className="mt-2">
                  <details className="bg-gray-50 rounded-lg">
                    <summary className="cursor-pointer p-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">
                      Edit Content
                    </summary>
                    <div className="p-2 border-t">
                      <textarea
                        value={result.rewrittenContent}
                        onChange={(e) => {
                          const updatedResult = {
                            ...result,
                            rewrittenContent: e.target.value
                          };
                          onUpdate(updatedResult);
                        }}
                        className="w-full h-32 resize-none border rounded p-2 text-sm leading-relaxed"
                        style={{ 
                          fontFamily: '"Times New Roman", serif',
                          fontSize: '14px',
                          lineHeight: '1.6'
                        }}
                        placeholder="Edit content here..."
                      />
                    </div>
                  </details>
                </div>

                {result.explanation && (
                  <>
                    <Separator />
                    <div>
                      <h5 className="text-sm font-medium text-blue-600 mb-2">
                        Explanation:
                      </h5>
                      <div className="text-sm text-blue-700 bg-blue-50 p-3 rounded">
                        {result.explanation}
                      </div>
                    </div>
                  </>
                )}

                {/* Rewrite the Rewrite Section */}
                <Separator />
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h5 className="text-sm font-medium text-blue-800 mb-3">
                    🔄 Rewrite the Rewrite
                  </h5>
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Provide specific instructions for how you want to rewrite this content..."
                      value={customInstructions}
                      onChange={(e) => setCustomInstructions(e.target.value)}
                      rows={3}
                      className="text-sm"
                    />
                    <div className="flex items-center justify-between">
                      <select 
                        className="text-sm border rounded px-3 py-2"
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                      >
                        <option value="claude">Claude</option>
                        <option value="gpt4">GPT-4</option>
                        <option value="deepseek">DeepSeek</option>
                      </select>
                      <Button 
                        onClick={rewriteTheRewrite}
                        disabled={isRewriting || !customInstructions.trim()}
                        className="px-4 py-2"
                      >
                        {isRewriting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Re-rewriting...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Start Re-rewrite
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}