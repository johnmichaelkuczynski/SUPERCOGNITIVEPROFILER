import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

interface AdvancedOptionsProps {
  chunkSize: string;
  onChunkSizeChange: (size: string) => void;
  temperature: number;
  onTemperatureChange: (temp: number) => void;
}

export default function AdvancedOptions({
  chunkSize,
  onChunkSizeChange,
  temperature,
  onTemperatureChange
}: AdvancedOptionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-6">
      <button 
        className="flex w-full items-center justify-between text-sm font-medium text-slate-700 mb-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>Advanced Options</span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>
      
      {isOpen && (
        <div className="space-y-3">
          <div>
            <Label className="text-sm text-slate-600 block mb-1">Chunk Size</Label>
            <Select value={chunkSize} onValueChange={onChunkSizeChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Default (Auto)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Default (Auto)</SelectItem>
                <SelectItem value="small">Small (1,000 tokens)</SelectItem>
                <SelectItem value="medium">Medium (2,000 tokens)</SelectItem>
                <SelectItem value="large">Large (4,000 tokens)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="text-sm text-slate-600 block mb-1">Temperature: {temperature.toFixed(1)}</Label>
            <Slider 
              value={[temperature]}
              min={0} 
              max={1} 
              step={0.1} 
              onValueChange={(values) => onTemperatureChange(values[0])} 
              className="mt-2"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>Precise</span>
              <span>Balanced</span>
              <span>Creative</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
