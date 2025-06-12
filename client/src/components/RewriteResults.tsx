import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { X, Download, Mail, ArrowLeft, RefreshCw, Plus, Share } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface RewriteResultsProps {
  isOpen: boolean;
  onClose: () => void;
  originalText: string;
  rewrittenText: string;
  mode: 'rewrite' | 'homework';
  model: string;
  chunksProcessed: number;
  onRewriteAgain: () => void;
  onAddToChat: () => void;
  onBackToChat: () => void;
}

export default function RewriteResults({
  isOpen,
  onClose,
  originalText,
  rewrittenText,
  mode,
  model,
  chunksProcessed,
  onRewriteAgain,
  onAddToChat,
  onBackToChat
}: RewriteResultsProps) {
  const [emailAddress, setEmailAddress] = useState('');
  const { toast } = useToast();

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: rewrittenText,
          format: 'pdf',
          title: `${mode === 'homework' ? 'Homework Solution' : 'Rewritten Content'}`
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${mode === 'homework' ? 'homework-solution' : 'rewritten-content'}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "PDF Downloaded",
          description: "Your content has been saved as PDF.",
        });
      }
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Could not generate PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDownloadWord = async () => {
    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: rewrittenText,
          format: 'docx',
          title: `${mode === 'homework' ? 'Homework Solution' : 'Rewritten Content'}`
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${mode === 'homework' ? 'homework-solution' : 'rewritten-content'}.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Word Document Downloaded",
          description: "Your content has been saved as Word document.",
        });
      }
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Could not generate Word document. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleShare = async () => {
    if (!emailAddress.trim()) {
      toast({
        title: "Email required",
        description: "Please enter an email address to share.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/share-rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: rewrittenText,
          recipientEmail: emailAddress,
          senderName: 'TextMind User',
          subject: `${mode === 'homework' ? 'Homework Solution' : 'Rewritten Content'} - Shared via TextMind`
        })
      });

      if (response.ok) {
        toast({
          title: "Content shared!",
          description: `Sent to ${emailAddress}`,
        });
        setEmailAddress('');
      } else {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      toast({
        title: "Share failed",
        description: "Could not send email. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              Rewrite Results - {mode === 'homework' ? 'Homework Solution' : 'Rewritten Content'}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Stats */}
          <div className="text-sm text-muted-foreground space-y-1">
            <div>Mode: {mode === 'homework' ? 'Complete Assignment' : 'Rewrite Existing Only'}</div>
            <div>Original: {originalText.length.toLocaleString()} characters | Final: {rewrittenText.length.toLocaleString()} characters</div>
            <div>Chunks rewritten: {chunksProcessed}</div>
            <div>Model: {model.toUpperCase()}</div>
          </div>
        </DialogHeader>

        {/* Action Buttons */}
        <div className="flex-shrink-0 flex items-center justify-between gap-2 py-4 border-t border-b">
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onRewriteAgain} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Rewrite the Rewrite
            </Button>
            <Button onClick={onAddToChat} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add to Chat
            </Button>
            <Button variant="outline" onClick={onBackToChat} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Chat
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleDownloadPDF} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Save as PDF
            </Button>
            <Button variant="outline" onClick={handleDownloadWord} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download Word
            </Button>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Enter email address"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                className="w-48"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleShare();
                  }
                }}
              />
              <Button onClick={handleShare} className="flex items-center gap-2">
                <Share className="h-4 w-4" />
                Share
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="prose dark:prose-invert prose-sm max-w-none p-4">
            <ReactMarkdown
              rehypePlugins={[rehypeKatex]}
              remarkPlugins={[remarkMath]}
            >
              {rewrittenText}
            </ReactMarkdown>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}