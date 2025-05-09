import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { LLMPrompt, LLMResponse, sendPrompt, processFile as apiProcessFile } from '@/lib/llm';
import { LLMModel, countWords } from '@/lib/utils';

export function useLLM() {
  const [response, setResponse] = useState<LLMResponse | null>(null);
  const { toast } = useToast();

  const { mutate, isPending, error } = useMutation({
    mutationFn: async (prompt: LLMPrompt): Promise<LLMResponse> => {
      try {
        const response = await sendPrompt(prompt);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to process request');
        }
        
        // Handle streaming vs. non-streaming responses
        if (prompt.stream) {
          // For streaming, we'd set up a different handling mechanism
          // This is a simplified approach
          const reader = response.body!.getReader();
          let result = '';
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = new TextDecoder().decode(value);
            result += chunk;
            
            // Update response incrementally
            setResponse({
              content: result,
              model: prompt.model,
              timestamp: new Date(),
              wordCount: countWords(result)
            });
          }
          
          return {
            content: result,
            model: prompt.model,
            timestamp: new Date(),
            wordCount: countWords(result)
          };
        } else {
          // For non-streaming, just get the full response
          const data = await response.json();
          
          return {
            content: data.content,
            model: prompt.model,
            timestamp: new Date(),
            wordCount: countWords(data.content)
          };
        }
      } catch (error) {
        console.error('Error processing LLM request:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      setResponse(data);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error processing request',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    },
  });

  const generateText = (prompt: string, model: LLMModel, options: Partial<LLMPrompt> = {}) => {
    mutate({
      content: prompt,
      model,
      stream: options.stream ?? true,
      temperature: options.temperature ?? 0.7,
      files: options.files,
      chunkSize: options.chunkSize,
      maxTokens: options.maxTokens,
    });
  };

  // Method to handle file processing
  const processFile = async (file: File): Promise<string> => {
    try {
      return await apiProcessFile(file);
    } catch (error) {
      toast({
        title: 'Error processing file',
        description: error instanceof Error ? error.message : 'Failed to process file',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return {
    generateText,
    response,
    isProcessing: isPending,
    error,
    processFile,
  };
}
