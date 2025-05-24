import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUp, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileProcessorProps {
  onFileProcessed: (data: {
    id: string;
    content: string;
    chunks?: Array<{index: number; title: string; summary: string; wordCount: number}>;
  }) => void;
}

export default function FileProcessor({ onFileProcessed }: FileProcessorProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive"
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      const response = await fetch('/api/documents/process', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Error processing file: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Notify parent component with processed data
      onFileProcessed({
        id: data.id,
        content: data.content,
        chunks: data.chunks
      });
      
      // Reset state
      setSelectedFile(null);
      
      toast({
        title: "File processed successfully",
        description: data.chunks 
          ? `Document split into ${data.chunks.length} sections` 
          : "Document processed successfully",
      });
    } catch (error) {
      console.error('Error processing file:', error);
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Process Document</CardTitle>
        <CardDescription>
          Upload a document to extract text and create sections
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <input
              type="file"
              id="file-upload"
              className="sr-only"
              onChange={handleFileChange}
              accept=".pdf,.docx,.txt,.jpg,.jpeg,.png"
            />
            <label 
              htmlFor="file-upload"
              className="flex-1 cursor-pointer px-4 py-2 border-2 border-dashed rounded-lg flex items-center justify-center hover:bg-slate-50 transition-colors"
            >
              <div className="text-center py-8">
                <FileUp className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                <div className="text-sm font-medium mb-1">
                  {selectedFile ? selectedFile.name : "Select a file to upload"}
                </div>
                <p className="text-xs text-slate-400">
                  Supports PDF, DOCX, TXT, and images
                </p>
              </div>
            </label>
          </div>
          
          <Button 
            onClick={handleUpload} 
            disabled={!selectedFile || isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <FileUp className="mr-2 h-4 w-4" />
                Process Document
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}