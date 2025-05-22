import React, { useState, useRef } from 'react';
import { UploadCloud, X } from 'lucide-react';
import { UploadedFile } from '@/lib/llm';
import { cn, formatBytes, getExtensionFromFileName, isDocumentFile, isImageFile } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface FileUploadProps {
  onFilesChange: (files: File[]) => void;
  files: File[];
}

export default function FileUpload({ onFilesChange, files }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    validateAndAddFiles(selectedFiles);
    
    // Reset file input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateAndAddFiles = (selectedFiles: File[]) => {
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    selectedFiles.forEach(file => {
      const extension = getExtensionFromFileName(file.name);
      
      if (isDocumentFile(file.name) || isImageFile(file.name)) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file.name);
      }
    });

    if (invalidFiles.length > 0) {
      toast({
        title: "Invalid file types",
        description: `Only PDF, DOCX, TXT, and image files are supported. Invalid files: ${invalidFiles.join(', ')}`,
        variant: "destructive"
      });
    }

    if (validFiles.length > 0) {
      // Process each file individually and immediately
      validFiles.forEach(file => {
        // Add the file to the list first
        onFilesChange([...files, file]);
        
        // Automatically trigger processing for this file
        // This will be handled by the parent component that receives the file
      });
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      validateAndAddFiles(droppedFiles);
    }
  };

  const handleRemoveFile = (index: number) => {
    const updatedFiles = [...files];
    updatedFiles.splice(index, 1);
    onFilesChange(updatedFiles);
  };

  const getFileIcon = (fileName: string) => {
    const extension = getExtensionFromFileName(fileName);
    
    switch (extension) {
      case 'pdf':
        return 'ri-file-pdf-line text-red-500';
      case 'docx':
      case 'doc':
        return 'ri-file-word-line text-blue-500';
      case 'txt':
        return 'ri-file-text-line text-slate-500';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'ri-image-line text-green-500';
      default:
        return 'ri-file-line text-slate-500';
    }
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-slate-700 mb-2">Upload Documents</label>
      <div 
        className={cn(
          "border-2 border-dashed rounded-lg p-4 text-center transition cursor-pointer bg-slate-50",
          isDragging ? "border-primary-400 bg-primary-50" : "border-slate-300 hover:border-primary-400"
        )} 
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <UploadCloud className="h-6 w-6 mx-auto text-slate-400 mb-2" />
        <p className="text-sm text-slate-600">Drag files here or click to upload</p>
        <p className="text-xs text-slate-500 mt-1">PDF, DOCX, TXT, JPG, PNG</p>
        <input 
          type="file" 
          className="hidden" 
          multiple 
          accept=".pdf,.docx,.txt,.jpg,.jpeg,.png"
          onChange={handleFileSelect}
          ref={fileInputRef}
        />
      </div>
      
      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between bg-slate-100 rounded-lg px-3 py-2 text-sm">
              <div className="flex items-center gap-2 overflow-hidden">
                <i className={getFileIcon(file.name)}></i>
                <span className="truncate">{file.name}</span>
                <span className="text-xs text-slate-500 whitespace-nowrap">({formatBytes(file.size)})</span>
              </div>
              <button 
                className="text-slate-500 hover:text-red-500 flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveFile(index);
                }}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
