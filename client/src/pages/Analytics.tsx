import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileBarChart, BarChart2, FileText, Brain, Download } from 'lucide-react';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import { useAnalytics } from '@/hooks/use-analytics';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

export default function Analytics() {
  const { 
    analyticsData, 
    isLoading, 
    timeframe, 
    setTimeframe, 
    generateReport,
    generateCustomReport,
    exportAnalyticsData,
    getCognitiveInsights
  } = useAnalytics();
  const { toast } = useToast();
  
  // State for dialogs
  const [customReportOpen, setCustomReportOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [insightsDialogOpen, setInsightsDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'pdf'>('json');
  const [reportType, setReportType] = useState<'writing' | 'cognitive' | 'comprehensive'>('comprehensive');
  const [insightType, setInsightType] = useState<'patterns' | 'evolution' | 'frameworks'>('patterns');

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
            <Button 
              className="w-full text-sm" 
              onClick={() => setCustomReportOpen(true)}
            >
              <FileText className="h-4 w-4 mr-2" />
              Create Custom Report
            </Button>
          </Card>
          
          <Card className="p-4">
            <h3 className="text-md font-medium mb-2">Export Analytics</h3>
            <p className="text-sm text-slate-600 mb-4">Download your analytics data in various formats for further analysis or record-keeping.</p>
            <Button 
              variant="outline" 
              className="w-full text-sm"
              onClick={() => setExportDialogOpen(true)}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </Card>
          
          <Card className="p-4">
            <h3 className="text-md font-medium mb-2">Cognitive Insights</h3>
            <p className="text-sm text-slate-600 mb-4">Detailed analysis of your intellectual frameworks and conceptual patterns over time.</p>
            <Button 
              variant="secondary" 
              className="w-full text-sm"
              onClick={() => setInsightsDialogOpen(true)}
            >
              <Brain className="h-4 w-4 mr-2" />
              View Insights
            </Button>
          </Card>
        </div>
      </div>
      
      {/* Custom Report Dialog */}
      <Dialog open={customReportOpen} onOpenChange={setCustomReportOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Custom Report</DialogTitle>
            <DialogDescription>
              Generate specialized analytics focusing on specific aspects of your writing patterns.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="mb-4">
              <label className="text-sm font-medium mb-1 block">Report Type</label>
              <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="writing">Writing Style Analysis</SelectItem>
                  <SelectItem value="cognitive">Cognitive Framework Analysis</SelectItem>
                  <SelectItem value="comprehensive">Comprehensive Profile</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="mb-4">
              <label className="text-sm font-medium mb-1 block">Time Period</label>
              <Select defaultValue="30days" onValueChange={(value: any) => setTimeframe(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="90days">Last Quarter</SelectItem>
                  <SelectItem value="365days">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomReportOpen(false)}>Cancel</Button>
            <Button onClick={async () => {
              const success = await generateCustomReport(reportType, timeframe);
              if (success) {
                setCustomReportOpen(false);
              }
            }}>Generate Report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Export Analytics Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export Analytics Data</DialogTitle>
            <DialogDescription>
              Download your analytics data in various formats.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="mb-4">
              <label className="text-sm font-medium mb-1 block">Export Format</label>
              <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="pdf">PDF Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="mb-4">
              <label className="text-sm font-medium mb-1 block">Time Period</label>
              <Select defaultValue="all" onValueChange={(value: any) => setTimeframe(value !== 'all' ? value : '365days')}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7days">Last 7 Days</SelectItem>
                  <SelectItem value="30days">Last 30 Days</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportDialogOpen(false)}>Cancel</Button>
            <Button onClick={async () => {
              const success = await exportAnalyticsData(exportFormat, timeframe);
              if (success) {
                setExportDialogOpen(false);
              }
            }}>Export</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Cognitive Insights Dialog */}
      <Dialog open={insightsDialogOpen} onOpenChange={setInsightsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cognitive Insights</DialogTitle>
            <DialogDescription>
              Explore detailed analysis of your intellectual frameworks.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="mb-4">
              <label className="text-sm font-medium mb-1 block">Insight Type</label>
              <Select value={insightType} onValueChange={(value: any) => setInsightType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select insight type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="patterns">Cognitive Patterns</SelectItem>
                  <SelectItem value="evolution">Intellectual Evolution</SelectItem>
                  <SelectItem value="frameworks">Mental Frameworks</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInsightsDialogOpen(false)}>Cancel</Button>
            <Button onClick={async () => {
              const success = await getCognitiveInsights(insightType);
              if (success) {
                setInsightsDialogOpen(false);
              }
            }}>View Insights</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
