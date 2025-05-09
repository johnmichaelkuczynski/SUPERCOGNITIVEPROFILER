import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OutputFormat } from '@/lib/utils';

interface OutputSettingsProps {
  streamResponse: boolean;
  onStreamResponseChange: (value: boolean) => void;
  saveToHistory: boolean;
  onSaveToHistoryChange: (value: boolean) => void;
  downloadFormat: OutputFormat;
  onDownloadFormatChange: (format: OutputFormat) => void;
}

export default function OutputSettings({
  streamResponse,
  onStreamResponseChange,
  saveToHistory,
  onSaveToHistoryChange,
  downloadFormat,
  onDownloadFormatChange
}: OutputSettingsProps) {
  
  return (
    <div className="mb-6">
      <h3 className="block text-sm font-medium text-slate-700 mb-2">Output Settings</h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="stream-toggle" className="text-sm text-slate-600">Stream Response</Label>
          <Switch 
            id="stream-toggle" 
            checked={streamResponse} 
            onCheckedChange={onStreamResponseChange} 
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="history-toggle" className="text-sm text-slate-600">Save to History</Label>
          <Switch 
            id="history-toggle" 
            checked={saveToHistory} 
            onCheckedChange={onSaveToHistoryChange} 
          />
        </div>
        
        <div>
          <Label htmlFor="download-format" className="text-sm text-slate-600 block mb-1">Download Format</Label>
          <Select value={downloadFormat} onValueChange={(value) => onDownloadFormatChange(value as OutputFormat)}>
            <SelectTrigger id="download-format" className="w-full">
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="txt">Plain Text (.txt)</SelectItem>
              <SelectItem value="pdf">PDF Document (.pdf)</SelectItem>
              <SelectItem value="docx">Word Document (.docx)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
