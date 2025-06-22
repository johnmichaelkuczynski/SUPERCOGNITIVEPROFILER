import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Edit3, Eye, RefreshCw, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { processContentForMathRendering, renderMathInElement } from '@/utils/mathRenderer';

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
  const [viewMode, setViewMode] = useState<'edit' | 'math'>('edit');
  const [customInstructions, setCustomInstructions] = useState('');
  const [selectedModel, setSelectedModel] = useState<'claude' | 'gpt4' | 'deepseek'>('deepseek');
  const [isRewriting, setIsRewriting] = useState(false);
  const { toast } = useToast();

  if (!result) return null;

  const rewriteTheRewrite = async () => {
    if (!customInstructions.trim()) {
      toast({
        title: "Instructions Required",
        description: "Please provide specific instructions for the rewrite.",
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
          isRerewrite: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to rewrite content');
      }

      const data = await response.json();
      
      const updatedResult = {
        ...result,
        rewrittenContent: data.rewrittenContent
      };
      
      onUpdate(updatedResult);
      setCustomInstructions('');
      
      toast({
        title: "Content Rewritten!",
        description: "Your content has been rewritten with the new instructions."
      });
    } catch (error) {
      console.error('Error rewriting content:', error);
      toast({
        title: "Rewrite Failed",
        description: "Failed to rewrite content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRewriting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Rewrite Results - Chunk {result.originalChunk.id}</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
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
                      Edit
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
                <div className="h-96 border rounded-lg">
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
                      className="w-full h-full resize-none border-none outline-none text-sm leading-relaxed p-4"
                      style={{ 
                        fontFamily: '"Times New Roman", serif',
                        fontSize: '14px',
                        lineHeight: '1.6'
                      }}
                      placeholder="Your content is fully editable here. Just click and type to make changes..."
                    />
                  ) : (
                    <div 
                      className="w-full h-full overflow-auto text-sm leading-relaxed prose prose-sm max-w-none p-4"
                      style={{ 
                        fontFamily: '"Times New Roman", serif',
                        fontSize: '14px',
                        lineHeight: '1.6'
                      }}
                      dangerouslySetInnerHTML={{
                        __html: processContentForMathRendering(result.rewrittenContent)
                      }}
                      ref={(el) => {
                        if (el) {
                          setTimeout(() => {
                            try {
                              renderMathInElement(el);
                              console.log('✅ Math rendered in RewriteViewer with double-escape fix');
                            } catch (e) {
                              console.error('❌ KaTeX rendering failed in RewriteViewer:', e);
                            }
                          }, 100);
                        }
                      }}
                    />
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
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value as 'claude' | 'gpt4' | 'deepseek')}
                        className="text-xs px-2 py-1 border rounded"
                      >
                        <option value="deepseek">DeepSeek</option>
                        <option value="claude">Claude</option>
                        <option value="gpt4">GPT-4</option>
                      </select>
                      <Button
                        size="sm"
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