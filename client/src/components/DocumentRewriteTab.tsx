import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Upload, Loader2, Mail, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface DocumentRewriteTabProps {
  selectedModel: string;
  messages: any[]; // Using any for now, we'll refine this
}

export default function DocumentRewriteTab({ selectedModel, messages }: DocumentRewriteTabProps) {
  // Document state
  const [documentContent, setDocumentContent] = useState<string>('');
  const [documentName, setDocumentName] = useState<string>('');
  const [rewriteInstructions, setRewriteInstructions] = useState<string>('');
  const [rewrittenContent, setRewrittenContent] = useState<string>('');
  
  // Processing states
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  
  // Email
  const [emailRecipient, setEmailRecipient] = useState<string>('');
  
  // AI detection
  const [aiDetectionResult, setAiDetectionResult] = useState<any>(null);
  
  // File upload ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Find the last uploaded document from conversation
  useEffect(() => {
    const lastDocumentFromConversation = getLastUploadedDocument();
    if (lastDocumentFromConversation) {
      setDocumentContent(lastDocumentFromConversation.content);
      setDocumentName(lastDocumentFromConversation.name);
      console.log("Found document in conversation:", lastDocumentFromConversation.name);
    }
  }, [messages]);
  
  // Get last uploaded document from conversation
  const getLastUploadedDocument = () => {
    // Find user messages with files
    const messagesWithFiles = messages.filter(msg => 
      msg.role === 'user' && msg.files && msg.files.length > 0
    );
    
    if (messagesWithFiles.length === 0) return null;
    
    // Get the last message with files
    const lastMessageWithFiles = messagesWithFiles[messagesWithFiles.length - 1];
    
    // Find the assistant response to this message
    const assistantResponseIndex = messages.findIndex(msg => msg.id === lastMessageWithFiles.id) + 1;
    
    if (assistantResponseIndex >= messages.length) {
      // If there's no response yet
      return null;
    }
    
    const assistantResponse = messages[assistantResponseIndex];
    
    if (assistantResponse.role !== 'assistant' || !assistantResponse.content) {
      return null;
    }
    
    return {
      name: lastMessageWithFiles.files[0].name,
      content: assistantResponse.content
    };
  };
  
  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setDocumentName(file.name);
    setIsProcessing(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/documents/process', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to process document');
      }
      
      const data = await response.json();
      
      if (data.text) {
        setDocumentContent(data.text);
      } else if (data.content) {
        setDocumentContent(data.content);
      } else {
        throw new Error('No document content returned');
      }
      
      toast({
        title: "Document uploaded",
        description: `${file.name} is ready to be rewritten`,
      });
      
    } catch (error) {
      console.error('Document processing error:', error);
      toast({
        title: "Error processing document",
        description: "Could not extract text. Try a different format.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle document rewrite
  const handleRewrite = async () => {
    if (!documentContent) {
      toast({
        title: "No document content",
        description: "Please upload a document first.",
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
      const response = await fetch('/api/document/rewrite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: documentContent,
          instructions: rewriteInstructions,
          model: selectedModel,
          documentName: documentName
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to rewrite document');
      }
      
      const result = await response.json();
      setRewrittenContent(result.content);
      
      toast({
        title: "Document rewritten",
        description: "Your document has been rewritten successfully."
      });
      
    } catch (error) {
      console.error('Rewrite error:', error);
      toast({
        title: "Rewrite failed",
        description: "There was an error rewriting your document.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Download as Word
  const downloadAsWord = async () => {
    if (!rewrittenContent) {
      toast({
        title: "No content",
        description: "Please rewrite the document first.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const response = await fetch('/api/document/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: rewrittenContent,
          format: 'docx',
          filename: documentName.replace(/\.[^/.]+$/, '')
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate Word document');
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${documentName.replace(/\.[^/.]+$/, '')}-rewritten.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Word export error:', error);
      toast({
        title: "Export failed",
        description: "Could not export as Word document.",
        variant: "destructive"
      });
    }
  };
  
  // Download as PDF
  const downloadAsPDF = async () => {
    if (!rewrittenContent) {
      toast({
        title: "No content",
        description: "Please rewrite the document first.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const response = await fetch('/api/document/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: rewrittenContent,
          format: 'pdf',
          filename: documentName.replace(/\.[^/.]+$/, '')
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${documentName.replace(/\.[^/.]+$/, '')}-rewritten.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: "Export failed",
        description: "Could not export as PDF.",
        variant: "destructive"
      });
    }
  };
  
  // Send via email
  const sendEmail = async () => {
    if (!rewrittenContent) {
      toast({
        title: "No content",
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
      console.error('Email error:', error);
      toast({
        title: "Email failed",
        description: "Could not send email. Check your connection.",
        variant: "destructive"
      });
    }
  };
  
  // Run AI detection
  const runAIDetection = async () => {
    if (!rewrittenContent) {
      toast({
        title: "No content",
        description: "Please rewrite the document first.",
        variant: "destructive"
      });
      return;
    }
    
    setIsDetecting(true);
    
    try {
      const response = await fetch('/api/ai-detection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: rewrittenContent
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze text');
      }
      
      const result = await response.json();
      setAiDetectionResult(result);
      
    } catch (error) {
      console.error('AI detection error:', error);
      toast({
        title: "Detection failed",
        description: "Could not perform AI detection.",
        variant: "destructive"
      });
    } finally {
      setIsDetecting(false);
    }
  };
  
  // Format AI detection result
  const formatAIDetectionResult = () => {
    if (!aiDetectionResult) return null;
    
    const humanProbability = (aiDetectionResult.humanProbability || (1 - aiDetectionResult.aiProbability)) * 100;
    const aiProbability = (aiDetectionResult.aiProbability || (1 - aiDetectionResult.humanProbability)) * 100;
    
    const isLikelyHuman = humanProbability > aiProbability;
    
    return (
      <div className="mt-4 p-4 border rounded-md">
        <div className="flex items-center gap-2 mb-2">
          {isLikelyHuman ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
          )}
          <h3 className="font-medium">
            {isLikelyHuman 
              ? "This text appears human-written" 
              : "This text may be detected as AI-generated"}
          </h3>
        </div>
        
        <div className="space-y-1">
          <div className="text-sm">
            <span className="font-medium">Human probability:</span> {humanProbability.toFixed(1)}%
          </div>
          <div className="text-sm">
            <span className="font-medium">AI probability:</span> {aiProbability.toFixed(1)}%
          </div>
          
          {aiDetectionResult.mostHumanSentence && (
            <div className="mt-2 text-sm">
              <div className="font-medium text-green-600">Most human-like passage:</div>
              <p className="italic text-gray-600 mt-1">"{aiDetectionResult.mostHumanSentence.sentence}"</p>
            </div>
          )}
          
          {aiDetectionResult.mostAISentence && (
            <div className="mt-2 text-sm">
              <div className="font-medium text-yellow-600">Most AI-like passage:</div>
              <p className="italic text-gray-600 mt-1">"{aiDetectionResult.mostAISentence.sentence}"</p>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="w-full grid gap-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Document Input</h2>
          
          {/* Document source section */}
          <div className="space-y-2">
            <Label>Document Source</Label>
            
            {/* Last uploaded document info */}
            {documentName && (
              <Card className="p-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="font-medium">{documentName}</div>
                    <div className="text-xs text-gray-500">
                      {documentContent.length} characters
                    </div>
                  </div>
                </div>
              </Card>
            )}
            
            {/* Upload button */}
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </>
              )}
            </Button>
            
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".txt,.docx,.pdf"
              onChange={handleFileUpload}
            />
          </div>
          
          {/* Rewrite instructions */}
          <div className="space-y-2">
            <Label htmlFor="instructions">Rewrite Instructions</Label>
            <Textarea
              id="instructions"
              placeholder="Specify how you want the document to be rewritten..."
              value={rewriteInstructions}
              onChange={(e) => setRewriteInstructions(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
          
          {/* Rewrite button */}
          <Button 
            className="w-full"
            onClick={handleRewrite}
            disabled={isProcessing || !documentContent || !rewriteInstructions}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Rewriting Document...
              </>
            ) : (
              'Rewrite Document'
            )}
          </Button>
        </div>
        
        {/* Right column - output and actions */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Rewritten Document</h2>
          
          {rewrittenContent ? (
            <>
              {/* Document output */}
              <div className="border rounded-md p-3 max-h-[300px] overflow-auto">
                <div className="whitespace-pre-wrap">{rewrittenContent}</div>
              </div>
              
              {/* Actions tabs */}
              <Tabs defaultValue="export">
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="export">Export Options</TabsTrigger>
                  <TabsTrigger value="aiDetection">AI Detection</TabsTrigger>
                </TabsList>
                
                {/* Export tab */}
                <TabsContent value="export" className="space-y-4 p-4 border rounded-md">
                  <div className="space-y-2">
                    <h3 className="font-medium">Download</h3>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={downloadAsWord}>
                        Download as Word
                      </Button>
                      <Button variant="outline" onClick={downloadAsPDF}>
                        Download as PDF
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Email</h3>
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        placeholder="recipient@example.com"
                        value={emailRecipient}
                        onChange={(e) => setEmailRecipient(e.target.value)}
                      />
                      <Button variant="outline" onClick={sendEmail}>
                        <Mail className="h-4 w-4 mr-2" />
                        Send
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                
                {/* AI Detection tab */}
                <TabsContent value="aiDetection" className="p-4 border rounded-md">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">AI Content Detection</h3>
                      <Button 
                        variant="outline" 
                        onClick={runAIDetection}
                        disabled={isDetecting}
                      >
                        {isDetecting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          'Analyze Text'
                        )}
                      </Button>
                    </div>
                    
                    {aiDetectionResult && formatAIDetectionResult()}
                    
                    {!aiDetectionResult && !isDetecting && (
                      <p className="text-sm text-gray-500">
                        Click "Analyze Text" to check if this document would be detected as AI-generated.
                      </p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <div className="border border-dashed rounded-md p-6 flex items-center justify-center h-[300px]">
              <div className="text-center text-gray-500">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Rewritten content will appear here</p>
                <p className="text-sm mt-1">
                  Upload a document and provide rewriting instructions
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}