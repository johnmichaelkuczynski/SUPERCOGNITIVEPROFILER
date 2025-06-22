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
  initialProcessingMode?: 'rewrite' | 'homework' | 'text-to-math';
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
  const [selectedModel, setSelectedModel] = useState<'claude' | 'gpt4' | 'perplexity' | 'deepseek'>('deepseek');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [previewChunk, setPreviewChunk] = useState<TextChunk | null>(null);
  const [emailAddress, setEmailAddress] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  
  // Processing mode options - use the passed initial mode
  const [processingMode, setProcessingMode] = useState<'rewrite' | 'homework' | 'text-to-math'>(initialProcessingMode);
  const [rewriteMode, setRewriteMode] = useState<'rewrite' | 'add' | 'both'>('rewrite');
  const [newChunkInstructions, setNewChunkInstructions] = useState('');
  const [numberOfNewChunks, setNumberOfNewChunks] = useState(3);
  const [showResultsPopup, setShowResultsPopup] = useState(false);
  const [finalRewrittenContent, setFinalRewrittenContent] = useState('');
  const [rewriteMetadata, setRewriteMetadata] = useState<any>(null);
  const [showLiveProgress, setShowLiveProgress] = useState(false);
  const [liveProgressChunks, setLiveProgressChunks] = useState<Array<{id: string, title: string, content: string, completed: boolean}>>([]);
  
  // Re-rewrite state
  const [isRerewriting, setIsRerewriting] = useState(false);
  const [showRerewriteForm, setShowRerewriteForm] = useState(false);
  const [rerewriteInstructions, setRerewriteInstructions] = useState('');
  const [rerewriteModel, setRerewriteModel] = useState<'claude' | 'gpt4' | 'perplexity' | 'deepseek'>('deepseek');
  const [rewriteChunks, setRewriteChunks] = useState<Array<{id: string, content: string, selected: boolean}>>([]);
  
  // Math View toggle state
  const [showMathView, setShowMathView] = useState(false);
  
  // Text selection and custom rewrite state
  const [selectedText, setSelectedText] = useState('');
  const [selectionInstructions, setSelectionInstructions] = useState('');
  const [showSelectionRewrite, setShowSelectionRewrite] = useState(false);
  const [expandedPreview, setExpandedPreview] = useState<string | null>(null);
  
  const { toast } = useToast();

  // Handle text selection for custom rewrite
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString().trim());
      setShowSelectionRewrite(true);
      toast({
        title: "Text Selected",
        description: `Selected: "${selection.toString().substring(0, 50)}${selection.toString().length > 50 ? '...' : ''}"`
      });
    } else {
      toast({
        title: "No Text Selected",
        description: "Please select some text first to rewrite it.",
        variant: "destructive"
      });
    }
  };

  // Rewrite selected text with custom instructions
  const rewriteSelectedText = async () => {
    if (!selectedText || !selectionInstructions.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select text and provide instructions.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/rewrite-selection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedText,
          instructions: selectionInstructions,
          model: selectedModel,
          fullContext: finalRewrittenContent
        })
      });

      if (!response.ok) {
        throw new Error('Failed to rewrite selected text');
      }

      const data = await response.json();
      
      // Replace the selected text in the full content
      const updatedContent = finalRewrittenContent.replace(selectedText, data.rewrittenText);
      setFinalRewrittenContent(updatedContent);
      
      setShowSelectionRewrite(false);
      setSelectedText('');
      setSelectionInstructions('');
      
      toast({
        title: "Text Rewritten!",
        description: "Selected text has been rewritten with your instructions."
      });
    } catch (error) {
      console.error('Error rewriting selected text:', error);
      toast({
        title: "Rewrite Failed",
        description: "Failed to rewrite selected text. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Fix math delimiters in content for proper rendering
  // REMOVED: fixMathDelimiters function was corrupting mathematical expressions in documents
  // Mathematical content should be preserved exactly as written without delimiter conversion

  // Clean content for auxiliary chat - remove markdown but PRESERVE LaTeX mathematical notation
  const cleanContentForChat = (content: string) => {
    let cleaned = content
      // Remove markdown headers
      .replace(/^#{1,6}\s+/gm, '')
      // Remove bold/italic formatting
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      // Remove list markers
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      // PRESERVE LaTeX mathematical notation - DO NOT convert to Unicode
      // Mathematical expressions should stay as \\(x \\in A\\), not become x ∈ A
      .replace(/\\leftrightarrow\s+/g, '↔')
      .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
      // Clean up multiple newlines
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    
    return cleaned;
  };

  const cancelRewrite = () => {
    setIsCancelled(true);
    toast({
      title: "Cancelling Rewrite",
      description: "Stopping the rewrite process...",
    });
  };

  const nukeEverything = () => {
    // Reset absolutely everything
    setIsProcessing(false);
    setIsCancelled(false);
    setCurrentChunkIndex(0);
    setProgress(0);
    setShowLiveProgress(false);
    setShowResultsPopup(false);
    setShowRerewriteForm(false);
    setIsRerewriting(false);
    setPreviewChunk(null);
    setRerewriteInstructions('');
    setRewriteChunks([]);
    setLiveProgressChunks([]);
    setFinalRewrittenContent('');
    setRewriteMetadata(null);
    
    // Clear any cached document content to force fresh processing
    localStorage.removeItem('cachedDocumentContent');
    localStorage.removeItem('lastProcessedDocument');
    
    // Reset all chunks and force regeneration from original text
    setChunks(prev => prev.map(chunk => ({
      ...chunk,
      rewritten: undefined,
      isProcessing: false,
      isComplete: false,
      selected: false
    })));
    
    toast({
      title: "🧨 NUKED!",
      description: "Everything has been reset. Fresh start!",
      variant: "destructive"
    });
  };

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
        selected: false, // Default to no chunks selected
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

  const processHomeworkMode = async () => {
    try {
      setIsProcessing(true);
      setProgress(25);

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
      
      setProgress(75);
      
      // Store any generated graphs
      const generatedGraphs = result.graphs || [];

      // Use original content without automatic math formatting
      let finalContent = result.response;

      setProgress(100);

      // Prepare metadata
      const metadata = {
        originalLength: originalText.length,
        rewrittenLength: finalContent.length,
        mode: 'homework',
        model: selectedModel,
        instructions: instructions,
        includedChatContext: includeChatContext,
        mathFormatted: true,
        graphs: generatedGraphs
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
    }
  };

  const startRewrite = async () => {
    // Handle homework mode differently - it processes the entire text as one unit
    if (processingMode === 'homework') {
      return await processHomeworkMode();
    }

    // Validation for rewrite modes only
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
      // All modes now use chunked processing
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
          id: `progress_${i}`,
          title: i < selectedChunks.length ? `Rewriting Chunk ${i + 1}` : `Generating New Chunk ${i - selectedChunks.length + 1}`,
          content: '',
          completed: false
        };
      }));

      // Step 1: Handle existing chunks
      const rewrittenChunks: string[] = [];
      
      if (rewriteMode === 'rewrite' || rewriteMode === 'both') {
        const selectedChunks = chunks.filter(chunk => chunk.selected);
        
        for (let i = 0; i < selectedChunks.length; i++) {
          // Check if cancelled
          if (isCancelled) {
            setIsProcessing(false);
            setIsCancelled(false);
            toast({
              title: "Rewrite Cancelled",
              description: "The rewrite process was stopped.",
              variant: "destructive"
            });
            return;
          }

          const chunk = selectedChunks[i];
          setCurrentChunkIndex(i);
          
          // Mark current chunk as processing
          setChunks(prev => prev.map(c => 
            c.id === chunk.id 
              ? { ...c, isProcessing: true }
              : c
          ));

          let response;
          if (processingMode === 'text-to-math') {
            // Use text-to-math endpoint for mathematical notation conversion
            response = await fetch('/api/text-to-math', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                content: chunk.content,
                instructions: instructions || 'Convert all mathematical markup and notation to perfect LaTeX format for proper rendering.',
                model: selectedModel,
                chatContext: includeChatContext ? chatContext : undefined,
                chunkIndex: i,
                totalChunks: selectedChunks.length
              }),
            });
          } else {
            // Use rewrite endpoint with document context
            const previousChunks = selectedChunks.slice(0, i).map(c => ({ title: c.preview.substring(0, 50), content: c.content }));
            const nextChunks = selectedChunks.slice(i + 1).map(c => ({ title: c.preview.substring(0, 50), content: c.content }));
            
            response = await fetch('/api/rewrite-chunk', {
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
                documentTitle: originalText.substring(0, 100) || 'Academic Document',
                previousChunks: previousChunks,
                nextChunks: nextChunks,
                mode: rewriteMode
              }),
            });
          }

          if (!response.ok) {
            throw new Error(`Failed to rewrite chunk ${i + 1}`);
          }

          const result = await response.json();

          // Store the content immediately (text-to-math returns 'mathContent', rewrite returns 'rewrittenContent')
          let content = processingMode === 'text-to-math' ? result.mathContent : 
                       result.rewrittenContent;

          // METADATA ELIMINATION: No automatic text-to-math processing to prevent unwanted metadata insertions
          // Math formatting is now handled directly by the rewrite-chunk endpoint system prompts

          rewrittenChunks.push(content);

          // Update chunk with rewritten content
          setChunks(prev => prev.map(c => 
            c.id === chunk.id 
              ? { 
                  ...c, 
                  rewritten: content,
                  isProcessing: false,
                  isComplete: true 
                }
              : c
          ));

          // Update live progress with completed chunk
          setLiveProgressChunks(prev => prev.map((item, idx) => 
            idx === i ? {
              ...item,
              content: content,
              completed: true
            } : item
          ));

          // Store completed chunk (don't automatically add to chat)

          processedChunks++;
          setProgress((processedChunks / totalOperations) * 100);

          // Add 15-second pause between requests to prevent rate limiting (except for last chunk)
          if (i < selectedChunks.length - 1) {
            console.log(`Pausing 15 seconds before processing chunk ${i + 2} to prevent rate limiting...`);
            await new Promise(resolve => setTimeout(resolve, 15000));
          }
        }

        // Compile rewritten chunks from our immediate storage
        finalContent = rewrittenChunks.join('\n\n');
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
          
          // AUTO-APPLY TEXT TO MATH: Format new chunks for math too
          let newChunkContent = result.newChunkContent;
          try {
            const mathResponse = await fetch('/api/text-to-math', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                content: newChunkContent,
                instructions: 'Convert all mathematical markup and notation to perfect LaTeX format for proper rendering.',
                model: selectedModel,
                chunkIndex: i,
                totalChunks: maxNewChunks
              }),
            });

            if (mathResponse.ok) {
              const mathResult = await mathResponse.json();
              newChunkContent = mathResult.mathContent;
              console.log(`[auto-math] New chunk ${i + 1} automatically formatted for math`);
            }
          } catch (error) {
            console.warn(`[auto-math] Failed to format new chunk ${i + 1} for math:`, error);
          }
          
          // Add new chunk to final content
          finalContent += '\n\n' + newChunkContent;

          // Update live progress with new chunk
          const selectedCount = chunks.filter(chunk => chunk.selected).length;
          setLiveProgressChunks(prev => prev.map((item, idx) => 
            idx === selectedCount + i ? {
              ...item,
              content: newChunkContent,
              completed: true
            } : item
          ));

          processedChunks++;
          setProgress((processedChunks / totalOperations) * 100);

          // Add 15-second pause between new chunk generation requests to prevent rate limiting (except for last chunk)
          if (i < maxNewChunks - 1) {
            console.log(`Pausing 15 seconds before generating new chunk ${i + 2} to prevent rate limiting...`);
            await new Promise(resolve => setTimeout(resolve, 15000));
          }
        }
      }

      // Calculate comprehensive word counts for each chunk
      const chunkWordCounts = chunks.filter(chunk => chunk.selected).map((chunk, index) => {
        const originalWords = chunk.content.trim().split(/\s+/).filter(word => word.length > 0).length;
        const rewrittenWords = chunk.rewritten ? chunk.rewritten.trim().split(/\s+/).filter(word => word.length > 0).length : 0;
        return {
          chunkNumber: index + 1,
          originalWords,
          rewrittenWords,
          wordChange: rewrittenWords - originalWords,
          expansionRatio: originalWords > 0 ? (rewrittenWords / originalWords).toFixed(2) : '0.00'
        };
      });

      // Calculate totals ONLY for selected/rewritten chunks, not the entire document
      const selectedChunks = chunks.filter(chunk => chunk.selected);
      const totalOriginalWords = selectedChunks.reduce((sum, chunk) => {
        return sum + chunk.content.trim().split(/\s+/).filter(word => word.length > 0).length;
      }, 0);
      const totalRewrittenWords = finalContent.trim().split(/\s+/).filter(word => word.length > 0).length;
      const totalWordChange = totalRewrittenWords - totalOriginalWords;
      const overallExpansionRatio = totalOriginalWords > 0 ? (totalRewrittenWords / totalOriginalWords).toFixed(2) : '0.00';

      // Prepare metadata with comprehensive word count tracking (only for selected chunks)
      const selectedChunksText = selectedChunks.map(chunk => chunk.content).join(' ');
      const metadata = {
        originalLength: selectedChunksText.length, // Only selected chunks, not entire document
        rewrittenLength: finalContent.length,
        originalWords: totalOriginalWords, // Only selected chunks
        rewrittenWords: totalRewrittenWords,
        wordChange: totalWordChange,
        expansionRatio: overallExpansionRatio,
        chunkWordCounts: chunkWordCounts,
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
        description: `Successfully processed ${metadata.chunksProcessed} chunks. ${metadata.originalWords} words → ${metadata.rewrittenWords} words (${metadata.wordChange >= 0 ? '+' : ''}${metadata.wordChange} words, ${metadata.expansionRatio}x expansion)${metadata.newChunksAdded ? ` with ${metadata.newChunksAdded} new chunks added` : ''}.`,
      });

      // Don't automatically add rewrite results to chat
      
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

  const printChunksAsPDF = () => {
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

    // Create print window with enhanced KaTeX support for perfect math rendering
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      toast({
        title: "Pop-up blocked",
        description: "Please allow pop-ups and try again.",
        variant: "destructive"
      });
      return;
    }

    // Process content for better LaTeX rendering
    let processedContent = rewrittenText
      // Convert markdown formatting to HTML
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^$*]*?)\*/g, '<em>$1</em>')
      .replace(/^#{1,6}\s+(.*)$/gm, '<h2>$1</h2>')
      // Ensure proper LaTeX delimiters
      .replace(/\$\$([^$]+)\$\$/g, '\\[$1\\]') // Display math
      .replace(/(?<!\$)\$([^$\n]+)\$(?!\$)/g, '\\($1\\)') // Inline math
      // Format paragraphs
      .replace(/\n\n+/g, '</p><p>')
      .replace(/\n/g, '<br>');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Mathematical Document - Print/Save as PDF</title>
          <meta charset="utf-8">
          <!-- KaTeX CSS for perfect math rendering -->
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
          <!-- KaTeX JavaScript -->
          <script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
          <script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Computer+Modern+Serif:wght@400;700&display=swap');
            
            body { 
              font-family: 'Computer Modern Serif', 'Times New Roman', serif;
              font-size: 12pt;
              line-height: 1.6; 
              max-width: 8.5in; 
              margin: 0 auto; 
              padding: 1in; 
              color: #000;
              background: white;
            }
            
            h2 { 
              color: #1a365d; 
              font-size: 16pt;
              margin: 24pt 0 12pt 0;
              page-break-after: avoid;
            }
            
            p { 
              margin: 12pt 0; 
              text-align: justify; 
              orphans: 2;
              widows: 2;
            }
            
            strong { font-weight: 700; }
            em { font-style: italic; }
            
            /* KaTeX math styling */
            .katex { font-size: 1.1em; }
            .katex-display { 
              margin: 16pt 0; 
              text-align: center;
              page-break-inside: avoid;
            }
            
            /* Control buttons */
            .controls { 
              text-align: center; 
              margin: 20px 0; 
              background: #f8f9fa;
              padding: 15px;
              border-radius: 8px;
              border: 2px solid #e9ecef;
            }
            .controls button { 
              margin: 0 10px; 
              padding: 12px 24px; 
              background: #007bff; 
              color: white; 
              border: none; 
              border-radius: 6px; 
              cursor: pointer;
              font-size: 14px;
              font-weight: 500;
            }
            .controls button:hover { background: #0056b3; }
            .controls .close { background: #6c757d; }
            .controls .close:hover { background: #545b62; }
            
            #loading {
              text-align: center;
              padding: 50px;
              font-size: 18px;
              color: #666;
            }
            
            #content { display: none; }
            
            /* Print-specific styles */
            @media print { 
              .controls { display: none; }
              body { 
                margin: 0; 
                padding: 0.75in; 
                font-size: 11pt;
              }
              @page { 
                margin: 0.75in;
                size: A4;
              }
              h2 { 
                page-break-after: avoid;
                margin-top: 18pt;
              }
              .katex-display {
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <div id="loading">⚡ Loading mathematical notation...</div>
          <div id="content">
            <div class="controls">
              <button onclick="window.print()" title="Use your browser's print dialog to save as PDF">
                📄 Print / Save as PDF
              </button>
              <button class="close" onclick="window.close()">Close Window</button>
            </div>
            <div id="text-content">
              <p>${processedContent}</p>
            </div>
          </div>
          
          <script>
            // Render LaTeX math with KaTeX for perfect display
            document.addEventListener("DOMContentLoaded", function() {
              renderMathInElement(document.getElementById('text-content'), {
                delimiters: [
                  {left: "\\\\[", right: "\\\\]", display: true},
                  {left: "\\\\(", right: "\\\\)", display: false},
                  {left: "$$", right: "$$", display: true}
                  // REMOVED single $ delimiters to prevent currency symbols from being treated as math
                ],
                throwOnError: false,
                strict: false,
                trust: true,
                // Enhanced options for currency protection
                ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
                ignoredClasses: ['currency', 'money', 'price', 'cost']
              });
              
              // Show content after math rendering
              setTimeout(function() {
                document.getElementById('loading').style.display = 'none';
                document.getElementById('content').style.display = 'block';
              }, 800);
            });
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    toast({
      title: "Print window opened",
      description: "Math notation will render perfectly. Use the Print/Save as PDF button when ready.",
    });
  };

  const shareViaEmail = async () => {
    if (!emailAddress || !senderEmail) {
      toast({
        title: "Email addresses required",
        description: "Please enter both recipient and verified sender email addresses.",
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
          senderEmail: senderEmail,
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
        selected: false
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
        
        const previousChunks = selectedChunks.slice(0, i).map(c => ({ title: 'Re-rewrite Section', content: c.content }));
        const nextChunks = selectedChunks.slice(i + 1).map(c => ({ title: 'Re-rewrite Section', content: c.content }));
        
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
            documentTitle: rewriteMetadata?.title || 'Re-rewritten Document',
            previousChunks: previousChunks,
            nextChunks: nextChunks,
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

      onAddToChat(cleanContentForChat(rerewrittenContent), rerewriteMetadata);

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
        <MathJax hideUntilTypeset="first">
          <ReactMarkdown
            rehypePlugins={[rehypeKatex]}
            remarkPlugins={[remarkMath]}
            components={{
              // Custom renderer for paragraphs to handle inline math better
              p: ({children}) => <p className="mb-4">{children}</p>,
              // Custom renderer for math blocks
              code: ({className, children, ...props}) => {
                const match = /language-(\w+)/.exec(className || '');
                if (match && match[1] === 'math') {
                  return <div className="math-display">$$${String(children)}$$</div>;
                }
                return <code className={className} {...props}>{children}</code>;
              }
            }}
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
        {/* Processing Mode Selection */}
        <div className="space-y-4">
          <Label className="text-lg font-semibold">Processing Mode</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <Card className={`cursor-pointer transition-all ${processingMode === 'text-to-math' ? 'ring-2 ring-purple-500 bg-purple-50' : 'hover:bg-gray-50'}`}
                  onClick={() => setProcessingMode('text-to-math')}>
              <CardContent className="p-4 text-center">
                <h3 className="font-semibold">Text to Math</h3>
                <p className="text-sm text-muted-foreground mt-2">Convert markup to perfect mathematical notation</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Rewrite Mode Selection - only show in rewrite mode */}
        {processingMode === 'rewrite' && (
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
        )}

        {/* Configuration Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            {processingMode === 'homework' ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="instructions">Additional Guidance (Optional)</Label>
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
                  placeholder="Provide any additional guidance for completing the assignment (e.g., 'show all work', 'explain your reasoning', 'use specific examples')..."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={3}
                />
              </div>
            ) : (rewriteMode === 'rewrite' || rewriteMode === 'both') && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="instructions">Rewrite Instructions for Existing Content</Label>
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
                  placeholder="Enter specific instructions for how you want the existing text rewritten..."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={3}
                />
              </div>
            )}
            
            {(rewriteMode === 'add' || rewriteMode === 'both') && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="newChunkInstructions">Instructions for New Content</Label>
                  <SpeechInput
                    onTranscript={(text) => {
                      const newInstructions = newChunkInstructions ? `${newChunkInstructions} ${text}` : text;
                      setNewChunkInstructions(newInstructions);
                    }}
                    onAppend={true}
                    size="sm"
                    className="h-8 w-8"
                  />
                </div>
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
                  <SelectItem value="deepseek">DeepSeek</SelectItem>
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
                        <DialogContent className="max-w-[95vw] w-[95vw] max-h-[90vh] overflow-y-auto" style={{ width: '95vw', maxWidth: '95vw' }}>
                          <DialogHeader>
                            <DialogTitle>Chunk {index + 1} Preview</DialogTitle>
                            <DialogDescription>
                              {chunk.rewritten ? 'Rewritten version' : 'Original content'}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="mt-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-900 text-sm leading-relaxed max-w-none w-full">
                            <MathJax hideUntilTypeset="first">
                              <div className="whitespace-pre-wrap font-mono">
                                {chunk.rewritten || chunk.content}
                              </div>
                            </MathJax>
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
                  {/* Show rewritten content if available, otherwise show preview */}
                  <div className="text-sm text-muted-foreground max-h-32 overflow-y-auto bg-gray-50 p-2 rounded border">
                    {chunk.rewritten ? (
                      <div className="space-y-2">
                        <div className="font-medium text-green-700 text-xs mb-1">REWRITTEN CONTENT:</div>
                        <div className="text-xs leading-relaxed">
                          <MathJax hideUntilTypeset="first">
                            <div className="whitespace-pre-wrap font-mono">
                              {chunk.rewritten}
                            </div>
                          </MathJax>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="font-medium text-gray-600 text-xs mb-1">ORIGINAL CONTENT:</div>
                        <div className="text-xs leading-relaxed">
                          <MathJax hideUntilTypeset="first">
                            <div className="whitespace-pre-wrap font-mono">
                              {chunk.content}
                            </div>
                          </MathJax>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Word Count Display for Each Chunk */}
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">Original:</span>
                      <span className="font-medium text-gray-700">
                        {chunk.content.trim().split(/\s+/).filter(word => word.length > 0).length} words
                      </span>
                    </div>
                    {chunk.rewritten && (
                      <>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-blue-500">Rewritten:</span>
                          <span className="font-medium text-blue-700">
                            {chunk.rewritten.trim().split(/\s+/).filter(word => word.length > 0).length} words
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-purple-500">Change:</span>
                          <span className={`font-medium ${
                            chunk.rewritten.trim().split(/\s+/).filter(word => word.length > 0).length - 
                            chunk.content.trim().split(/\s+/).filter(word => word.length > 0).length >= 0 
                            ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {chunk.rewritten.trim().split(/\s+/).filter(word => word.length > 0).length - 
                             chunk.content.trim().split(/\s+/).filter(word => word.length > 0).length > 0 ? '+' : ''}
                            {chunk.rewritten.trim().split(/\s+/).filter(word => word.length > 0).length - 
                             chunk.content.trim().split(/\s+/).filter(word => word.length > 0).length} words
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                  
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

        {/* Enhanced Progress Section - Prominent for Homework Mode */}
        {isProcessing && (
          <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 shadow-sm">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-blue-800 mb-2 flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent mr-3"></div>
                {processingMode === 'homework' ? 'Processing Homework Assignment' : 
                 processingMode === 'text-to-math' ? 'Converting to Mathematical Notation' : 
                 'Rewriting Document Chunks'}
              </h3>
              <p className="text-blue-700 text-sm">
                {processingMode === 'homework' ? 
                  'AI is analyzing and completing your assignment. This typically takes 1-3 minutes for complex tasks.' :
                  processingMode === 'text-to-math' ? 
                  'Converting all mathematical expressions to proper LaTeX formatting for clean rendering.' :
                  `Processing chunks with 15-second intervals between requests to prevent API rate limits.`}
              </p>
            </div>
            
            <div className="space-y-3">
              {/* Main Progress Bar */}
              <div className="w-full bg-blue-200 rounded-full h-4 border border-blue-300 shadow-inner">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-500 flex items-center justify-center text-white text-xs font-medium shadow-sm"
                  style={{ width: `${Math.max(progress, 5)}%` }}
                >
                  {Math.round(progress)}%
                </div>
              </div>
              
              {/* Status Text */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-blue-700 font-medium">
                  {processingMode === 'homework' && progress <= 25 && 'Analyzing assignment requirements...'}
                  {processingMode === 'homework' && progress > 25 && progress <= 50 && `Processing with ${selectedModel.toUpperCase()} model...`}
                  {processingMode === 'homework' && progress > 50 && progress <= 75 && 'Formatting mathematical notation...'}
                  {processingMode === 'homework' && progress > 75 && 'Finalizing results...'}
                  {processingMode === 'text-to-math' && 'Converting mathematical expressions...'}
                  {processingMode === 'rewrite' && rewriteMode === 'add' && `Generating new chunk ${currentChunkIndex + 1} of ${numberOfNewChunks}`}
                  {processingMode === 'rewrite' && rewriteMode === 'rewrite' && `Rewriting chunk ${currentChunkIndex + 1} of ${chunks.filter(c => c.selected).length}`}
                  {processingMode === 'rewrite' && rewriteMode === 'both' && `Processing chunk ${currentChunkIndex + 1} of ${chunks.filter(c => c.selected).length + numberOfNewChunks}`}
                </span>
                <span className="text-blue-600 font-semibold">
                  {processingMode === 'homework' || processingMode === 'text-to-math' ? 
                    `${Math.round(progress)}% Complete` :
                    `${chunks.filter(c => c.rewritten).length} / ${chunks.filter(c => c.selected).length + (rewriteMode === 'add' || rewriteMode === 'both' ? numberOfNewChunks : 0)} done`}
                </span>
              </div>
              
              {/* Homework Mode Specific Status */}
              {processingMode === 'homework' && (
                <div className="flex items-center justify-center space-x-2 pt-2 border-t border-blue-200">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                  <span className="text-blue-600 text-sm font-medium">Working on your assignment...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {!isProcessing ? (
            <Button 
              onClick={startRewrite} 
              disabled={processingMode === 'rewrite' ? chunks.filter(c => c.selected).length === 0 : false}
              className="flex items-center space-x-2"
            >
              <Play className="w-4 h-4" />
              <span>{processingMode === 'homework' ? 'Start Homework' : 
                     processingMode === 'text-to-math' ? 'Convert to Math' : 
                     'Start Rewrite'}</span>
            </Button>
          ) : (
            <Button 
              onClick={cancelRewrite} 
              variant="destructive"
              className="flex items-center space-x-2"
            >
              <X className="w-4 h-4" />
              <span>Cancel Rewrite</span>
            </Button>
          )}



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
            onClick={printChunksAsPDF}
            disabled={!chunks.some(c => c.rewritten)}
            className="flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Save as PDF</span>
          </Button>
        </div>

        {/* Email Sharing */}
        <div className="space-y-2">
          <div className="flex space-x-2">
            <Input
              placeholder="Recipient email address..."
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              disabled={!chunks.some(c => c.rewritten)}
              className="flex-1"
            />
            <Input
              placeholder="Your verified SendGrid sender email..."
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
              disabled={!chunks.some(c => c.rewritten)}
              className="flex-1"
            />
            <Button 
              onClick={shareViaEmail}
              disabled={!chunks.some(c => c.rewritten) || !emailAddress || !senderEmail}
              className="flex items-center space-x-2"
            >
              <Mail className="w-4 h-4" />
              <span>Share</span>
            </Button>
          </div>
          <p className="text-xs text-red-600">
            Sender email must be verified in your SendGrid account
          </p>
        </div>
      </CardContent>
    </Card>

    {/* Persistent Results Popup */}
    <Dialog open={showResultsPopup} onOpenChange={setShowResultsPopup}>
      <DialogContent className="max-w-[95vw] w-[95vw] overflow-hidden h-[95vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {rewriteMetadata?.isRerewrite ? '🔄 Re-rewritten Content' : 'Rewrite Results'} - {rewriteMetadata?.rewriteMode === 'rewrite' ? 'Rewritten Content' : rewriteMetadata?.rewriteMode === 'add' ? 'Original + New Content' : 'Rewritten + New Content'}
          </DialogTitle>
          <DialogDescription>
            {rewriteMetadata && (
              <div className="text-sm space-y-3">
                {rewriteMetadata.isRerewrite && (
                  <div className="text-blue-600 font-medium">✨ This content has been re-rewritten with custom instructions</div>
                )}
                
                {/* Comprehensive Word Count Display */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-800">{rewriteMetadata.originalWords?.toLocaleString() || 'N/A'}</div>
                    <div className="text-xs text-gray-600">Original Words</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">{rewriteMetadata.rewrittenWords?.toLocaleString() || 'N/A'}</div>
                    <div className="text-xs text-gray-600">Rewritten Words</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-lg font-bold ${(rewriteMetadata.wordChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(rewriteMetadata.wordChange || 0) > 0 ? '+' : ''}{rewriteMetadata.wordChange?.toLocaleString() || '0'}
                    </div>
                    <div className="text-xs text-gray-600">Word Change</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-purple-600">{rewriteMetadata.expansionRatio || '1.00'}x</div>
                    <div className="text-xs text-gray-600">Expansion Ratio</div>
                  </div>
                </div>

                {/* Per-Chunk Word Count Details */}
                {rewriteMetadata.chunkWordCounts && rewriteMetadata.chunkWordCounts.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs font-semibold text-gray-700 mb-2">Individual Chunk Word Counts:</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                      {rewriteMetadata.chunkWordCounts.map((chunk: any, index: number) => (
                        <div key={index} className="text-xs bg-white p-2 rounded border">
                          <div className="font-medium text-gray-700">Chunk {chunk.chunkNumber}</div>
                          <div className="flex justify-between">
                            <span>Original:</span>
                            <span className="font-medium">{chunk.originalWords}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Rewritten:</span>
                            <span className="font-medium text-blue-600">{chunk.rewrittenWords}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Change:</span>
                            <span className={`font-medium ${chunk.wordChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {chunk.wordChange > 0 ? '+' : ''}{chunk.wordChange}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Ratio:</span>
                            <span className="font-medium text-purple-600">{chunk.expansionRatio}x</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>Mode: {rewriteMetadata.rewriteMode === 'rewrite' ? 'Rewrite Existing Only' : rewriteMetadata.rewriteMode === 'add' ? 'Add New Content Only' : 'Both Rewrite & Add'}</div>
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
        
        {/* Main Content Container */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 mb-4 p-4 bg-gray-50 rounded-lg flex-shrink-0">
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
                onAddToChat(cleanContentForChat(finalRewrittenContent), rewriteMetadata);
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
              onClick={() => {
                // Close popup and go straight back to chat
                setShowResultsPopup(false);
                setFinalRewrittenContent('');
                setRewriteMetadata(null);
                onAddToChat(cleanContentForChat(finalRewrittenContent), rewriteMetadata);
                toast({
                  title: "Back to chat!",
                  description: "Content added and returned to main chat.",
                });
              }}
              variant="outline"
              className="flex items-center space-x-2 border-green-500 text-green-700 hover:bg-green-50"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Chat</span>
            </Button>

            <Button 
              onClick={() => {
                // Create print window with perfect KaTeX math rendering
                const printWindow = window.open('', '_blank', 'width=900,height=700');
                if (!printWindow) {
                  toast({
                    title: "Pop-up blocked",
                    description: "Please allow pop-ups and try again.",
                    variant: "destructive"
                  });
                  return;
                }

                // Process content for perfect PDF rendering with proper currency handling
                let processedContent = finalRewrittenContent
                  // FIRST: Fix all escaped dollar signs to regular currency symbols
                  .replace(/\\\$/g, '$')
                  // SECOND: Apply the rebuilt math delimiter system for proper currency/math distinction
                  .replace(/\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\b/g, 'CURRENCY_TEMP_$1')  // Protect currency like $300, $1,000.50
                  .replace(/\$(\d+\.?\d*)\s*(?:USD|dollars?|bucks?)\b/gi, 'CURRENCY_TEMP_$1 $2') // Protect $25 USD
                  .replace(/(?:USD|dollars?)\s*\$(\d+\.?\d*)\b/gi, '$1 CURRENCY_TEMP_$2') // Protect USD $25
                  // Convert only legitimate math expressions to LaTeX
                  .replace(/\$([^$]*[\\^_{}α-ωΑ-Ω∑∏∫∂∇][^$]*)\$/g, '\\($1\\)') // Math with Greek letters, operators, or LaTeX commands
                  .replace(/\$\$([^$]+)\$\$/g, '\\[$1\\]') // Display math
                  // Restore currency symbols
                  .replace(/CURRENCY_TEMP_/g, '$')
                  // Convert markdown formatting to HTML
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\*([^$*]*?)\*/g, '<em>$1</em>')
                  .replace(/^#{1,6}\s+(.*)$/gm, '<h2>$1</h2>')
                  // Format paragraphs
                  .replace(/\n\n+/g, '</p><p>')
                  .replace(/\n/g, '<br>');

                // Generate graphs HTML if they exist
                let graphsHTML = '';
                if (rewriteMetadata?.graphs && rewriteMetadata.graphs.length > 0) {
                  graphsHTML = `
                    <div class="graphs-section">
                      <h2>Supporting Visualizations</h2>
                      ${rewriteMetadata.graphs.map((graph: any, index: number) => `
                        <div class="graph-container">
                          <h3 class="graph-title">${graph.title || `Graph ${index + 1}`}</h3>
                          ${graph.description ? `<p class="graph-description">${graph.description}</p>` : ''}
                          <div class="graph-svg">
                            ${graph.svg}
                          </div>
                        </div>
                      `).join('')}
                      <h2>Assignment Content</h2>
                    </div>
                  `;
                }

                const htmlContent = `
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <title>Homework Assignment - Mathematical Document</title>
                      <meta charset="utf-8">
                      <!-- KaTeX CSS for perfect math rendering -->
                      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
                      <!-- KaTeX JavaScript -->
                      <script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
                      <script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js"></script>
                      <style>
                        @import url('https://fonts.googleapis.com/css2?family=Computer+Modern+Serif:wght@400;700&display=swap');
                        
                        body { 
                          font-family: 'Computer Modern Serif', 'Times New Roman', serif;
                          font-size: 12pt;
                          line-height: 1.6; 
                          max-width: 8.5in; 
                          margin: 0 auto; 
                          padding: 1in; 
                          color: #000;
                          background: white;
                        }
                        
                        h2 { 
                          color: #1a365d; 
                          font-size: 16pt;
                          margin: 24pt 0 12pt 0;
                          page-break-after: avoid;
                        }
                        
                        p { 
                          margin: 12pt 0; 
                          text-align: justify; 
                          orphans: 2;
                          widows: 2;
                        }
                        
                        strong { font-weight: 700; }
                        em { font-style: italic; }
                        
                        /* Graph styling for PDF */
                        .graphs-section {
                          margin-bottom: 24pt;
                        }
                        
                        .graph-container {
                          margin: 18pt 0;
                          page-break-inside: avoid;
                          border: 1px solid #ddd;
                          padding: 12pt;
                          background: #fafafa;
                        }
                        
                        .graph-container h3 {
                          font-size: 14pt;
                          margin: 0 0 6pt 0;
                          color: #1a365d;
                          text-align: center;
                        }
                        
                        .graph-description {
                          font-size: 10pt;
                          color: #666;
                          text-align: center;
                          margin: 0 0 12pt 0;
                          font-style: italic;
                        }
                        
                        .graph-svg {
                          text-align: center;
                          margin: 12pt 0;
                          overflow: visible;
                        }
                        
                        .graph-svg svg {
                          max-width: 100%;
                          height: auto;
                          max-height: 300pt;
                        }
                        
                        /* Perfect KaTeX math styling */
                        .katex { font-size: 1.1em; }
                        .katex-display { 
                          margin: 16pt 0; 
                          text-align: center;
                          page-break-inside: avoid;
                        }
                        
                        /* Graph title math styling */
                        .graph-title {
                          font-size: 14pt;
                          font-weight: bold;
                          margin: 12pt 0 8pt 0;
                          text-align: center;
                        }
                        
                        /* Control buttons */
                        .controls { 
                          text-align: center; 
                          margin: 20px 0; 
                          background: #f8f9fa;
                          padding: 15px;
                          border-radius: 8px;
                          border: 2px solid #e9ecef;
                        }
                        .controls button { 
                          margin: 0 10px; 
                          padding: 12px 24px; 
                          background: #28a745; 
                          color: white; 
                          border: none; 
                          border-radius: 6px; 
                          cursor: pointer;
                          font-size: 14px;
                          font-weight: 500;
                        }
                        .controls button:hover { background: #218838; }
                        .controls .close { background: #6c757d; }
                        .controls .close:hover { background: #545b62; }
                        
                        #loading {
                          text-align: center;
                          padding: 50px;
                          font-size: 18px;
                          color: #666;
                        }
                        
                        #content { display: none; }
                        
                        /* Print-specific styles for perfect PDFs */
                        @media print { 
                          .controls { display: none; }
                          body { 
                            margin: 0; 
                            padding: 0.75in; 
                            font-size: 11pt;
                          }
                          @page { 
                            margin: 0.75in;
                            size: A4;
                          }
                          h2 { 
                            page-break-after: avoid;
                            margin-top: 18pt;
                          }
                          .katex-display {
                            page-break-inside: avoid;
                          }
                          
                          /* Graph-specific print styles */
                          .graph-container {
                            page-break-inside: avoid;
                            margin: 12pt 0;
                            max-width: 100%;
                          }
                          
                          .graph-svg {
                            overflow: visible;
                            text-align: center;
                            max-width: 100%;
                            display: block;
                          }
                          
                          .graph-svg svg {
                            max-width: 6in !important;
                            max-height: 4in !important;
                            width: auto !important;
                            height: auto !important;
                            display: block;
                            margin: 0 auto;
                          }
                        }
                      </style>
                    </head>
                    <body>
                      <div id="loading">⚡ Rendering mathematical notation...</div>
                      <div id="content">
                        <div class="controls">
                          <button onclick="window.print()" title="Save as PDF using your browser's print dialog">
                            📄 Save as PDF (Perfect Math Rendering)
                          </button>
                          <button class="close" onclick="window.close()">Close Window</button>
                        </div>
                        <div id="text-content">
                          ${graphsHTML}
                          <p>${processedContent}</p>
                        </div>
                      </div>
                      
                      <script>
                        // Render LaTeX math with KaTeX for perfect display
                        document.addEventListener("DOMContentLoaded", function() {
                          // Render math in main content
                          renderMathInElement(document.getElementById('text-content'), {
                            delimiters: [
                              {left: "\\\\[", right: "\\\\]", display: true},
                              {left: "\\\\(", right: "\\\\)", display: false},
                              {left: "$$", right: "$$", display: true}
                              // Removed single $ delimiters to prevent currency symbols from being treated as math
                            ],
                            throwOnError: false,
                            strict: false,
                            trust: true
                          });
                          
                          // Render math in graph titles specifically
                          const graphTitles = document.querySelectorAll('.graph-title');
                          graphTitles.forEach(function(title) {
                            renderMathInElement(title, {
                              delimiters: [
                                {left: "\\\\(", right: "\\\\)", display: false}
                                // Removed single $ delimiters to prevent currency symbols from being treated as math
                              ],
                              throwOnError: false,
                              strict: false,
                              trust: true
                            });
                          });
                          
                          // Show content after math rendering
                          setTimeout(function() {
                            document.getElementById('loading').style.display = 'none';
                            document.getElementById('content').style.display = 'block';
                          }, 800);
                        });
                      </script>
                    </body>
                  </html>
                `;

                printWindow.document.write(htmlContent);
                printWindow.document.close();

                toast({
                  title: "Print window opened",
                  description: "Mathematical notation will render perfectly. Click Save as PDF when ready.",
                });
              }}
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Save as PDF</span>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => {
                // Download as clean TXT file
                const cleanContent = finalRewrittenContent;
                const blob = new Blob([cleanContent], { type: 'text/plain' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = 'rewritten-document.txt';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                toast({
                  title: "Download started",
                  description: "Your text file is downloading.",
                });
              }}
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download TXT</span>
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
                type="email"
                placeholder="Enter email address to share..."
                value={emailAddress}
                onChange={(e) => {
                  setEmailAddress(e.target.value);
                  // Save to localStorage for next time
                  if (e.target.value) {
                    localStorage.setItem('userEmail', e.target.value);
                  }
                }}
                onFocus={() => {
                  // Auto-fill from localStorage if empty
                  if (!emailAddress) {
                    const savedEmail = localStorage.getItem('userEmail');
                    if (savedEmail) {
                      setEmailAddress(savedEmail);
                    }
                  }
                }}
                autoComplete="email"
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
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="rerewrite-instructions">Custom Instructions</Label>
                    <SpeechInput
                      onTranscript={(text) => {
                        const newInstructions = rerewriteInstructions ? `${rerewriteInstructions} ${text}` : text;
                        setRerewriteInstructions(newInstructions);
                      }}
                      onAppend={true}
                      size="sm"
                      className="h-8 w-8"
                    />
                  </div>
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
                    <Select value={rerewriteModel} onValueChange={(value: 'claude' | 'gpt4' | 'perplexity' | 'deepseek') => setRerewriteModel(value)}>
                      <SelectTrigger id="rerewrite-model" className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="claude">Claude</SelectItem>
                        <SelectItem value="gpt4">GPT-4</SelectItem>
                        <SelectItem value="perplexity">Perplexity</SelectItem>
                        <SelectItem value="deepseek">DeepSeek</SelectItem>
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

          {/* Content Display - Toggle between Edit View and Math View */}
          <div className="flex-1 flex flex-col overflow-hidden border rounded-lg">
            <div className="p-2 bg-gray-50 border-b flex justify-between items-center">
              <span className="text-xs text-gray-600">
                {showMathView ? '📐 Math View - Beautiful notation' : '✏️ Edit View - Click to modify text directly'}
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant={!showMathView ? "default" : "outline"}
                  onClick={() => setShowMathView(false)}
                  className="text-xs h-6 px-2"
                >
                  Edit View
                </Button>
                <Button
                  size="sm"
                  variant={showMathView ? "default" : "outline"}
                  onClick={() => setShowMathView(true)}
                  className="text-xs h-6 px-2"
                >
                  Math View
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleTextSelection}
                  className="text-xs h-6 px-2"
                >
                  🎯 Select Text
                </Button>
              </div>
            </div>
            
            {showMathView ? (
              /* Math View - Editable Rendered Mathematical Notation with Graphs */
              <div className="flex-1 overflow-y-auto bg-white space-y-6">
                {/* Display generated graphs first if they exist */}
                {rewriteMetadata?.graphs && rewriteMetadata.graphs.length > 0 && (
                  <div className="space-y-6 p-4 border-b">
                    <div className="border-b border-gray-200 pb-2">
                      <h3 className="text-lg font-semibold text-gray-800">Generated Visualizations</h3>
                      <p className="text-sm text-gray-600">Charts and graphs to support the assignment content</p>
                    </div>
                    {rewriteMetadata.graphs.map((graph: any, index: number) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg border">
                        <div className="mb-3">
                          <h4 className="font-medium text-gray-800">
                            <MathJax>{graph.title || `Graph ${index + 1}`}</MathJax>
                          </h4>
                          {graph.description && (
                            <p className="text-sm text-gray-600 mt-1">{graph.description}</p>
                          )}
                        </div>
                        <div 
                          className="flex justify-center bg-white p-4 rounded border"
                          dangerouslySetInnerHTML={{ __html: graph.svg }}
                        />
                      </div>
                    ))}
                    <div className="border-b border-gray-200 pb-2">
                      <h3 className="text-lg font-semibold text-gray-800">Assignment Content</h3>
                    </div>
                  </div>
                )}
                <div 
                  className="w-full prose prose-sm max-w-none p-4"
                  contentEditable={true}
                  suppressContentEditableWarning={true}
                  onInput={(e) => {
                    // Extract plain text content from the contentEditable div
                    const element = e.target as HTMLElement;
                    const textContent = element.innerText || element.textContent || '';
                    setFinalRewrittenContent(textContent);
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
                    minHeight: '400px',
                    outline: 'none',
                    border: '1px solid #e5e7eb',
                    borderRadius: '4px',
                    backgroundColor: '#ffffff'
                  }}
                  dangerouslySetInnerHTML={{
                    __html: finalRewrittenContent
                      .replace(/\n/g, '<br>')
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  }}
                  ref={(el) => {
                    if (el && window.renderMathInElement) {
                      // Clear any existing rendered math first
                      const mathElements = el.querySelectorAll('.katex');
                      mathElements.forEach(elem => elem.remove());
                      
                      // Render new math
                      window.renderMathInElement(el, {
                        delimiters: [
                          {left: '$$', right: '$$', display: true},
                          {left: '\\[', right: '\\]', display: true},
                          {left: '\\(', right: '\\)', display: false}
                        ],
                        throwOnError: false,
                        strict: false
                      });
                    }
                  }}
                />
              </div>
            ) : (
              /* Edit View - Editable Textarea */
              <textarea
                value={finalRewrittenContent}
                onChange={(e) => setFinalRewrittenContent(e.target.value)}
                className="flex-1 w-full resize-none border-none outline-none p-4"
                style={{ 
                  fontFamily: '"Times New Roman", serif',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  minHeight: '400px'
                }}
                placeholder="Processed content will appear here and can be edited directly..."
                spellCheck={false}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Live Progress Popup - Enhanced with Progress Bar */}
    <Dialog open={showLiveProgress} onOpenChange={(open) => {
      if (!open) {
        // Allow closing the dialog
        setShowLiveProgress(false);
        // If processing is still happening, also cancel it
        if (isProcessing) {
          setIsCancelled(true);
          setIsProcessing(false);
        }
      }
    }} modal={true}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-blue-600">Processing Multi-Chunk Document</DialogTitle>
          <DialogDescription className="text-lg">
            Real-time progress - Each chunk is rewritten with 15-second pauses to prevent rate limiting
          </DialogDescription>
        </DialogHeader>

        {/* Overall Progress Bar */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-lg font-semibold text-blue-800">
              Overall Progress: {liveProgressChunks.filter(c => c.completed).length} of {liveProgressChunks.length} chunks
            </span>
            <span className="text-xl font-bold text-blue-600">
              {liveProgressChunks.length > 0 ? Math.round((liveProgressChunks.filter(c => c.completed).length / liveProgressChunks.length) * 100) : 0}%
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-4 border border-blue-300">
            <div 
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-4 rounded-full transition-all duration-500 shadow-sm"
              style={{ 
                width: `${liveProgressChunks.length > 0 ? (liveProgressChunks.filter(c => c.completed).length / liveProgressChunks.length) * 100 : 0}%` 
              }}
            ></div>
          </div>
          <div className="text-sm text-blue-700 mt-2">
            {liveProgressChunks.filter(c => c.completed).length < liveProgressChunks.length 
              ? "Processing chunks with 15-second intervals to prevent API rate limits..." 
              : "All chunks completed successfully!"}
          </div>
        </div>
        
        {/* Individual Chunk Progress */}
        <div className="space-y-3 max-h-[50vh] overflow-y-auto">
          {liveProgressChunks.map((chunk, index) => (
            <div 
              key={index}
              className={`p-4 border-2 rounded-lg transition-all duration-300 ${
                chunk.completed 
                  ? 'bg-green-50 border-green-300 shadow-md' 
                  : index === liveProgressChunks.findIndex(c => !c.completed)
                    ? 'bg-blue-50 border-blue-300 shadow-lg ring-2 ring-blue-200'
                    : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {chunk.completed ? (
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  ) : index === liveProgressChunks.findIndex(c => !c.completed) ? (
                    <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-xs text-gray-600">{index + 1}</span>
                    </div>
                  )}
                  <h3 className="font-semibold text-lg">{chunk.title}</h3>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  chunk.completed 
                    ? 'bg-green-100 text-green-800' 
                    : index === liveProgressChunks.findIndex(c => !c.completed)
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-600'
                }`}>
                  {chunk.completed ? 'Completed' : index === liveProgressChunks.findIndex(c => !c.completed) ? 'Processing...' : 'Waiting'}
                </span>
              </div>
              
              {chunk.completed && chunk.content && (
                <div className="mt-3 p-4 bg-white rounded-lg border border-green-200 shadow-sm">
                  <div className="text-green-700 font-medium mb-2 flex items-center justify-between">
                    <span>Rewritten Content Preview:</span>
                    {chunk.content.length > 300 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setExpandedPreview(expandedPreview === chunk.id ? null : chunk.id)}
                        className="text-xs h-6 px-2"
                      >
                        {expandedPreview === chunk.id ? 'Show Less' : 'Show All'}
                      </Button>
                    )}
                  </div>
                  <div className="text-sm text-gray-700 leading-relaxed">
                    <MathJax hideUntilTypeset="first">
                      <div className="whitespace-pre-wrap">
                        {expandedPreview === chunk.id || chunk.content.length <= 300
                          ? chunk.content
                          : chunk.content.substring(0, 300) + '...'}
                      </div>
                    </MathJax>
                  </div>
                  <div className="mt-2 text-xs text-green-600">
                    Length: {chunk.content.length.toLocaleString()} characters
                  </div>
                </div>
              )}
              
              {!chunk.completed && index === liveProgressChunks.findIndex(c => !c.completed) && (
                <div className="mt-3 p-3 bg-blue-100 rounded-lg border border-blue-200">
                  <div className="text-blue-700 text-sm">
                    Currently processing this chunk with the selected AI model...
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Bottom Summary */}
        <div className="pt-4 mt-4 border-t-2 border-gray-200">
          <div className="flex justify-between items-center mb-3">
            <div className="text-lg font-semibold text-gray-800">
              Processing Summary: {liveProgressChunks.filter(c => c.completed).length} of {liveProgressChunks.length} chunks completed
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">
                {liveProgressChunks.filter(c => c.completed).length === liveProgressChunks.length 
                  ? "Ready to view results!" 
                  : `${liveProgressChunks.length - liveProgressChunks.filter(c => c.completed).length} remaining`}
              </div>
            </div>
          </div>
          
          {/* Completion Actions */}
          {liveProgressChunks.filter(c => c.completed).length === liveProgressChunks.length && liveProgressChunks.length > 0 && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg border-2 border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-lg font-semibold text-green-800">All chunks completed successfully!</span>
                </div>
                <Button 
                  onClick={() => setShowLiveProgress(false)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  Close Progress & View Results
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>

    {/* Text Selection Rewrite Dialog */}
    {showSelectionRewrite && (
      <Dialog open={showSelectionRewrite} onOpenChange={setShowSelectionRewrite}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rewrite Selected Text</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Selected Text:</Label>
              <div className="bg-gray-100 p-3 rounded text-sm max-h-32 overflow-y-auto mt-1">
                {selectedText}
              </div>
            </div>
            
            <div>
              <Label htmlFor="selection-instructions">Rewrite Instructions:</Label>
              <Textarea
                id="selection-instructions"
                placeholder="How should this text be rewritten? (e.g., 'Fix math notation', 'Make more formal', 'Simplify language')"
                value={selectionInstructions}
                onChange={(e) => setSelectionInstructions(e.target.value)}
                rows={3}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label>AI Model:</Label>
              <Select value={selectedModel} onValueChange={(value: 'claude' | 'gpt4' | 'perplexity' | 'deepseek') => setSelectedModel(value)}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deepseek">DeepSeek</SelectItem>
                  <SelectItem value="claude">Claude</SelectItem>
                  <SelectItem value="gpt4">GPT-4</SelectItem>
                  <SelectItem value="perplexity">Perplexity</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowSelectionRewrite(false);
                setSelectedText('');
                setSelectionInstructions('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={rewriteSelectedText}
              disabled={isProcessing || !selectionInstructions.trim()}
            >
              {isProcessing ? 'Rewriting...' : 'Rewrite Text'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )}
    </>
  );
}