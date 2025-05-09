import React from 'react';
import { cn, LLMModel, modelIconMap } from '@/lib/utils';

interface ModelSelectorProps {
  selectedModel: LLMModel;
  onModelChange: (model: LLMModel) => void;
}

export default function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  const models: LLMModel[] = ['claude', 'gpt4', 'perplexity'];
  
  const modelNames: Record<LLMModel, string> = {
    'claude': 'Claude',
    'gpt4': 'GPT-4',
    'perplexity': 'Perplexity'
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-slate-700 mb-2">Select Language Model</label>
      <div className="grid grid-cols-3 gap-2">
        {models.map((model) => (
          <button
            key={model}
            onClick={() => onModelChange(model)}
            className={cn(
              "model-btn flex flex-col items-center justify-center p-3 rounded-lg border-2 text-center transition",
              selectedModel === model
                ? "border-primary-500 bg-primary-50"
                : "border-transparent bg-slate-100 hover:bg-slate-200"
            )}
          >
            <i className={cn(
              `${modelIconMap[model]} text-lg mb-1`,
              selectedModel === model ? "text-primary-600" : "text-slate-600"
            )}></i>
            <span className="text-xs font-medium">{modelNames[model]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
