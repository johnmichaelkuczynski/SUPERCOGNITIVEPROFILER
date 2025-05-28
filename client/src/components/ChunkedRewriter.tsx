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
  
  // New rewriting mode options
  const [rewriteMode, setRewriteMode] = useState<'rewrite' | 'add' | 'both'>('rewrite');
  const [newChunkInstructions, setNewChunkInstructions] = useState('');
  const [numberOfNewChunks, setNumberOfNewChunks] = useState(3);
  const [showResultsPopup, setShowResultsPopup] = useState(false);
  const [finalRewrittenContent, setFinalRewrittenContent] = useState('');
  const [rewriteMetadata, setRewriteMetadata] = useState<any>(null);
  const [showLiveProgress, setShowLiveProgress] = useState(false);
  const [liveProgressChunks, setLiveProgressChunks] = useState<Array<{title: string, content: string, completed: boolean}>>([]);
  
  // Re-rewrite state
  const [isRerewriting, setIsRerewriting] = useState(false);
  const [showRerewriteForm, setShowRerewriteForm] = useState(false);
  const [rerewriteInstructions, setRerewriteInstructions] = useState('');
  const [rerewriteModel, setRerewriteModel] = useState<'claude' | 'gpt4' | 'perplexity'>('claude');
  const [rewriteChunks, setRewriteChunks] = useState<Array<{id: string, content: string, selected: boolean}>>([]);
  
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
    // Validation based on rewrite mode
    if (rewriteMode === 'rewrite' || rewriteMode === 'both') {
      const selectedChunks = chunks.filter(chunk => chunk.selected);
      if (selectedChunks.length === 0) {
        toast({
          title: "No chunks selected",
          description: "Please select at least one chunk to rewrite.",
          variant: "destructive"
        });
        return;
      }
    }
    
    if (rewriteMode === 'add' || rewriteMode === 'both') {
      if (!newChunkInstructions.trim()) {
        toast({
          title: "Missing new chunk instructions",
          description: "Please provide instructions for the new content to be added.",
          variant: "destructive"
        });
        return;
      }
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

      let finalContent = '';
      let processedChunks = 0;
      let totalOperations = 0;

      // Calculate total operations for progress tracking
      if (rewriteMode === 'rewrite' || rewriteMode === 'both') {
        totalOperations += chunks.filter(chunk => chunk.selected).length;
      }
      if (rewriteMode === 'add' || rewriteMode === 'both') {
        totalOperations += numberOfNewChunks;
      }

      // Initialize live progress tracking
      setShowLiveProgress(true);
      setLiveProgressChunks(Array(totalOperations).fill(null).map((_, i) => {
        const selectedChunks = chunks.filter(chunk => chunk.selected);
        return {
          title: i < selectedChunks.length ? `Rewriting Chunk ${i + 1}` : `Generating New Chunk ${i - selectedChunks.length + 1}`,
          content: '',
          completed: false
        };
      }));

      // Step 1: Handle existing chunks
      if (rewriteMode === 'rewrite' || rewriteMode === 'both') {
        const selectedChunks = chunks.filter(chunk => chunk.selected);
        
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
              totalChunks: selectedChunks.length,
              mode: rewriteMode
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

          // Update live progress with completed chunk
          setLiveProgressChunks(prev => prev.map((item, idx) => 
            idx === i ? {
              ...item,
              content: result.rewrittenContent,
              completed: true
            } : item
          ));

          processedChunks++;
          setProgress((processedChunks / totalOperations) * 100);
        }

        // Compile rewritten chunks
        if (rewriteMode === 'rewrite') {
          finalContent = chunks
            .filter(chunk => chunk.selected && chunk.rewritten)
            .map(chunk => chunk.rewritten)
            .join('\n\n');
        } else {
          // For 'both' mode, we'll add the rewritten chunks first
          finalContent = chunks
            .filter(chunk => chunk.selected && chunk.rewritten)
            .map(chunk => chunk.rewritten)
            .join('\n\n');
        }
      } else if (rewriteMode === 'add') {
        // For add-only mode, keep original content unchanged
        finalContent = originalText;
      }

      // Step 2: Generate new chunks if needed (cap at maximum 5 chunks to prevent overwhelming)
      if (rewriteMode === 'add' || rewriteMode === 'both') {
        const maxNewChunks = Math.min(numberOfNewChunks, 5);
        for (let i = 0; i < maxNewChunks; i++) {
          // Update current chunk index for new chunks
          setCurrentChunkIndex(processedChunks);
          
          const response = await fetch('/api/generate-new-chunk', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              originalContent: originalText,
              newChunkInstructions: newChunkInstructions,
              existingContent: finalContent,
              model: selectedModel,
              chatContext: includeChatContext ? chatContext : undefined,
              chunkNumber: i + 1,
              totalNewChunks: numberOfNewChunks
            }),
          });

          if (!response.ok) {
            throw new Error(`Failed to generate new chunk ${i + 1}`);
          }

          const result = await response.json();
          
          // Add new chunk to final content
          finalContent += '\n\n' + result.newChunkContent;

          // Update live progress with new chunk
          const selectedCount = chunks.filter(chunk => chunk.selected).length;
          setLiveProgressChunks(prev => prev.map((item, idx) => 
            idx === selectedCount + i ? {
              ...item,
              content: result.newChunkContent,
              completed: true
            } : item
          ));

          processedChunks++;
          setProgress((processedChunks / totalOperations) * 100);
        }
      }

      // Prepare metadata
      const metadata = {
        originalLength: originalText.length,
        rewrittenLength: finalContent.length,
        chunksProcessed: chunks.filter(chunk => chunk.selected).length,
        newChunksAdded: rewriteMode === 'add' || rewriteMode === 'both' ? numberOfNewChunks : 0,
        model: selectedModel,
        instructions: instructions,
        newChunkInstructions: newChunkInstructions,
        rewriteMode: rewriteMode,
        includedChatContext: includeChatContext
      };

      // Store results for popup display - force it to show!
      console.log("Setting popup content:", finalContent.length, "characters");
      console.log("Setting popup metadata:", metadata);
      setFinalRewrittenContent(finalContent);
      setRewriteMetadata(metadata);
      setShowResultsPopup(true);
      console.log("Popup state set to true - should display now!");

      toast({
        title: "Rewrite complete!",
        description: `Successfully processed content with ${metadata.chunksProcessed} rewritten chunks${metadata.newChunksAdded ? ` and ${metadata.newChunksAdded} new chunks` : ''}.`,
      });

      // Force the rewrite to appear in chat immediately
      console.log("FORCING REWRITE TO CHAT:", finalContent.substring(0, 100));
      onAddToChat(`**Rewritten Document:**\n\n${finalContent}`, metadata);
      
      onRewriteComplete(finalContent, metadata);

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

  // Split content into chunks for re-rewriting
  const splitContentIntoRewriteChunks = (content: string) => {
    const words = content.split(/\s+/);
    const chunkSize = 500;
    const chunks: Array<{id: string, content: string, selected: boolean}> = [];

    for (let i = 0; i < words.length; i += chunkSize) {
      const chunkWords = words.slice(i, i + chunkSize);
      const chunkContent = chunkWords.join(' ');
      
      chunks.push({
        id: `rewrite_chunk_${i / chunkSize}`,
        content: chunkContent,
        selected: true
      });
    }

    return chunks;
  };

  // Handle re-rewrite process
  const startRerewrite = async () => {
    if (!rerewriteInstructions.trim()) {
      toast({
        title: "Instructions required",
        description: "Please provide instructions for the re-rewrite.",
        variant: "destructive"
      });
      return;
    }

    const selectedChunks = rewriteChunks.filter(chunk => chunk.selected);
    if (selectedChunks.length === 0) {
      toast({
        title: "No chunks selected",
        description: "Please select at least one chunk to re-rewrite.",
        variant: "destructive"
      });
      return;
    }

    setIsRerewriting(true);

    try {
      let rerewrittenContent = '';
      
      for (let i = 0; i < selectedChunks.length; i++) {
        const chunk = selectedChunks[i];
        
        const response = await fetch('/api/rewrite-chunk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: chunk.content,
            instructions: rerewriteInstructions,
            model: rerewriteModel,
            chunkIndex: i,
            totalChunks: selectedChunks.length,
            mode: 'rewrite'
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to re-rewrite chunk ${i + 1}`);
        }

        const result = await response.json();
        rerewrittenContent += (i > 0 ? '\n\n' : '') + result.rewrittenContent;
      }

      // Update the final content with re-rewritten version
      setFinalRewrittenContent(rerewrittenContent);
      
      // Update metadata
      setRewriteMetadata((prev: any) => ({
        ...prev,
        rewrittenLength: rerewrittenContent.length,
        isRerewrite: true,
        rerewriteInstructions: rerewriteInstructions,
        rerewriteModel: rerewriteModel
      }));

      // Save the re-rewritten content to Documents section
      try {
        const saveResponse = await fetch('/api/documents', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: `Re-rewritten: ${rewriteMetadata?.title || 'Document'}`,
            content: rerewrittenContent,
            type: 'rewrite',
            originalLength: rewriteMetadata?.originalLength || 0,
            rewrittenLength: rerewrittenContent.length,
            model: rerewriteModel,
            instructions: rerewriteInstructions
          }),
        });

        if (saveResponse.ok) {
          console.log("Re-rewritten document saved to Documents section");
        } else {
          console.warn("Failed to save re-rewritten document to Documents section");
        }
      } catch (saveError) {
        console.error("Error saving re-rewritten document:", saveError);
      }

      // Automatically add re-rewritten content to chat
      const rerewriteMetadata = {
        type: 'rerewrite',
        originalLength: rewriteMetadata?.originalLength || 0,
        rewrittenLength: rerewrittenContent.length,
        chunksRerewrote: selectedChunks.length,
        model: rerewriteModel,
        instructions: rerewriteInstructions,
        isRerewrite: true
      };

      onAddToChat(`**Re-rewritten Content:**\n\n${rerewrittenContent}`, rerewriteMetadata);

      setShowRerewriteForm(false);
      setRerewriteInstructions('');

      toast({
        title: "Re-rewrite complete!",
        description: `Successfully re-rewrote ${selectedChunks.length} chunk(s) and added to chat.`,
      });

    } catch (error) {
      console.error('Re-rewrite error:', error);
      toast({
        title: "Re-rewrite failed",
        description: error instanceof Error ? error.message : "An error occurred during re-rewriting.",
        variant: "destructive"
      });
    } finally {
      setIsRerewriting(false);
    }
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
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Smart Document Rewriter</CardTitle>
          <CardDescription>
            Rewrite large documents chunk by chunk with full control and real-time preview
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
        {/* Rewrite Mode Selection */}
        <div className="space-y-4">
          <Label className="text-lg font-semibold">Rewriting Mode</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className={`cursor-pointer transition-all ${rewriteMode === 'rewrite' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
                  onClick={() => setRewriteMode('rewrite')}>
              <CardContent className="p-4 text-center">
                <h3 className="font-semibold">Rewrite Existing Only</h3>
                <p className="text-sm text-muted-foreground mt-2">Modify existing chunks without adding new content</p>
              </CardContent>
            </Card>
            <Card className={`cursor-pointer transition-all ${rewriteMode === 'add' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
                  onClick={() => setRewriteMode('add')}>
              <CardContent className="p-4 text-center">
                <h3 className="font-semibold">Add New Chunks Only</h3>
                <p className="text-sm text-muted-foreground mt-2">Keep existing content unchanged, add new material</p>
              </CardContent>
            </Card>
            <Card className={`cursor-pointer transition-all ${rewriteMode === 'both' ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
                  onClick={() => setRewriteMode('both')}>
              <CardContent className="p-4 text-center">
                <h3 className="font-semibold">Both Rewrite & Add</h3>
                <p className="text-sm text-muted-foreground mt-2">Modify existing chunks AND add new content</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Configuration Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            {(rewriteMode === 'rewrite' || rewriteMode === 'both') && (
              <div className="space-y-2">
                <Label htmlFor="instructions">Rewrite Instructions for Existing Content</Label>
                <Textarea
                  id="instructions"
                  placeholder="Enter specific instructions for how you want the existing text rewritten..."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={3}
                />
              </div>
            )}
            
            {(rewriteMode === 'add' || rewriteMode === 'both') && (
              <div className="space-y-2">
                <Label htmlFor="newChunkInstructions">Instructions for New Content</Label>
                <Textarea
                  id="newChunkInstructions"
                  placeholder="Provide detailed instructions for what new content should be added. Be specific about topics, themes, examples, or sections you want included..."
                  value={newChunkInstructions}
                  onChange={(e) => setNewChunkInstructions(e.target.value)}
                  rows={6}
                  className="min-h-[120px]"
                />
                <div className="flex items-center space-x-2 mt-2">
                  <Label htmlFor="numberOfNewChunks" className="text-sm">Number of new chunks:</Label>
                  <input
                    type="number"
                    id="numberOfNewChunks"
                    min="1"
                    max="10"
                    value={numberOfNewChunks}
                    onChange={(e) => setNumberOfNewChunks(parseInt(e.target.value) || 1)}
                    className="w-20 px-2 py-1 border rounded text-sm"
                  />
                </div>
              </div>
            )}
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
              <span>
                {rewriteMode === 'add' 
                  ? `Generating new chunk ${currentChunkIndex + 1} of ${numberOfNewChunks}`
                  : rewriteMode === 'rewrite' 
                    ? `Rewriting chunk ${currentChunkIndex + 1} of ${chunks.filter(c => c.selected).length}`
                    : `Processing chunk ${currentChunkIndex + 1} of ${chunks.filter(c => c.selected).length + numberOfNewChunks}`
                }
              </span>
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
      </CardContent>
    </Card>

    {/* Persistent Results Popup */}
    <Dialog open={showResultsPopup} onOpenChange={setShowResultsPopup}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {rewriteMetadata?.isRerewrite ? '🔄 Re-rewritten Content' : 'Rewrite Results'} - {rewriteMetadata?.rewriteMode === 'rewrite' ? 'Rewritten Content' : rewriteMetadata?.rewriteMode === 'add' ? 'Original + New Content' : 'Rewritten + New Content'}
          </DialogTitle>
          <DialogDescription>
            {rewriteMetadata && (
              <div className="text-sm space-y-1">
                {rewriteMetadata.isRerewrite && (
                  <div className="text-blue-600 font-medium">✨ This content has been re-rewritten with custom instructions</div>
                )}
                <div>Mode: {rewriteMetadata.rewriteMode === 'rewrite' ? 'Rewrite Existing Only' : rewriteMetadata.rewriteMode === 'add' ? 'Add New Content Only' : 'Both Rewrite & Add'}</div>
                <div>Original: {rewriteMetadata.originalLength.toLocaleString()} characters | Final: {rewriteMetadata.rewrittenLength.toLocaleString()} characters</div>
                {rewriteMetadata.chunksProcessed > 0 && <div>Chunks rewritten: {rewriteMetadata.chunksProcessed}</div>}
                {rewriteMetadata.newChunksAdded > 0 && <div>New chunks added: {rewriteMetadata.newChunksAdded}</div>}
                <div>Model: {(rewriteMetadata.isRerewrite ? rewriteMetadata.rerewriteModel : rewriteMetadata.model).toUpperCase()}</div>
                {rewriteMetadata.isRerewrite && (
                  <div className="text-blue-600">Re-rewrite instructions: {rewriteMetadata.rerewriteInstructions}</div>
                )}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col h-[75vh]">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 mb-4 p-4 bg-gray-50 rounded-lg">
            <Button 
              onClick={() => {
                // Split content into chunks for potential re-rewriting
                const chunks = splitContentIntoRewriteChunks(finalRewrittenContent);
                setRewriteChunks(chunks);
                setShowRerewriteForm(!showRerewriteForm);
              }}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Rewrite the Rewrite</span>
            </Button>
            
            <Button 
              onClick={() => {
                onAddToChat(`**Rewritten Document:**\n\n${finalRewrittenContent}`, rewriteMetadata);
                toast({
                  title: "Added to chat!",
                  description: "The rewritten content has been added to your chat.",
                });
              }}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Add to Chat</span>
            </Button>

            <Button 
              onClick={async () => {
                try {
                  const response = await fetch('/api/download-rewrite', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      content: finalRewrittenContent,
                      format: 'pdf',
                      title: 'Rewrite Results',
                      metadata: rewriteMetadata
                    }),
                  });

                  if (!response.ok) throw new Error('PDF generation failed');

                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.style.display = 'none';
                  a.href = url;
                  a.download = `rewrite-results-${Date.now()}.pdf`;
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);
                } catch (error) {
                  console.error('PDF download failed:', error);
                  toast({
                    title: "PDF generation failed",
                    description: "Unable to generate PDF. Try the Word download instead.",
                    variant: "destructive"
                  });
                }
              }}
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Print/Save as PDF</span>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={async () => {
                try {
                  const response = await fetch('/api/download-rewrite', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      content: finalRewrittenContent,
                      format: 'docx',
                      title: 'Rewritten Document'
                    }),
                  });

                  if (!response.ok) throw new Error('Download failed');

                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.style.display = 'none';
                  a.href = url;
                  a.download = 'rewritten-document.docx';
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  document.body.removeChild(a);

                  toast({
                    title: "Download started",
                    description: "Your Word document is downloading.",
                  });
                } catch (error) {
                  toast({
                    title: "Download failed",
                    description: "Unable to download the file. Please try again.",
                    variant: "destructive"
                  });
                }
              }}
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download Word</span>
            </Button>

            <div className="flex space-x-2 flex-1 max-w-md">
              <Input
                placeholder="Enter email address to share..."
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={async () => {
                  if (!emailAddress) {
                    toast({
                      title: "Email required",
                      description: "Please enter an email address.",
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
                        content: finalRewrittenContent,
                        recipientEmail: emailAddress,
                        subject: 'Rewritten Document'
                      }),
                    });

                    if (!response.ok) throw new Error('Email sharing failed');

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
                }}
                disabled={!emailAddress}
                className="flex items-center space-x-2"
              >
                <Mail className="w-4 h-4" />
                <span>Share</span>
              </Button>
            </div>
          </div>

          {/* Re-rewrite Form */}
          {showRerewriteForm && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
              <h3 className="text-lg font-semibold text-blue-900">Rewrite the Rewrite</h3>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="rerewrite-instructions">Custom Instructions</Label>
                  <Textarea
                    id="rerewrite-instructions"
                    placeholder="Provide specific instructions for how you want to rewrite this content..."
                    value={rerewriteInstructions}
                    onChange={(e) => setRerewriteInstructions(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <div>
                    <Label htmlFor="rerewrite-model">AI Model</Label>
                    <Select value={rerewriteModel} onValueChange={(value: 'claude' | 'gpt4' | 'perplexity') => setRerewriteModel(value)}>
                      <SelectTrigger id="rerewrite-model" className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="claude">Claude</SelectItem>
                        <SelectItem value="gpt4">GPT-4</SelectItem>
                        <SelectItem value="perplexity">Perplexity</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Chunk Selection for multi-chunk content */}
                {rewriteChunks.length > 1 && (
                  <div className="space-y-2">
                    <Label>Select Chunks to Re-rewrite ({rewriteChunks.filter(c => c.selected).length} of {rewriteChunks.length} selected)</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                      {rewriteChunks.map((chunk, index) => (
                        <div key={chunk.id} className="flex items-center space-x-2 p-2 border rounded">
                          <Checkbox
                            checked={chunk.selected}
                            onCheckedChange={(checked) => {
                              setRewriteChunks(prev => prev.map(c => 
                                c.id === chunk.id ? { ...c, selected: !!checked } : c
                              ));
                            }}
                          />
                          <span className="text-sm">Chunk {index + 1}</span>
                          <span className="text-xs text-gray-500 truncate">
                            ({chunk.content.substring(0, 50)}...)
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRewriteChunks(prev => prev.map(c => ({ ...c, selected: true })))}
                      >
                        Select All
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRewriteChunks(prev => prev.map(c => ({ ...c, selected: false })))}
                      >
                        Deselect All
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button
                    onClick={startRerewrite}
                    disabled={isRerewriting || !rerewriteInstructions.trim()}
                    className="flex items-center space-x-2"
                  >
                    {isRerewriting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Re-rewriting...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        <span>Start Re-rewrite</span>
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRerewriteForm(false);
                      setRerewriteInstructions('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Content Display */}
          <div className="flex-1 overflow-auto border rounded-lg p-4 bg-white">
            <div id="rewrite-content" className="prose max-w-none">
              {formatContent(finalRewrittenContent)}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}