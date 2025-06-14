import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Cloud, FileText, Download, ExternalLink } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface GoogleDriveIntegrationProps {
  content: string;
  defaultFilename?: string;
  format?: 'pdf' | 'txt' | 'doc';
  onSuccess?: (driveLink: string) => void;
}

export function GoogleDriveIntegration({ 
  content, 
  defaultFilename = 'document', 
  format = 'pdf',
  onSuccess 
}: GoogleDriveIntegrationProps) {
  const [filename, setFilename] = useState(defaultFilename);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [driveLink, setDriveLink] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const handleAuthorize = async () => {
    try {
      setIsAuthorizing(true);
      
      const response = await fetch('/api/google-drive/auth-url');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get authorization URL');
      }
      
      // Open authorization window
      const authWindow = window.open(
        data.authUrl,
        'google-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );
      
      // Check if window was closed (indicating successful auth)
      const checkClosed = setInterval(() => {
        if (authWindow?.closed) {
          clearInterval(checkClosed);
          setIsAuthorized(true);
          setIsAuthorizing(false);
          toast({
            title: "Authorization successful",
            description: "You can now save documents to Google Drive"
          });
        }
      }, 1000);
      
    } catch (error) {
      console.error('Authorization error:', error);
      setIsAuthorizing(false);
      toast({
        title: "Authorization failed",
        description: error instanceof Error ? error.message : "Failed to authorize Google Drive access",
        variant: "destructive"
      });
    }
  };

  const handleSave = async () => {
    if (!content.trim()) {
      toast({
        title: "No content to save",
        description: "Please provide content to save to Google Drive",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSaving(true);
      
      const endpoint = format === 'pdf' ? '/api/google-drive/save-pdf' : '/api/google-drive/save-document';
      const payload = format === 'pdf' 
        ? { content, filename }
        : { content, filename, format };
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setDriveLink(data.driveLink);
        toast({
          title: "Document saved successfully",
          description: `${format.toUpperCase()} with mathematical notation saved to Google Drive`
        });
        
        onSuccess?.(data.driveLink);
      } else {
        throw new Error(data.error || 'Failed to save document');
      }
      
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Failed to save document to Google Drive",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDirectDownload = async () => {
    try {
      setIsDownloading(true);
      
      const response = await fetch('/api/export/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          filename
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${filename}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "PDF downloaded successfully",
        description: "Document with mathematical notation saved to your device"
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

  const formatDescription = {
    pdf: "Save as PDF with perfect mathematical notation rendering (∀∃∧∨→↔≤≥≠∈⊂∪∩)",
    txt: "Save as plain text with Unicode mathematical symbols",
    doc: "Save as Google Document with mathematical notation"
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Cloud className="h-4 w-4" />
          Save to Google Drive
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            Google Drive Integration
          </DialogTitle>
          <DialogDescription>
            {formatDescription[format]}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {!isAuthorized ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Authorization Required</CardTitle>
                <CardDescription>
                  Connect to Google Drive to save documents with mathematical notation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleAuthorize}
                  disabled={isAuthorizing}
                  className="w-full gap-2"
                >
                  {isAuthorizing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Authorizing...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4" />
                      Authorize Google Drive Access
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="filename">Filename</Label>
                <Input
                  id="filename"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  placeholder={`Enter filename for ${format.toUpperCase()}`}
                />
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                <span>Format: {format.toUpperCase()}</span>
                <span>•</span>
                <span>Mathematical notation: ∀∃∧∨→↔≤≥≠∈⊂∪∩</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={handleDirectDownload}
                  disabled={isDownloading || !filename.trim()}
                  variant="outline"
                  className="gap-2"
                >
                  {isDownloading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      Downloading...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Download PDF
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={handleSave}
                  disabled={isSaving || !filename.trim()}
                  className="gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Cloud className="h-4 w-4" />
                      Save to Drive
                    </>
                  )}
                </Button>
              </div>
              
              {driveLink && (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-green-700">
                        <Cloud className="h-4 w-4" />
                        <span>Saved successfully!</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(driveLink, '_blank')}
                        className="gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Open
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}