import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { X, RefreshCw, Loader2, Download, Share2, Copy, Check, Eye, Edit3 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

declare global {
  interface Window {
    renderMathInElement: any;
  }
}

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
  const [viewMode, setViewMode] = useState<'edit' | 'math'>('edit');
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
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm text-green-600">
                    Rewritten Content
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant={viewMode === 'edit' ? 'default' : 'outline'}
                      onClick={() => setViewMode('edit')}
                      className="px-3 py-1 text-xs"
                    >
                      <Edit3 className="h-3 w-3 mr-1" />
                      Edit View
                    </Button>
                    <Button
                      size="sm"
                      variant={viewMode === 'math' ? 'default' : 'outline'}
                      onClick={() => setViewMode('math')}
                      className="px-3 py-1 text-xs"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Math View
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden space-y-4">
                <div className="h-64 border rounded-lg p-2">
                  {viewMode === 'edit' ? (
                    <textarea
                      value={result.rewrittenContent}
                      onChange={(e) => {
                        const updatedResult = {
                          ...result,
                          rewrittenContent: e.target.value
                        };
                        onUpdate(updatedResult);
                      }}
                      className="w-full h-full resize-none border-none outline-none text-sm leading-relaxed"
                      style={{ 
                        fontFamily: '"Times New Roman", serif',
                        fontSize: '14px',
                        lineHeight: '1.6'
                      }}
                      placeholder="Rewritten content will appear here and can be edited..."
                    />
                  ) : (
                    <div 
                      className="w-full h-full overflow-auto text-sm leading-relaxed prose prose-sm max-w-none"
                      contentEditable={true}
                      suppressContentEditableWarning={true}
                      onInput={(e) => {
                        // Extract plain text content from the contentEditable div
                        const element = e.target as HTMLElement;
                        const textContent = element.innerText || element.textContent || '';
                        
                        const updatedResult = {
                          ...result,
                          rewrittenContent: textContent
                        };
                        onUpdate(updatedResult);
                      }}
                      onBlur={(e) => {
                        // Re-render math after editing
                        const element = e.target as HTMLElement;
                        if (window.renderMathInElement) {
                          setTimeout(() => {
                            window.renderMathInElement(element, {
                              delimiters: [
                                {left: '$$', right: '$$', display: true},
                                {left: '\\[', right: '\\]', display: true},
                                {left: '\\(', right: '\\)', display: false}
                              ],
                              throwOnError: false,
                              strict: false
                            });
                          }, 50);
                        }
                      }}
                      style={{ 
                        fontFamily: '"Times New Roman", serif',
                        fontSize: '14px',
                        lineHeight: '1.6',
                        minHeight: '100%',
                        padding: '8px',
                        border: '1px solid #e5e7eb',
                        borderRadius: '4px',
                        outline: 'none'
                      }}
                      dangerouslySetInnerHTML={{
                        __html: result.rewrittenContent
                          .replace(/\n/g, '<br>')
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.*?)\*/g, '<em>$1</em>')
                      }}
                      ref={(el) => {
                        if (el && window.renderMathInElement) {
                          // Clear any existing rendered math first
                          const mathElements = el.querySelectorAll('.katex');
                          mathElements.forEach(elem => elem.remove());
                          
                          // Force KaTeX rendering with proper timing
                          setTimeout(() => {
                            try {
                              window.renderMathInElement(el, {
                                delimiters: [
                                  {left: '$$', right: '$$', display: true},
                                  {left: '\\[', right: '\\]', display: true},
                                  {left: '\\(', right: '\\)', display: false}
                                ],
                                throwOnError: false,
                                strict: false
                              });
                            } catch (e) {
                              console.warn('KaTeX rendering failed:', e);
                            }
                          }, 200);
                        }
                      }}
                    />
                  </div>
                  )}
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