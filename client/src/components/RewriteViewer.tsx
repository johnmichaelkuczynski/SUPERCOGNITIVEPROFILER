import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Edit3, Eye, RefreshCw, Loader2, Highlighter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

  const handleDirectEdit = () => {
    setViewMode('edit');
    toast({
      title: "Edit Mode Enabled",
      description: "You can now directly edit the content in the text area."
    });
  };



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
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDirectEdit}
                      className="px-3 py-1 text-xs"
                    >
                      <Edit3 className="h-3 w-3 mr-1" />
                      Edit
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
                      placeholder="Click 'Edit' button above to start editing your content directly..."
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
                        __html: result.rewrittenContent
                          .replace(/\n/g, '<br>')
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.*?)\*/g, '<em>$1</em>')
                      }}
                      ref={(el) => {
                        if (el && window.renderMathInElement) {
                          const mathElements = el.querySelectorAll('.katex');
                          mathElements.forEach(elem => elem.remove());
                          
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

                {/* Text Selection Rewrite Section */}
                {showSelectionRewrite && (
                  <>
                    <Separator />
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <h5 className="text-sm font-medium text-yellow-800 mb-3">
                        🎯 Rewrite Selected Text
                      </h5>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-medium text-yellow-700">Selected Text:</label>
                          <div className="text-xs bg-white p-2 rounded border border-yellow-300 max-h-20 overflow-y-auto">
                            "{selectedText}"
                          </div>
                        </div>
                        <Textarea
                          placeholder="How should this selected text be rewritten? (e.g., 'render this with proper LaTeX math notation', 'make this more formal', 'fix the grammar')"
                          value={selectionInstructions}
                          onChange={(e) => setSelectionInstructions(e.target.value)}
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
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowSelectionRewrite(false)}
                              className="px-3 py-1 text-xs"
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={rewriteSelectedText}
                              disabled={isRewriting || !selectionInstructions.trim()}
                              className="px-3 py-1 text-xs"
                            >
                              {isRewriting ? (
                                <>
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  Rewriting...
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="h-3 w-3 mr-1" />
                                  Rewrite Selection
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
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