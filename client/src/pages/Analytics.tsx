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
  
  // State for dialogs and results
  const [customReportOpen, setCustomReportOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [insightsDialogOpen, setInsightsDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'pdf'>('json');
  const [reportType, setReportType] = useState<'writing' | 'cognitive' | 'comprehensive'>('comprehensive');
  const [insightType, setInsightType] = useState<'patterns' | 'evolution' | 'frameworks'>('patterns');
  
  // Results states
  const [showInsights, setShowInsights] = useState(false);
  const [showReport, setShowReport] = useState(false);

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
      
      {/* Insights Section - Displayed when insights are available */}
      {showInsights && (
        <div className="mt-8 bg-white rounded-xl shadow-md border border-slate-200 p-6">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-slate-800">
              {insightType === 'patterns' ? 'Cognitive Patterns' : 
               insightType === 'evolution' ? 'Intellectual Evolution' : 
               'Mental Frameworks'} Insights
            </h2>
            <Button variant="outline" size="sm" onClick={() => setShowInsights(false)}>
              Close
            </Button>
          </div>
          
          <div className="space-y-6">
            {/* Insights Content - Based on the selected insight type */}
            {insightType === 'patterns' && (
              <>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h3 className="font-medium text-slate-800 mb-2">Recurring Thought Patterns</h3>
                  <p className="text-slate-600 mb-3">Your writing shows a consistent focus on epistemological frameworks, particularly in how knowledge is constructed and validated.</p>
                  <div className="bg-white p-3 rounded border border-slate-200">
                    <p className="text-sm italic text-slate-700">"You consistently approach topics through a framework of questioning assumptions and examining foundational knowledge structures."</p>
                  </div>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h3 className="font-medium text-slate-800 mb-2">Information Processing Style</h3>
                  <p className="text-slate-600 mb-3">Your cognitive pattern shows a notable preference for systematic analysis with strong integration of multiple perspectives.</p>
                  <div className="flex gap-3 mt-2">
                    <div className="flex-1 bg-blue-50 p-3 rounded border border-blue-100">
                      <h4 className="text-sm font-medium text-blue-700 mb-1">Analytical Depth</h4>
                      <div className="h-2 bg-blue-200 rounded">
                        <div className="h-2 bg-blue-600 rounded" style={{ width: '85%' }}></div>
                      </div>
                    </div>
                    <div className="flex-1 bg-purple-50 p-3 rounded border border-purple-100">
                      <h4 className="text-sm font-medium text-purple-700 mb-1">Conceptual Integration</h4>
                      <div className="h-2 bg-purple-200 rounded">
                        <div className="h-2 bg-purple-600 rounded" style={{ width: '78%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h3 className="font-medium text-slate-800 mb-2">Conceptual Keywords</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">epistemology</span>
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">knowledge structures</span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">systematic analysis</span>
                    <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs">logical frameworks</span>
                    <span className="px-2 py-1 bg-rose-100 text-rose-800 rounded-full text-xs">conceptual integration</span>
                    <span className="px-2 py-1 bg-sky-100 text-sky-800 rounded-full text-xs">critical inquiry</span>
                  </div>
                </div>
              </>
            )}
            
            {insightType === 'evolution' && (
              <>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h3 className="font-medium text-slate-800 mb-2">Intellectual Development Timeline</h3>
                  <p className="text-slate-600 mb-3">Analysis of your writing shows the following evolution in your intellectual approach:</p>
                  <div className="space-y-4 mt-4">
                    <div className="flex">
                      <div className="w-24 text-sm text-slate-500">Initial Phase</div>
                      <div className="flex-1 pl-4 border-l-2 border-slate-300">
                        <p className="text-sm text-slate-700">Focus on foundational concepts with emphasis on classical frameworks</p>
                      </div>
                    </div>
                    <div className="flex">
                      <div className="w-24 text-sm text-slate-500">Developing Phase</div>
                      <div className="flex-1 pl-4 border-l-2 border-slate-300">
                        <p className="text-sm text-slate-700">Integration of multiple perspectives with more nuanced understanding</p>
                      </div>
                    </div>
                    <div className="flex">
                      <div className="w-24 text-sm text-slate-500">Current Phase</div>
                      <div className="flex-1 pl-4 border-l-2 border-slate-300">
                        <p className="text-sm text-slate-700">Synthesis of complex ideas with original theoretical contributions</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h3 className="font-medium text-slate-800 mb-2">Concept Maturation</h3>
                  <p className="text-slate-600 mb-3">Key concepts in your writing have evolved in sophistication:</p>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div className="bg-white p-3 rounded border border-slate-200">
                      <h4 className="text-sm font-medium text-slate-800 mb-1">Epistemological Frameworks</h4>
                      <div className="flex items-center">
                        <div className="w-1/3 text-xs text-slate-500">Initial</div>
                        <div className="w-1/3 text-center">→</div>
                        <div className="w-1/3 text-right text-xs text-slate-500">Advanced</div>
                      </div>
                      <div className="h-2 bg-slate-100 rounded mt-1">
                        <div className="h-2 bg-gradient-to-r from-blue-400 to-blue-600 rounded" style={{ width: '92%' }}></div>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded border border-slate-200">
                      <h4 className="text-sm font-medium text-slate-800 mb-1">Methodological Approaches</h4>
                      <div className="flex items-center">
                        <div className="w-1/3 text-xs text-slate-500">Initial</div>
                        <div className="w-1/3 text-center">→</div>
                        <div className="w-1/3 text-right text-xs text-slate-500">Advanced</div>
                      </div>
                      <div className="h-2 bg-slate-100 rounded mt-1">
                        <div className="h-2 bg-gradient-to-r from-purple-400 to-purple-600 rounded" style={{ width: '85%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
            
            {insightType === 'frameworks' && (
              <>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h3 className="font-medium text-slate-800 mb-2">Primary Mental Frameworks</h3>
                  <p className="text-slate-600 mb-3">Your writing reveals the following dominant cognitive frameworks:</p>
                  <div className="space-y-3 mt-3">
                    <div className="bg-white p-3 rounded border border-slate-200">
                      <h4 className="text-sm font-medium text-slate-800 mb-1">Analytical Framework</h4>
                      <p className="text-sm text-slate-600">Systematic decomposition of complex topics with focus on logical structures and patterns</p>
                      <div className="mt-2 flex items-center">
                        <span className="text-xs text-slate-500 mr-2">Utilization:</span>
                        <div className="flex-1 h-2 bg-slate-100 rounded">
                          <div className="h-2 bg-blue-500 rounded" style={{ width: '88%' }}></div>
                        </div>
                        <span className="text-xs font-medium ml-2">88%</span>
                      </div>
                    </div>
                    
                    <div className="bg-white p-3 rounded border border-slate-200">
                      <h4 className="text-sm font-medium text-slate-800 mb-1">Integrative Framework</h4>
                      <p className="text-sm text-slate-600">Connecting disparate concepts into cohesive theoretical structures</p>
                      <div className="mt-2 flex items-center">
                        <span className="text-xs text-slate-500 mr-2">Utilization:</span>
                        <div className="flex-1 h-2 bg-slate-100 rounded">
                          <div className="h-2 bg-purple-500 rounded" style={{ width: '76%' }}></div>
                        </div>
                        <span className="text-xs font-medium ml-2">76%</span>
                      </div>
                    </div>
                    
                    <div className="bg-white p-3 rounded border border-slate-200">
                      <h4 className="text-sm font-medium text-slate-800 mb-1">Critical Framework</h4>
                      <p className="text-sm text-slate-600">Evaluation of assumptions and evidence with emphasis on validity and rigor</p>
                      <div className="mt-2 flex items-center">
                        <span className="text-xs text-slate-500 mr-2">Utilization:</span>
                        <div className="flex-1 h-2 bg-slate-100 rounded">
                          <div className="h-2 bg-green-500 rounded" style={{ width: '82%' }}></div>
                        </div>
                        <span className="text-xs font-medium ml-2">82%</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h3 className="font-medium text-slate-800 mb-2">Cognitive Architecture</h3>
                  <p className="text-slate-600 mb-3">Visualization of how your mental frameworks interact:</p>
                  <div className="bg-white p-4 rounded border border-slate-200 mt-2">
                    <div className="h-48 flex items-center justify-center">
                      <div className="relative w-full max-w-sm h-full">
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-800 text-sm font-medium border-2 border-blue-300">
                          Core<br/>Frameworks
                        </div>
                        <div className="absolute top-1/4 left-1/4 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-purple-800 text-xs font-medium border-2 border-purple-300">
                          Analytical
                        </div>
                        <div className="absolute top-1/4 right-1/4 transform translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-800 text-xs font-medium border-2 border-green-300">
                          Critical
                        </div>
                        <div className="absolute bottom-1/4 left-1/4 transform -translate-x-1/2 translate-y-1/2 w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-800 text-xs font-medium border-2 border-amber-300">
                          Integrative
                        </div>
                        <div className="absolute bottom-1/4 right-1/4 transform translate-x-1/2 translate-y-1/2 w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center text-sky-800 text-xs font-medium border-2 border-sky-300">
                          Creative
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Custom Report Section - Displayed when a report is generated */}
      {showReport && (
        <div className="mt-8 bg-white rounded-xl shadow-md border border-slate-200 p-6">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-slate-800">
              {reportType === 'writing' ? 'Writing Style Analysis' : 
               reportType === 'cognitive' ? 'Cognitive Framework Analysis' : 
               'Comprehensive Profile'} Report
            </h2>
            <Button variant="outline" size="sm" onClick={() => setShowReport(false)}>
              Close
            </Button>
          </div>
          
          <div className="prose max-w-none">
            <h3>Analysis Summary</h3>
            <p>
              This {reportType} report analyzes your writing patterns and cognitive frameworks
              based on documents from the past {timeframe === '7days' ? 'week' : 
                                               timeframe === '30days' ? 'month' : 
                                               timeframe === '90days' ? 'quarter' : 'year'}.
            </p>
            
            <h3>Key Findings</h3>
            <ul>
              <li>Your writing demonstrates a high level of analytical depth with consistent logical structure</li>
              <li>The cognitive patterns reveal a systematic approach to knowledge acquisition</li>
              <li>Your conceptual frameworks show strong integration of multiple theoretical perspectives</li>
            </ul>
            
            <h3>Recommendations</h3>
            <p>
              Based on the analysis, we recommend exploring more diverse writing styles to expand your
              cognitive flexibility and expressive range. Your natural strengths in analytical thinking could
              be complemented by more narrative or metaphorical approaches.
            </p>
          </div>
        </div>
      )}
      
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
                setShowReport(true);
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
                setShowInsights(true);
              }
            }}>View Insights</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
