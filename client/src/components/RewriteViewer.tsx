import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { X, RefreshCw, Loader2, Download, Share2, Copy, Check } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { MathJaxContext, MathJax } from 'better-react-mathjax';
import 'katex/dist/katex.min.css';

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

  // Configure MathJax for proper rendering
  const mathJaxConfig = {
    tex: {
      inlineMath: [['$', '$'], ['\\(', '\\)']],
      displayMath: [['$$', '$$'], ['\\[', '\\]']],
      processEscapes: true,
      processEnvironments: true
    },
    options: {
      skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-hidden">
      {/* Header Bar */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center gap-4">
          <Button size="sm" variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-1" />
            Close
          </Button>
          <h1 className="text-xl font-bold text-gray-800">
            {result.originalChunk.title} - Professional Rewrite
          </h1>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
          <Button size="sm" variant="outline" onClick={handleCopy}>
            {isCopied ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Content - Full Screen */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Rewritten Content - Takes Most Space */}
        <div className="flex-1 flex flex-col bg-white">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-bold text-green-700 mb-2">
              Professional Rewrite
            </h2>
            <p className="text-gray-600">Enhanced content with proper formatting and mathematical notation</p>
          </div>
          <div className="flex-1 overflow-auto p-6">
            <div className="prose prose-lg max-w-none">
              <MathJaxContext config={mathJaxConfig}>
                <MathJax>
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                      // Enhanced rendering for better formatting
                      h1: ({children}) => <h1 className="text-3xl font-bold mb-6 text-gray-900">{children}</h1>,
                      h2: ({children}) => <h2 className="text-2xl font-bold mb-4 text-gray-800">{children}</h2>,
                      h3: ({children}) => <h3 className="text-xl font-bold mb-3 text-gray-700">{children}</h3>,
                      p: ({children}) => <p className="mb-4 text-gray-800 leading-relaxed">{children}</p>,
                      ul: ({children}) => <ul className="mb-4 ml-6 list-disc">{children}</ul>,
                      ol: ({children}) => <ol className="mb-4 ml-6 list-decimal">{children}</ol>,
                      li: ({children}) => <li className="mb-2 text-gray-800">{children}</li>,
                      blockquote: ({children}) => <blockquote className="border-l-4 border-blue-500 pl-4 my-4 italic text-gray-700">{children}</blockquote>,
                      code: ({children, className}) => {
                        if (className?.includes('language-')) {
                          return <code className="block bg-gray-100 p-4 rounded text-sm font-mono">{children}</code>;
                        }
                        return <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">{children}</code>;
                      }
                    }}
                  >
                    {result.rewrittenContent}
                  </ReactMarkdown>
                </MathJax>
              </MathJaxContext>
            </div>
          </div>
        </div>

        {/* Side Panel - Original Content & Controls */}
        <div className="w-96 bg-gray-50 border-l flex flex-col">
          {/* Original Content */}
          <div className="border-b p-4">
            <h3 className="font-semibold text-gray-700 mb-3">
              Original ({result.originalChunk.wordCount} words)
            </h3>
            <div className="text-sm text-gray-600 bg-white p-3 rounded border max-h-40 overflow-auto">
              {result.originalChunk.content}
            </div>
          </div>

          {/* Explanation */}
          {result.explanation && (
            <div className="border-b p-4">
              <h3 className="font-semibold text-blue-700 mb-3">Explanation</h3>
              <div className="text-sm text-blue-800 bg-blue-50 p-3 rounded">
                {result.explanation}
              </div>
            </div>
          )}

          {/* Rewrite Controls */}
          <div className="flex-1 p-4">
            <h3 className="font-semibold text-gray-800 mb-3">
              Refine This Rewrite
            </h3>
            <div className="space-y-4">
              <Textarea
                placeholder="Provide specific instructions for refinement..."
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                rows={4}
                className="text-sm"
              />
              <div className="flex items-center justify-between">
                <select 
                  className="border rounded px-3 py-2 text-sm"
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                >
                  <option value="claude">Claude (Recommended)</option>
                  <option value="gpt4">GPT-4</option>
                </select>
                <Button 
                  onClick={rewriteTheRewrite}
                  disabled={isRewriting || !customInstructions.trim()}
                  size="sm"
                >
                  {isRewriting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Refining...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refine
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}