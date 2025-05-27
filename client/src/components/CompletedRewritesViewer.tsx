import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Mail, Eye, FileText, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MathJax } from 'better-react-mathjax';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface CompletedRewrite {
  id: string;
  title: string;
  content: string;
  originalLength: number;
  rewrittenLength: number;
  model: string;
  instructions: string;
  createdAt: Date;
  chunksProcessed: number;
}

interface CompletedRewritesViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CompletedRewritesViewer({ isOpen, onClose }: CompletedRewritesViewerProps) {
  const [rewrites, setRewrites] = useState<CompletedRewrite[]>([]);
  const [selectedRewrite, setSelectedRewrite] = useState<CompletedRewrite | null>(null);
  const [emailAddress, setEmailAddress] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const { toast } = useToast();

  // Load completed rewrites from local storage or API
  useEffect(() => {
    if (isOpen) {
      loadCompletedRewrites();
    }
  }, [isOpen]);

  const loadCompletedRewrites = async () => {
    try {
      // Try to load from Documents API (saved rewrites)
      const response = await fetch('/api/documents');
      if (response.ok) {
        const documents = await response.json();
        const rewriteDocs = documents
          .filter((doc: any) => doc.type === 'rewrite' || doc.title.includes('(Rewritten)'))
          .map((doc: any) => ({
            id: doc.id,
            title: doc.title,
            content: doc.content,
            originalLength: doc.metadata?.originalLength || 0,
            rewrittenLength: doc.content.length,
            model: doc.metadata?.model || 'unknown',
            instructions: doc.metadata?.instructions || 'No instructions provided',
            createdAt: new Date(doc.createdAt || Date.now()),
            chunksProcessed: doc.metadata?.chunksProcessed || 1
          }));
        setRewrites(rewriteDocs);
      }

      // Also check localStorage for any cached rewrites
      const cachedRewrites = localStorage.getItem('completedRewrites');
      if (cachedRewrites) {
        const parsed = JSON.parse(cachedRewrites);
        // Merge with API results, avoiding duplicates
        const existingIds = new Set(rewrites.map(r => r.id));
        const newRewrites = parsed.filter((r: CompletedRewrite) => !existingIds.has(r.id));
        setRewrites(prev => [...prev, ...newRewrites]);
      }
    } catch (error) {
      console.error('Failed to load completed rewrites:', error);
      toast({
        title: "Failed to load rewrites",
        description: "Could not load your completed rewrites.",
        variant: "destructive"
      });
    }
  };

  const downloadRewrite = async (rewrite: CompletedRewrite, format: 'pdf' | 'docx') => {
    try {
      const response = await fetch('/api/download-rewrite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: rewrite.content,
          format: format,
          title: rewrite.title
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
      a.download = `${rewrite.title}.${format}`;
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

  const shareViaEmail = async (rewrite: CompletedRewrite) => {
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
          content: rewrite.content,
          recipientEmail: emailAddress,
          subject: `Rewritten Document: ${rewrite.title}`
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Completed Rewrites</DialogTitle>
          <DialogDescription>
            View, download, and share your completed document rewrites
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {rewrites.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No completed rewrites yet</h3>
                <p className="text-gray-500">Your completed document rewrites will appear here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {rewrites.map((rewrite) => (
                <Card key={rewrite.id} className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{rewrite.title}</CardTitle>
                        <CardDescription className="flex items-center space-x-4 mt-1">
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {rewrite.createdAt.toLocaleDateString()}
                          </span>
                          <Badge variant="secondary">{rewrite.model}</Badge>
                          <Badge variant="outline">{rewrite.chunksProcessed} chunks</Badge>
                        </CardDescription>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRewrite(rewrite);
                            setIsPreviewOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Preview
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-sm text-gray-600">
                        <strong>Instructions:</strong> {rewrite.instructions}
                      </div>
                      <div className="text-sm text-gray-500">
                        Length: {rewrite.originalLength.toLocaleString()} → {rewrite.rewrittenLength.toLocaleString()} characters
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          onClick={() => downloadRewrite(rewrite, 'pdf')}
                          className="flex items-center space-x-1"
                        >
                          <Download className="w-4 h-4" />
                          <span>PDF</span>
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadRewrite(rewrite, 'docx')}
                          className="flex items-center space-x-1"
                        >
                          <Download className="w-4 h-4" />
                          <span>Word</span>
                        </Button>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="flex items-center space-x-1">
                              <Mail className="w-4 h-4" />
                              <span>Email</span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Share via Email</DialogTitle>
                              <DialogDescription>
                                Send "{rewrite.title}" to an email address
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <Input
                                placeholder="Enter email address..."
                                value={emailAddress}
                                onChange={(e) => setEmailAddress(e.target.value)}
                              />
                              <Button 
                                onClick={() => shareViaEmail(rewrite)}
                                disabled={!emailAddress}
                                className="w-full"
                              >
                                Send Email
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Preview Dialog */}
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedRewrite?.title}</DialogTitle>
              <DialogDescription>
                Rewritten with {selectedRewrite?.model} • {selectedRewrite?.chunksProcessed} chunks processed
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[60vh]">
              <div className="p-4">
                {selectedRewrite && formatContent(selectedRewrite.content)}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}