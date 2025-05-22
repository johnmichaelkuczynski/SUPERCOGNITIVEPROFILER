import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, FileText, Upload, Download, Mail } from 'lucide-react';
import DocumentExportButtons from './DocumentExportButtons';
import { toast } from '@/hooks/use-toast';

interface LargeDocumentRewriteProps {
  lastUploadedDocument?: {
    name: string;
    content: string;
  };
  selectedModel: string;
  conversationInsights?: string;
}

export default function LargeDocumentRewrite({ 
  lastUploadedDocument, 
  selectedModel,
  conversationInsights = ''
}: LargeDocumentRewriteProps) {
  // State for document content
  const [documentContent, setDocumentContent] = useState<string>(lastUploadedDocument?.content || '');
  const [documentName, setDocumentName] = useState<string>(lastUploadedDocument?.name || 'Document');
  
  // State for rewrite instructions
  const [rewriteInstructions, setRewriteInstructions] = useState<string>('');
  
  // State for processing status
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  // State for rewritten content
  const [rewrittenContent, setRewrittenContent] = useState<string>('');
  
  // State for email sharing
  const [emailRecipient, setEmailRecipient] = useState<string>('');
  const [includeConversationInsights, setIncludeConversationInsights] = useState<boolean>(false);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  
  // File upload ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setDocumentName(file.name);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setDocumentContent(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };
  
  // Handle document rewrite request
  const handleRewriteRequest = async () => {
    if (!documentContent) {
      toast({
        title: "No document content",
        description: "Please upload a document or use the last uploaded document from your conversation.",
        variant: "destructive"
      });
      return;
    }
    
    if (!rewriteInstructions) {
      toast({
        title: "Missing instructions",
        description: "Please specify how you want the document to be rewritten.",
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Prepare the request with all necessary information
      const formData = new FormData();
      formData.append('content', documentContent);
      formData.append('instructions', rewriteInstructions);
      formData.append('model', selectedModel);
      formData.append('documentName', documentName);
      
      // Include conversation insights if requested
      if (includeConversationInsights && conversationInsights) {
        formData.append('insights', conversationInsights);
      }
      
      // Make the API call
      const response = await fetch('/api/document/rewrite', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to rewrite document');
      }
      
      const data = await response.json();
      setRewrittenContent(data.content);
      
    } catch (error) {
      console.error('Error rewriting document:', error);
      toast({
        title: "Rewrite failed",
        description: "There was an error rewriting your document. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle email sending
  const handleSendEmail = async () => {
    if (!rewrittenContent) {
      toast({
        title: "No content to send",
        description: "Please rewrite the document first.",
        variant: "destructive"
      });
      return;
    }
    
    if (!emailRecipient) {
      toast({
        title: "Missing recipient",
        description: "Please provide an email address.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const response = await fetch('/api/document/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: emailRecipient,
          subject: `Rewritten Document: ${documentName}`,
          content: rewrittenContent,
          format: 'html'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to send email');
      }
      
      toast({
        title: "Email sent",
        description: `Document has been sent to ${emailRecipient}`,
      });
      
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Email failed",
        description: "There was an error sending the email. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Rewrite Large Document
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Large Document Rewriter</DialogTitle>
          <DialogDescription>
            Upload a document or use the last one from your conversation, specify how you want it rewritten,
            and get results in a downloadable format.
          </DialogDescription>
        </DialogHeader>
        
        {!rewrittenContent ? (
          /* Input Phase - Document Upload and Instructions */
          <div className="grid gap-6">
            <div className="grid gap-3">
              <Label htmlFor="document">Document Source</Label>
              
              <div className="flex flex-col gap-4">
                {lastUploadedDocument && (
                  <Card className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <span className="font-medium">{lastUploadedDocument.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {lastUploadedDocument.content.length} characters
                        </span>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setDocumentContent(lastUploadedDocument.content);
                          setDocumentName(lastUploadedDocument.name);
                        }}
                      >
                        Use This Document
                      </Button>
                    </div>
                  </Card>
                )}
                
                <div className="flex items-center gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload New Document
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".txt,.md,.doc,.docx"
                    onChange={handleFileUpload}
                  />
                </div>
                
                {documentContent && (
                  <div className="border rounded-md p-4 max-h-[200px] overflow-auto">
                    <h3 className="font-medium mb-2">Document Preview:</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {documentContent.length > 500 
                        ? documentContent.substring(0, 500) + '...' 
                        : documentContent}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid gap-3">
              <Label htmlFor="instructions">Rewrite Instructions</Label>
              <Textarea
                id="instructions"
                placeholder="Specify how you want the document to be rewritten (e.g., 'Make it more formal', 'Simplify the language', 'Reorganize the structure')"
                rows={5}
                value={rewriteInstructions}
                onChange={(e) => setRewriteInstructions(e.target.value)}
                className="resize-none"
              />
            </div>
            
            {conversationInsights && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="insights"
                  checked={includeConversationInsights}
                  onCheckedChange={setIncludeConversationInsights}
                />
                <Label htmlFor="insights">
                  Include insights from our conversation in the rewrite
                </Label>
              </div>
            )}
            
            <Button 
              onClick={handleRewriteRequest} 
              disabled={isProcessing || !documentContent || !rewriteInstructions}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing Document...
                </>
              ) : (
                'Rewrite Document'
              )}
            </Button>
          </div>
        ) : (
          /* Output Phase - Rewritten Content and Export Options */
          <div className="grid gap-6">
            <Tabs defaultValue="preview">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="export">Export Options</TabsTrigger>
              </TabsList>
              
              <TabsContent value="preview" className="p-4 border rounded-md max-h-[400px] overflow-auto">
                <div className="whitespace-pre-wrap">
                  {rewrittenContent}
                </div>
              </TabsContent>
              
              <TabsContent value="export" className="p-4 border rounded-md">
                <div className="grid gap-6">
                  <div className="grid gap-4">
                    <h3 className="font-medium">Download Options</h3>
                    <div className="flex flex-wrap gap-4">
                      <DocumentExportButtons 
                        content={rewrittenContent} 
                        filename={documentName.replace(/\.[^/.]+$/, '')} 
                      />
                    </div>
                  </div>
                  
                  <div className="grid gap-4">
                    <h3 className="font-medium">Share via Email</h3>
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        placeholder="recipient@example.com"
                        value={emailRecipient}
                        onChange={(e) => setEmailRecipient(e.target.value)}
                      />
                      <Button variant="outline" onClick={handleSendEmail}>
                        <Mail className="h-4 w-4 mr-2" />
                        Send
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <DialogFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setRewrittenContent('')}
              >
                Back to Edit
              </Button>
              <Button onClick={() => setIsDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}