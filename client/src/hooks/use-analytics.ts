import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnalyticsData, getAnalytics } from '@/lib/llm';
import { useToast } from '@/hooks/use-toast';

export function useAnalytics() {
  const [timeframe, setTimeframe] = useState<string>('7days');
  const { toast } = useToast();

  const { data: analyticsData, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/analytics', timeframe],
    queryFn: () => getAnalytics(timeframe),
    enabled: false, // We don't want to auto-fetch analytics by default
  });

  const generateReport = async () => {
    try {
      await refetch();
      toast({
        title: 'Analytics report generated',
        description: `Report for the last ${getTimeframeLabel(timeframe)} has been generated`,
      });
    } catch (error) {
      toast({
        title: 'Error generating report',
        description: 'Failed to generate analytics report',
        variant: 'destructive',
      });
    }
  };

  const getTimeframeLabel = (tf: string): string => {
    switch (tf) {
      case '7days': return '7 days';
      case '30days': return '30 days';
      case '3months': return '3 months';
      case '6months': return '6 months';
      default: return timeframe;
    }
  };

  return {
    analyticsData,
    isLoading,
    error,
    timeframe,
    setTimeframe,
    generateReport,
  };
}
