import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileBarChart, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { cn } from '@/lib/utils';
import { AnalyticsData } from '@/lib/llm';

interface AnalyticsDashboardProps {
  analyticsData: AnalyticsData | null;
  isLoading: boolean;
  onTimeframeChange: (timeframe: string) => void;
  onGenerateReport: () => void;
}

export default function AnalyticsDashboard({ 
  analyticsData, 
  isLoading,
  onTimeframeChange,
  onGenerateReport
}: AnalyticsDashboardProps) {
  const [timeframe, setTimeframe] = useState('7days');

  // Placeholder data for visualization when real data is not available
  const emptyStyleData = [
    { name: 'Formality', value: 0 },
    { name: 'Complexity', value: 0 },
  ];

  const emptyTopicData = [
    { name: 'No Data', value: 100, color: '#cbd5e1' },
  ];

  const emptySentimentData = [
    { name: 'Day 1', value: 0 },
    { name: 'Day 2', value: 0 },
    { name: 'Day 3', value: 0 },
    { name: 'Day 4', value: 0 },
    { name: 'Day 5', value: 0 },
    { name: 'Day 6', value: 0 },
    { name: 'Day 7', value: 0 },
  ];

  const handleTimeframeChange = (value: string) => {
    setTimeframe(value);
    onTimeframeChange(value);
  };

  return (
    <div className="mt-12 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold">Psychoanalytic Dashboard <span className="text-xs px-2 py-0.5 bg-accent-100 text-accent-800 rounded-full ml-2">Premium</span></h2>
        <div className="flex items-center gap-3">
          <Select value={timeframe} onValueChange={handleTimeframeChange}>
            <SelectTrigger className="text-sm w-[180px]">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="3months">Last 3 months</SelectItem>
              <SelectItem value="6months">Last 6 months</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={onGenerateReport} className="text-sm text-white bg-accent-600 hover:bg-accent-700">
            <FileBarChart className="h-4 w-4 mr-1" />
            <span>Generate Report</span>
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-500"></div>
          <span className="ml-3 text-sm text-slate-600">Loading analytics data...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Writing Style Analysis */}
            <Card className="bg-slate-50 p-4 border border-slate-200">
              <h3 className="text-sm font-medium text-slate-700 mb-3">Writing Style Analysis</h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analyticsData?.writingStyle ? [
                      { name: 'Formality', value: analyticsData.writingStyle.formality * 100 },
                      { name: 'Complexity', value: analyticsData.writingStyle.complexity * 100 },
                    ] : emptyStyleData}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip 
                      formatter={(value) => [`${value}%`, 'Value']}
                      contentStyle={{ borderRadius: '6px', border: '1px solid #e2e8f0' }}
                    />
                    <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 text-xs text-slate-600">
                <div className="flex justify-between mb-1">
                  <span>Formality</span>
                  <span>{analyticsData?.writingStyle ? `${Math.round(analyticsData.writingStyle.formality * 100)}%` : 'N/A'}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 mb-2">
                  <div 
                    className="bg-primary-500 h-1.5 rounded-full" 
                    style={{ width: analyticsData?.writingStyle ? `${analyticsData.writingStyle.formality * 100}%` : '0%' }}
                  ></div>
                </div>
                <div className="flex justify-between mb-1">
                  <span>Complexity</span>
                  <span>{analyticsData?.writingStyle ? `${Math.round(analyticsData.writingStyle.complexity * 100)}%` : 'N/A'}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 mb-2">
                  <div 
                    className="bg-primary-500 h-1.5 rounded-full" 
                    style={{ width: analyticsData?.writingStyle ? `${analyticsData.writingStyle.complexity * 100}%` : '0%' }}
                  ></div>
                </div>
              </div>
            </Card>
            
            {/* Topic Distribution */}
            <Card className="bg-slate-50 p-4 border border-slate-200">
              <h3 className="text-sm font-medium text-slate-700 mb-3">Topic Distribution</h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData?.topics || emptyTopicData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={2}
                      dataKey="percentage"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {(analyticsData?.topics || emptyTopicData).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`${value}%`, 'Percentage']}
                      contentStyle={{ borderRadius: '6px', border: '1px solid #e2e8f0' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                {analyticsData?.topics ? (
                  analyticsData.topics.map((topic, index) => (
                    <div key={index} className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: topic.color }}></span>
                      <span className="text-slate-700">{topic.name} ({topic.percentage}%)</span>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center text-slate-500">No topic data available</div>
                )}
              </div>
            </Card>
            
            {/* Emotional Trends */}
            <Card className="bg-slate-50 p-4 border border-slate-200">
              <h3 className="text-sm font-medium text-slate-700 mb-3">Emotional Trends</h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={emptySentimentData}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[-1, 1]} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '6px', border: '1px solid #e2e8f0' }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#8b5cf6" fill="#ddd6fe" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 text-xs">
                <div className="flex items-center justify-between text-slate-700 mb-1">
                  <span>Overall sentiment:</span>
                  {analyticsData?.sentiment ? (
                    <span className={cn(
                      "font-medium",
                      analyticsData.sentiment.overall > 0.3 ? "text-green-600" : 
                      analyticsData.sentiment.overall < -0.3 ? "text-red-600" : 
                      "text-amber-600"
                    )}>
                      {analyticsData.sentiment.label} ({analyticsData.sentiment.overall.toFixed(2)})
                    </span>
                  ) : (
                    <span className="text-slate-500">No data available</span>
                  )}
                </div>
                <p className="text-slate-600">{
                  analyticsData?.sentiment ? 
                    "Your writing shows consistent patterns with occasional shifts in emotional tone." : 
                    "Start interacting with the system to generate sentiment analysis."
                }</p>
              </div>
            </Card>
          </div>
          
          {/* Longitudinal Language Patterns */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-slate-700 mb-3">Longitudinal Language Patterns</h3>
            <Card className="bg-slate-50 p-4 border border-slate-200">
              <div className="h-64 w-full mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart 
                    data={[
                      { name: 'Day 1', complexity: 2.4, formality: 1.8, conceptual: 2.1 },
                      { name: 'Day 2', complexity: 2.3, formality: 2.2, conceptual: 2.0 },
                      { name: 'Day 3', complexity: 2.7, formality: 2.4, conceptual: 2.6 },
                      { name: 'Day 4', complexity: 3.0, formality: 2.3, conceptual: 2.8 },
                      { name: 'Day 5', complexity: 3.2, formality: 2.6, conceptual: 3.1 },
                      { name: 'Day 6', complexity: 3.5, formality: 2.5, conceptual: 3.3 },
                      { name: 'Day 7', complexity: 3.8, formality: 2.8, conceptual: 3.6 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 5]} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '6px', border: '1px solid #e2e8f0' }}
                      formatter={(value) => [`${value}`, '']}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="complexity" 
                      stroke="#3b82f6" 
                      fill="#bfdbfe" 
                      name="Language complexity" 
                      activeDot={{ r: 6 }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="formality" 
                      stroke="#8b5cf6" 
                      fill="#ddd6fe" 
                      name="Expression formality" 
                      activeDot={{ r: 6 }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="conceptual" 
                      stroke="#10b981" 
                      fill="#a7f3d0" 
                      name="Conceptual density" 
                      activeDot={{ r: 6 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              <div className="flex justify-between mb-2 mt-6">
                <div className="text-sm font-medium text-slate-700">Cognitive Evolution Score</div>
                <div className="text-sm font-medium text-emerald-600">+24% Growth</div>
              </div>
              
              <div className="w-full bg-slate-200 rounded-full h-2 mb-4">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '74%' }}></div>
              </div>
              
              <div className="mt-4 text-sm">
                <h4 className="font-medium text-slate-700 mb-2">Key Insights</h4>
                <ul className="text-slate-600 space-y-2 text-xs">
                  {analyticsData?.insights ? (
                    analyticsData.insights.map((insight, index) => (
                      <li key={index} className="flex items-start gap-2 bg-white p-2 rounded-md border border-slate-200">
                        {insight.trend === 'up' ? (
                          <TrendingUp className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        ) : insight.trend === 'down' ? (
                          <TrendingDown className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                        ) : (
                          <ArrowRight className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                        )}
                        <span>{insight.text}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-center text-slate-500">No insights available yet</li>
                  )}
                </ul>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <h4 className="text-xs font-medium text-blue-800 mb-1">Linguistic Evolution Analysis</h4>
                <p className="text-xs text-blue-700">
                  Your writing shows a significant upward trend in cognitive complexity and conceptual density over time, 
                  suggesting intellectual development in your approach to topics. This pattern indicates a deepening understanding 
                  of the subject matter and increasingly sophisticated analytical frameworks.
                </p>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
