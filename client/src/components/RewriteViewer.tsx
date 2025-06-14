import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { X, RefreshCw, Loader2, Download, Share2, Copy, Check, FileText } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import { MathJaxContext, MathJax } from 'better-react-mathjax';

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
  const { toast } = useToast();

  if (!result) return null;

  // Configure MathJax for proper mathematical notation
  const mathJaxConfig = {
    tex: {
      inlineMath: [['$', '$'], ['\\(', '\\)']],
      displayMath: [['$$', '$$'], ['\\[', '\\]']],
      processEscapes: true,
      processEnvironments: true,
      packages: ['base', 'ams', 'newcommand', 'mathtools'],
      macros: {
        "\\R": "\\mathbb{R}",
        "\\N": "\\mathbb{N}",
        "\\Z": "\\mathbb{Z}",
        "\\Q": "\\mathbb{Q}",
        "\\C": "\\mathbb{C}",
        "\\implies": "\\Rightarrow",
        "\\iff": "\\Leftrightarrow",
        "\\neg": "\\lnot",
        "\\vee": "\\lor",
        "\\wedge": "\\land"
      }
    },
    svg: {
      fontCache: 'global'
    },
    options: {
      skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre'],
      ignoreHtmlClass: 'tex2jax_ignore',
      processHtmlClass: 'tex2jax_process'
    }
  };

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

  const handlePrintToPdf = () => {
    if (!result) return;
    
    // Wait for MathJax to finish rendering, then print
    setTimeout(() => {
      const originalTitle = document.title;
      document.title = result.originalChunk.title;
      
      // Add print-specific styles that preserve math
      const printStyles = document.createElement('style');
      printStyles.innerHTML = `
        @media print {
          @page { 
            margin: 1in; 
            size: letter;
          }
          body * { visibility: hidden; }
          .print-content, .print-content * { visibility: visible; }
          .print-content { 
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            font-family: 'Times New Roman', serif;
            font-size: 12pt;
            line-height: 1.6;
            color: black !important;
            background: white !important;
          }
          .print-content h1 { 
            font-size: 20pt; 
            margin-bottom: 18pt; 
            page-break-after: avoid;
            border-bottom: 1pt solid black;
            padding-bottom: 6pt;
          }
          .print-content h2 { 
            font-size: 16pt; 
            margin-bottom: 14pt; 
            margin-top: 18pt;
            page-break-after: avoid;
          }
          .print-content h3 { 
            font-size: 14pt; 
            margin-bottom: 12pt; 
            margin-top: 14pt;
            page-break-after: avoid;
          }
          .print-content p { 
            margin-bottom: 12pt; 
            text-align: justify;
            orphans: 2;
            widows: 2;
          }
          .print-content ul, .print-content ol { 
            margin-bottom: 12pt; 
            page-break-inside: avoid;
          }
          .print-content li { margin-bottom: 6pt; }
          .print-content blockquote {
            margin: 12pt 0;
            padding-left: 12pt;
            border-left: 2pt solid #666;
            font-style: italic;
          }
          /* Math preservation */
          .print-content .MathJax { 
            font-size: inherit !important; 
            color: black !important;
          }
          .print-content .MathJax_Display { 
            margin: 12pt auto !important; 
            text-align: center !important;
          }
          .print-content .MathJax span { 
            color: black !important; 
          }
          /* Code blocks */
          .print-content code {
            font-family: 'Courier New', monospace;
            font-size: 10pt;
            background: #f5f5f5 !important;
            padding: 2pt;
            border: 1pt solid #ddd;
          }
          .print-content pre {
            background: #f5f5f5 !important;
            padding: 8pt;
            border: 1pt solid #ddd;
            font-size: 10pt;
            overflow: visible;
            white-space: pre-wrap;
          }
        }
      `;
      document.head.appendChild(printStyles);
      
      // Mark the content area for printing
      const contentDiv = document.querySelector('.max-w-4xl > div');
      if (contentDiv) {
        contentDiv.classList.add('print-content');
      }
      
      window.print();
      
      // Cleanup
      setTimeout(() => {
        document.title = originalTitle;
        document.head.removeChild(printStyles);
        if (contentDiv) {
          contentDiv.classList.remove('print-content');
        }
      }, 100);
    }, 1500); // Wait longer for MathJax rendering
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white">
      {/* Minimal Header */}
      <div className="flex items-center justify-between p-3 border-b bg-white shadow-sm">
        <div className="flex items-center gap-3">
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-gray-800">
            {result.originalChunk.title}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleCopy}>
            {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
          <Button size="sm" variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={handlePrintToPdf}>
            <FileText className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* FULL-SCREEN DOCUMENT DISPLAY */}
      <div className="h-[calc(100vh-60px)] bg-white">
        <div className="max-w-4xl mx-auto h-full p-8 overflow-auto">
          {/* Large, Professional Document Display */}
          <div className="bg-white">
            <MathJaxContext config={mathJaxConfig}>
              <MathJax>
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  components={{
                    h1: ({children}) => (
                      <h1 className="text-5xl font-bold mb-8 text-gray-900 border-b-2 border-gray-200 pb-4">
                        {children}
                      </h1>
                    ),
                    h2: ({children}) => (
                      <h2 className="text-4xl font-bold mb-6 text-gray-800 mt-12">
                        {children}
                      </h2>
                    ),
                    h3: ({children}) => (
                      <h3 className="text-3xl font-bold mb-4 text-gray-700 mt-8">
                        {children}
                      </h3>
                    ),
                    h4: ({children}) => (
                      <h4 className="text-2xl font-semibold mb-3 text-gray-700 mt-6">
                        {children}
                      </h4>
                    ),
                    p: ({children}) => (
                      <p className="text-xl leading-relaxed mb-6 text-gray-800 font-light">
                        {children}
                      </p>
                    ),
                    ul: ({children}) => (
                      <ul className="text-xl mb-6 ml-8 list-disc space-y-2">
                        {children}
                      </ul>
                    ),
                    ol: ({children}) => (
                      <ol className="text-xl mb-6 ml-8 list-decimal space-y-2">
                        {children}
                      </ol>
                    ),
                    li: ({children}) => (
                      <li className="text-gray-800 leading-relaxed">
                        {children}
                      </li>
                    ),
                    blockquote: ({children}) => (
                      <blockquote className="border-l-4 border-blue-500 pl-6 my-8 italic text-xl text-gray-700 bg-blue-50 py-6 rounded-r-lg">
                        {children}
                      </blockquote>
                    ),
                    code: ({children, className}) => {
                      if (className?.includes('language-')) {
                        return (
                          <code className="block bg-gray-100 p-6 rounded-lg text-lg font-mono leading-relaxed overflow-x-auto">
                            {children}
                          </code>
                        );
                      }
                      return (
                        <code className="bg-gray-100 px-2 py-1 rounded font-mono text-lg">
                          {children}
                        </code>
                      );
                    },
                    pre: ({children}) => (
                      <pre className="bg-gray-100 p-6 rounded-lg overflow-x-auto mb-6">
                        {children}
                      </pre>
                    )
                  }}
                >
                  {result.rewrittenContent}
                </ReactMarkdown>
              </MathJax>
            </MathJaxContext>
          </div>
        </div>

        {/* Floating Controls */}
        <div className="fixed bottom-6 right-6 bg-white shadow-lg rounded-lg border p-4 max-w-sm">
          <h4 className="font-semibold mb-3 text-gray-800">Refine This Content</h4>
          <div className="space-y-3">
            <Textarea
              placeholder="Enter refinement instructions..."
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              rows={3}
              className="text-sm"
            />
            <div className="flex gap-2">
              <select 
                className="flex-1 border rounded px-2 py-1 text-sm"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
              >
                <option value="claude">Claude</option>
                <option value="gpt4">GPT-4</option>
              </select>
              <Button 
                onClick={rewriteTheRewrite}
                disabled={isRewriting || !customInstructions.trim()}
                size="sm"
              >
                {isRewriting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}