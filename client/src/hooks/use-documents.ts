import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Document, getDocuments, processFile } from '@/lib/llm';
import { useToast } from '@/hooks/use-toast';

export function useDocuments() {
  const [processedContent, setProcessedContent] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: documents = [], isLoading, error } = useQuery({
    queryKey: ['/api/documents'],
    queryFn: getDocuments,
  });

  const { mutate: processFiles, isPending: isProcessing } = useMutation({
    mutationFn: async (files: File[]) => {
      const contents = [];
      
      for (const file of files) {
        try {
          const content = await processFile(file);
          contents.push(content);
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
          throw error;
        }
      }
      
      return contents;
    },
    onSuccess: (contents) => {
      setProcessedContent(contents);
      toast({
        title: 'Files processed successfully',
        description: `${contents.length} files have been processed and are ready to use`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error processing files',
        description: error.message || 'Failed to process uploaded files',
        variant: 'destructive',
      });
    },
  });

  const getRecentDocuments = (limit: number = 3): Document[] => {
    // Sort by date (newest first) and limit
    return [...documents]
      .sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, limit);
  };

  return {
    documents,
    isLoading,
    error,
    processFiles,
    isProcessing,
    processedContent,
    getRecentDocuments,
    refetch: () => queryClient.invalidateQueries({queryKey: ['/api/documents']}),
  };
}
