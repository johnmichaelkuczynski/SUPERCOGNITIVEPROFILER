import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileBarChart } from 'lucide-react';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import { useAnalytics } from '@/hooks/use-analytics';

export default function Analytics() {
  const { analyticsData, isLoading, timeframe, setTimeframe, generateReport } = useAnalytics();

  return (
    <main className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Analytics</h1>
        <p className="text-slate-600">Track your writing patterns and cognitive trends over time</p>
      </div>
      
      <AnalyticsDashboard 
        analyticsData={analyticsData || null}
        isLoading={isLoading}
        onTimeframeChange={setTimeframe}
        onGenerateReport={generateReport}
      />
      
      <div className="mt-12">
        <h2 className="text-lg font-semibold mb-4">Analytics Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="p-4">
            <h3 className="text-md font-medium mb-2">Custom Reports</h3>
            <p className="text-sm text-slate-600 mb-4">Generate a specialized analysis focusing on specific aspects of your writing and thinking patterns.</p>
            <Button className="w-full text-sm">Create Custom Report</Button>
          </Card>
          
          <Card className="p-4">
            <h3 className="text-md font-medium mb-2">Export Analytics</h3>
            <p className="text-sm text-slate-600 mb-4">Download your analytics data in various formats for further analysis or record-keeping.</p>
            <Button variant="outline" className="w-full text-sm">Export Data</Button>
          </Card>
          
          <Card className="p-4">
            <h3 className="text-md font-medium mb-2">Cognitive Insights</h3>
            <p className="text-sm text-slate-600 mb-4">Detailed analysis of your intellectual frameworks and conceptual patterns over time.</p>
            <Button variant="secondary" className="w-full text-sm">View Insights</Button>
          </Card>
        </div>
      </div>
    </main>
  );
}
