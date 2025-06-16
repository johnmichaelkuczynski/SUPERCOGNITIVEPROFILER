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
  const [selectedModel, setSelectedModel] = useState<'claude' | 'gpt4' | 'perplexity' | 'deepseek'>('claude');
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
  const [liveProgressChunks, setLiveProgressChunks] = useState<Array<{title: string, content: string, completed: boolean}>>([]);
  
  // Re-rewrite state
  const [isRerewriting, setIsRerewriting] = useState(false);
  const [showRerewriteForm, setShowRerewriteForm] = useState(false);
  const [rerewriteInstructions, setRerewriteInstructions] = useState('');
  const [rerewriteModel, setRerewriteModel] = useState<'claude' | 'gpt4' | 'perplexity' | 'deepseek'>('claude');
  const [rewriteChunks, setRewriteChunks] = useState<Array<{id: string, content: string, selected: boolean}>>([]);
  
  const { toast } = useToast();

  // Clean content for auxiliary chat - remove markdown and fix math notation
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
      // Fix mathematical notation - convert common LaTeX to readable format
      .replace(/\\forall\s+/g, '∀')
      .replace(/\\exists\s+/g, '∃')
      .replace(/\\in\s+/g, '∈')
      .replace(/\\notin\s+/g, '∉')
      .replace(/\\subset\s+/g, '⊂')
      .replace(/\\subseteq\s+/g, '⊆')
      .replace(/\\supset\s+/g, '⊃')
      .replace(/\\supseteq\s+/g, '⊇')
      .replace(/\\cup\s+/g, '∪')
      .replace(/\\cap\s+/g, '∩')
      .replace(/\\emptyset/g, '∅')
      .replace(/\\infty/g, '∞')
      .replace(/\\leq\s+/g, '≤')
      .replace(/\\geq\s+/g, '≥')
      .replace(/\\neq\s+/g, '≠')
      .replace(/\\approx\s+/g, '≈')
      .replace(/\\equiv\s+/g, '≡')
      .replace(/\\Rightarrow\s+/g, '⇒')
      .replace(/\\Leftarrow\s+/g, '⇐')
      .replace(/\\Leftrightarrow\s+/g, '⇔')
      .replace(/\\rightarrow\s+/g, '→')
      .replace(/\\leftarrow\s+/g, '←')
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
      
      setProgress(75);

      // AUTO-APPLY TEXT TO MATH: Automatically run homework results through math formatting
      let finalContent = result.response;
      try {
        const mathResponse = await fetch('/api/text-to-math', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: finalContent,
            instructions: 'Convert all mathematical markup and notation to perfect LaTeX format for proper rendering.',
            model: selectedModel
          }),
        });

        if (mathResponse.ok) {
          const mathResult = await mathResponse.json();
          finalContent = mathResult.mathContent;
          console.log('[auto-math] Homework result automatically formatted for math');
        }
      } catch (error) {
        console.warn('[auto-math] Failed to format homework result for math:', error);
        // Continue with original content if math formatting fails
      }

      setProgress(100);

      // Prepare metadata
      const metadata = {
        originalLength: originalText.length,
        rewrittenLength: finalContent.length,
        mode: 'homework',
        model: selectedModel,
        instructions: instructions,
        includedChatContext: includeChatContext,
        mathFormatted: true
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

          // AUTO-APPLY TEXT TO MATH: For rewrite mode, automatically run through math formatting
          if (processingMode === 'rewrite') {
            try {
              const mathResponse = await fetch('/api/text-to-math', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  content: content,
                  instructions: 'Convert all mathematical markup and notation to perfect LaTeX format for proper rendering.',
                  model: selectedModel,
                  chunkIndex: i,
                  totalChunks: selectedChunks.length
                }),
              });

              if (mathResponse.ok) {
                const mathResult = await mathResponse.json();
                content = mathResult.mathContent; // Use the math-formatted version
                console.log(`[auto-math] Chunk ${i + 1} automatically formatted for math`);
              }
            } catch (error) {
              console.warn(`[auto-math] Failed to format chunk ${i + 1} for math:`, error);
              // Continue with original content if math formatting fails
            }
          }

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

    // Create proper PDF with MathJax
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      toast({
        title: "Pop-up blocked",
        description: "Please allow pop-ups and try again.",
        variant: "destructive"
      });
      return;
    }

    // Clean content but preserve LaTeX math
    let cleanContent = rewrittenText
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^$*]*)\*/g, '<em>$1</em>')
      .replace(/\(\*([^)]*)\*\)/g, '($1)')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Rewritten Chunks</title>
          <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
          <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
          <script>
            window.MathJax = {
              tex: {
                inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
                displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
                processEscapes: true,
                processEnvironments: true
              },
              options: {
                skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre']
              },
              startup: {
                ready: () => {
                  MathJax.startup.defaultReady();
                  setTimeout(() => {
                    document.getElementById('loading').style.display = 'none';
                    document.getElementById('content').style.display = 'block';
                  }, 1000);
                }
              }
            };
          </script>
          <style>
            body { 
              font-family: 'Times New Roman', serif; 
              line-height: 1.6; 
              max-width: 8.5in; 
              margin: 0 auto; 
              padding: 1in;
              color: black;
              background: white;
            }
            h1, h2, h3 { margin-top: 24px; margin-bottom: 12px; }
            p { margin-bottom: 12px; }
            .MathJax { font-size: 1em !important; }
            #loading { text-align: center; padding: 50px; }
            #content { display: none; }
            .controls { text-align: center; margin: 20px 0; }
            .controls button { 
              margin: 0 10px; padding: 10px 20px; 
              background: #007bff; color: white; 
              border: none; border-radius: 4px; cursor: pointer; 
            }
            .controls button:hover { background: #0056b3; }
            .controls .close { background: #6c757d; }
            .controls .close:hover { background: #545b62; }
            @media print {
              .controls { display: none; }
              body { margin: 0.5in; }
            }
          </style>
        </head>
        <body>
          <div id="loading">Loading math notation...</div>
          <div id="content">
            <div class="controls">
              <button onclick="window.print()">📄 Save as PDF</button>
              <button class="close" onclick="window.close()">Close</button>
            </div>
            <div id="text-content"><p>${cleanContent}</p></div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    toast({
      title: "PDF window opened!",
      description: "Math notation will render in a moment, then click 'Save as PDF'",
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
            onClick={nukeEverything} 
            variant="destructive"
            className="flex items-center space-x-2 bg-red-600 hover:bg-red-700"
          >
            <Bomb className="w-4 h-4" />
            <span>🧨 NUKE</span>
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
      <DialogContent className="max-w-6xl overflow-hidden h-[95vh] flex flex-col">
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
              onClick={async () => {
                try {
                  // Create structured data for the print endpoint
                  const response = await fetch('/api/print-pdf', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      results: [{ 
                        rewrittenContent: finalRewrittenContent,
                        originalChunk: { title: 'Document Content' }
                      }],
                      documentName: 'Rewritten Document'
                    }),
                  });

                  if (response.ok) {
                    const htmlContent = await response.text();
                    
                    // Open formatted document in print window
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {
                      printWindow.document.write(htmlContent);
                      printWindow.document.close();
                      
                      // Automatically trigger print dialog after MathJax loads
                      printWindow.onload = () => {
                        setTimeout(() => {
                          printWindow.print(); // This opens the print dialog with "Save as PDF" option
                        }, 1500); // Give MathJax time to render
                      };
                      
                      toast({
                        title: "Print dialog opening",
                        description: "Choose 'Save as PDF' from the print dialog for perfect math",
                      });
                    } else {
                      throw new Error('Please allow popups to print');
                    }
                  } else {
                    throw new Error('Failed to prepare print document');
                  }
                } catch (error) {
                  console.error('Print error:', error);
                  toast({
                    title: "Print failed",
                    description: "Please allow popups and try again",
                    variant: "destructive"
                  });
                }
              }}
              className="flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Print as PDF</span>
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

          {/* Content Display - Fully Editable Textarea */}
          <div className="flex-1 flex flex-col overflow-hidden border rounded-lg">
            <div className="p-2 bg-gray-50 border-b text-xs text-gray-600">
              ✏️ Content is editable - click to modify text directly
            </div>
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
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Live Progress Popup */}
    <Dialog open={showLiveProgress} onOpenChange={setShowLiveProgress}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>🔄 Rewriting in Progress</DialogTitle>
          <DialogDescription>
            Watch each chunk being processed in real-time - you're not being strung along!
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {liveProgressChunks.map((chunk, index) => (
            <div 
              key={index}
              className={`p-4 border rounded-lg transition-all ${
                chunk.completed ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center space-x-2 mb-2">
                {chunk.completed ? (
                  <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                )}
                <h3 className="font-medium">{chunk.title}</h3>
                <span className="text-sm text-gray-500">
                  {chunk.completed ? '✓ Complete' : '⏳ Processing...'}
                </span>
              </div>
              
              {chunk.completed && chunk.content && (
                <div className="mt-2 p-3 bg-white rounded border text-sm">
                  <div className="text-gray-600 mb-1">Content preview:</div>
                  <div className="line-clamp-3">
                    {chunk.content.substring(0, 200)}
                    {chunk.content.length > 200 && '...'}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-600">
            {liveProgressChunks.filter(c => c.completed).length} of {liveProgressChunks.length} chunks completed
          </div>
          <div className="w-32 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${liveProgressChunks.length > 0 ? (liveProgressChunks.filter(c => c.completed).length / liveProgressChunks.length) * 100 : 0}%` 
              }}
            ></div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}