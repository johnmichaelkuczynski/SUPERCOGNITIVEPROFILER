import React, { useState } from 'react';
import ControlPanel from '@/components/ControlPanel';
import Editor from '@/components/Editor';
import OutputContainer from '@/components/OutputContainer';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import DocumentLibrary from '@/components/DocumentLibrary';
import { LLMModel, OutputFormat } from '@/lib/utils';
import { useLLM } from '@/hooks/use-llm';
import { useDocuments } from '@/hooks/use-documents';
import { useAnalytics } from '@/hooks/use-analytics';

export default function Home() {
  // State for control panel options
  const [selectedModel, setSelectedModel] = useState<LLMModel>('claude');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [streamResponse, setStreamResponse] = useState(true);
  const [saveToHistory, setSaveToHistory] = useState(true);
  const [downloadFormat, setDownloadFormat] = useState<OutputFormat>('txt');
  const [chunkSize, setChunkSize] = useState('auto');
  const [temperature, setTemperature] = useState(0.7);
  
  // Editor state
  const [prompt, setPrompt] = useState('');
  
  // Hooks for core functionality
  const { generateText, response, isProcessing } = useLLM();
  const { getRecentDocuments, processFiles, processedContent } = useDocuments();
  const { analyticsData, isLoading: isLoadingAnalytics, timeframe, setTimeframe, generateReport } = useAnalytics();
  
  const handleProcessRequest = () => {
    if (!prompt.trim()) return;
    
    generateText(prompt, selectedModel, {
      stream: streamResponse,
      temperature,
      chunkSize,
      files: uploadedFiles,
    });
  };
  
  const handleFilesChange = (files: File[]) => {
    setUploadedFiles(files);
    if (files.length > 0) {
      processFiles(files);
    }
  };

  return (
    <main className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row gap-6">
        <ControlPanel 
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
          files={uploadedFiles}
          onFilesChange={handleFilesChange}
          streamResponse={streamResponse}
          onStreamResponseChange={setStreamResponse}
          saveToHistory={saveToHistory}
          onSaveToHistoryChange={setSaveToHistory}
          downloadFormat={downloadFormat}
          onDownloadFormatChange={setDownloadFormat}
          chunkSize={chunkSize}
          onChunkSizeChange={setChunkSize}
          temperature={temperature}
          onTemperatureChange={setTemperature}
          onProcess={handleProcessRequest}
          isProcessing={isProcessing}
        />
        
        <div className="flex-1">
          <Editor 
            value={prompt}
            onChange={setPrompt}
            contextDocuments={processedContent}
            onSubmit={handleProcessRequest}
          />
          
          <OutputContainer 
            content={response?.content || ''}
            model={response?.model || selectedModel}
            timestamp={response?.timestamp || null}
            downloadFormat={downloadFormat}
            isLoading={isProcessing}
          />
        </div>
      </div>
      
      <AnalyticsDashboard 
        analyticsData={analyticsData || null}
        isLoading={isLoadingAnalytics}
        onTimeframeChange={setTimeframe}
        onGenerateReport={generateReport}
      />
      
      <DocumentLibrary 
        documents={getRecentDocuments(3)}
        isLoading={false}
      />
    </main>
  );
}
