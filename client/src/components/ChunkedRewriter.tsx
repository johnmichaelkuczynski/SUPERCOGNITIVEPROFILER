import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

interface NewContentItem {
  id: string;
  topic: string;
  description: string;
  selected: boolean;
  generatedContent?: string;
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
  const [newContentItems, setNewContentItems] = useState<NewContentItem[]>([]);
  const [instructions, setInstructions] = useState('');
  const [includeChatContext, setIncludeChatContext] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'claude' | 'gpt4' | 'perplexity'>('claude');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [previewChunk, setPreviewChunk] = useState<TextChunk | null>(null);
  const [emailAddress, setEmailAddress] = useState('');
  const [newContentTopic, setNewContentTopic] = useState('');
  const [newContentDescription, setNewContentDescription] = useState('');
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

  // New content management functions
  const addNewContentItem = () => {
    if (!newContentTopic.trim()) {
      toast({
        title: "Topic required",
        description: "Please enter a topic for the new content section.",
        variant: "destructive"
      });
      return;
    }

    const newItem: NewContentItem = {
      id: `new_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      topic: newContentTopic.trim(),
      description: newContentDescription.trim(),
      selected: true,
      isProcessing: false,
      isComplete: false
    };

    setNewContentItems(prev => [...prev, newItem]);
    setNewContentTopic('');
    setNewContentDescription('');
    
    toast({
      title: "New section added",
      description: `Added "${newItem.topic}" to the content generation list.`,
    });
  };

  const toggleNewContentSelection = (itemId: string) => {
    setNewContentItems(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, selected: !item.selected }
        : item
    ));
  };

  const removeNewContentItem = (itemId: string) => {
    setNewContentItems(prev => prev.filter(item => item.id !== itemId));
  };

  const startRewrite = async () => {
    const selectedChunks = chunks.filter(chunk => chunk.selected);
    const selectedNewContent = newContentItems.filter(item => item.selected);
    
    if (selectedChunks.length === 0 && selectedNewContent.length === 0) {
      toast({
        title: "No content selected",
        description: "Please select at least one chunk to rewrite or add new content sections.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setCurrentChunkIndex(0);
    setProgress(0);

    // Reset all chunks and new content items
    setChunks(prev => prev.map(chunk => ({
      ...chunk,
      rewritten: undefined,
      isProcessing: false,
      isComplete: false
    })));
    
    setNewContentItems(prev => prev.map(item => ({
      ...item,
      generatedContent: undefined,
      isProcessing: false,
      isComplete: false
    })));

    try {
      let chatContext = '';
      if (includeChatContext && chatHistory.length > 0) {
        chatContext = '\n\nChat Context (for reference):\n' + 
          chatHistory.slice(-10).map(msg => `${msg.role}: ${msg.content}`).join('\n');
      }

      const totalTasks = selectedChunks.length + selectedNewContent.length;
      let completedTasks = 0;

      // Process existing chunks for rewriting
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

        completedTasks++;
        setProgress((completedTasks / totalTasks) * 100);
      }

      // Process new content generation
      for (let i = 0; i < selectedNewContent.length; i++) {
        const item = selectedNewContent[i];
        
        // Mark current item as processing
        setNewContentItems(prev => prev.map(item => 
          item.id === selectedNewContent[i].id 
            ? { ...item, isProcessing: true }
            : item
        ));

        const contentPrompt = `Write a comprehensive section about "${item.topic}".
        
${item.description ? `Description: ${item.description}` : ''}

Context: This is being added to a document that already contains content about similar topics. 
Please write a well-structured, informative section that would fit naturally with academic or professional content.

${instructions ? `Additional instructions: ${instructions}` : ''}
${chatContext}

Write the content in a clear, engaging style with proper headings and structure.`;

        const response = await fetch('/api/rewrite-chunk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: contentPrompt,
            instructions: `Generate new content about: ${item.topic}`,
            model: selectedModel,
            chatContext: includeChatContext ? chatContext : undefined,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to generate content for "${item.topic}"`);
        }

        const result = await response.json();

        // Update item with generated content
        setNewContentItems(prev => prev.map(i => 
          i.id === item.id 
            ? { 
                ...i, 
                generatedContent: result.rewrittenContent,
                isProcessing: false,
                isComplete: true 
              }
            : i
        ));

        completedTasks++;
        setProgress((completedTasks / totalTasks) * 100);
      }

      // Compile the full text: rewritten chunks + new content
      const rewrittenChunks = chunks.filter(chunk => chunk.selected && chunk.rewritten);
      const newGeneratedContent = newContentItems.filter(item => item.selected && item.generatedContent);
      
      console.log('Rewritten chunks for assembly:', rewrittenChunks.length);
      console.log('New content sections for assembly:', newGeneratedContent.length);
      console.log('Sample chunk content:', rewrittenChunks[0]?.rewritten?.substring(0, 100));
      console.log('Sample new content:', newGeneratedContent[0]?.generatedContent?.substring(0, 100));
      
      const rewrittenText = rewrittenChunks
        .map(chunk => chunk.rewritten)
        .join('\n\n');
        
      const newContentText = newGeneratedContent
        .map(item => item.generatedContent)
        .join('\n\n');
      
      // Combine rewritten content and new content
      const fullRewrittenText = [rewrittenText, newContentText]
        .filter(text => text && text.trim())
        .join('\n\n');
      
      console.log('Final assembled text length:', fullRewrittenText.length);

      const metadata = {
        originalLength: originalText.length,
        rewrittenLength: fullRewrittenText.length,
        chunksProcessed: selectedChunks.length,
        newContentSections: selectedNewContent.length,
        model: selectedModel,
        instructions: instructions,
        includedChatContext: includeChatContext
      };

      let successMessage = '';
      if (selectedChunks.length > 0 && selectedNewContent.length > 0) {
        successMessage = `Successfully rewrote ${selectedChunks.length} chunks and added ${selectedNewContent.length} new content sections.`;
      } else if (selectedChunks.length > 0) {
        successMessage = `Successfully rewrote ${selectedChunks.length} chunks.`;
      } else {
        successMessage = `Successfully added ${selectedNewContent.length} new content sections.`;
      }

      toast({
        title: "Process complete!",
        description: `${successMessage} Document saved and ready for download/sharing.`,
        duration: 8000,
      });

      // Save the completed rewrite and let user see the results
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

        {/* Add New Content Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Add New Content Sections</h3>
            <Badge variant="outline">{newContentItems.length} sections</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Add entirely new sections to your document on topics you specify. These will be generated as additional content alongside your existing text.
          </p>
          
          <div className="grid grid-cols-1 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="newTopic">Topic/Section Title</Label>
              <Input
                id="newTopic"
                placeholder="e.g., Knowledge of the Past"
                value={newContentTopic}
                onChange={(e) => setNewContentTopic(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newDescription">Detailed Instructions (Optional)</Label>
              <Textarea
                id="newDescription"
                placeholder="Detailed instructions for what to include in this section. You can provide extensive guidance, examples, specific points to cover, writing style preferences, etc. Add as much detail as needed - this field can handle multiple paragraphs of instructions."
                value={newContentDescription}
                onChange={(e) => setNewContentDescription(e.target.value)}
                rows={8}
                className="min-h-[200px] w-full resize-y"
              />
            </div>
            <div>
              <Button onClick={addNewContentItem} className="w-full">
                Add New Section
              </Button>
            </div>
          </div>

          {/* Display Added New Content Items */}
          {newContentItems.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {newContentItems.map((item, index) => (
                <Card key={item.id} className={`cursor-pointer transition-colors ${
                  item.selected ? 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800' : ''
                }`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">
                        {item.topic}
                      </CardTitle>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeNewContentItem(item.id)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          ×
                        </Button>
                        <Checkbox
                          checked={item.selected}
                          onCheckedChange={() => toggleNewContentSelection(item.id)}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      {item.description || 'Will generate content about this topic'}
                    </p>
                    {item.isProcessing && (
                      <div className="mt-2 text-xs text-yellow-600 dark:text-yellow-400">
                        Generating content...
                      </div>
                    )}
                    {item.isComplete && (
                      <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                        ✓ Content generated
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
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

        {/* Completed Rewrite Display */}
        {chunks.some(c => c.rewritten) && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-green-600">✓ Rewrite Complete!</h3>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {chunks.filter(c => c.rewritten).length} chunks rewritten
              </Badge>
            </div>
            
            <Card className="bg-green-50 border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-green-800">Your Rewritten Document</CardTitle>
                <CardDescription>
                  Document is ready for download, sharing, or adding to your chat
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Button 
                    onClick={addToChat}
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Add to Chat</span>
                  </Button>

                  <Button 
                    variant="outline" 
                    onClick={() => downloadRewrite('pdf')}
                    className="flex items-center space-x-2 border-green-300 text-green-700 hover:bg-green-100"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
                  </Button>

                  <Button 
                    variant="outline" 
                    onClick={() => downloadRewrite('docx')}
                    className="flex items-center space-x-2 border-green-300 text-green-700 hover:bg-green-100"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Word</span>
                  </Button>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline"
                        className="flex items-center space-x-2 border-green-300 text-green-700 hover:bg-green-100"
                      >
                        <Mail className="w-4 h-4" />
                        <span>Email</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Share Rewritten Document</DialogTitle>
                        <DialogDescription>
                          Send your rewritten document via email
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input
                          placeholder="Enter email address..."
                          value={emailAddress}
                          onChange={(e) => setEmailAddress(e.target.value)}
                        />
                        <Button 
                          onClick={shareViaEmail}
                          disabled={!emailAddress}
                          className="w-full"
                        >
                          Send Email
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
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
            onClick={() => {
              setChunks(prev => prev.map(chunk => ({
                ...chunk,
                rewritten: undefined,
                isProcessing: false,
                isComplete: false
              })));
              setProgress(0);
              setCurrentChunkIndex(0);
            }}
            disabled={isProcessing}
            className="flex items-center space-x-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </Button>
        </div>


      </CardContent>
    </Card>
  );
}