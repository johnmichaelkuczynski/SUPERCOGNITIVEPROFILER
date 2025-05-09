import React from 'react';
import { Download, Copy, Check } from 'lucide-react';
import { LLMModel, countWords, formatDateTime, modelColorMap, modelIconMap } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { downloadOutput } from '@/lib/llm';
import { OutputFormat } from '@/lib/utils';

interface OutputContainerProps {
  content: string;
  model: LLMModel;
  timestamp: Date | null;
  downloadFormat: OutputFormat;
  isLoading: boolean;
}

export default function OutputContainer({ 
  content, 
  model, 
  timestamp, 
  downloadFormat,
  isLoading
}: OutputContainerProps) {
  const { toast } = useToast();
  const [isCopied, setIsCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
      
      toast({
        title: "Copied to clipboard",
        description: "The output has been copied to your clipboard",
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy text to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async () => {
    try {
      // Use current date for filename if no timestamp
      const fileDate = timestamp ? 
        timestamp.toISOString().split('T')[0] : 
        new Date().toISOString().split('T')[0];
      
      const filename = `textmind-output-${fileDate}`;
      
      await downloadOutput(content, downloadFormat, filename);
      
      toast({
        title: "Download started",
        description: `Your ${downloadFormat.toUpperCase()} file is being downloaded`,
      });
    } catch (err) {
      toast({
        title: "Download failed",
        description: "Could not download the output",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-200 flex justify-between items-center">
        <h3 className="text-sm font-medium text-slate-700">Model Output</h3>
        <div className="flex items-center gap-3">
          <button 
            className="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1"
            onClick={handleDownload}
            disabled={!content || isLoading}
          >
            <Download className="h-4 w-4" />
            <span>Download</span>
          </button>
          <button 
            className="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1"
            onClick={handleCopy}
            disabled={!content || isLoading}
          >
            {isCopied ? (
              <>
                <Check className="h-4 w-4" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>
      
      <div className="p-5">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
            <span className="ml-3 text-sm text-slate-600">Processing your request...</span>
          </div>
        ) : content ? (
          <div className="text-sm text-slate-800 prose prose-slate max-w-none">
            {/* Use as dangerouslySetInnerHTML if LLM output is Markdown/HTML, but with sanitization */}
            {content.split('\n').map((line, index) => (
              <React.Fragment key={index}>
                {line}
                <br />
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-sm text-slate-500">Output will appear here after processing</p>
            <p className="text-xs text-slate-400 mt-1">Enter a prompt and click 'Process Request'</p>
          </div>
        )}
      </div>
      
      {(content && timestamp) && (
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${modelColorMap[model]}`}>
              <i className={`${modelIconMap[model]} text-xs mr-1`}></i>
              {model === 'claude' ? 'Claude' : model === 'gpt4' ? 'GPT-4' : 'Perplexity'}
            </span>
            <span className="text-xs text-slate-500">{formatDateTime(timestamp)}</span>
          </div>
          <div className="text-xs text-slate-500">{countWords(content)} words</div>
        </div>
      )}
    </div>
  );
}
