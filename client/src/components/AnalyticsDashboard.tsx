import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileBarChart, TrendingUp, TrendingDown, Brain, Target, Activity, Zap } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
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

  const handleTimeframeChange = (value: string) => {
    setTimeframe(value);
    onTimeframeChange(value);
  };

  if (isLoading) {
    return (
      <div className="mt-12 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-500"></div>
          <span className="ml-3 text-sm text-slate-600">Analyzing cognitive patterns...</span>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="mt-12 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="text-center py-12">
          <Brain className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">No Analytics Data</h3>
          <p className="text-slate-600">Upload documents to begin psychoanalytic profiling</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-12 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-semibold text-slate-900">
          Cognitive Psychoanalysis Dashboard
          <span className="text-xs px-2 py-0.5 bg-accent-100 text-accent-800 rounded-full ml-2">Advanced</span>
        </h2>
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

      {/* Cognitive Archetype */}
      <div className="mb-8">
        <Card className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <Brain className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-semibold text-slate-900">
                  Cognitive Archetype: {analyticsData.cognitiveArchetype.type.replace('_', ' ').toUpperCase()}
                </h3>
                <div className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                  {Math.round(analyticsData.cognitiveArchetype.confidence * 100)}% confidence
                </div>
              </div>
              <p className="text-slate-700 mb-3">{analyticsData.cognitiveArchetype.description}</p>
              <div className="flex flex-wrap gap-2">
                {analyticsData.cognitiveArchetype.traits.map((trait, index) => (
                  <span key={index} className="px-2 py-1 bg-white text-slate-700 text-xs rounded-full border border-indigo-200">
                    {trait}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Writing Style Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Target className="h-5 w-5 mr-2 text-blue-600" />
            Formality Analysis
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Overall Score</span>
              <span className="text-lg font-semibold">{Math.round(analyticsData.writingStyle.formality.score * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${analyticsData.writingStyle.formality.score * 100}%` }}
              ></div>
            </div>
            <div className="text-xs text-slate-500">
              {analyticsData.writingStyle.formality.percentile}th percentile
            </div>
            
            <div className="space-y-2 mt-4">
              <div className="flex justify-between text-sm">
                <span>Tone Register</span>
                <span>{Math.round(analyticsData.writingStyle.formality.subdimensions.toneRegister * 100)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Hedging Frequency</span>
                <span>{Math.round(analyticsData.writingStyle.formality.subdimensions.hedgingFrequency * 100)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Contraction Rate</span>
                <span>{Math.round(analyticsData.writingStyle.formality.subdimensions.contractionRate * 100)}%</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Activity className="h-5 w-5 mr-2 text-green-600" />
            Complexity Analysis
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Overall Score</span>
              <span className="text-lg font-semibold">{Math.round(analyticsData.writingStyle.complexity.score * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full" 
                style={{ width: `${analyticsData.writingStyle.complexity.score * 100}%` }}
              ></div>
            </div>
            <div className="text-xs text-slate-500">
              {analyticsData.writingStyle.complexity.percentile}th percentile
            </div>
            
            <div className="space-y-2 mt-4">
              <div className="flex justify-between text-sm">
                <span>Clause Density</span>
                <span>{Math.round(analyticsData.writingStyle.complexity.subdimensions.clauseDensity * 100)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Lexical Rarity</span>
                <span>{Math.round(analyticsData.writingStyle.complexity.subdimensions.lexicalRarity * 100)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Embedded Structure Rate</span>
                <span>{Math.round(analyticsData.writingStyle.complexity.subdimensions.embeddedStructureRate * 100)}%</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Cognitive Signatures */}
      <Card className="p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Zap className="h-5 w-5 mr-2 text-purple-600" />
          Cognitive Signatures
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {Math.round(analyticsData.writingStyle.cognitiveSignatures.nestedHypotheticals * 100)}%
            </div>
            <div className="text-xs text-slate-600">Nested Hypotheticals</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {Math.round(analyticsData.writingStyle.cognitiveSignatures.anaphoricReasoning * 100)}%
            </div>
            <div className="text-xs text-slate-600">Anaphoric Reasoning</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {Math.round(analyticsData.writingStyle.cognitiveSignatures.structuralAnalogies * 100)}%
            </div>
            <div className="text-xs text-slate-600">Structural Analogies</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {Math.round(analyticsData.writingStyle.cognitiveSignatures.dialecticalVsDidactic * 100)}%
            </div>
            <div className="text-xs text-slate-600">Dialectical vs Didactic</div>
          </div>
        </div>
      </Card>

      {/* Topic Distribution with Psychology */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Topic Distribution</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analyticsData.topicDistribution.dominant}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="percentage"
                  label={({ name, percentage }) => `${name} ${percentage}%`}
                >
                  {analyticsData.topicDistribution.dominant.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Psychological Interpretation</h3>
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-sm font-medium text-blue-800 mb-1">Cognitive Style</div>
              <div className="text-sm text-blue-700">{analyticsData.topicDistribution.cognitiveStyle}</div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="text-sm font-medium text-purple-800 mb-1">Interpretation</div>
              <div className="text-sm text-purple-700">{analyticsData.topicDistribution.interpretation}</div>
            </div>
            <div className="space-y-2">
              {analyticsData.topicDistribution.dominant.slice(0, 3).map((topic, index) => (
                <div key={index} className="text-xs">
                  <span className="font-medium">{topic.name}:</span>
                  <span className="text-slate-600 ml-1">{topic.psychologicalImplication}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Longitudinal Patterns */}
      {analyticsData.longitudinalPatterns.length > 0 && (
        <Card className="p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Longitudinal Cognitive Evolution</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analyticsData.longitudinalPatterns}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="conceptualDensity" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  name="Conceptual Density"
                />
                <Line 
                  type="monotone" 
                  dataKey="formalityIndex" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Formality Index"
                />
                <Line 
                  type="monotone" 
                  dataKey="cognitiveComplexity" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Cognitive Complexity"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Temporal Evolution */}
      <Card className="p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">Temporal Cognitive Evolution</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="font-medium text-slate-800 mb-1">{analyticsData.temporalEvolution.periods.early.label}</div>
            <div className="text-sm text-slate-600 mb-2">{analyticsData.temporalEvolution.periods.early.archetype}</div>
            <div className="text-xs text-slate-500">{analyticsData.temporalEvolution.periods.early.description}</div>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="font-medium text-slate-800 mb-1">{analyticsData.temporalEvolution.periods.middle.label}</div>
            <div className="text-sm text-slate-600 mb-2">{analyticsData.temporalEvolution.periods.middle.archetype}</div>
            <div className="text-xs text-slate-500">{analyticsData.temporalEvolution.periods.middle.description}</div>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="font-medium text-slate-800 mb-1">{analyticsData.temporalEvolution.periods.recent.label}</div>
            <div className="text-sm text-slate-600 mb-2">{analyticsData.temporalEvolution.periods.recent.archetype}</div>
            <div className="text-xs text-slate-500">{analyticsData.temporalEvolution.periods.recent.description}</div>
          </div>
        </div>
        <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
          <div className="font-medium text-emerald-800 mb-2">Trajectory: {analyticsData.temporalEvolution.trajectory.type.replace('_', ' ').toUpperCase()}</div>
          <div className="text-sm text-emerald-700 mb-2">{analyticsData.temporalEvolution.trajectory.description}</div>
          <div className="text-xs text-emerald-600">{analyticsData.temporalEvolution.trajectory.prognosis}</div>
        </div>
      </Card>

      {/* Psychostylistic Insights */}
      <Card className="p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">Psychostylistic Analysis</h3>
        <div className="space-y-4 mb-6">
          {analyticsData.psychostylisticInsights.primary.map((insight, index) => (
            <div key={index} className={cn(
              "p-4 rounded-lg border-l-4",
              insight.significance === 'high' ? "bg-red-50 border-red-400" :
              insight.significance === 'medium' ? "bg-yellow-50 border-yellow-400" :
              "bg-blue-50 border-blue-400"
            )}>
              <div className="font-medium text-slate-800 mb-1">{insight.observation}</div>
              <div className="text-sm text-slate-600 mb-1">{insight.interpretation}</div>
              {insight.causality && (
                <div className="text-xs text-slate-500 italic">{insight.causality}</div>
              )}
            </div>
          ))}
        </div>
        
        <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
          <h4 className="font-medium text-purple-800 mb-3">Self-Mirror Analysis</h4>
          <div className="text-sm text-purple-700 mb-3">{analyticsData.psychostylisticInsights.metaReflection.mindProfile}</div>
          <div className="space-y-2">
            <div>
              <span className="text-xs font-medium text-purple-800">Cognitive Preferences: </span>
              <span className="text-xs text-purple-600">{analyticsData.psychostylisticInsights.metaReflection.cognitivePreferences.join(', ')}</span>
            </div>
            <div>
              <span className="text-xs font-medium text-purple-800">Thinking Tempo: </span>
              <span className="text-xs text-purple-600">{analyticsData.psychostylisticInsights.metaReflection.thinkingTempo}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}