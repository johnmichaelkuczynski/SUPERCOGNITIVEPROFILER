import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Heart, 
  Zap, 
  Upload, 
  Mic, 
  FileText, 
  Download, 
  Mail, 
  BarChart3,
  User,
  Sparkles,
  Clock,
  Database
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { SpeechInput, useSpeechInput } from '@/components/ui/speech-input';
import ReactMarkdown from 'react-markdown';

interface ProfileResults {
  cognitiveProfile?: any;
  psychologicalProfile?: any;
  comprehensiveInsights?: any;
}

interface MindProfilerProps {
  userId: number;
}

export default function MindProfiler({ userId }: MindProfilerProps) {
  const [profileType, setProfileType] = useState<'cognitive' | 'psychological'>('cognitive');
  const [analysisMode, setAnalysisMode] = useState<'instant' | 'comprehensive'>('instant');
  const [inputText, setInputText] = useState('');
  const [results, setResults] = useState<ProfileResults | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Speech input functionality
  const { SpeechButton } = useSpeechInput(
    (text: string) => setInputText(text),
    () => inputText,
    { onAppend: true }
  );

  // Profile analysis mutation
  const analyzeProfile = useMutation({
    mutationFn: async (data: {
      profileType: string;
      analysisMode: string;
      inputText?: string;
    }) => {
      const endpoint = data.analysisMode === 'instant' 
        ? '/api/profile/instant'
        : '/api/profile/comprehensive';
      
      return await apiRequest(endpoint, 'POST', {
        profileType: data.profileType,
        inputText: data.inputText,
        userId
      });
    },
    onSuccess: (data) => {
      setResults(data);
      toast({
        title: "Profile Analysis Complete",
        description: `Your ${profileType} profile has been generated successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to generate profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Full profile analysis mutation (both cognitive and psychological)
  const analyzeFullProfile = useMutation({
    mutationFn: async (data: {
      analysisMode: string;
      inputText?: string;
    }) => {
      const endpoint = data.analysisMode === 'instant' 
        ? '/api/profile/full-instant'
        : '/api/profile/full-comprehensive';
      
      return await apiRequest(endpoint, 'POST', {
        inputText: data.inputText,
        userId
      });
    },
    onSuccess: (data) => {
      setResults(data);
      toast({
        title: "Complete Mind Profile Generated",
        description: "Your comprehensive cognitive and psychological profile is ready.",
      });
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to generate profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Export profile mutation
  const exportProfile = useMutation({
    mutationFn: async (format: 'pdf' | 'docx') => {
      return await apiRequest('/api/profile/export', 'POST', {
        results,
        format,
        profileType,
        analysisMode
      });
    },
    onSuccess: (data) => {
      // Trigger download
      const blob = new Blob([data.content], { type: data.mimeType });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Complete",
        description: `Profile exported as ${data.filename}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export profile.",
        variant: "destructive",
      });
    },
  });

  // Email profile mutation
  const emailProfile = useMutation({
    mutationFn: async (email: string) => {
      return await apiRequest('/api/profile/email', 'POST', {
        results,
        email,
        profileType,
        analysisMode
      });
    },
    onSuccess: () => {
      toast({
        title: "Profile Emailed",
        description: "Your profile has been sent to your email address.",
      });
    },
    onError: (error) => {
      toast({
        title: "Email Failed",
        description: error.message || "Failed to email profile.",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/documents/process', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) throw new Error('Failed to process file');
      
      const data = await response.json();
      const extractedText = data.text || data.content || '';
      
      setInputText(extractedText);
      toast({
        title: "File Processed",
        description: `Extracted text from ${file.name}`,
      });
    } catch (error) {
      toast({
        title: "File Processing Failed",
        description: "Could not extract text from the file.",
        variant: "destructive",
      });
    }
  };

  const handleAnalyze = () => {
    if (analysisMode === 'instant' && inputText.trim().length < 100) {
      toast({
        title: "Insufficient Text",
        description: "Please provide at least 100 characters for analysis.",
        variant: "destructive",
      });
      return;
    }

    analyzeProfile.mutate({
      profileType,
      analysisMode,
      inputText: analysisMode === 'instant' ? inputText : undefined
    });
  };

  const handleFullAnalyze = () => {
    if (analysisMode === 'instant' && inputText.trim().length < 100) {
      toast({
        title: "Insufficient Text",
        description: "Please provide at least 100 characters for analysis.",
        variant: "destructive",
      });
      return;
    }

    analyzeFullProfile.mutate({
      analysisMode,
      inputText: analysisMode === 'instant' ? inputText : undefined
    });
  };

  const handleEmailProfile = () => {
    const email = prompt("Enter your email address:");
    if (email && email.includes('@')) {
      emailProfile.mutate(email);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <Card className="mb-8 border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-800 flex items-center justify-center gap-3">
            <Sparkles className="h-8 w-8 text-blue-600" />
            Mind Profiler
            <Sparkles className="h-8 w-8 text-purple-600" />
          </CardTitle>
          <p className="text-lg text-gray-600 mt-2">
            Analyze writing samples to generate insights about the author's cognitive and psychological patterns. 
            Choose the type of analysis you want to perform below.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Profile Type Selection */}
          <div className="flex justify-center space-x-4">
            <Button
              variant={profileType === 'cognitive' ? 'default' : 'outline'}
              onClick={() => setProfileType('cognitive')}
              className="flex items-center gap-2 px-6 py-3"
            >
              <Brain className="h-5 w-5" />
              Cognitive
            </Button>
            <Button
              variant={profileType === 'psychological' ? 'default' : 'outline'}
              onClick={() => setProfileType('psychological')}
              className="flex items-center gap-2 px-6 py-3"
            >
              <Heart className="h-5 w-5" />
              Psychological
            </Button>
          </div>

          {/* Profile Description */}
          <div className="p-4 bg-white rounded-lg border border-gray-200">
            {profileType === 'cognitive' ? (
              <div className="flex items-start gap-3">
                <Brain className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">Cognitive Analysis</h3>
                  <p className="text-sm text-gray-600">
                    Analyzes your writing to profile your cognitive patterns, reasoning style, and intellectual characteristics.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <Heart className="h-6 w-6 text-pink-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">Psychological Analysis</h3>
                  <p className="text-sm text-gray-600">
                    Analyzes your writing to profile your emotional patterns, motivational structure, and interpersonal dynamics.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Analysis Mode Selection */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Analysis Mode</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card 
                className={`cursor-pointer transition-all ${
                  analysisMode === 'instant' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setAnalysisMode('instant')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <h4 className="font-semibold">Instant Analysis</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Analyze a single writing sample you provide right now. Quick insights based on the specific text.
                  </p>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all ${
                  analysisMode === 'comprehensive' 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setAnalysisMode('comprehensive')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Database className="h-5 w-5 text-purple-600" />
                    <h4 className="font-semibold">Comprehensive Analysis</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Analyze all your activity on this app (documents, conversations, rewrites) for deep insights.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Input Section for Instant Analysis */}
          {analysisMode === 'instant' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Provide Writing Sample</h3>
              
              <div className="relative">
                <Textarea
                  placeholder="Paste or type any text sample for analysis. Longer samples (500+ characters) provide more accurate profiling results."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="min-h-[200px] pr-12"
                />
                <div className="absolute bottom-3 right-3">
                  <SpeechButton />
                </div>
              </div>

              <div className="flex gap-2 text-sm text-gray-500">
                <span>{inputText.length} characters</span>
                <span className="text-gray-300">|</span>
                <span>Minimum: 100 characters</span>
              </div>

              {/* File Upload and Paste Options */}
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload Document
                </Button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <span className="text-sm text-gray-500 self-center">
                  Supported formats: .txt, .doc, .docx, .pdf, .jpg, .png
                </span>
              </div>
            </div>
          )}

          {/* Analysis Buttons */}
          <div className="flex gap-4 justify-center pt-4">
            <Button
              onClick={handleAnalyze}
              disabled={analyzeProfile.isPending || (analysisMode === 'instant' && inputText.length < 100)}
              className="flex items-center gap-2 px-8 py-3"
            >
              {analyzeProfile.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4" />
                  Analyze {profileType === 'cognitive' ? 'Cognition' : 'Psychology'}
                </>
              )}
            </Button>

            <Button
              onClick={handleFullAnalyze}
              disabled={analyzeFullProfile.isPending || (analysisMode === 'instant' && inputText.length < 100)}
              variant="outline"
              className="flex items-center gap-2 px-8 py-3"
            >
              {analyzeFullProfile.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <BarChart3 className="h-4 w-4" />
                  Full Mind Profile
                </>
              )}
            </Button>
          </div>

          <div className="text-center text-sm text-gray-500">
            Analysis using: OpenAI, Anthropic & Perplexity
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {results && (
        <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-blue-50">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <User className="h-6 w-6 text-green-600" />
                Your Mind Profile Results
              </CardTitle>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportProfile.mutate('pdf')}
                  disabled={exportProfile.isPending}
                  className="flex items-center gap-1"
                >
                  <Download className="h-4 w-4" />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportProfile.mutate('docx')}
                  disabled={exportProfile.isPending}
                  className="flex items-center gap-1"
                >
                  <FileText className="h-4 w-4" />
                  Word
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEmailProfile}
                  disabled={emailProfile.isPending}
                  className="flex items-center gap-1"
                >
                  <Mail className="h-4 w-4" />
                  Email
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="cognitive">Cognitive</TabsTrigger>
                <TabsTrigger value="psychological">Psychological</TabsTrigger>
                <TabsTrigger value="insights">Insights</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {results.comprehensiveInsights && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-800">Overall Profile</h3>
                    <div className="p-4 bg-white rounded-lg border">
                      <ReactMarkdown className="text-gray-700">
                        {results.comprehensiveInsights.overallProfile}
                      </ReactMarkdown>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <h4 className="font-semibold text-green-800 mb-2">Unique Strengths</h4>
                        <ul className="space-y-1">
                          {results.comprehensiveInsights.uniqueStrengths?.map((strength: string, index: number) => (
                            <li key={index} className="text-sm text-green-700 flex items-start">
                              <span className="text-green-600 mr-2">•</span>
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                        <h4 className="font-semibold text-orange-800 mb-2">Development Areas</h4>
                        <ul className="space-y-1">
                          {results.comprehensiveInsights.developmentAreas?.map((area: string, index: number) => (
                            <li key={index} className="text-sm text-orange-700 flex items-start">
                              <span className="text-orange-600 mr-2">•</span>
                              {area}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="cognitive" className="space-y-6">
                {results.cognitiveProfile && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                      <Brain className="h-6 w-6 text-blue-600" />
                      Cognitive Profile
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-semibold text-blue-800 mb-2">Analytical Depth</h4>
                        <div className="flex items-center gap-2">
                          <Progress value={results.cognitiveProfile.analyticalDepth * 10} className="flex-1" />
                          <span className="text-sm font-medium">{results.cognitiveProfile.analyticalDepth}/10</span>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-green-50 rounded-lg">
                        <h4 className="font-semibold text-green-800 mb-2">Conceptual Integration</h4>
                        <div className="flex items-center gap-2">
                          <Progress value={results.cognitiveProfile.conceptualIntegration * 10} className="flex-1" />
                          <span className="text-sm font-medium">{results.cognitiveProfile.conceptualIntegration}/10</span>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <h4 className="font-semibold text-purple-800 mb-2">Logical Structuring</h4>
                        <div className="flex items-center gap-2">
                          <Progress value={results.cognitiveProfile.logicalStructuring * 10} className="flex-1" />
                          <span className="text-sm font-medium">{results.cognitiveProfile.logicalStructuring}/10</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-white rounded-lg border">
                      <h4 className="font-semibold text-gray-800 mb-2">Intellectual Approach</h4>
                      <p className="text-gray-700">{results.cognitiveProfile.intellectualApproach}</p>
                    </div>

                    <div className="p-4 bg-white rounded-lg border">
                      <h4 className="font-semibold text-gray-800 mb-2">Cognitive Signature</h4>
                      <p className="text-gray-700 italic">"{results.cognitiveProfile.cognitiveSignature}"</p>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="psychological" className="space-y-6">
                {results.psychologicalProfile && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                      <Heart className="h-6 w-6 text-pink-600" />
                      Psychological Profile
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-pink-50 rounded-lg">
                        <h4 className="font-semibold text-pink-800 mb-2">Emotional Intelligence</h4>
                        <div className="flex items-center gap-2">
                          <Progress value={results.psychologicalProfile.emotionalIntelligence * 10} className="flex-1" />
                          <span className="text-sm font-medium">{results.psychologicalProfile.emotionalIntelligence}/10</span>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-yellow-50 rounded-lg">
                        <h4 className="font-semibold text-yellow-800 mb-2">Adaptability</h4>
                        <div className="flex items-center gap-2">
                          <Progress value={results.psychologicalProfile.adaptability * 10} className="flex-1" />
                          <span className="text-sm font-medium">{results.psychologicalProfile.adaptability}/10</span>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-indigo-50 rounded-lg">
                        <h4 className="font-semibold text-indigo-800 mb-2">Social Orientation</h4>
                        <div className="flex items-center gap-2">
                          <Progress value={results.psychologicalProfile.socialOrientation * 10} className="flex-1" />
                          <span className="text-sm font-medium">{results.psychologicalProfile.socialOrientation}/10</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-white rounded-lg border">
                      <h4 className="font-semibold text-gray-800 mb-2">Emotional Pattern</h4>
                      <p className="text-gray-700">{results.psychologicalProfile.emotionalPattern}</p>
                    </div>

                    <div className="p-4 bg-white rounded-lg border">
                      <h4 className="font-semibold text-gray-800 mb-2">Psychological Signature</h4>
                      <p className="text-gray-700 italic">"{results.psychologicalProfile.psychologicalSignature}"</p>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="insights" className="space-y-6">
                {results.comprehensiveInsights && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-gray-800">Comprehensive Insights</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                        <h4 className="font-semibold text-red-800 mb-2">Risk Factors</h4>
                        <ul className="space-y-1">
                          {results.comprehensiveInsights.riskFactors?.map((risk: string, index: number) => (
                            <li key={index} className="text-sm text-red-700 flex items-start">
                              <span className="text-red-600 mr-2">⚠</span>
                              {risk}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h4 className="font-semibold text-blue-800 mb-2">Recommendations</h4>
                        <ul className="space-y-1">
                          {results.comprehensiveInsights.recommendations?.map((rec: string, index: number) => (
                            <li key={index} className="text-sm text-blue-700 flex items-start">
                              <span className="text-blue-600 mr-2">💡</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {results.comprehensiveInsights.compatibility && (
                      <div className="p-4 bg-gray-50 rounded-lg border">
                        <h4 className="font-semibold text-gray-800 mb-3">Compatibility Insights</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <h5 className="font-medium text-gray-700 mb-2">Work Environments</h5>
                            <ul className="space-y-1">
                              {results.comprehensiveInsights.compatibility.workEnvironments?.map((env: string, index: number) => (
                                <li key={index} className="text-sm text-gray-600">• {env}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-700 mb-2">Communication Styles</h5>
                            <ul className="space-y-1">
                              {results.comprehensiveInsights.compatibility.communicationStyles?.map((style: string, index: number) => (
                                <li key={index} className="text-sm text-gray-600">• {style}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-700 mb-2">Collaboration Preferences</h5>
                            <ul className="space-y-1">
                              {results.comprehensiveInsights.compatibility.collaborationPreferences?.map((pref: string, index: number) => (
                                <li key={index} className="text-sm text-gray-600">• {pref}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}