import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, Download, Upload, Plus, FileText, X } from 'lucide-react';
import { useDocuments } from '@/hooks/use-documents';
import { modelColorMap, formatDate, countWords } from '@/lib/utils';
import { useLLM } from '@/hooks/use-llm';
import { useToast } from '@/hooks/use-toast';
import { downloadOutput } from '@/lib/llm';
import AIDetectionBadge from '@/components/AIDetectionBadge';

export default function Documents() {
  const { documents, isLoading, refetch } = useDocuments();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [viewingDocument, setViewingDocument] = useState<{id: string, title: string, content: string, metadata?: string} | null>(null);
  const { toast } = useToast();
  const { processFile } = useLLM();
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const uploadDocument = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }
    
    setUploading(true);
    
    try {
      await processFile(selectedFile);
      toast({
        title: "Document uploaded",
        description: "Your document has been processed and added to your library",
      });
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      // Refresh document list
      refetch();
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to process document",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const filteredDocs = documents
    .filter(doc => 
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      doc.content.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      } else if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      } else if (sortBy === 'wordCount') {
        return (b.wordCount || 0) - (a.wordCount || 0);
      }
      return 0;
    });

  return (
    <main className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Documents</h1>
            <p className="text-slate-600">Manage your processed texts and generated content</p>
          </div>
          <Button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 text-lg shadow-lg"
          >
            <FileText className="h-5 w-5 mr-2" />
            Upload Document
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
          />
        </div>
        
        {/* Upload instructions for better visibility */}
        {!selectedFile && filteredDocs.length === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 text-center">
            <FileText className="h-12 w-12 mx-auto mb-3 text-blue-500" />
            <h3 className="text-lg font-medium text-blue-800 mb-2">Upload Your First Document</h3>
            <p className="text-blue-600 mb-4">
              Click the "Upload Document" button to upload PDF, Word, text, or image files for processing
            </p>
            <Button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-blue-600 hover:bg-blue-700 text-white py-6 px-8 text-lg"
            >
              <Upload className="h-5 w-5 mr-2" />
              Select File to Upload
            </Button>
          </div>
        )}
      </div>
      
      {/* File upload preview */}
      {selectedFile && (
        <div className="mb-6 bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-slate-600" />
              <div>
                <p className="font-medium text-slate-800">{selectedFile.name}</p>
                <p className="text-xs text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              >
                Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={uploadDocument}
                disabled={uploading}
                className="bg-primary-600 hover:bg-primary-700 text-white"
              >
                {uploading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    <span>Upload</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input 
              className="pl-10"
              placeholder="Search documents" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              <span>Filter</span>
            </Button>
            <select 
              className="px-3 py-2 border border-slate-300 rounded-md text-sm"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date">Sort by Date</option>
              <option value="title">Sort by Title</option>
              <option value="wordCount">Sort by Word Count</option>
            </select>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
            <span className="ml-3 text-sm text-slate-600">Loading documents...</span>
          </div>
        ) : filteredDocs.length > 0 ? (
          <div className="space-y-4">
            {filteredDocs.map((doc) => (
              <div key={doc.id} className="bg-slate-50 rounded-lg border border-slate-200 p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-slate-800">{doc.title}</h3>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${modelColorMap[doc.model]}`}>
                    {doc.model === 'claude' ? 'Claude' : doc.model === 'gpt4' ? 'GPT-4' : 'Perplexity'}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mb-3">{doc.excerpt}</p>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>{typeof doc.date === 'string' ? doc.date : formatDate(doc.date as Date)}</span>
                    <span>{countWords(doc.content)} words</span>
                    {doc.metadata && <AIDetectionBadge metadata={doc.metadata} />}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs"
                      onClick={() => setViewingDocument({
                        id: doc.id,
                        title: doc.title,
                        content: doc.content,
                        metadata: doc.metadata
                      })}
                    >
                      View
                    </Button>
                    <div className="relative group">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-xs flex items-center gap-1"
                      >
                        <Download className="h-3 w-3" />
                        <span>Download</span>
                      </Button>
                      <div className="absolute right-0 mt-1 w-28 bg-white rounded-md shadow-lg border border-slate-200 hidden group-hover:block z-10">
                        <div className="py-1">
                          <button 
                            onClick={() => downloadOutput(doc.content, 'txt', doc.title)}
                            className="block w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-100"
                          >
                            Text (.txt)
                          </button>
                          <button 
                            onClick={() => downloadOutput(doc.content, 'docx', doc.title)}
                            className="block w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-100"
                          >
                            Word (.docx)
                          </button>
                          <button 
                            onClick={() => downloadOutput(doc.content, 'pdf', doc.title)}
                            className="block w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-100"
                          >
                            PDF (.pdf)
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-600">No documents match your search</p>
            <p className="text-sm text-slate-500 mt-1">Try adjusting your search terms</p>
          </div>
        )}
      </div>
      
      {/* Document Viewer Dialog */}
      {viewingDocument && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl overflow-hidden w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-semibold text-lg">{viewingDocument.title}</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setViewingDocument(null)}
                className="h-8 w-8 p-0"
              >
                <span className="sr-only">Close</span>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <div className="prose max-w-none">
                {viewingDocument.content.split('\n').map((paragraph, index) => (
                  paragraph.trim() ? <p key={index}>{paragraph}</p> : <br key={index} />
                ))}
              </div>
            </div>
            <div className="border-t border-slate-200 p-4 flex justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-500">
                    {countWords(viewingDocument.content)} words
                  </span>
                  {viewingDocument.metadata && (
                    <AIDetectionBadge metadata={viewingDocument.metadata} showDetails={true} />
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => downloadOutput(viewingDocument.content, 'txt', viewingDocument.title)}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Text
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => downloadOutput(viewingDocument.content, 'docx', viewingDocument.title)}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Word
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => downloadOutput(viewingDocument.content, 'pdf', viewingDocument.title)}
                >
                  <Download className="h-3 w-3 mr-1" />
                  PDF
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={() => setViewingDocument(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
