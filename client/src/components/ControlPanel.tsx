import React from 'react';
import { Button } from '@/components/ui/button';
import ModelSelector from './ModelSelector';
import FileUpload from './FileUpload';
import OutputSettings from './OutputSettings';
import AdvancedOptions from './AdvancedOptions';
import { Send } from 'lucide-react';
import { LLMModel, OutputFormat } from '@/lib/utils';

interface ControlPanelProps {
  selectedModel: LLMModel;
  onModelChange: (model: LLMModel) => void;
  files: File[];
  onFilesChange: (files: File[]) => void;
  streamResponse: boolean;
  onStreamResponseChange: (value: boolean) => void;
  saveToHistory: boolean;
  onSaveToHistoryChange: (value: boolean) => void;
  downloadFormat: OutputFormat;
  onDownloadFormatChange: (format: OutputFormat) => void;
  chunkSize: string;
  onChunkSizeChange: (size: string) => void;
  temperature: number;
  onTemperatureChange: (temp: number) => void;
  onProcess: () => void;
  isProcessing: boolean;
}

export default function ControlPanel({
  selectedModel,
  onModelChange,
  files,
  onFilesChange,
  streamResponse,
  onStreamResponseChange,
  saveToHistory,
  onSaveToHistoryChange,
  downloadFormat,
  onDownloadFormatChange,
  chunkSize,
  onChunkSizeChange,
  temperature,
  onTemperatureChange,
  onProcess,
  isProcessing
}: ControlPanelProps) {
  return (
    <div className="w-full md:w-80 lg:w-96 flex-shrink-0">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 sticky top-20">
        <h2 className="text-lg font-semibold mb-4">Engine Controls</h2>
        
        <ModelSelector 
          selectedModel={selectedModel} 
          onModelChange={onModelChange} 
        />
        
        <FileUpload 
          files={files}
          onFilesChange={onFilesChange} 
        />
        
        <OutputSettings 
          streamResponse={streamResponse}
          onStreamResponseChange={onStreamResponseChange}
          saveToHistory={saveToHistory}
          onSaveToHistoryChange={onSaveToHistoryChange}
          downloadFormat={downloadFormat}
          onDownloadFormatChange={onDownloadFormatChange}
        />
        
        <AdvancedOptions 
          chunkSize={chunkSize}
          onChunkSizeChange={onChunkSizeChange}
          temperature={temperature}
          onTemperatureChange={onTemperatureChange}
        />
        
        <div className="pt-2">
          <Button 
            onClick={onProcess}
            disabled={isProcessing}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Process Request</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
