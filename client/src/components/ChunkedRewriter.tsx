import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Download, Mail, Eye, Play, Pause, RotateCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { MathJax } from 'better-react-mathjax';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

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
}

export default function ChunkedRewriter({ 
  originalText, 
  onRewriteComplete, 
  onAddToChat,
  chatHistory = []
}: ChunkedRewriterProps) {
  const [chunks, setChunks] = useState<TextChunk[]>([]);
  const [instructions, setInstructions] = useState('');
  const [includeChatContext, setIncludeChatContext] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'claude' | 'gpt4' | 'perplexity'>('claude');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [previewChunk, setPreviewChunk] = useState<TextChunk | null>(null);
  const [emailAddress, setEmailAddress] = useState('');
  const [showRewriteRewrite, setShowRewriteRewrite] = useState(false);
  const [rewriteInstructions, setRewriteInstructions] = useState('');
  const [isRewritingRewrite, setIsRewritingRewrite] = useState(false);
  const [rewriteProgress, setRewriteProgress] = useState(0);
  const { toast } = useToast();

  // Split text into chunks of approximately 500 words
  useEffect(() => {
    if (!originalText) return;

    const words = originalText.split(/\s+/);
    const chunkSize = 500;
    const textChunks: TextChunk[] = [];

    for (let i = 0; i < words.length; i += chunkSize) {
      const chunkWords = words.slice(i, i + chunkSize);
      const content = chunkWords.join(' ');
      const preview = content.length > 200 ? content.substring(0, 200) + '...' : content;
      
      textChunks.push({
        id: `chunk_${i / chunkSize}`,
        content,
        preview,
        selected: true, // Default to all chunks selected
      });
    }

    setChunks(textChunks);
  }, [originalText]);

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

  const startRewrite = async () => {
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
    setCurrentChunkIndex(0);
    setProgress(0);

    // Reset all chunks
    setChunks(prev => prev.map(chunk => ({
      ...chunk,
      rewritten: undefined,
      isProcessing: false,
      isComplete: false
    })));

    try {
      let chatContext = '';
      if (includeChatContext && chatHistory.length > 0) {
        chatContext = '\n\nChat Context (for reference):\n' + 
          chatHistory.slice(-10).map(msg => `${msg.role}: ${msg.content}`).join('\n');
      }

      for (let i = 0; i < selectedChunks.length; i++) {
        const chunk = selectedChunks[i];
        setCurrentChunkIndex(i);
        
        // Mark current chunk as processing
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
            totalChunks: selectedChunks.length
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to rewrite chunk ${i + 1}`);
        }

        const result = await response.json();

        // Update chunk with rewritten content
        setChunks(prev => prev.map(c => 
          c.id === chunk.id 
            ? { 
                ...c, 
                rewritten: result.rewrittenContent,
                isProcessing: false,
                isComplete: true 
              }
            : c
        ));

        setProgress(((i + 1) / selectedChunks.length) * 100);
      }

      toast({
        title: "Rewrite complete!",
        description: `Successfully rewrote ${selectedChunks.length} chunks.`,
      });

      // Compile the full rewritten text
      const fullRewrittenText = chunks
        .filter(chunk => chunk.selected && chunk.rewritten)
        .map(chunk => chunk.rewritten)
        .join('\n\n');

      const metadata = {
        originalLength: originalText.length,
        rewrittenLength: fullRewrittenText.length,
        chunksProcessed: selectedChunks.length,
        model: selectedModel,
        instructions: instructions,
        includedChatContext: includeChatContext
      };

      onRewriteComplete(fullRewrittenText, metadata);

    } catch (error) {
      console.error('Rewrite error:', error);
      toast({
        title: "Rewrite failed",
        description: error instanceof Error ? error.message : "An error occurred during rewriting.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadRewrite = async (format: 'pdf' | 'docx') => {
    const rewrittenText = chunks
      .filter(chunk => chunk.selected && chunk.rewritten)
      .map(chunk => chunk.rewritten)
      .join('\n\n');

    if (!rewrittenText) {
      toast({
        title: "No content to download",
        description: "Please complete the rewrite first.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/download-rewrite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: rewrittenText,
          format: format,
          title: 'Rewritten Document'
        }),
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `rewritten-document.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download started",
        description: `Your ${format.toUpperCase()} file is downloading.`,
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Unable to download the file. Please try again.",
        variant: "destructive"
      });
    }
  };

  const shareViaEmail = async () => {
    if (!emailAddress) {
      toast({
        title: "Email required",
        description: "Please enter an email address.",
        variant: "destructive"
      });
      return;
    }

    const rewrittenText = chunks
      .filter(chunk => chunk.selected && chunk.rewritten)
      .map(chunk => chunk.rewritten)
      .join('\n\n');

    if (!rewrittenText) {
      toast({
        title: "No content to share",
        description: "Please complete the rewrite first.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/share-rewrite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: rewrittenText,
          recipientEmail: emailAddress,
          subject: 'Rewritten Document'
        }),
      });

      if (!response.ok) {
        throw new Error('Email sharing failed');
      }

      toast({
        title: "Email sent!",
        description: `Rewritten document sent to ${emailAddress}`,
      });

      setEmailAddress('');
    } catch (error) {
      toast({
        title: "Email failed",
        description: "Unable to send email. Please try again.",
        variant: "destructive"
      });
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
        description: "Please complete the rewrite first.",
        variant: "destructive"
      });
      return;
    }

    const metadata = {
      type: 'chunked_rewrite',
      originalLength: originalText.length,
      rewrittenLength: rewrittenText.length,
      chunksProcessed: chunks.filter(c => c.selected && c.rewritten).length,
      model: selectedModel,
      instructions: instructions
    };

    onAddToChat(`**Rewritten Document:**\n\n${rewrittenText}`, metadata);

    toast({
      title: "Added to chat",
      description: "The rewritten content has been added to your conversation.",
    });
  };

  const rewriteTheRewrite = async () => {
    const completedChunks = chunks.filter(chunk => chunk.selected && chunk.rewritten);
    if (completedChunks.length === 0) {
      toast({
        title: "No content to rewrite",
        description: "Please complete the initial rewrite first.",
        variant: "destructive"
      });
      return;
    }

    if (!rewriteInstructions.trim()) {
      toast({
        title: "Instructions required",
        description: "Please provide instructions for the rewrite.",
        variant: "destructive"
      });
      return;
    }

    setIsRewritingRewrite(true);
    setRewriteProgress(0);

    try {
      for (let i = 0; i < completedChunks.length; i++) {
        const chunk = completedChunks[i];
        
        const response = await fetch('/api/rewrite-chunk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: chunk.rewritten, // Rewrite the already rewritten content
            instructions: rewriteInstructions,
            model: selectedModel,
            chunkIndex: i,
            totalChunks: completedChunks.length
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to rewrite chunk ${i + 1}`);
        }

        const result = await response.json();

        // Update chunk with newly rewritten content
        setChunks(prev => prev.map(c => 
          c.id === chunk.id 
            ? { 
                ...c, 
                rewritten: result.rewrittenContent,
              }
            : c
        ));

        setRewriteProgress(((i + 1) / completedChunks.length) * 100);
      }

      toast({
        title: "Rewrite complete!",
        description: `Successfully re-rewrote ${completedChunks.length} chunks.`,
      });

      setShowRewriteRewrite(false);
      setRewriteInstructions('');

    } catch (error) {
      console.error('Rewrite-rewrite error:', error);
      toast({
        title: "Rewrite failed",
        description: error instanceof Error ? error.message : "An error occurred during rewriting.",
        variant: "destructive"
      });
    } finally {
      setIsRewritingRewrite(false);
    }
  };

  const printAsPDF = () => {
    const rewrittenText = chunks
      .filter(chunk => chunk.selected && chunk.rewritten)
      .map(chunk => chunk.rewritten)
      .join('\n\n');

    if (!rewrittenText) {
      toast({
        title: "No content to print",
        description: "Please complete the rewrite first.",
        variant: "destructive"
      });
      return;
    }

    // Create a new window with the content formatted for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Rewritten Document</title>
          <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
          <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
          <script>
            window.MathJax = {
              tex: {
                inlineMath: [['\\\\(', '\\\\)'], ['$', '$']],
                displayMath: [['\\\\[', '\\\\]'], ['$$', '$$']],
                processEscapes: true
              }
            };
          </script>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              max-width: 800px; 
              margin: 0 auto; 
              padding: 20px; 
            }
            h1, h2, h3 { color: #333; }
            p { margin-bottom: 1em; }
            @media print {
              body { margin: 0; padding: 15px; }
            }
          </style>
        </head>
        <body>
          <div id="content">${rewrittenText.replace(/\n/g, '<br>')}</div>
          <script>
            // Wait for MathJax to finish, then print
            window.addEventListener('load', function() {
              setTimeout(function() {
                window.print();
              }, 1000);
            });
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }

    toast({
      title: "Print dialog opened",
      description: "Choose 'Save as PDF' in the print dialog to preserve math notation.",
    });
  };

  const formatContent = (content: string) => {
    return (
      <div className="prose dark:prose-invert prose-sm max-w-none">
        <MathJax>
          <ReactMarkdown
            rehypePlugins={[rehypeKatex]}
            remarkPlugins={[remarkMath]}
          >
            {content}
          </ReactMarkdown>
        </MathJax>
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Smart Document Rewriter</CardTitle>
        <CardDescription>
          Rewrite large documents chunk by chunk with full control and real-time preview
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configuration Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="instructions">Rewrite Instructions</Label>
            <Textarea
              id="instructions"
              placeholder="Enter specific instructions for how you want the text rewritten..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
            />
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
              <Label htmlFor="chatContext">Include chat context in rewrite</Label>
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
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewChunk(chunk);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Chunk {index + 1} Preview</DialogTitle>
                            <DialogDescription>
                              {chunk.rewritten ? 'Rewritten version' : 'Original content'}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="mt-4">
                            {formatContent(chunk.rewritten || chunk.content)}
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Checkbox
                        checked={chunk.selected}
                        onClick={(e) => e.stopPropagation()}
                        onCheckedChange={() => toggleChunkSelection(chunk.id)}
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {chunk.preview}
                  </p>
                  {chunk.isProcessing && (
                    <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
                      Processing...
                    </div>
                  )}
                  {chunk.isComplete && (
                    <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                      ✓ Complete
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Progress Section */}
        {isProcessing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Processing chunk {currentChunkIndex + 1} of {chunks.filter(c => c.selected).length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button 
            onClick={startRewrite} 
            disabled={isProcessing || chunks.filter(c => c.selected).length === 0}
            className="flex items-center space-x-2"
          >
            <Play className="w-4 h-4" />
            <span>{isProcessing ? 'Processing...' : 'Start Rewrite'}</span>
          </Button>

          <Button 
            variant="outline" 
            onClick={addToChat}
            disabled={!chunks.some(c => c.rewritten)}
            className="flex items-center space-x-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Add to Chat</span>
          </Button>

          <Button 
            variant="outline" 
            onClick={() => downloadRewrite('pdf')}
            disabled={!chunks.some(c => c.rewritten)}
            className="flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>PDF</span>
          </Button>

          <Button 
            variant="outline" 
            onClick={() => downloadRewrite('docx')}
            disabled={!chunks.some(c => c.rewritten)}
            className="flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Word</span>
          </Button>
        </div>

        {/* Email Sharing */}
        <div className="flex space-x-2">
          <Input
            placeholder="Enter email address to share..."
            value={emailAddress}
            onChange={(e) => setEmailAddress(e.target.value)}
            disabled={!chunks.some(c => c.rewritten)}
          />
          <Button 
            onClick={shareViaEmail}
            disabled={!chunks.some(c => c.rewritten) || !emailAddress}
            className="flex items-center space-x-2"
          >
            <Mail className="w-4 h-4" />
            <span>Share</span>
          </Button>
        </div>

        {/* Rewrite the Rewrite Section */}
        {chunks.some(c => c.rewritten) && (
          <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
            <CardHeader>
              <CardTitle className="text-lg text-blue-800 dark:text-blue-200">
                Rewrite the Rewrite
              </CardTitle>
              <CardDescription>
                Iteratively improve your rewritten content with additional instructions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!showRewriteRewrite ? (
                <Button 
                  onClick={() => setShowRewriteRewrite(true)}
                  className="w-full"
                  variant="outline"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Start Rewrite Iteration
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="rewrite-instructions">Additional Instructions</Label>
                    <Textarea
                      id="rewrite-instructions"
                      placeholder="Enter instructions for improving the rewritten content..."
                      value={rewriteInstructions}
                      onChange={(e) => setRewriteInstructions(e.target.value)}
                      rows={3}
                    />
                  </div>

                  {/* Progress for re-rewrite */}
                  {isRewritingRewrite && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Re-rewriting content...</span>
                        <span>{Math.round(rewriteProgress)}%</span>
                      </div>
                      <Progress value={rewriteProgress} className="w-full" />
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <Button 
                      onClick={rewriteTheRewrite}
                      disabled={isRewritingRewrite || !rewriteInstructions.trim()}
                      className="flex-1"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {isRewritingRewrite ? 'Rewriting...' : 'Apply Changes'}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setShowRewriteRewrite(false);
                        setRewriteInstructions('');
                      }}
                      disabled={isRewritingRewrite}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Enhanced Download and Share Options */}
              <div className="border-t pt-4 space-y-3">
                <h4 className="font-medium text-sm">Export Options</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <Button 
                    variant="outline" 
                    onClick={printAsPDF}
                    disabled={!chunks.some(c => c.rewritten)}
                    className="flex items-center space-x-1 text-xs"
                  >
                    <Download className="w-3 h-3" />
                    <span>Print PDF</span>
                  </Button>

                  <Button 
                    variant="outline" 
                    onClick={() => downloadRewrite('docx')}
                    disabled={!chunks.some(c => c.rewritten)}
                    className="flex items-center space-x-1 text-xs"
                  >
                    <Download className="w-3 h-3" />
                    <span>Word</span>
                  </Button>

                  <Button 
                    variant="outline" 
                    onClick={() => downloadRewrite('pdf')}
                    disabled={!chunks.some(c => c.rewritten)}
                    className="flex items-center space-x-1 text-xs"
                  >
                    <Download className="w-3 h-3" />
                    <span>PDF</span>
                  </Button>

                  <Button 
                    variant="outline" 
                    onClick={shareViaEmail}
                    disabled={!chunks.some(c => c.rewritten) || !emailAddress}
                    className="flex items-center space-x-1 text-xs"
                  >
                    <Mail className="w-3 h-3" />
                    <span>Email</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}