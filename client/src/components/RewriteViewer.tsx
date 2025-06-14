import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, RefreshCw, Loader2, Download, Share2, Copy, Check, FileText } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import MathRenderer from './MathRenderer';
import { GoogleDriveIntegration } from './GoogleDriveIntegration';

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
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  if (!result) return null;

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
        const data = await response.json();
        const updatedResult = {
          ...result,
          rewrittenContent: data.rewrittenContent
        };
        onUpdate(updatedResult);
        
        toast({
          title: "Rewrite Complete",
          description: "Content has been successfully rewritten"
        });
        setCustomInstructions('');
      } else {
        throw new Error('Failed to rewrite');
      }
    } catch (error) {
      toast({
        title: "Rewrite Failed",
        description: "Failed to rewrite content. Please try again.",
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
      setTimeout(() => setIsCopied(false), 2000);
      toast({
        title: "Copied to Clipboard",
        description: "Content copied successfully"
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy content",
        variant: "destructive"
      });
    }
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      
      const response = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: result.rewrittenContent,
          filename: result.originalChunk.title.replace(/[^a-zA-Z0-9]/g, '_') + '_rewritten'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${result.originalChunk.title.replace(/[^a-zA-Z0-9]/g, '_')}_rewritten.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "PDF downloaded successfully",
        description: "Rewritten content with mathematical notation saved"
      });

    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "Failed to download PDF",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrintToPdf = () => {
    if (!result) return;
    
    setTimeout(() => {
      const originalTitle = document.title;
      document.title = result.originalChunk.title;
      
      const printStyles = document.createElement('style');
      printStyles.textContent = `
        @media print {
          * { -webkit-print-color-adjust: exact; color-adjust: exact; }
          body { margin: 0; padding: 20px; font-family: 'Times New Roman', serif; }
          .print-content { font-size: 12pt; line-height: 1.6; }
          .print-content h1 { font-size: 18pt; margin-bottom: 16pt; }
          .print-content h2 { font-size: 16pt; margin-bottom: 12pt; }
          .print-content h3 { font-size: 14pt; margin-bottom: 10pt; }
          .print-content p { margin-bottom: 12pt; text-align: justify; }
          .math-display { font-size: inherit !important; color: black !important; }
          .math-inline { color: black !important; }
        }
      `;
      document.head.appendChild(printStyles);
      
      const contentDiv = document.querySelector('.max-w-4xl > div');
      if (contentDiv) {
        contentDiv.classList.add('print-content');
      }
      
      window.print();
      
      setTimeout(() => {
        document.title = originalTitle;
        document.head.removeChild(printStyles);
        if (contentDiv) {
          contentDiv.classList.remove('print-content');
        }
      }, 100);
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-white">
      {/* Header */}
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
          <GoogleDriveIntegration 
            content={result.rewrittenContent}
            defaultFilename={`rewrite-${result.originalChunk.title.toLowerCase().replace(/\s+/g, '-')}`}
            format="pdf"
            onSuccess={(driveLink) => {
              toast({
                title: "Backup successful",
                description: "Document with mathematical notation saved to Google Drive"
              });
            }}
          />
        </div>
      </div>

      {/* Full-Screen Document Display */}
      <div className="h-[calc(100vh-60px)] bg-white">
        <div className="max-w-4xl mx-auto h-full p-8 overflow-auto">
          <div className="bg-white">
            <MathRenderer 
              content={result.rewrittenContent}
              className="prose prose-xl max-w-none leading-relaxed text-gray-800"
            />
          </div>
        </div>

        {/* Floating Controls */}
        <div className="fixed bottom-6 right-6 bg-white shadow-lg rounded-lg border p-4 max-w-sm">
          <h4 className="font-semibold mb-3 text-gray-800">Refine This Content</h4>
          <div className="space-y-3">
            <Textarea
              placeholder="Provide specific instructions for how you want to rewrite this content..."
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              className="min-h-[100px] text-sm"
            />
            <div className="flex gap-2">
              <select 
                value={selectedModel} 
                onChange={(e) => setSelectedModel(e.target.value)}
                className="flex-1 px-2 py-1 text-sm border rounded"
              >
                <option value="claude">Claude</option>
                <option value="gpt4">GPT-4</option>
                <option value="perplexity">Perplexity</option>
              </select>
              <Button 
                size="sm" 
                onClick={rewriteTheRewrite}
                disabled={isRewriting || !customInstructions.trim()}
                className="flex-shrink-0"
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