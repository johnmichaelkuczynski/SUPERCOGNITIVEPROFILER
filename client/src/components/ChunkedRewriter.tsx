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
import MathRenderer from './MathRenderer_simple';

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
  originalText: string;
  onRewriteComplete: (rewrittenText: string, metadata: any) => void;
  onAddToChat: (content: string, metadata: any) => void;
  chatHistory?: Array<{role: string; content: string}>;
  initialProcessingMode?: 'rewrite' | 'homework';
}

export default function ChunkedRewriter({ 
  originalText, 
  onRewriteComplete, 
  onAddToChat,
  chatHistory = [],
  initialProcessingMode = 'rewrite'
}: ChunkedRewriterProps) {
  const [chunks, setChunks] = useState<TextChunk[]>([]);
  const [instructions, setInstructions] = useState('');
  const [includeChatContext, setIncludeChatContext] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'claude' | 'gpt4' | 'perplexity' | 'deepseek'>('claude');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [previewChunk, setPreviewChunk] = useState<TextChunk | null>(null);
  const [emailAddress, setEmailAddress] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  
  // Processing mode options - use the passed initial mode
  const [processingMode, setProcessingMode] = useState<'rewrite' | 'homework'>(initialProcessingMode);
  const [showResultsPopup, setShowResultsPopup] = useState(false);
  const [finalRewrittenContent, setFinalRewrittenContent] = useState('');
  const [rewriteMetadata, setRewriteMetadata] = useState<any>(null);

  const { toast } = useToast();

  useEffect(() => {
    createChunks();
  }, [originalText]);

  const createChunks = () => {
    const words = originalText.split(/\s+/);
    const chunkSize = Math.max(100, Math.floor(words.length / 8));
    const newChunks: TextChunk[] = [];

    for (let i = 0; i < words.length; i += chunkSize) {
      const chunkWords = words.slice(i, i + chunkSize);
      const content = chunkWords.join(' ');
      const preview = content.substring(0, 150) + (content.length > 150 ? '...' : '');
      
      newChunks.push({
        id: `chunk-${i}`,
        content,
        preview,
        selected: false
      });
    }

    setChunks(newChunks);
  };

  const cleanContentForChat = (content: string): string => {
    return content
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/^[#]+\s+/gm, '')
      .replace(/[*]{2,3}(.+?)[*]{2,3}/g, '$1')
      .replace(/[_]{2}(.+?)[_]{2}/g, '$1')
      .trim();
  };

  const selectAllChunks = () => {
    setChunks(prev => prev.map(chunk => ({ ...chunk, selected: true })));
  };

  const deselectAllChunks = () => {
    setChunks(prev => prev.map(chunk => ({ ...chunk, selected: false })));
  };

  const processHomeworkMode = async () => {
    try {
      let chatContext = '';
      if (includeChatContext && chatHistory.length > 0) {
        chatContext = '\n\nChat Context (for reference):\n' + 
          chatHistory.slice(-10).map(msg => `${msg.role}: ${msg.content}`).join('\n');
      }

      setProgress(50);

      const response = await fetch('/api/homework-mode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instructions: originalText, // The text contains the instructions to follow
          userPrompt: instructions, // User's additional guidance
          model: selectedModel,
          chatContext: includeChatContext ? chatContext : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process homework');
      }

      const result = await response.json();
      
      setProgress(100);

      // Content is automatically formatted through MathRenderer component
      let finalContent = result.response;

      // Prepare metadata
      const metadata = {
        originalLength: originalText.length,
        rewrittenLength: finalContent.length,
        mode: 'homework',
        model: selectedModel,
        instructions: instructions,
        includedChatContext: includeChatContext,
        mathFormatted: false
      };

      // Store results for popup display
      setFinalRewrittenContent(finalContent);
      setRewriteMetadata(metadata);
      setShowResultsPopup(true);

      toast({
        title: "Homework Complete!",
        description: "Successfully completed the assignment.",
      });

      // Add cleaned content to chat immediately
      onAddToChat(cleanContentForChat(finalContent), metadata);

      // Save as document
      onRewriteComplete(finalContent, metadata);

    } catch (error) {
      console.error('Homework processing error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process homework",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const processSelectedChunks = async () => {
    const selectedChunks = chunks.filter(chunk => chunk.selected);
    
    if (selectedChunks.length === 0) {
      toast({
        title: "No chunks selected",
        description: "Please select at least one chunk to rewrite.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setIsCancelled(false);
    setProgress(0);

    try {
      let chatContext = '';
      if (includeChatContext && chatHistory.length > 0) {
        chatContext = '\n\nChat Context (for reference):\n' + 
          chatHistory.slice(-10).map(msg => `${msg.role}: ${msg.content}`).join('\n');
      }

      const rewrittenChunks: string[] = [];
      const totalOperations = selectedChunks.length;
      let processedChunks = 0;

      // Process each selected chunk
      for (let i = 0; i < selectedChunks.length; i++) {
        if (isCancelled) break;

        const chunk = selectedChunks[i];
        setCurrentChunkIndex(i);
        setProgress((processedChunks / totalOperations) * 100);

        // Update chunk status
        setChunks(prev => prev.map(c => 
          c.id === chunk.id 
            ? { ...c, isProcessing: true }
            : c
        ));

        const response = await fetch('/api/rewrite-chunk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: chunk.content,
            instructions: instructions || 'Improve clarity, coherence, and readability while maintaining the original meaning.',
            model: selectedModel,
            chatContext: includeChatContext ? chatContext : undefined,
            chunkIndex: i,
            totalChunks: selectedChunks.length,
            documentTitle: originalText.substring(0, 100) || 'Academic Document'
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to rewrite chunk ${i + 1}`);
        }

        const result = await response.json();
        const content = result.rewrittenContent;

        rewrittenChunks.push(content);

        // Update chunk with rewritten content
        setChunks(prev => prev.map(c => 
          c.id === chunk.id 
            ? { ...c, rewritten: content, isProcessing: false, isComplete: true }
            : c
        ));

        processedChunks++;
        setProgress((processedChunks / totalOperations) * 100);

        // Add delay between requests to prevent rate limiting
        if (i < selectedChunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 15000));
        }
      }

      // Compile final content
      const finalContent = rewrittenChunks.join('\n\n');

      // Prepare metadata
      const metadata = {
        originalLength: originalText.length,
        rewrittenLength: finalContent.length,
        chunksProcessed: selectedChunks.length,
        mode: processingMode,
        model: selectedModel,
        instructions: instructions,
        includedChatContext: includeChatContext
      };

      // Store results for popup display
      setFinalRewrittenContent(finalContent);
      setRewriteMetadata(metadata);
      setShowResultsPopup(true);

      toast({
        title: "Processing Complete!",
        description: `Successfully processed ${selectedChunks.length} chunks.`,
      });

      // Add cleaned content to chat immediately
      onAddToChat(cleanContentForChat(finalContent), metadata);

      // Save as document
      onRewriteComplete(finalContent, metadata);

    } catch (error) {
      console.error('Processing error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process chunks",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleProcessing = async () => {
    if (processingMode === 'homework') {
      await processHomeworkMode();
    } else {
      await processSelectedChunks();
    }
  };

  const downloadResult = () => {
    if (!finalRewrittenContent) return;
    
    const blob = new Blob([finalRewrittenContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${processingMode}_result.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Processing Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Processing Mode</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card 
              className={`cursor-pointer transition-all ${processingMode === 'rewrite' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
              onClick={() => setProcessingMode('rewrite')}
            >
              <CardContent className="p-4 text-center">
                <h3 className="font-semibold">Rewrite Mode</h3>
                <p className="text-sm text-muted-foreground mt-2">Transform and improve existing text</p>
              </CardContent>
            </Card>
            <Card 
              className={`cursor-pointer transition-all ${processingMode === 'homework' ? 'ring-2 ring-green-500 bg-green-50' : 'hover:bg-gray-50'}`}
              onClick={() => setProcessingMode('homework')}
            >
              <CardContent className="p-4 text-center">
                <h3 className="font-semibold">Homework Mode</h3>
                <p className="text-sm text-muted-foreground mt-2">Complete assignments, answer questions, follow instructions</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
          <CardDescription>
            {processingMode === 'homework' 
              ? 'Provide additional guidance for completing the assignment'
              : 'Describe how you want to improve or transform the text'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="instructions">Processing Instructions</Label>
            <div className="relative">
              <Textarea
                id="instructions"
                placeholder={processingMode === 'homework' 
                  ? "Add any additional context or specific requirements..."
                  : "Improve clarity, coherence, and readability while maintaining the original meaning..."}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="min-h-[100px] pr-12"
              />
              <div className="absolute bottom-2 right-2">
                <SpeechInput 
                  onTranscript={(transcript) => setInstructions(prev => prev + ' ' + transcript)}
                  className="h-8 w-8"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="model">AI Model</Label>
              <Select value={selectedModel} onValueChange={(value: 'claude' | 'gpt4' | 'perplexity' | 'deepseek') => setSelectedModel(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="claude">Claude (Anthropic)</SelectItem>
                  <SelectItem value="gpt4">GPT-4 (OpenAI)</SelectItem>
                  <SelectItem value="perplexity">Perplexity</SelectItem>
                  <SelectItem value="deepseek">DeepSeek</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <Checkbox 
                id="chatContext" 
                checked={includeChatContext}
                onCheckedChange={(checked) => setIncludeChatContext(checked as boolean)}
              />
              <Label htmlFor="chatContext" className="text-sm">
                Include chat context ({chatHistory.length} messages)
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chunk Selection (only for rewrite mode) */}
      {processingMode === 'rewrite' && (
        <Card>
          <CardHeader>
            <CardTitle>Text Chunks ({chunks.length})</CardTitle>
            <CardDescription>Select the chunks you want to rewrite</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={selectAllChunks}>
                Select All
              </Button>
              <Button size="sm" variant="outline" onClick={deselectAllChunks}>
                Deselect All
              </Button>
            </div>
            
            <div className="grid gap-2 max-h-96 overflow-y-auto">
              {chunks.map((chunk, index) => (
                <div 
                  key={chunk.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    chunk.selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  } ${chunk.isProcessing ? 'opacity-50' : ''} ${chunk.isComplete ? 'border-green-500 bg-green-50' : ''}`}
                  onClick={() => {
                    if (!chunk.isProcessing) {
                      setChunks(prev => prev.map(c => 
                        c.id === chunk.id ? { ...c, selected: !c.selected } : c
                      ));
                    }
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">Chunk {index + 1}</span>
                        {chunk.isProcessing && <span className="text-xs text-blue-600">Processing...</span>}
                        {chunk.isComplete && <span className="text-xs text-green-600">Complete</span>}
                      </div>
                      <p className="text-sm text-gray-600">{chunk.preview}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewChunk(chunk);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">
                    {processingMode === 'homework' ? 'Processing homework...' : `Processing chunk ${currentChunkIndex + 1}...`}
                  </span>
                  <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={handleProcessing}
                disabled={isProcessing || (processingMode === 'rewrite' && chunks.filter(c => c.selected).length === 0)}
                className="flex-1"
              >
                <Play className="h-4 w-4 mr-2" />
                {isProcessing ? 'Processing...' : (processingMode === 'homework' ? 'Complete Assignment' : 'Rewrite Selected')}
              </Button>

              {isProcessing && (
                <Button 
                  variant="outline" 
                  onClick={() => setIsCancelled(true)}
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Popup */}
      <Dialog open={showResultsPopup} onOpenChange={setShowResultsPopup}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {processingMode === 'homework' ? 'Homework Complete!' : 'Rewrite Complete!'}
            </DialogTitle>
            <DialogDescription>
              Content is editable - click anywhere to modify the text directly
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Textarea
              value={finalRewrittenContent}
              onChange={(e) => setFinalRewrittenContent(e.target.value)}
              className="min-h-[400px] font-mono text-sm"
            />
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <MathRenderer content={finalRewrittenContent} />
            </div>

            <div className="flex gap-2">
              <Button onClick={downloadResult} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              
              <Button 
                onClick={() => {
                  onRewriteComplete(finalRewrittenContent, rewriteMetadata);
                  setShowResultsPopup(false);
                }}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chunk Preview */}
      <Dialog open={!!previewChunk} onOpenChange={() => setPreviewChunk(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chunk Preview</DialogTitle>
          </DialogHeader>
          {previewChunk && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Original Content:</h4>
                <div className="p-3 bg-gray-50 rounded text-sm">
                  <MathRenderer content={previewChunk.content} />
                </div>
              </div>
              {previewChunk.rewritten && (
                <div>
                  <h4 className="font-medium mb-2">Rewritten Content:</h4>
                  <div className="p-3 bg-green-50 rounded text-sm">
                    <MathRenderer content={previewChunk.rewritten} />
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}