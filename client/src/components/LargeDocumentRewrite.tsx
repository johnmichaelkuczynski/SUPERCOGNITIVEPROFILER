import React, { useState, useRef, useEffect } from 'react';
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
  const [documentContent, setDocumentContent] = useState<string>('');
  const [documentName, setDocumentName] = useState<string>('');
  
  // Initialize with last uploaded document if available
  useEffect(() => {
    if (lastUploadedDocument) {
      setDocumentContent(lastUploadedDocument.content);
      setDocumentName(lastUploadedDocument.name);
      console.log("Loaded document from props:", lastUploadedDocument.name, 
                 "with content length:", lastUploadedDocument.content.length);
    }
  }, [lastUploadedDocument]);
  
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
  
  // Handle file upload - simplified method that just uses the document upload API
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setDocumentName(file.name);
      setIsProcessing(true);
      
      try {
        // Create form data for upload - always use the same API endpoint that works correctly in the main application
        const formData = new FormData();
        formData.append('file', file);
        
        // Use the existing /api/llm/prompt endpoint which already handles document processing correctly
        const response = await fetch('/api/documents/process', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          throw new Error('Failed to process document');
        }
        
        const data = await response.json();
        
        // Check if the text property exists and is not empty
        if (data.text && data.text.length > 0) {
          setDocumentContent(data.text);
          console.log("Document processed successfully:", file.name, "Content length:", data.text.length);
        } else if (data.content && data.content.length > 0) {
          // Fallback to content field if available
          setDocumentContent(data.content);
          console.log("Document processed successfully (using content field):", file.name, "Content length:", data.content.length);
        } else {
          throw new Error('No document text was returned from the server');
        }
      } catch (error) {
        console.error("Error processing document:", error);
        toast({
          title: "Error processing document",
          description: "Could not extract text from this document format. Please try a plain text file.",
          variant: "destructive"
        });
      } finally {
        setIsProcessing(false);
      }
    }
  };
  
  // Handle document rewrite request
  const handleRewriteRequest = async () => {
    if (!documentContent || documentContent === "Loading...") {
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
      console.log("Sending document for rewrite:", {
        documentName,
        contentLength: documentContent.length,
        instructions: rewriteInstructions
      });
      
      // Directly create JSON payload instead of FormData for better error handling
      const payload = {
        content: documentContent,
        instructions: rewriteInstructions,
        model: selectedModel,
        documentName: documentName,
        insights: includeConversationInsights ? conversationInsights : ''
      };
      
      // Make the API call with JSON
      const response = await fetch('/api/document/rewrite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server error response:", errorText);
        throw new Error(`Failed to rewrite document: ${errorText}`);
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
                          {lastUploadedDocument.content ? lastUploadedDocument.content.length : '0'} characters
                        </span>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          if (lastUploadedDocument.content && lastUploadedDocument.content !== "Loading...") {
                            console.log("Using document:", lastUploadedDocument.name);
                            setDocumentContent(lastUploadedDocument.content);
                            setDocumentName(lastUploadedDocument.name);
                          } else {
                            // Alert user that content is not available
                            toast({
                              title: "Document content not available",
                              description: "Unable to load document content. Please upload the document directly.",
                              variant: "destructive"
                            });
                          }
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
                    accept=".txt,.md,.doc,.docx,.pdf"
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