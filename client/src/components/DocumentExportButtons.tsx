import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { FileDown, Mail, FileText, FileJson, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface DocumentExportButtonsProps {
  content: string;
  filename?: string;
}

export default function DocumentExportButtons({ content, filename = 'document' }: DocumentExportButtonsProps) {
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'txt' | 'html' | 'docx' | 'pdf' | 'md' | 'json'>('txt');
  const [exportFilename, setExportFilename] = useState(filename);
  const [emailRecipient, setEmailRecipient] = useState('');
  const [emailSubject, setEmailSubject] = useState('Your AI-Generated Document');
  const [isLoading, setIsLoading] = useState(false);

  // Export document
  const handleExport = async () => {
    try {
      setIsLoading(true);
      
      // For large documents over 1000 words, use the enhanced export route
      if (content.length > 5000) {
        const response = await fetch('/api/document/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content,
            format: exportFormat,
            filename: exportFilename
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to export document');
        }
        
        // Get the blob and create download link
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = exportFilename.includes(`.${exportFormat}`) ? 
          exportFilename : `${exportFilename}.${exportFormat}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // Use simpler route for smaller documents
        const response = await fetch('/api/llm/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content,
            format: exportFormat,
            filename: exportFilename
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to download document');
        }
        
        // Get the blob and create download link
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = exportFilename.includes(`.${exportFormat}`) ? 
          exportFilename : `${exportFilename}.${exportFormat}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
      
      toast({
        title: "Document exported successfully",
        description: `Downloaded as ${exportFilename}.${exportFormat}`,
      });
      
      setIsExportDialogOpen(false);
    } catch (error) {
      console.error('Error exporting document:', error);
      toast({
        title: "Export failed",
        description: "There was an error exporting your document.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Email document
  const handleEmailDocument = async () => {
    try {
      setIsLoading(true);
      
      if (!emailRecipient) {
        toast({
          title: "Email required",
          description: "Please enter a recipient email address.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      const response = await fetch('/api/document/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          recipient: emailRecipient,
          subject: emailSubject,
          format: exportFormat
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to send email');
      }
      
      toast({
        title: "Document sent successfully",
        description: `Email sent to ${emailRecipient}`,
      });
      
      setIsEmailDialogOpen(false);
    } catch (error) {
      console.error('Error sending document via email:', error);
      toast({
        title: "Email failed",
        description: error instanceof Error ? error.message : "There was an error sending your document.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get icon based on format
  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'json':
        return <FileJson className="h-5 w-5" />;
      case 'md':
      case 'html':
        return <FileText className="h-5 w-5" />;
      case 'docx':
        return <FileDown className="h-5 w-5" />;
      case 'pdf':
        return <FileDown className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  return (
    <div className="flex space-x-2">
      {/* Export button & dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Document</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="export-format">Format</Label>
              <Select 
                value={exportFormat} 
                onValueChange={(value) => setExportFormat(value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="txt">Text (.txt)</SelectItem>
                  <SelectItem value="html">HTML (.html)</SelectItem>
                  <SelectItem value="docx">Word (.docx)</SelectItem>
                  <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                  <SelectItem value="md">Markdown (.md)</SelectItem>
                  <SelectItem value="json">JSON (.json)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="export-filename">Filename</Label>
              <Input
                id="export-filename"
                value={exportFilename}
                onChange={(e) => setExportFilename(e.target.value)}
                placeholder="Enter filename"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={isLoading}>
              {isLoading ? (
                <div className="animate-spin h-4 w-4 border-2 border-b-transparent border-white rounded-full mr-2"></div>
              ) : (
                getFormatIcon(exportFormat)
              )}
              <span className="ml-2">Download</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Email button & dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Mail className="h-4 w-4 mr-2" />
            Email
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Email Document</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email-recipient">Recipient Email</Label>
              <Input
                id="email-recipient"
                value={emailRecipient}
                onChange={(e) => setEmailRecipient(e.target.value)}
                placeholder="recipient@example.com"
                type="email"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email-subject">Subject</Label>
              <Input
                id="email-subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Document subject"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email-format">Format</Label>
              <Select 
                value={exportFormat} 
                onValueChange={(value) => setExportFormat(value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="txt">Text (.txt)</SelectItem>
                  <SelectItem value="html">HTML (.html)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEmailDocument} disabled={isLoading}>
              {isLoading ? (
                <div className="animate-spin h-4 w-4 border-2 border-b-transparent border-white rounded-full mr-2"></div>
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              Send Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}