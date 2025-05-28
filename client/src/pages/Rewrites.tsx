import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Mail, Eye, FileText, Calendar, RefreshCw } from 'lucide-react';
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

export default function Rewrites() {
  const [rewrites, setRewrites] = useState<CompletedRewrite[]>([]);
  const [selectedRewrite, setSelectedRewrite] = useState<CompletedRewrite | null>(null);
  const [emailAddress, setEmailAddress] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadRewrites();
  }, []);

  const loadRewrites = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/documents');
      if (response.ok) {
        const documents = await response.json();
        console.log('All documents from API:', documents);
        
        const rewriteDocs = documents
          .filter((doc: any) => {
            const isRewrite = doc.type === 'rewrite' || 
                             doc.title.includes('(Rewritten)') || 
                             doc.title.includes('Rewritten:') ||
                             doc.metadata?.isRewrite === true;
            // Only show rewrites that actually have content
            const hasContent = doc.content && doc.content.trim().length > 0;
            return isRewrite && hasContent;
          })
          .map((doc: any) => {
            const metadata = typeof doc.metadata === 'string' ? JSON.parse(doc.metadata) : doc.metadata || {};
            return {
              id: doc.id,
              title: doc.title,
              content: doc.content,
              originalLength: metadata.originalLength || doc.content.length,
              rewrittenLength: doc.content.length,
              model: metadata.model || 'claude',
              instructions: metadata.instructions || metadata.rewriteInstructions || 'Default rewrite instructions',
              createdAt: new Date(doc.createdAt || doc.updatedAt || doc.date || Date.now()),
              chunksProcessed: metadata.chunksProcessed || metadata.totalChunks || 1
            };
          });
        
        console.log('Filtered rewrite documents:', rewriteDocs);
        setRewrites(rewriteDocs);
      }
    } catch (error) {
      console.error('Failed to load rewrites:', error);
      toast({
        title: "Failed to load rewrites",
        description: "Could not load your completed rewrites.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
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
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Rewrites</h1>
          <p className="text-gray-600 mt-2">All your completed document rewrites in one place</p>
        </div>
        <Button onClick={loadRewrites} disabled={isLoading} variant="outline">
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 mx-auto animate-spin text-gray-400 mb-4" />
            <p className="text-gray-500">Loading your rewrites...</p>
          </div>
        ) : rewrites.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No rewrites yet</h3>
              <p className="text-gray-500 mb-4">Your completed document rewrites will appear here</p>
              <Button onClick={() => window.location.href = '/'} variant="outline">
                Start Your First Rewrite
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {rewrites.map((rewrite) => (
              <Card key={rewrite.id} className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{rewrite.title}</CardTitle>
                      <CardDescription className="flex flex-wrap items-center gap-4">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {rewrite.createdAt.toLocaleDateString()}
                        </span>
                        <Badge variant="secondary">{rewrite.model}</Badge>
                        <Badge variant="outline">{rewrite.chunksProcessed} chunks</Badge>
                        <span className="text-sm text-gray-500">
                          {rewrite.rewrittenLength.toLocaleString()} characters
                        </span>
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
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-1">Rewrite Instructions:</p>
                      <p className="text-sm text-gray-600">{rewrite.instructions}</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-3">
                      <Button
                        size="sm"
                        onClick={() => downloadRewrite(rewrite, 'pdf')}
                        className="flex items-center space-x-1"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download PDF</span>
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadRewrite(rewrite, 'docx')}
                        className="flex items-center space-x-1"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Word</span>
                      </Button>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="flex items-center space-x-1">
                            <Mail className="w-4 h-4" />
                            <span>Share via Email</span>
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
    </div>
  );
}