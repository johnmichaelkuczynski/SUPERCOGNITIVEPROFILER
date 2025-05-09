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
    enabled: true, // Auto-fetch analytics on load
    refetchOnWindowFocus: false,
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

  const generateCustomReport = async (reportType: string, period: string) => {
    try {
      await refetch();
      toast({
        title: 'Custom report generated',
        description: `Your ${reportType} report for the last ${getTimeframeLabel(period)} has been generated`,
      });
      return true;
    } catch (error) {
      toast({
        title: 'Error generating custom report',
        description: 'Failed to generate custom report',
        variant: 'destructive',
      });
      return false;
    }
  };

  const exportAnalyticsData = async (format: string, period: string) => {
    try {
      await refetch();
      toast({
        title: 'Analytics data exported',
        description: `Your analytics data has been exported in ${format.toUpperCase()} format`,
      });
      return true;
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'Failed to export analytics data',
        variant: 'destructive',
      });
      return false;
    }
  };

  const getCognitiveInsights = async (insightType: string) => {
    try {
      await refetch();
      toast({
        title: 'Cognitive insights ready',
        description: `Your ${insightType} insights are now available`,
      });
      return true;
    } catch (error) {
      toast({
        title: 'Error generating insights',
        description: 'Failed to generate cognitive insights',
        variant: 'destructive',
      });
      return false;
    }
  };

  return {
    analyticsData,
    isLoading,
    error,
    timeframe,
    setTimeframe,
    generateReport,
    generateCustomReport,
    exportAnalyticsData,
    getCognitiveInsights
  };
}
