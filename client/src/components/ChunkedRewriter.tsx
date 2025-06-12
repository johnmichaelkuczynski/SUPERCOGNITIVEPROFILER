import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Download, Mail, Eye, Play, Pause, RotateCcw, X, Bomb, ArrowLeft } from 'lucide-react';
import { SpeechInput } from '@/components/ui/speech-input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { MathJax } from 'better-react-mathjax';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface TextChunk {
  id: string;
  content: string;
  preview: string;
  selected: boolean;
  rewritten?: string;
  isProcessing?: boolean;
  isComplete?: boolean;
}

interface ChunkedRewriterProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  originalText: string;
  onRewriteComplete: (rewrittenText: string, metadata: any) => void;
  onAddToChat: (content: string, metadata: any) => void;
  chatHistory?: Array<{role: string; content: string}>;
  initialProcessingMode?: 'rewrite' | 'homework';
}

export default function ChunkedRewriter({ 
  isOpen,
  onClose,
  title,
  originalText, 
  onRewriteComplete, 
  onAddToChat,
  chatHistory = [],
  initialProcessingMode = 'rewrite'
}: ChunkedRewriterProps) {
  const [chunks, setChunks] = useState<TextChunk[]>([]);
  const [instructions, setInstructions] = useState('');
  const [includeChatContext, setIncludeChatContext] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'claude' | 'gpt4' | 'perplexity'>('claude');
  const [processingMode, setProcessingMode] = useState<'rewrite' | 'homework'>(initialProcessingMode);

  // Set default instructions based on processing mode
  useEffect(() => {
    if (processingMode === 'homework' && !instructions.trim()) {
      setInstructions('Solve all problems step by step with clear explanations and show your work.');
    } else if (processingMode === 'rewrite' && !instructions.trim()) {
      setInstructions('Improve clarity, flow, and overall quality while maintaining the original meaning.');
    }
  }, [processingMode]);
  const [rewriteMode, setRewriteMode] = useState<'rewrite' | 'add' | 'both'>('rewrite');
  const [newChunkInstructions, setNewChunkInstructions] = useState('');
  const [numberOfNewChunks, setNumberOfNewChunks] = useState(3);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [emailAddress, setEmailAddress] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (originalText && originalText.trim()) {
      createChunks(originalText);
    }
  }, [originalText]);

  const createChunks = (text: string) => {
    const sentences = text.split(/(?<=[.!?])\s+/);
    const chunkSize = Math.max(3, Math.floor(sentences.length / 8));
    const newChunks: TextChunk[] = [];
    
    for (let i = 0; i < sentences.length; i += chunkSize) {
      const chunkContent = sentences.slice(i, i + chunkSize).join(' ');
      if (chunkContent.trim()) {
        newChunks.push({
          id: `chunk-${i}`,
          content: chunkContent,
          preview: chunkContent.substring(0, 100) + '...',
          selected: true
        });
      }
    }
    
    setChunks(newChunks);
  };

  const toggleChunkSelection = (chunkId: string) => {
    setChunks(prev => prev.map(chunk => 
      chunk.id === chunkId 
        ? { ...chunk, selected: !chunk.selected }
        : chunk
    ));
  };

  const selectAllChunks = () => {
    setChunks(prev => prev.map(chunk => ({ ...chunk, selected: true })));
  };

  const deselectAllChunks = () => {
    setChunks(prev => prev.map(chunk => ({ ...chunk, selected: false })));
  };

  const processChunks = async () => {
    const selectedChunks = chunks.filter(chunk => chunk.selected);
    if (selectedChunks.length === 0) {
      toast({
        title: "No chunks selected",
        description: "Please select at least one chunk to process.",
        variant: "destructive"
      });
      return;
    }

    if (!instructions.trim()) {
      toast({
        title: "Instructions required",
        description: "Please provide instructions for how to process the content.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      for (let i = 0; i < selectedChunks.length; i++) {
        const chunk = selectedChunks[i];
        
        setChunks(prev => prev.map(c => 
          c.id === chunk.id ? { ...c, isProcessing: true } : c
        ));

        const response = await fetch('/api/rewrite-chunk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: chunk.content,
            instructions,
            model: selectedModel,
            processingMode,
            rewriteMode,
            includeChatContext,
            chatHistory: includeChatContext ? chatHistory : [],
            newChunkInstructions: rewriteMode === 'add' || rewriteMode === 'both' ? newChunkInstructions : '',
            numberOfNewChunks: rewriteMode === 'add' || rewriteMode === 'both' ? numberOfNewChunks : 0
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to process chunk ${i + 1}`);
        }

        const result = await response.json();
        
        setChunks(prev => prev.map(c => 
          c.id === chunk.id 
            ? { ...c, rewritten: result.rewritten, isProcessing: false, isComplete: true }
            : c
        ));

        setProgress(((i + 1) / selectedChunks.length) * 100);
      }

      const finalRewrittenContent = chunks
        .filter(chunk => chunk.selected && chunk.rewritten)
        .map(chunk => chunk.rewritten)
        .join('\n\n');

      const metadata = {
        type: processingMode,
        originalLength: originalText.length,
        rewrittenLength: finalRewrittenContent.length,
        chunksProcessed: selectedChunks.length,
        model: selectedModel,
        instructions,
        rewriteMode
      };

      onRewriteComplete(finalRewrittenContent, metadata);

      toast({
        title: "Processing complete!",
        description: `Successfully processed ${selectedChunks.length} chunk(s).`,
      });

    } catch (error) {
      console.error('Processing error:', error);
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "An error occurred during processing.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const addToChat = () => {
    const rewrittenText = chunks
      .filter(chunk => chunk.selected && chunk.rewritten)
      .map(chunk => chunk.rewritten)
      .join('\n\n');

    if (!rewrittenText) {
      toast({
        title: "No content to add",
        description: "Please process some chunks first.",
        variant: "destructive"
      });
      return;
    }

    const metadata = {
      type: processingMode,
      originalLength: originalText.length,
      rewrittenLength: rewrittenText.length,
      chunksProcessed: chunks.filter(c => c.selected && c.rewritten).length,
      model: selectedModel,
      instructions,
      rewriteMode
    };

    onAddToChat(`**${processingMode === 'homework' ? 'Homework Solution' : 'Rewritten Content'}:**\n\n${rewrittenText}`, metadata);

    toast({
      title: "Added to chat!",
      description: "Content has been added to the chat dialogue.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Process large documents chunk by chunk with full control and real-time preview
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Processing Mode Selection */}
          <div className="space-y-4">
            <Label className="text-lg font-semibold">Processing Mode</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className={`cursor-pointer transition-all ${processingMode === 'rewrite' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
                    onClick={() => setProcessingMode('rewrite')}>
                <CardContent className="p-4 text-center">
                  <h3 className="font-semibold">Rewrite Mode</h3>
                  <p className="text-sm text-muted-foreground mt-2">Transform and improve the existing text</p>
                </CardContent>
              </Card>
              <Card className={`cursor-pointer transition-all ${processingMode === 'homework' ? 'ring-2 ring-green-500 bg-green-50' : 'hover:bg-gray-50'}`}
                    onClick={() => setProcessingMode('homework')}>
                <CardContent className="p-4 text-center">
                  <h3 className="font-semibold">Homework Mode</h3>
                  <p className="text-sm text-muted-foreground mt-2">Follow instructions, complete assignments, answer questions</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Configuration Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="instructions">{processingMode === 'homework' ? 'Assignment/Questions' : 'Rewriting Instructions'}</Label>
                  <SpeechInput
                    onTranscript={(text) => {
                      const newInstructions = instructions ? `${instructions} ${text}` : text;
                      setInstructions(newInstructions);
                    }}
                    onAppend={true}
                    size="sm"
                    className="h-8 w-8"
                  />
                </div>
                <Textarea
                  id="instructions"
                  placeholder={processingMode === 'homework' 
                    ? "Enter the homework questions or assignment instructions here..."
                    : "Describe how you want the text to be rewritten (e.g., 'make it more formal', 'simplify for beginners', etc.)"
                  }
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="model">AI Model</Label>
                <Select value={selectedModel} onValueChange={(value: any) => setSelectedModel(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="claude">Claude</SelectItem>
                    <SelectItem value="gpt4">GPT-4</SelectItem>
                    <SelectItem value="perplexity">Perplexity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="chatContext"
                  checked={includeChatContext}
                  onCheckedChange={(checked) => setIncludeChatContext(!!checked)}
                />
                <Label htmlFor="chatContext">Include chat context</Label>
              </div>
            </div>
          </div>

          {/* Chunk Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Text Chunks ({chunks.length})</h3>
              <div className="space-x-2">
                <Button size="sm" variant="outline" onClick={selectAllChunks}>
                  Select All
                </Button>
                <Button size="sm" variant="outline" onClick={deselectAllChunks}>
                  Deselect All
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {chunks.map((chunk, index) => (
                <Card 
                  key={chunk.id} 
                  className={`relative cursor-pointer transition-all ${
                    chunk.selected ? 'ring-2 ring-blue-500' : ''
                  } ${chunk.isProcessing ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''} ${
                    chunk.isComplete ? 'bg-green-50 dark:bg-green-900/20' : ''
                  }`}
                  onClick={() => toggleChunkSelection(chunk.id)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Chunk {index + 1}</CardTitle>
                      <div className="flex space-x-1">
                        {chunk.rewritten && (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="ghost" onClick={(e) => e.stopPropagation()}>
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Chunk {index + 1} - Rewritten</DialogTitle>
                              </DialogHeader>
                              <div className="prose dark:prose-invert prose-sm max-w-none">
                                <MathJax>
                                  <ReactMarkdown
                                    rehypePlugins={[rehypeKatex]}
                                    remarkPlugins={[remarkMath]}
                                  >
                                    {chunk.rewritten}
                                  </ReactMarkdown>
                                </MathJax>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-xs text-muted-foreground line-clamp-3">
                      {chunk.preview}
                    </p>
                    {chunk.isProcessing && (
                      <div className="mt-2 flex items-center space-x-2">
                        <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs text-blue-600">Processing...</span>
                      </div>
                    )}
                    {chunk.isComplete && (
                      <div className="mt-2 flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                        <span className="text-xs text-green-600">Complete</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Progress Bar */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing chunks...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between space-x-4 pt-4 border-t">
            <Button
              onClick={processChunks}
              disabled={isProcessing || chunks.filter(c => c.selected).length === 0}
              className="flex items-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>{processingMode === 'homework' ? 'Complete Assignment' : 'Process Chunks'}</span>
            </Button>

            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={addToChat}
                disabled={chunks.filter(c => c.selected && c.rewritten).length === 0}
              >
                Add to Chat
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}