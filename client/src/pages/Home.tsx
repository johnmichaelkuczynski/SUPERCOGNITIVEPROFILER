import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LLMModel, formatBytes } from '@/lib/utils';
import { Send, Upload, X, FileText } from 'lucide-react';

export default function Home() {
  // Basic state
  const [selectedModel, setSelectedModel] = useState<LLMModel>('claude');
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const handleProcessRequest = async () => {
    if (!prompt.trim()) return;
    
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('content', prompt);
      formData.append('model', selectedModel);
      formData.append('stream', 'false');
      formData.append('temperature', '0.7');
      
      // Add any uploaded files to the request
      if (files.length > 0) {
        files.forEach(file => {
          formData.append('files', file);
        });
      }
      
      const res = await fetch('/api/llm/prompt', {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) {
        throw new Error('Failed to process request');
      }
      
      const data = await res.json();
      setResponse(data.content);
    } catch (error) {
      console.error('Error processing request:', error);
      setResponse('Error: Failed to get a response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleProcessRequest();
    }
  };
  
  // File upload handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setFiles([...files, ...selectedFiles]);
      
      // Reset the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const handleRemoveFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  return (
    <main className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">TextMind Chat</h1>
      
      <div className="grid grid-cols-1 gap-6">
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Model Selection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant={selectedModel === 'claude' ? 'default' : 'outline'} 
                onClick={() => setSelectedModel('claude')}
              >
                Claude
              </Button>
              <Button 
                variant={selectedModel === 'gpt4' ? 'default' : 'outline'} 
                onClick={() => setSelectedModel('gpt4')}
              >
                GPT-4
              </Button>
              <Button 
                variant={selectedModel === 'perplexity' ? 'default' : 'outline'} 
                onClick={() => setSelectedModel('perplexity')}
              >
                Perplexity
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Your Message</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full h-32 p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Type your question or prompt here and press Enter to send..."
              />
              
              {/* File Upload UI */}
              <div className="space-y-2">
                <div 
                  className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-slate-50"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-6 w-6 mx-auto text-slate-400 mb-2" />
                  <p className="text-sm text-slate-600">Upload files for context</p>
                  <p className="text-xs text-slate-500 mt-1">PDF, DOCX, TXT, JPG, PNG</p>
                  <input 
                    type="file" 
                    className="hidden" 
                    multiple 
                    accept=".pdf,.docx,.txt,.jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                  />
                </div>
                
                {files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-slate-100 rounded-lg px-3 py-2 text-sm">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileText className="h-4 w-4 text-blue-500" />
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
              
              <Button 
                onClick={handleProcessRequest} 
                className="w-full"
                disabled={isLoading || !prompt.trim()}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-b-transparent border-white rounded-full"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">AI Response</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mb-3"></div>
                <p className="text-slate-500">AI is thinking...</p>
              </div>
            ) : response ? (
              <div className="p-3 whitespace-pre-wrap">
                {response}
              </div>
            ) : (
              <p className="text-center py-8 text-slate-500">
                The AI will respond here after you send a message.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
