import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  Database,
  Loader2,
  CheckCircle,
  Lightbulb,
  Target,
  Award,
  Users,
  TrendingUp,
  AlertTriangle,
  Briefcase,
  Quote,
  Shield,
  XCircle,
  Crown
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { SpeechInput, useSpeechInput } from '@/components/ui/speech-input';
import ReactMarkdown from 'react-markdown';

interface SupportingEvidence {
  quote: string;
  explanation: string;
}

interface ProfileResults {
  // Structured Analysis fields
  primaryAnalysis?: {
    title?: string;
    intellectualApproach?: string;
    reasoningStyle?: string;
    problemSolvingPattern?: string;
    analyticalDepth?: number;
    conceptualIntegration?: number;
    logicalStructuring?: number;
  };
  dissentingAnalysis?: {
    title?: string;
    counterArgument?: string;
    alternativeInterpretation?: string;
    methodologicalConcerns?: string;
    potentialOverreads?: string;
  };
  superThesis?: {
    title?: string;
    strengthenedAssessment?: string;
    refutationOfDissent?: string;
    reinforcedConclusions?: string;
  };

  // Psychological fields
  emotionalPattern?: string;
  motivationalStructure?: string;
  interpersonalDynamics?: string;
  stressResponsePattern?: string;
  communicationStyle?: string;
  personalityTraits?: string[];
  emotionalIntelligence?: number;
  adaptability?: number;
  socialOrientation?: number;
  psychologicalSignature?: string;
  
  // Cognitive fields
  intellectualApproach?: string;
  reasoningStyle?: string;
  problemSolvingPattern?: string;
  analyticalDepth?: number;
  conceptualIntegration?: number;
  logicalStructuring?: number;
  cognitiveSignature?: string;
  strengths?: string[];
  growthAreas?: string[];
  
  // Synthesis fields
  intellectEmotionBalance?: string;
  rationalEmotionalIntegration?: number;
  decisionMakingStyle?: string;
  stressVsClarity?: string;
  creativeRationalFusion?: string;
  emotionalReasoningPattern?: string;
  intellectualEmpathy?: number;
  synthesisStrengths?: string[];
  integrationChallenges?: string[];
  holisticSignature?: string;
  cognitiveEmotionalArchitecture?: string;
  authenticityVsPerformance?: string;
  stressIntegrationPattern?: string;
  empathyVsManipulation?: string;
  balanceVsCompensation?: string;
  synthesisEvolution?: string;
  contextualFlexibility?: string;
  integrationMaturity?: number;
  authenticityScore?: number;
  developmentPathways?: string[];
  potentialPitfalls?: string[];
  optimalEnvironments?: string[];
  collaborationStyle?: string;
  
  // Formal diagnostic components
  typeOfIntelligence?: string;
  comparisonToParadigms?: string;
  uniqueStrengths?: string;
  uniqueWeaknesses?: string;
  careerFitEcosystem?: string;
  mostRevealingQuotation?: string;

  // General fields
  detailedAnalysis?: string;
  supportingEvidence?: {
    emotionalPattern?: SupportingEvidence[];
    motivationalStructure?: SupportingEvidence[];
    interpersonalDynamics?: SupportingEvidence[];
    stressResponsePattern?: SupportingEvidence[];
    intellectualApproach?: SupportingEvidence[];
    reasoningStyle?: SupportingEvidence[];
    problemSolvingPattern?: SupportingEvidence[];
    intellectEmotionBalance?: SupportingEvidence[];
    decisionMakingStyle?: SupportingEvidence[];
    emotionalReasoning?: SupportingEvidence[];
  };
  
  // Legacy nested structures (for backwards compatibility)
  cognitiveProfile?: any;
  psychologicalProfile?: any;
  comprehensiveInsights?: any;
}

interface MindProfilerProps {
  userId: number;
}

export default function MindProfiler({ userId }: MindProfilerProps) {
  const [profileType, setProfileType] = useState<'cognitive' | 'psychological' | 'synthesis' | 'metacognitive'>('cognitive');
  const [analysisMode, setAnalysisMode] = useState<'instant' | 'comprehensive'>('instant');
  const [inputText, setInputText] = useState('');
  const [results, setResults] = useState<ProfileResults | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStage, setAnalysisStage] = useState('');
  const [showLoadingAnimation, setShowLoadingAnimation] = useState(false);
  const [savedEmail, setSavedEmail] = useState('');
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clear/reset function
  const handleClear = () => {
    setInputText('');
    setResults(null);
    setShowResultsDialog(false);
    setAnalysisProgress(0);
    setAnalysisStage('');
    setShowLoadingAnimation(false);
    toast({
      title: "Interface Cleared",
      description: "Ready for new analysis",
    });
  };

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
      let endpoint;
      if (data.profileType === 'metacognitive') {
        endpoint = data.analysisMode === 'instant' 
          ? '/api/profile/metacognitive-instant'
          : '/api/profile/metacognitive-comprehensive';
      } else {
        endpoint = data.analysisMode === 'instant' 
          ? '/api/profile/instant'
          : '/api/profile/comprehensive';
      }
      
      const response = await apiRequest('POST', endpoint, {
        profileType: data.profileType,
        inputText: data.inputText,
        userId
      });
      return await response.json();
    },
    onSuccess: (data) => {
      console.log('Analysis results received:', data);
      setResults(data);
      setAnalysisProgress(100);
      setAnalysisStage('Analysis complete!');
      
      // Small delay to show completion state before opening dialog
      setTimeout(() => {
        setShowResultsDialog(true);
        setShowLoadingAnimation(false);
      }, 800);
      
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
      
      const response = await apiRequest('POST', endpoint, {
        inputText: data.inputText,
        userId
      });
      return await response.json();
    },
    onSuccess: (data) => {
      setResults(data);
      setShowResultsDialog(true);
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

  // Metapsychological profile analysis mutation
  const analyzeMetapsychological = useMutation({
    mutationFn: async (data: {
      analysisMode: string;
      inputText?: string;
    }) => {
      const endpoint = data.analysisMode === 'instant' 
        ? '/api/profile/metapsychological-instant'
        : '/api/profile/metapsychological-comprehensive';
      
      const response = await apiRequest('POST', endpoint, {
        inputText: data.inputText,
        userId
      });
      return await response.json();
    },
    onSuccess: (data) => {
      setResults(data);
      setShowResultsDialog(true);
      toast({
        title: "Metapsychological Profile Generated",
        description: "Your comprehensive metapsychological analysis with six diagnostic components is ready.",
      });
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to generate metapsychological profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Export profile mutation
  const exportProfile = useMutation({
    mutationFn: async (format: 'pdf' | 'docx') => {
      if (!results) {
        throw new Error('No analysis results available to export');
      }

      const response = await fetch('/api/profile/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          results,
          format,
          profileType,
          analysisMode
        })
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      return {
        blob: await response.blob(),
        filename: `mind-profile-${profileType}-${format === 'pdf' ? 'pdf' : 'docx'}`,
        format
      };
    },
    onSuccess: (data) => {
      // Trigger download
      const url = window.URL.createObjectURL(data.blob);
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
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Unable to export profile. Please try again.",
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

  const handleMetapsychologicalAnalyze = () => {
    if (analysisMode === 'instant' && inputText.trim().length < 100) {
      toast({
        title: "Insufficient Text",
        description: "Please provide at least 100 characters for analysis.",
        variant: "destructive",
      });
      return;
    }

    analyzeMetapsychological.mutate({
      analysisMode,
      inputText: analysisMode === 'instant' ? inputText : undefined
    });
  };

  const handleEmailProfile = () => {
    const email = savedEmail || prompt("Enter your email address:");
    if (email && email.includes('@')) {
      setSavedEmail(email);
      emailProfile.mutate(email);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (analysisMode === 'instant' && inputText.length >= 100) {
        handleAnalyze();
      } else if (analysisMode === 'comprehensive') {
        handleAnalyze();
      }
    }
  };

  // Animation progress effect
  useEffect(() => {
    if (analyzeProfile.isPending || analyzeFullProfile.isPending) {
      setShowLoadingAnimation(true);
      setAnalysisProgress(0);
      
      const stages = [
        { stage: 'Initializing analysis...', progress: 10 },
        { stage: 'Processing text patterns...', progress: 25 },
        { stage: 'Analyzing cognitive markers...', progress: 45 },
        { stage: 'Evaluating psychological indicators...', progress: 65 },
        { stage: 'Generating insights...', progress: 85 },
        { stage: 'Finalizing profile...', progress: 95 }
      ];
      
      let currentStage = 0;
      const interval = setInterval(() => {
        if (currentStage < stages.length) {
          setAnalysisStage(stages[currentStage].stage);
          setAnalysisProgress(stages[currentStage].progress);
          currentStage++;
        }
      }, 1500);
      
      return () => clearInterval(interval);
    } else {
      setShowLoadingAnimation(false);
      setAnalysisProgress(100);
      setAnalysisStage('');
    }
  }, [analyzeProfile.isPending, analyzeFullProfile.isPending]);

  const handleEmailKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const email = (e.target as HTMLInputElement).value;
      if (email && email.includes('@')) {
        emailProfile.mutate(email);
        (e.target as HTMLInputElement).value = '';
      }
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
            <Button
              variant={profileType === 'synthesis' ? 'default' : 'outline'}
              onClick={() => setProfileType('synthesis')}
              className="flex items-center gap-2 px-6 py-3"
            >
              <Zap className="h-5 w-5" />
              Synthesis
            </Button>
            <Button
              variant={profileType === 'metacognitive' ? 'default' : 'outline'}
              onClick={() => setProfileType('metacognitive')}
              className="flex items-center gap-2 px-6 py-3"
            >
              <Shield className="h-5 w-5" />
              Metacognitive
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
            ) : profileType === 'psychological' ? (
              <div className="flex items-start gap-3">
                <Heart className="h-6 w-6 text-pink-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">Psychological Analysis</h3>
                  <p className="text-sm text-gray-600">
                    Analyzes your writing to profile your emotional patterns, motivational structure, and interpersonal dynamics.
                  </p>
                </div>
              </div>
            ) : profileType === 'metacognitive' ? (
              <div className="flex items-start gap-3">
                <Shield className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">Metacognitive Analysis</h3>
                  <p className="text-sm text-gray-600">
                    Analyzes your intellectual configuration from every possible angle using dialectical analysis (Thesis-Antithesis-Super-Thesis).
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <Zap className="h-6 w-6 text-purple-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-gray-800 mb-1">Synthesis Analysis</h3>
                  <p className="text-sm text-gray-600">
                    Analyzes the dynamic integration between intellect and emotion, exploring how rational and emotional processing interact in your thinking.
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
                  placeholder="Paste or type any text sample for analysis. Longer samples (500+ characters) provide more accurate profiling results. Press Enter to analyze (Shift+Enter for new line)."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyPress}
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

            <Button
              onClick={handleMetapsychologicalAnalyze}
              disabled={analyzeMetapsychological.isPending || (analysisMode === 'instant' && inputText.length < 100)}
              variant="outline"
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
            >
              {analyzeMetapsychological.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <Crown className="h-4 w-4" />
                  Metapsychological Profiling
                </>
              )}
            </Button>

            <Button
              onClick={handleClear}
              variant="secondary"
              className="flex items-center gap-2 px-6 py-3"
            >
              <Target className="h-4 w-4" />
              Clear
            </Button>
          </div>

          <div className="text-center text-sm text-gray-500">
            Analysis using: OpenAI, Anthropic & Perplexity
          </div>

          {/* Debug - Show Results Button */}
          {results && (
            <div className="mt-4 text-center">
              <Button
                onClick={() => setShowResultsDialog(true)}
                variant="outline"
                className="border-green-600 text-green-600 hover:bg-green-50 font-medium"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                View Analysis Results
              </Button>
            </div>
          )}

          {/* Animated Loading Overlay */}
          {showLoadingAnimation && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300">
              <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
                <div className="text-center">
                  <div className="relative w-20 h-20 mx-auto mb-6">
                    <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                    <div className="absolute inset-2 border-2 border-purple-400 rounded-full border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
                    <Brain className="absolute inset-0 m-auto h-8 w-8 text-blue-600 animate-pulse" />
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    Analyzing Your Mind Profile
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${analysisProgress}%` }}
                      ></div>
                    </div>
                    
                    <p className="text-gray-600 animate-pulse">
                      {analysisStage || 'Preparing analysis...'}
                    </p>
                    
                    <div className="flex justify-center space-x-2 mt-4">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}


        </CardContent>
      </Card>

      {/* Removed old results section - now only shows in popup dialog */}
      {false && results && (
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
                      <div className="text-gray-700">
                        <ReactMarkdown>{results.comprehensiveInsights.overallProfile}</ReactMarkdown>
                      </div>
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
                {/* Enhanced structured cognitive analysis display */}
                {results && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                      <Brain className="h-6 w-6 text-blue-600" />
                      Structured Cognitive Analysis
                    </h3>



                    {/* Primary Analysis Section */}
                    {results.primaryAnalysis && (
                      <div className="space-y-4">
                        <div className="p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
                          <h4 className="font-bold text-blue-900 mb-4 text-lg flex items-center gap-2">
                            <Brain className="h-5 w-5" />
                            {results.primaryAnalysis.title || "1️⃣ Primary Analysis"}
                          </h4>
                          
                          {/* Primary Analysis Sub-sections */}
                          {results.primaryAnalysis.intellectualApproach && (
                            <div className="mb-6">
                              <h5 className="font-semibold text-blue-800 mb-3">Intellectual Approach</h5>
                              <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                                <ReactMarkdown>{results.primaryAnalysis.intellectualApproach}</ReactMarkdown>
                              </div>
                            </div>
                          )}
                          
                          {results.primaryAnalysis.reasoningStyle && (
                            <div className="mb-6">
                              <h5 className="font-semibold text-blue-800 mb-3">Reasoning Style</h5>
                              <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                                <ReactMarkdown>{results.primaryAnalysis.reasoningStyle}</ReactMarkdown>
                              </div>
                            </div>
                          )}
                          
                          {results.primaryAnalysis.problemSolvingPattern && (
                            <div className="mb-6">
                              <h5 className="font-semibold text-blue-800 mb-3">Problem Solving Pattern</h5>
                              <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                                <ReactMarkdown>{results.primaryAnalysis.problemSolvingPattern}</ReactMarkdown>
                              </div>
                            </div>
                          )}
                          
                          {/* Primary Analysis Metrics */}
                          {(results.primaryAnalysis.analyticalDepth || results.primaryAnalysis.conceptualIntegration || results.primaryAnalysis.logicalStructuring) && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                              {results.primaryAnalysis.analyticalDepth && (
                                <div className="p-4 bg-blue-100 rounded-lg">
                                  <h6 className="font-semibold text-blue-800 mb-2">Analytical Depth</h6>
                                  <div className="flex items-center gap-2">
                                    <Progress value={results.primaryAnalysis.analyticalDepth * 10} className="flex-1" />
                                    <span className="text-sm font-medium">{results.primaryAnalysis.analyticalDepth}/10</span>
                                  </div>
                                </div>
                              )}
                              
                              {results.primaryAnalysis.conceptualIntegration && (
                                <div className="p-4 bg-blue-100 rounded-lg">
                                  <h6 className="font-semibold text-blue-800 mb-2">Conceptual Integration</h6>
                                  <div className="flex items-center gap-2">
                                    <Progress value={results.primaryAnalysis.conceptualIntegration * 10} className="flex-1" />
                                    <span className="text-sm font-medium">{results.primaryAnalysis.conceptualIntegration}/10</span>
                                  </div>
                                </div>
                              )}
                              
                              {results.primaryAnalysis.logicalStructuring && (
                                <div className="p-4 bg-blue-100 rounded-lg">
                                  <h6 className="font-semibold text-blue-800 mb-2">Logical Structuring</h6>
                                  <div className="flex items-center gap-2">
                                    <Progress value={results.primaryAnalysis.logicalStructuring * 10} className="flex-1" />
                                    <span className="text-sm font-medium">{results.primaryAnalysis.logicalStructuring}/10</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Dissenting Analysis Section */}
                    {results.dissentingAnalysis && (
                      <div className="space-y-4">
                        <div className="p-6 bg-orange-50 rounded-lg border-2 border-orange-200">
                          <h4 className="font-bold text-orange-900 mb-4 text-lg flex items-center gap-2">
                            <Target className="h-5 w-5" />
                            {results.dissentingAnalysis.title || "2️⃣ Dissenting Analysis"}
                          </h4>
                          
                          {results.dissentingAnalysis.counterArgument && (
                            <div className="mb-6">
                              <h5 className="font-semibold text-orange-800 mb-3">Counter-Argument</h5>
                              <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                                <ReactMarkdown>{results.dissentingAnalysis.counterArgument}</ReactMarkdown>
                              </div>
                            </div>
                          )}
                          
                          {results.dissentingAnalysis.alternativeInterpretation && (
                            <div className="mb-6">
                              <h5 className="font-semibold text-orange-800 mb-3">Alternative Interpretation</h5>
                              <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                                <ReactMarkdown>{results.dissentingAnalysis.alternativeInterpretation}</ReactMarkdown>
                              </div>
                            </div>
                          )}
                          
                          {results.dissentingAnalysis.methodologicalConcerns && (
                            <div className="mb-6">
                              <h5 className="font-semibold text-orange-800 mb-3">Methodological Concerns</h5>
                              <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                                <ReactMarkdown>{results.dissentingAnalysis.methodologicalConcerns}</ReactMarkdown>
                              </div>
                            </div>
                          )}
                          
                          {results.dissentingAnalysis.potentialOverreads && (
                            <div className="mb-6">
                              <h5 className="font-semibold text-orange-800 mb-3">Potential Over-reads</h5>
                              <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                                <ReactMarkdown>{results.dissentingAnalysis.potentialOverreads}</ReactMarkdown>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Super-Thesis Section */}
                    {results.superThesis && (
                      <div className="space-y-4">
                        <div className="p-6 bg-emerald-50 rounded-lg border-2 border-emerald-200">
                          <h4 className="font-bold text-emerald-900 mb-4 text-lg flex items-center gap-2">
                            <Sparkles className="h-5 w-5" />
                            {results.superThesis.title || "3️⃣ Super-Thesis (Final Assessment)"}
                          </h4>
                          
                          {results.superThesis.strengthenedAssessment && (
                            <div className="mb-6">
                              <h5 className="font-semibold text-emerald-800 mb-3">Strengthened Assessment</h5>
                              <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                                <ReactMarkdown>{results.superThesis.strengthenedAssessment}</ReactMarkdown>
                              </div>
                            </div>
                          )}
                          
                          {results.superThesis.refutationOfDissent && (
                            <div className="mb-6">
                              <h5 className="font-semibold text-emerald-800 mb-3">Refutation of Dissent</h5>
                              <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                                <ReactMarkdown>{results.superThesis.refutationOfDissent}</ReactMarkdown>
                              </div>
                            </div>
                          )}
                          
                          {results.superThesis.reinforcedConclusions && (
                            <div className="mb-6">
                              <h5 className="font-semibold text-emerald-800 mb-3">Reinforced Conclusions</h5>
                              <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                                <ReactMarkdown>{results.superThesis.reinforcedConclusions}</ReactMarkdown>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Formal Diagnostic Components */}
                    {(results.typeOfIntelligence || results.comparisonToParadigms || results.uniqueStrengths || 
                      results.uniqueWeaknesses || results.careerFitEcosystem || results.mostRevealingQuotation) && (
                      <div className="mt-8 space-y-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2 border-b-2 border-gray-300 pb-2">
                          <Award className="h-6 w-6 text-purple-600" />
                          Formal Diagnostic Components
                        </h3>

                        {/* Type of Intelligence */}
                        {results.typeOfIntelligence && (
                          <div className="p-6 bg-purple-50 rounded-lg border-2 border-purple-200">
                            <h4 className="font-bold text-purple-900 mb-3 text-lg flex items-center gap-2">
                              <Brain className="h-5 w-5" />
                              1️⃣ Type of Intelligence
                            </h4>
                            <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                              <ReactMarkdown>{results.typeOfIntelligence}</ReactMarkdown>
                            </div>
                          </div>
                        )}

                        {/* Comparison to Paradigm Examples */}
                        {results.comparisonToParadigms && (
                          <div className="p-6 bg-indigo-50 rounded-lg border-2 border-indigo-200">
                            <h4 className="font-bold text-indigo-900 mb-3 text-lg flex items-center gap-2">
                              <Users className="h-5 w-5" />
                              2️⃣ Comparison to Paradigm Examples
                            </h4>
                            <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                              <ReactMarkdown>{results.comparisonToParadigms}</ReactMarkdown>
                            </div>
                          </div>
                        )}

                        {/* Unique Strengths */}
                        {results.uniqueStrengths && (
                          <div className="p-6 bg-green-50 rounded-lg border-2 border-green-200">
                            <h4 className="font-bold text-green-900 mb-3 text-lg flex items-center gap-2">
                              <TrendingUp className="h-5 w-5" />
                              3️⃣ Unique Strengths
                            </h4>
                            <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                              <ReactMarkdown>{results.uniqueStrengths}</ReactMarkdown>
                            </div>
                          </div>
                        )}

                        {/* Unique Weaknesses */}
                        {results.uniqueWeaknesses && (
                          <div className="p-6 bg-red-50 rounded-lg border-2 border-red-200">
                            <h4 className="font-bold text-red-900 mb-3 text-lg flex items-center gap-2">
                              <AlertTriangle className="h-5 w-5" />
                              4️⃣ Unique Weaknesses
                            </h4>
                            <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                              <ReactMarkdown>{results.uniqueWeaknesses}</ReactMarkdown>
                            </div>
                          </div>
                        )}

                        {/* Career Fit / Intellectual Ecosystem */}
                        {results.careerFitEcosystem && (
                          <div className="p-6 bg-yellow-50 rounded-lg border-2 border-yellow-200">
                            <h4 className="font-bold text-yellow-900 mb-3 text-lg flex items-center gap-2">
                              <Briefcase className="h-5 w-5" />
                              5️⃣ Likely Career Fit / Intellectual Ecosystem
                            </h4>
                            <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                              <ReactMarkdown>{results.careerFitEcosystem}</ReactMarkdown>
                            </div>
                          </div>
                        )}

                        {/* Most Revealing Quotation */}
                        {results.mostRevealingQuotation && (
                          <div className="p-6 bg-cyan-50 rounded-lg border-2 border-cyan-200">
                            <h4 className="font-bold text-cyan-900 mb-3 text-lg flex items-center gap-2">
                              <Quote className="h-5 w-5" />
                              6️⃣ Most Revealing Quotation
                            </h4>
                            <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                              <ReactMarkdown>{results.mostRevealingQuotation}</ReactMarkdown>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Fallback to standard cognitive analysis if structured analysis not available */}
                    {!results.primaryAnalysis && results.intellectualApproach && (
                      <div className="space-y-4">
                        <div className="p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
                          <h4 className="font-bold text-blue-900 mb-4 text-lg flex items-center gap-2">
                            <Brain className="h-5 w-5" />
                            Intellectual Approach
                          </h4>
                          <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                            <ReactMarkdown>{results.intellectualApproach}</ReactMarkdown>
                          </div>
                        </div>

                        {results.supportingEvidence?.intellectualApproach && (
                          <div className="ml-4 space-y-3">
                            <h5 className="font-medium text-gray-700 text-sm">Supporting Evidence:</h5>
                            {results.supportingEvidence.intellectualApproach.map((evidence: any, index: number) => (
                              <div key={index} className="border-l-4 border-blue-300 pl-4 py-2 bg-gray-50 rounded-r">
                                <blockquote className="text-sm italic text-gray-600 mb-2">
                                  "{evidence.quote}"
                                </blockquote>
                                <p className="text-sm text-gray-700">{evidence.explanation}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Reasoning Style Section */}
                    {results.reasoningStyle && (
                      <div className="space-y-4">
                        <div className="p-6 bg-green-50 rounded-lg border-2 border-green-200">
                          <h4 className="font-bold text-green-900 mb-4 text-lg flex items-center gap-2">
                            <Lightbulb className="h-5 w-5" />
                            Reasoning Style
                          </h4>
                          <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                            <ReactMarkdown>{results.reasoningStyle}</ReactMarkdown>
                          </div>
                        </div>

                        {results.supportingEvidence?.reasoningStyle && (
                          <div className="ml-4 space-y-3">
                            <h5 className="font-medium text-gray-700 text-sm">Supporting Evidence:</h5>
                            {results.supportingEvidence.reasoningStyle.map((evidence: any, index: number) => (
                              <div key={index} className="border-l-4 border-green-300 pl-4 py-2 bg-gray-50 rounded-r">
                                <blockquote className="text-sm italic text-gray-600 mb-2">
                                  "{evidence.quote}"
                                </blockquote>
                                <p className="text-sm text-gray-700">{evidence.explanation}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Problem Solving Pattern Section */}
                    {results.problemSolvingPattern && (
                      <div className="space-y-4">
                        <div className="p-6 bg-purple-50 rounded-lg border-2 border-purple-200">
                          <h4 className="font-bold text-purple-900 mb-4 text-lg flex items-center gap-2">
                            <Target className="h-5 w-5" />
                            Problem Solving Pattern
                          </h4>
                          <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                            <ReactMarkdown>{results.problemSolvingPattern}</ReactMarkdown>
                          </div>
                        </div>

                        {results.supportingEvidence?.problemSolvingPattern && (
                          <div className="ml-4 space-y-3">
                            <h5 className="font-medium text-gray-700 text-sm">Supporting Evidence:</h5>
                            {results.supportingEvidence.problemSolvingPattern.map((evidence: any, index: number) => (
                              <div key={index} className="border-l-4 border-purple-300 pl-4 py-2 bg-gray-50 rounded-r">
                                <blockquote className="text-sm italic text-gray-600 mb-2">
                                  "{evidence.quote}"
                                </blockquote>
                                <p className="text-sm text-gray-700">{evidence.explanation}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Cognitive Signature */}
                    {results && results.cognitiveSignature && (
                      <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
                        <h4 className="font-bold text-blue-900 mb-4 text-lg">Cognitive Signature</h4>
                        <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                          <ReactMarkdown>{results.cognitiveSignature}</ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {/* Detailed Analysis */}
                    {results && results.detailedAnalysis && (
                      <div className="p-6 bg-gray-50 rounded-lg border-2 border-gray-200">
                        <h4 className="font-bold text-gray-900 mb-4 text-lg">Detailed Analysis</h4>
                        <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                          <ReactMarkdown>{results.detailedAnalysis}</ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {/* Cognitive scores display */}
                    {(results.analyticalDepth || results.conceptualIntegration || results.logicalStructuring) && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        {results.analyticalDepth && (
                          <div className="p-4 bg-blue-50 rounded-lg">
                            <h4 className="font-semibold text-blue-800 mb-2">Analytical Depth</h4>
                            <div className="flex items-center gap-2">
                              <Progress value={results.analyticalDepth * 10} className="flex-1" />
                              <span className="text-sm font-medium">{results.analyticalDepth}/10</span>
                            </div>
                          </div>
                        )}
                        
                        {results.conceptualIntegration && (
                          <div className="p-4 bg-green-50 rounded-lg">
                            <h4 className="font-semibold text-green-800 mb-2">Conceptual Integration</h4>
                            <div className="flex items-center gap-2">
                              <Progress value={results.conceptualIntegration * 10} className="flex-1" />
                              <span className="text-sm font-medium">{results.conceptualIntegration}/10</span>
                            </div>
                          </div>
                        )}
                        
                        {results.logicalStructuring && (
                          <div className="p-4 bg-purple-50 rounded-lg">
                            <h4 className="font-semibold text-purple-800 mb-2">Logical Structuring</h4>
                            <div className="flex items-center gap-2">
                              <Progress value={results.logicalStructuring * 10} className="flex-1" />
                              <span className="text-sm font-medium">{results.logicalStructuring}/10</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Show comprehensive cognitive profile data */}
                    {results.cognitiveProfile && (
                      <div className="space-y-6">
                        {/* Cognitive Signature from nested structure */}
                        {results.cognitiveProfile.cognitiveSignature && (
                          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
                            <h4 className="font-bold text-blue-900 mb-4 text-lg">Cognitive Signature</h4>
                            <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                              <ReactMarkdown>{results.cognitiveProfile.cognitiveSignature}</ReactMarkdown>
                            </div>
                          </div>
                        )}

                        {/* Detailed Analysis from nested structure */}
                        {results.cognitiveProfile.detailedAnalysis && (
                          <div className="p-6 bg-gray-50 rounded-lg border-2 border-gray-200">
                            <h4 className="font-bold text-gray-900 mb-4 text-lg">Comprehensive Detailed Analysis</h4>
                            <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                              <ReactMarkdown>{results.cognitiveProfile.detailedAnalysis}</ReactMarkdown>
                            </div>
                          </div>
                        )}

                        {/* Strengths and Growth Areas from nested structure */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {results.cognitiveProfile.strengths && (
                            <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
                              <h4 className="font-bold text-green-800 mb-3">Cognitive Strengths</h4>
                              <ul className="space-y-2">
                                {results.cognitiveProfile.strengths.map((strength: string, index: number) => (
                                  <li key={index} className="text-green-700 flex items-start">
                                    <span className="text-green-600 mr-2 font-bold">•</span>
                                    {strength}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {results.cognitiveProfile.growthAreas && (
                            <div className="p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
                              <h4 className="font-bold text-orange-800 mb-3">Growth Areas</h4>
                              <ul className="space-y-2">
                                {results.cognitiveProfile.growthAreas.map((area: string, index: number) => (
                                  <li key={index} className="text-orange-700 flex items-start">
                                    <span className="text-orange-600 mr-2 font-bold">•</span>
                                    {area}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* Supporting Evidence from nested structure */}
                        {results.cognitiveProfile.supportingEvidence && (
                          <div className="space-y-4">
                            <h4 className="font-bold text-gray-800 mb-3">Supporting Evidence</h4>
                            
                            {results.cognitiveProfile.supportingEvidence.intellectualApproach && (
                              <div className="p-4 bg-gray-50 rounded-lg">
                                <h5 className="font-medium text-gray-700 mb-3">Intellectual Approach Evidence</h5>
                                {results.cognitiveProfile.supportingEvidence.intellectualApproach.map((evidence: any, index: number) => (
                                  <div key={index} className="border-l-4 border-blue-300 pl-4 py-2 mb-3 bg-white rounded-r">
                                    <blockquote className="text-sm italic text-gray-600 mb-2">
                                      "{evidence.quote}"
                                    </blockquote>
                                    <p className="text-sm text-gray-700">{evidence.explanation}</p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {results.cognitiveProfile.supportingEvidence.reasoningStyle && (
                              <div className="p-4 bg-gray-50 rounded-lg">
                                <h5 className="font-medium text-gray-700 mb-3">Reasoning Style Evidence</h5>
                                {results.cognitiveProfile.supportingEvidence.reasoningStyle.map((evidence: any, index: number) => (
                                  <div key={index} className="border-l-4 border-green-300 pl-4 py-2 mb-3 bg-white rounded-r">
                                    <blockquote className="text-sm italic text-gray-600 mb-2">
                                      "{evidence.quote}"
                                    </blockquote>
                                    <p className="text-sm text-gray-700">{evidence.explanation}</p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {results.cognitiveProfile.supportingEvidence.problemSolvingPattern && (
                              <div className="p-4 bg-gray-50 rounded-lg">
                                <h5 className="font-medium text-gray-700 mb-3">Problem Solving Evidence</h5>
                                {results.cognitiveProfile.supportingEvidence.problemSolvingPattern.map((evidence: any, index: number) => (
                                  <div key={index} className="border-l-4 border-purple-300 pl-4 py-2 mb-3 bg-white rounded-r">
                                    <blockquote className="text-sm italic text-gray-600 mb-2">
                                      "{evidence.quote}"
                                    </blockquote>
                                    <p className="text-sm text-gray-700">{evidence.explanation}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Fallback: Strengths and Growth Areas from flat structure */}
                    {!results.cognitiveProfile && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {results.strengths && (
                          <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
                            <h4 className="font-bold text-green-800 mb-3">Cognitive Strengths</h4>
                            <ul className="space-y-2">
                              {results.strengths.map((strength: string, index: number) => (
                                <li key={index} className="text-green-700 flex items-start">
                                  <span className="text-green-600 mr-2 font-bold">•</span>
                                  {strength}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {results.growthAreas && (
                          <div className="p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
                            <h4 className="font-bold text-orange-800 mb-3">Growth Areas</h4>
                            <ul className="space-y-2">
                              {results.growthAreas.map((area: string, index: number) => (
                                <li key={index} className="text-orange-700 flex items-start">
                                  <span className="text-orange-600 mr-2 font-bold">•</span>
                                  {area}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
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

      {/* Results Dialog */}
      <Dialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden p-0" aria-describedby="results-description">
          <div className="p-6 border-b border-gray-200">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {profileType === 'cognitive' && <Brain className="h-5 w-5 text-blue-600" />}
                {profileType === 'psychological' && <Heart className="h-5 w-5 text-red-600" />}
                {profileType === 'synthesis' && <Sparkles className="h-5 w-5 text-purple-600" />}
                {profileType === 'metacognitive' && <Brain className="h-5 w-5 text-indigo-600" />}
                {profileType === 'cognitive' ? 'Cognitive Profile' : 
                 profileType === 'psychological' ? 'Psychological Profile' : 
                 profileType === 'synthesis' ? 'Synthesis Profile' :
                 'Metacognitive Profile'} Analysis
              </DialogTitle>
            </DialogHeader>
            <div id="results-description" className="sr-only">
              Analysis results showing cognitive and psychological insights
            </div>
          </div>
          
          <div className="overflow-y-auto max-h-[calc(95vh-180px)] p-6">
            <div className="space-y-8">            
            {/* Enhanced analysis content with evidence */}
            {results && (
              <div className="space-y-8">
                {/* Emotional Pattern Analysis */}
                {results.emotionalPattern && (
                  <div className="p-8 bg-red-50 rounded-xl border-2 border-red-200 shadow-sm">
                    <h3 className="text-2xl font-bold text-red-800 mb-6 flex items-center gap-3">
                      <Heart className="h-7 w-7" />
                      Emotional Pattern Analysis
                    </h3>
                    
                    <div className="space-y-6">
                      <div className="p-5 bg-white rounded-lg border border-red-100">
                        <h4 className="font-semibold text-red-700 mb-3 text-lg">Primary Finding</h4>
                        <p className="text-gray-800 leading-relaxed text-base">
                          {results.emotionalPattern}
                        </p>
                      </div>
                      
                      {results.supportingEvidence?.emotionalPattern && (
                        <div className="space-y-4">
                          <h4 className="font-semibold text-red-700 text-lg">Supporting Evidence</h4>
                          {results.supportingEvidence.emotionalPattern.map((evidence: any, index: number) => (
                            <div key={index} className="p-4 bg-red-25 rounded-lg border-l-4 border-red-300">
                              <div className="mb-3">
                                <span className="text-sm font-medium text-red-600 bg-red-100 px-2 py-1 rounded">Quote</span>
                                <blockquote className="mt-2 text-gray-700 italic border-l-3 border-red-200 pl-4">
                                  "{evidence.quote}"
                                </blockquote>
                              </div>
                              <div>
                                <span className="text-sm font-medium text-red-600 bg-red-100 px-2 py-1 rounded">Analysis</span>
                                <p className="mt-2 text-gray-800 leading-relaxed">
                                  {evidence.explanation}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Motivational Structure Analysis */}
                {results.motivationalStructure && (
                  <div className="p-8 bg-blue-50 rounded-xl border-2 border-blue-200 shadow-sm">
                    <h3 className="text-2xl font-bold text-blue-800 mb-6 flex items-center gap-3">
                      <Zap className="h-7 w-7" />
                      Motivational Structure
                    </h3>
                    
                    <div className="space-y-6">
                      <div className="p-5 bg-white rounded-lg border border-blue-100">
                        <h4 className="font-semibold text-blue-700 mb-3 text-lg">Core Drivers</h4>
                        <p className="text-gray-800 leading-relaxed text-base">
                          {results.motivationalStructure}
                        </p>
                      </div>
                      
                      {results.supportingEvidence?.motivationalStructure && (
                        <div className="space-y-4">
                          <h4 className="font-semibold text-blue-700 text-lg">Supporting Evidence</h4>
                          {results.supportingEvidence.motivationalStructure.map((evidence: any, index: number) => (
                            <div key={index} className="p-4 bg-blue-25 rounded-lg border-l-4 border-blue-300">
                              <div className="mb-3">
                                <span className="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">Quote</span>
                                <blockquote className="mt-2 text-gray-700 italic border-l-3 border-blue-200 pl-4">
                                  "{evidence.quote}"
                                </blockquote>
                              </div>
                              <div>
                                <span className="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">Analysis</span>
                                <p className="mt-2 text-gray-800 leading-relaxed">
                                  {evidence.explanation}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Interpersonal Dynamics Analysis */}
                {results.interpersonalDynamics && (
                  <div className="p-8 bg-green-50 rounded-xl border-2 border-green-200 shadow-sm">
                    <h3 className="text-2xl font-bold text-green-800 mb-6 flex items-center gap-3">
                      <User className="h-7 w-7" />
                      Interpersonal Dynamics
                    </h3>
                    
                    <div className="space-y-6">
                      <div className="p-5 bg-white rounded-lg border border-green-100">
                        <h4 className="font-semibold text-green-700 mb-3 text-lg">Relationship Patterns</h4>
                        <p className="text-gray-800 leading-relaxed text-base">
                          {results.interpersonalDynamics}
                        </p>
                      </div>
                      
                      {results.supportingEvidence?.interpersonalDynamics && (
                        <div className="space-y-4">
                          <h4 className="font-semibold text-green-700 text-lg">Supporting Evidence</h4>
                          {results.supportingEvidence.interpersonalDynamics.map((evidence: any, index: number) => (
                            <div key={index} className="p-4 bg-green-25 rounded-lg border-l-4 border-green-300">
                              <div className="mb-3">
                                <span className="text-sm font-medium text-green-600 bg-green-100 px-2 py-1 rounded">Quote</span>
                                <blockquote className="mt-2 text-gray-700 italic border-l-3 border-green-200 pl-4">
                                  "{evidence.quote}"
                                </blockquote>
                              </div>
                              <div>
                                <span className="text-sm font-medium text-green-600 bg-green-100 px-2 py-1 rounded">Analysis</span>
                                <p className="mt-2 text-gray-800 leading-relaxed">
                                  {evidence.explanation}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Intellectual Approach Analysis */}
                {results.intellectualApproach && (
                  <div className="p-8 bg-purple-50 rounded-xl border-2 border-purple-200 shadow-sm">
                    <h3 className="text-2xl font-bold text-purple-800 mb-6 flex items-center gap-3">
                      <Brain className="h-7 w-7" />
                      Intellectual Approach
                    </h3>
                    
                    <div className="space-y-6">
                      <div className="p-5 bg-white rounded-lg border border-purple-100">
                        <h4 className="font-semibold text-purple-700 mb-3 text-lg">Cognitive Style</h4>
                        <p className="text-gray-800 leading-relaxed text-base">
                          {results.intellectualApproach}
                        </p>
                      </div>
                      
                      {results.supportingEvidence?.intellectualApproach && (
                        <div className="space-y-4">
                          <h4 className="font-semibold text-purple-700 text-lg">Supporting Evidence</h4>
                          {results.supportingEvidence.intellectualApproach.map((evidence: any, index: number) => (
                            <div key={index} className="p-4 bg-purple-25 rounded-lg border-l-4 border-purple-300">
                              <div className="mb-3">
                                <span className="text-sm font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded">Quote</span>
                                <blockquote className="mt-2 text-gray-700 italic border-l-3 border-purple-200 pl-4">
                                  "{evidence.quote}"
                                </blockquote>
                              </div>
                              <div>
                                <span className="text-sm font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded">Analysis</span>
                                <p className="mt-2 text-gray-800 leading-relaxed">
                                  {evidence.explanation}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Personality Metrics */}
                {(results.personalityTraits || results.emotionalIntelligence) && (
                  <div className="p-8 bg-gray-50 rounded-xl border-2 border-gray-200 shadow-sm">
                    <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                      <BarChart3 className="h-7 w-7" />
                      Personality Metrics
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {results.personalityTraits && (
                        <div className="p-5 bg-white rounded-lg border border-gray-100">
                          <h4 className="font-semibold text-gray-700 mb-3 text-lg">Core Traits</h4>
                          <div className="flex flex-wrap gap-2">
                            {results.personalityTraits.map((trait: string, index: number) => (
                              <Badge key={index} variant="secondary" className="text-sm">
                                {trait}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {results.emotionalIntelligence && (
                        <div className="p-5 bg-white rounded-lg border border-gray-100">
                          <h4 className="font-semibold text-gray-700 mb-3 text-lg">Emotional Intelligence</h4>
                          <div className="flex items-center gap-3">
                            <div className="text-3xl font-bold text-blue-600">
                              {results.emotionalIntelligence}/10
                            </div>
                            <Progress value={results.emotionalIntelligence * 10} className="flex-1" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Show Psychological Profile First */}
            {false && results?.psychologicalProfile && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-red-800 flex items-center gap-2">
                  <Heart className="h-6 w-6" />
                  Psychological Analysis
                </h3>
                
                <div className="p-6 bg-red-50 rounded-lg border-2 border-red-200">
                  <h4 className="font-bold text-red-900 mb-4 text-lg">Emotional Pattern</h4>
                  <div className="text-gray-800 leading-relaxed">
                    {results.psychologicalProfile.emotionalPattern}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-white rounded-lg border-2 border-red-200">
                    <h4 className="font-bold text-red-800 mb-3">Motivational Structure</h4>
                    <p className="text-gray-700 leading-relaxed">{results.psychologicalProfile.motivationalStructure}</p>
                  </div>
                  <div className="p-4 bg-white rounded-lg border-2 border-red-200">
                    <h4 className="font-bold text-red-800 mb-3">Interpersonal Dynamics</h4>
                    <p className="text-gray-700 leading-relaxed">{results.psychologicalProfile.interpersonalDynamics}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Show Synthesis Profile */}
            {profileType === 'synthesis' && results && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-purple-800 flex items-center gap-2">
                  <Zap className="h-6 w-6" />
                  Synthesis Analysis
                </h3>
                
                {/* Intellect-Emotion Balance */}
                {results.intellectEmotionBalance && (
                  <div className="p-6 bg-purple-50 rounded-lg border-2 border-purple-200">
                    <h4 className="font-bold text-purple-900 mb-4 text-lg">Intellect-Emotion Balance</h4>
                    <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                      <ReactMarkdown>
                        {results.intellectEmotionBalance}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
                
                {/* Decision Making & Emotional Reasoning */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {results.decisionMakingStyle && (
                    <div className="p-4 bg-white rounded-lg border-2 border-purple-200">
                      <h4 className="font-bold text-purple-800 mb-3">Decision Making Style</h4>
                      <div className="text-gray-700 leading-relaxed prose prose-sm max-w-none">
                        <ReactMarkdown>{results.decisionMakingStyle}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                  {results.emotionalReasoningPattern && (
                    <div className="p-4 bg-white rounded-lg border-2 border-purple-200">
                      <h4 className="font-bold text-purple-800 mb-3">Emotional Reasoning Pattern</h4>
                      <div className="text-gray-700 leading-relaxed prose prose-sm max-w-none">
                        <ReactMarkdown>{results.emotionalReasoningPattern}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>

                {/* Cognitive-Emotional Architecture */}
                {results.cognitiveEmotionalArchitecture && (
                  <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200">
                    <h4 className="font-bold text-purple-900 mb-4 text-lg">Cognitive-Emotional Architecture</h4>
                    <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                      <ReactMarkdown>{results.cognitiveEmotionalArchitecture}</ReactMarkdown>
                    </div>
                  </div>
                )}

                {/* Authenticity vs Performance */}
                {results.authenticityVsPerformance && (
                  <div className="p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border-2 border-orange-200">
                    <h4 className="font-bold text-orange-900 mb-4 text-lg">Authenticity vs Performance</h4>
                    <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                      <ReactMarkdown>{results.authenticityVsPerformance}</ReactMarkdown>
                    </div>
                  </div>
                )}

                {/* Synthesis Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {results.rationalEmotionalIntegration && (
                    <div className="p-4 bg-purple-50 rounded-lg text-center">
                      <h4 className="font-bold text-purple-800 mb-2">Integration Score</h4>
                      <div className="text-3xl font-bold text-purple-600">{results.rationalEmotionalIntegration}/10</div>
                    </div>
                  )}
                  {results.intellectualEmpathy && (
                    <div className="p-4 bg-pink-50 rounded-lg text-center">
                      <h4 className="font-bold text-pink-800 mb-2">Intellectual Empathy</h4>
                      <div className="text-3xl font-bold text-pink-600">{results.intellectualEmpathy}/10</div>
                    </div>
                  )}
                  {results.authenticityScore && (
                    <div className="p-4 bg-orange-50 rounded-lg text-center">
                      <h4 className="font-bold text-orange-800 mb-2">Authenticity Score</h4>
                      <div className="text-3xl font-bold text-orange-600">{results.authenticityScore}/10</div>
                    </div>
                  )}
                </div>

                {/* Strengths and Challenges */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {results.synthesisStrengths && (
                    <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
                      <h4 className="font-bold text-green-800 mb-3">Synthesis Strengths</h4>
                      <ul className="space-y-2">
                        {results.synthesisStrengths.map((strength: string, index: number) => (
                          <li key={index} className="text-green-700 flex items-start">
                            <span className="text-green-600 mr-2 font-bold">•</span>
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {results.integrationChallenges && (
                    <div className="p-4 bg-red-50 rounded-lg border-2 border-red-200">
                      <h4 className="font-bold text-red-800 mb-3">Integration Challenges</h4>
                      <ul className="space-y-2">
                        {results.integrationChallenges.map((challenge: string, index: number) => (
                          <li key={index} className="text-red-700 flex items-start">
                            <span className="text-red-600 mr-2 font-bold">•</span>
                            {challenge}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Development Pathways */}
                {results.developmentPathways && (
                  <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                    <h4 className="font-bold text-blue-800 mb-3">Development Pathways</h4>
                    <ul className="space-y-2">
                      {results.developmentPathways.map((pathway: string, index: number) => (
                        <li key={index} className="text-blue-700 flex items-start">
                          <span className="text-blue-600 mr-2 font-bold">•</span>
                          {pathway}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Supporting Evidence */}
                {results.supportingEvidence && (
                  <div className="space-y-4">
                    <h4 className="font-bold text-gray-800 mb-3">Supporting Evidence</h4>
                    
                    {results.supportingEvidence.intellectEmotionBalance && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <h5 className="font-medium text-gray-700 mb-3">Intellect-Emotion Balance Evidence</h5>
                        {results.supportingEvidence.intellectEmotionBalance.map((evidence: any, index: number) => (
                          <div key={index} className="border-l-4 border-purple-300 pl-4 py-2 mb-3 bg-white rounded-r">
                            <blockquote className="text-sm italic text-gray-600 mb-2">
                              "{evidence.quote}"
                            </blockquote>
                            <p className="text-sm text-gray-700">{evidence.explanation}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Holistic Signature */}
                {results.holisticSignature && (
                  <div className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border-2 border-purple-300">
                    <h4 className="font-bold text-purple-900 mb-4 text-lg">Holistic Signature</h4>
                    <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                      <ReactMarkdown>{results.holisticSignature}</ReactMarkdown>
                    </div>
                  </div>
                )}

                {/* Detailed Analysis */}
                {results.detailedAnalysis && (
                  <div className="p-6 bg-gray-50 rounded-lg border-2 border-gray-200">
                    <h4 className="font-bold text-gray-900 mb-4 text-lg">Detailed Analysis</h4>
                    <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                      <ReactMarkdown>{results.detailedAnalysis}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Show Metacognitive Profile */}
            {profileType === 'metacognitive' && results && (
              <div className="space-y-8">
                <h3 className="text-2xl font-bold text-indigo-800 flex items-center gap-2">
                  <Brain className="h-6 w-6" />
                  Metacognitive Analysis
                </h3>

                {/* Thesis Section */}
                {results.thesis && (
                  <div className="p-8 bg-green-50 rounded-xl border-2 border-green-200 shadow-sm">
                    <h4 className="text-2xl font-bold text-green-800 mb-6 flex items-center gap-3">
                      <CheckCircle className="h-7 w-7" />
                      {results.thesis.title || "Thesis: Primary Analysis"}
                    </h4>
                    
                    <div className="space-y-6">
                      {results.thesis.intellectualConfiguration && (
                        <div className="p-5 bg-white rounded-lg border border-green-100">
                          <h5 className="font-semibold text-green-700 mb-3 text-lg">Intellectual Configuration</h5>
                          <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                            <ReactMarkdown>{results.thesis.intellectualConfiguration}</ReactMarkdown>
                          </div>
                        </div>
                      )}

                      {results.thesis.cognitiveArchitecture && (
                        <div className="p-5 bg-white rounded-lg border border-green-100">
                          <h5 className="font-semibold text-green-700 mb-3 text-lg">Cognitive Architecture</h5>
                          <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                            <ReactMarkdown>{results.thesis.cognitiveArchitecture}</ReactMarkdown>
                          </div>
                        </div>
                      )}

                      {results.thesis.metacognitiveAwareness && (
                        <div className="p-5 bg-white rounded-lg border border-green-100">
                          <h5 className="font-semibold text-green-700 mb-3 text-lg">Metacognitive Awareness</h5>
                          <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                            <ReactMarkdown>{results.thesis.metacognitiveAwareness}</ReactMarkdown>
                          </div>
                        </div>
                      )}

                      {results.thesis.intellectualHabits && (
                        <div className="p-5 bg-white rounded-lg border border-green-100">
                          <h5 className="font-semibold text-green-700 mb-3 text-lg">Intellectual Habits</h5>
                          <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                            <ReactMarkdown>{results.thesis.intellectualHabits}</ReactMarkdown>
                          </div>
                        </div>
                      )}

                      {results.thesis.epistemicVirtues && (
                        <div className="p-5 bg-white rounded-lg border border-green-100">
                          <h5 className="font-semibold text-green-700 mb-3 text-lg">Epistemic Virtues</h5>
                          <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                            <ReactMarkdown>{results.thesis.epistemicVirtues}</ReactMarkdown>
                          </div>
                        </div>
                      )}

                      {results.thesis.reflectiveCapacity && (
                        <div className="p-5 bg-white rounded-lg border border-green-100">
                          <h5 className="font-semibold text-green-700 mb-3 text-lg">Reflective Capacity</h5>
                          <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                            <ReactMarkdown>{results.thesis.reflectiveCapacity}</ReactMarkdown>
                          </div>
                        </div>
                      )}

                      {results.thesis.selfKnowledge && (
                        <div className="p-5 bg-white rounded-lg border border-green-100">
                          <h5 className="font-semibold text-green-700 mb-3 text-lg">Self-Knowledge</h5>
                          <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                            <ReactMarkdown>{results.thesis.selfKnowledge}</ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Antithesis Section */}
                {results.antithesis && (
                  <div className="p-8 bg-red-50 rounded-xl border-2 border-red-200 shadow-sm">
                    <h4 className="text-2xl font-bold text-red-800 mb-6 flex items-center gap-3">
                      <XCircle className="h-7 w-7" />
                      {results.antithesis.title || "Antithesis: Dissenting Analysis"}
                    </h4>
                    
                    <div className="space-y-6">
                      {results.antithesis.counterConfiguration && (
                        <div className="p-5 bg-white rounded-lg border border-red-100">
                          <h5 className="font-semibold text-red-700 mb-3 text-lg">Counter-Configuration</h5>
                          <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                            <ReactMarkdown>{results.antithesis.counterConfiguration}</ReactMarkdown>
                          </div>
                        </div>
                      )}

                      {results.antithesis.alternativeArchitecture && (
                        <div className="p-5 bg-white rounded-lg border border-red-100">
                          <h5 className="font-semibold text-red-700 mb-3 text-lg">Alternative Architecture</h5>
                          <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                            <ReactMarkdown>{results.antithesis.alternativeArchitecture}</ReactMarkdown>
                          </div>
                        </div>
                      )}

                      {results.antithesis.limitedAwareness && (
                        <div className="p-5 bg-white rounded-lg border border-red-100">
                          <h5 className="font-semibold text-red-700 mb-3 text-lg">Limited Awareness</h5>
                          <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                            <ReactMarkdown>{results.antithesis.limitedAwareness}</ReactMarkdown>
                          </div>
                        </div>
                      )}

                      {results.antithesis.problematicHabits && (
                        <div className="p-5 bg-white rounded-lg border border-red-100">
                          <h5 className="font-semibold text-red-700 mb-3 text-lg">Problematic Habits</h5>
                          <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                            <ReactMarkdown>{results.antithesis.problematicHabits}</ReactMarkdown>
                          </div>
                        </div>
                      )}

                      {results.antithesis.epistemicVices && (
                        <div className="p-5 bg-white rounded-lg border border-red-100">
                          <h5 className="font-semibold text-red-700 mb-3 text-lg">Epistemic Vices</h5>
                          <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                            <ReactMarkdown>{results.antithesis.epistemicVices}</ReactMarkdown>
                          </div>
                        </div>
                      )}

                      {results.antithesis.reflectiveLimitations && (
                        <div className="p-5 bg-white rounded-lg border border-red-100">
                          <h5 className="font-semibold text-red-700 mb-3 text-lg">Reflective Limitations</h5>
                          <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                            <ReactMarkdown>{results.antithesis.reflectiveLimitations}</ReactMarkdown>
                          </div>
                        </div>
                      )}

                      {results.antithesis.selfDeception && (
                        <div className="p-5 bg-white rounded-lg border border-red-100">
                          <h5 className="font-semibold text-red-700 mb-3 text-lg">Self-Deception</h5>
                          <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                            <ReactMarkdown>{results.antithesis.selfDeception}</ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Super-Thesis Section */}
                {results.superThesis && (
                  <div className="p-8 bg-blue-50 rounded-xl border-2 border-blue-200 shadow-sm">
                    <h4 className="text-2xl font-bold text-blue-800 mb-6 flex items-center gap-3">
                      <Crown className="h-7 w-7" />
                      {results.superThesis.title || "Super-Thesis: Reinforced Analysis"}
                    </h4>
                    
                    <div className="space-y-6">
                      {results.superThesis.reinforcedConfiguration && (
                        <div className="p-5 bg-white rounded-lg border border-blue-100">
                          <h5 className="font-semibold text-blue-700 mb-3 text-lg">Reinforced Configuration</h5>
                          <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                            <ReactMarkdown>{results.superThesis.reinforcedConfiguration}</ReactMarkdown>
                          </div>
                        </div>
                      )}

                      {results.superThesis.defendedArchitecture && (
                        <div className="p-5 bg-white rounded-lg border border-blue-100">
                          <h5 className="font-semibold text-blue-700 mb-3 text-lg">Defended Architecture</h5>
                          <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                            <ReactMarkdown>{results.superThesis.defendedArchitecture}</ReactMarkdown>
                          </div>
                        </div>
                      )}

                      {results.superThesis.validatedAwareness && (
                        <div className="p-5 bg-white rounded-lg border border-blue-100">
                          <h5 className="font-semibold text-blue-700 mb-3 text-lg">Validated Awareness</h5>
                          <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                            <ReactMarkdown>{results.superThesis.validatedAwareness}</ReactMarkdown>
                          </div>
                        </div>
                      )}

                      {results.superThesis.confirmedHabits && (
                        <div className="p-5 bg-white rounded-lg border border-blue-100">
                          <h5 className="font-semibold text-blue-700 mb-3 text-lg">Confirmed Habits</h5>
                          <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                            <ReactMarkdown>{results.superThesis.confirmedHabits}</ReactMarkdown>
                          </div>
                        </div>
                      )}

                      {results.superThesis.strengthenedVirtues && (
                        <div className="p-5 bg-white rounded-lg border border-blue-100">
                          <h5 className="font-semibold text-blue-700 mb-3 text-lg">Strengthened Virtues</h5>
                          <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                            <ReactMarkdown>{results.superThesis.strengthenedVirtues}</ReactMarkdown>
                          </div>
                        </div>
                      )}

                      {results.superThesis.enhancedReflection && (
                        <div className="p-5 bg-white rounded-lg border border-blue-100">
                          <h5 className="font-semibold text-blue-700 mb-3 text-lg">Enhanced Reflection</h5>
                          <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                            <ReactMarkdown>{results.superThesis.enhancedReflection}</ReactMarkdown>
                          </div>
                        </div>
                      )}

                      {results.superThesis.authenticSelfKnowledge && (
                        <div className="p-5 bg-white rounded-lg border border-blue-100">
                          <h5 className="font-semibold text-blue-700 mb-3 text-lg">Authentic Self-Knowledge</h5>
                          <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                            <ReactMarkdown>{results.superThesis.authenticSelfKnowledge}</ReactMarkdown>
                          </div>
                        </div>
                      )}

                      {results.superThesis.refutationOfAntithesis && (
                        <div className="p-5 bg-yellow-50 rounded-lg border border-yellow-200">
                          <h5 className="font-semibold text-yellow-700 mb-3 text-lg">Refutation of Dissenting Analysis</h5>
                          <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                            <ReactMarkdown>{results.superThesis.refutationOfAntithesis}</ReactMarkdown>
                          </div>
                        </div>
                      )}

                      {results.superThesis.finalAssessment && (
                        <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                          <h5 className="font-semibold text-blue-700 mb-3 text-lg">Final Assessment</h5>
                          <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                            <ReactMarkdown>{results.superThesis.finalAssessment}</ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Overall Metacognitive Profile */}
                {results.overallMetacognitiveProfile && (
                  <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border-2 border-indigo-200">
                    <h4 className="font-bold text-indigo-900 mb-4 text-lg">Overall Metacognitive Profile</h4>
                    <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                      <ReactMarkdown>{results.overallMetacognitiveProfile}</ReactMarkdown>
                    </div>
                  </div>
                )}

                {/* Metacognitive Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {results.intellectualMaturity && (
                    <div className="p-4 bg-white rounded-lg border-2 border-indigo-200 text-center">
                      <div className="text-sm font-medium text-indigo-600 mb-2">Intellectual Maturity</div>
                      <div className="text-2xl font-bold text-indigo-800">{results.intellectualMaturity}/10</div>
                      <Progress value={results.intellectualMaturity * 10} className="mt-2" />
                    </div>
                  )}
                  {results.selfAwarenessLevel && (
                    <div className="p-4 bg-white rounded-lg border-2 border-indigo-200 text-center">
                      <div className="text-sm font-medium text-indigo-600 mb-2">Self-Awareness Level</div>
                      <div className="text-2xl font-bold text-indigo-800">{results.selfAwarenessLevel}/10</div>
                      <Progress value={results.selfAwarenessLevel * 10} className="mt-2" />
                    </div>
                  )}
                  {results.epistemicHumility && (
                    <div className="p-4 bg-white rounded-lg border-2 border-indigo-200 text-center">
                      <div className="text-sm font-medium text-indigo-600 mb-2">Epistemic Humility</div>
                      <div className="text-2xl font-bold text-indigo-800">{results.epistemicHumility}/10</div>
                      <Progress value={results.epistemicHumility * 10} className="mt-2" />
                    </div>
                  )}
                  {results.reflectiveDepth && (
                    <div className="p-4 bg-white rounded-lg border-2 border-indigo-200 text-center">
                      <div className="text-sm font-medium text-indigo-600 mb-2">Reflective Depth</div>
                      <div className="text-2xl font-bold text-indigo-800">{results.reflectiveDepth}/10</div>
                      <Progress value={results.reflectiveDepth * 10} className="mt-2" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Metapsychological Profile Section */}
            {results?.thesis && results?.antithesis && results?.superThesis && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-center text-gray-800 mb-6">
                  Metapsychological Profile Analysis
                </h3>
                
                {/* Thesis Section */}
                <div className="p-8 bg-green-50 rounded-xl border-2 border-green-200 shadow-sm">
                  <h4 className="text-2xl font-bold text-green-800 mb-6 flex items-center gap-3">
                    <Lightbulb className="h-7 w-7" />
                    Thesis: Primary Psychological Analysis
                  </h4>
                  
                  <div className="space-y-6">
                    {results.thesis.emotionalConfiguration && (
                      <div className="p-5 bg-white rounded-lg border border-green-100">
                        <h5 className="font-semibold text-green-700 mb-3 text-lg">Emotional Configuration</h5>
                        <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                          <ReactMarkdown>{results.thesis.emotionalConfiguration}</ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {results.thesis.comparisonToParadigms && (
                      <div className="p-5 bg-white rounded-lg border border-green-100">
                        <h5 className="font-semibold text-green-700 mb-3 text-lg">Comparison to Paradigm Examples</h5>
                        <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                          <ReactMarkdown>{results.thesis.comparisonToParadigms}</ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {results.thesis.uniqueStrengths && (
                      <div className="p-5 bg-white rounded-lg border border-green-100">
                        <h5 className="font-semibold text-green-700 mb-3 text-lg">Unique Strengths</h5>
                        <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                          <ReactMarkdown>{results.thesis.uniqueStrengths}</ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {results.thesis.uniqueWeaknesses && (
                      <div className="p-5 bg-white rounded-lg border border-green-100">
                        <h5 className="font-semibold text-green-700 mb-3 text-lg">Unique Weaknesses</h5>
                        <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                          <ReactMarkdown>{results.thesis.uniqueWeaknesses}</ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {results.thesis.interpersonalSocialFit && (
                      <div className="p-5 bg-white rounded-lg border border-green-100">
                        <h5 className="font-semibold text-green-700 mb-3 text-lg">Interpersonal/Social Fit</h5>
                        <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                          <ReactMarkdown>{results.thesis.interpersonalSocialFit}</ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {results.thesis.mostRevealingQuotation && (
                      <div className="p-5 bg-white rounded-lg border border-green-100">
                        <h5 className="font-semibold text-green-700 mb-3 text-lg flex items-center gap-2">
                          <Quote className="h-5 w-5" />
                          Most Revealing Quotation
                        </h5>
                        <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                          <ReactMarkdown>{results.thesis.mostRevealingQuotation}</ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Antithesis Section */}
                <div className="p-8 bg-red-50 rounded-xl border-2 border-red-200 shadow-sm">
                  <h4 className="text-2xl font-bold text-red-800 mb-6 flex items-center gap-3">
                    <XCircle className="h-7 w-7" />
                    Antithesis: Dissenting Analysis
                  </h4>
                  
                  <div className="space-y-6">
                    {results.antithesis.alternativeEmotionalConfiguration && (
                      <div className="p-5 bg-white rounded-lg border border-red-100">
                        <h5 className="font-semibold text-red-700 mb-3 text-lg">Alternative Emotional Configuration</h5>
                        <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                          <ReactMarkdown>{results.antithesis.alternativeEmotionalConfiguration}</ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {results.antithesis.counterParadigmComparison && (
                      <div className="p-5 bg-white rounded-lg border border-red-100">
                        <h5 className="font-semibold text-red-700 mb-3 text-lg">Counter-Paradigm Comparison</h5>
                        <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                          <ReactMarkdown>{results.antithesis.counterParadigmComparison}</ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {results.antithesis.hiddenStrengths && (
                      <div className="p-5 bg-white rounded-lg border border-red-100">
                        <h5 className="font-semibold text-red-700 mb-3 text-lg">Hidden Strengths</h5>
                        <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                          <ReactMarkdown>{results.antithesis.hiddenStrengths}</ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {results.antithesis.overlookedWeaknesses && (
                      <div className="p-5 bg-white rounded-lg border border-red-100">
                        <h5 className="font-semibold text-red-700 mb-3 text-lg">Overlooked Weaknesses</h5>
                        <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                          <ReactMarkdown>{results.antithesis.overlookedWeaknesses}</ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {results.antithesis.alternativeInterpersonalFit && (
                      <div className="p-5 bg-white rounded-lg border border-red-100">
                        <h5 className="font-semibold text-red-700 mb-3 text-lg">Alternative Interpersonal Fit</h5>
                        <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                          <ReactMarkdown>{results.antithesis.alternativeInterpersonalFit}</ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {results.antithesis.alternativeQuotationInterpretation && (
                      <div className="p-5 bg-white rounded-lg border border-red-100">
                        <h5 className="font-semibold text-red-700 mb-3 text-lg flex items-center gap-2">
                          <Quote className="h-5 w-5" />
                          Alternative Quotation Interpretation
                        </h5>
                        <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                          <ReactMarkdown>{results.antithesis.alternativeQuotationInterpretation}</ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Super-Thesis Section */}
                <div className="p-8 bg-blue-50 rounded-xl border-2 border-blue-200 shadow-sm">
                  <h4 className="text-2xl font-bold text-blue-800 mb-6 flex items-center gap-3">
                    <Crown className="h-7 w-7" />
                    Super-Thesis: Reinforced Analysis
                  </h4>
                  
                  <div className="space-y-6">
                    {results.superThesis.reinforcedEmotionalConfiguration && (
                      <div className="p-5 bg-white rounded-lg border border-blue-100">
                        <h5 className="font-semibold text-blue-700 mb-3 text-lg">Reinforced Emotional Configuration</h5>
                        <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                          <ReactMarkdown>{results.superThesis.reinforcedEmotionalConfiguration}</ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {results.superThesis.definitiveParadigmComparison && (
                      <div className="p-5 bg-white rounded-lg border border-blue-100">
                        <h5 className="font-semibold text-blue-700 mb-3 text-lg">Definitive Paradigm Comparison</h5>
                        <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                          <ReactMarkdown>{results.superThesis.definitiveParadigmComparison}</ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {results.superThesis.confirmedStrengths && (
                      <div className="p-5 bg-white rounded-lg border border-blue-100">
                        <h5 className="font-semibold text-blue-700 mb-3 text-lg">Confirmed Strengths</h5>
                        <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                          <ReactMarkdown>{results.superThesis.confirmedStrengths}</ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {results.superThesis.confirmedWeaknesses && (
                      <div className="p-5 bg-white rounded-lg border border-blue-100">
                        <h5 className="font-semibold text-blue-700 mb-3 text-lg">Confirmed Weaknesses</h5>
                        <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                          <ReactMarkdown>{results.superThesis.confirmedWeaknesses}</ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {results.superThesis.finalInterpersonalAssessment && (
                      <div className="p-5 bg-white rounded-lg border border-blue-100">
                        <h5 className="font-semibold text-blue-700 mb-3 text-lg">Final Interpersonal Assessment</h5>
                        <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                          <ReactMarkdown>{results.superThesis.finalInterpersonalAssessment}</ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {results.superThesis.quotationSignificance && (
                      <div className="p-5 bg-white rounded-lg border border-blue-100">
                        <h5 className="font-semibold text-blue-700 mb-3 text-lg flex items-center gap-2">
                          <Quote className="h-5 w-5" />
                          Quotation Significance
                        </h5>
                        <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                          <ReactMarkdown>{results.superThesis.quotationSignificance}</ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {results.superThesis.refutationOfAntithesis && (
                      <div className="p-5 bg-white rounded-lg border border-blue-100">
                        <h5 className="font-semibold text-blue-700 mb-3 text-lg flex items-center gap-2">
                          <Shield className="h-5 w-5" />
                          Refutation of Antithesis
                        </h5>
                        <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                          <ReactMarkdown>{results.superThesis.refutationOfAntithesis}</ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {results.superThesis.finalPsychologicalAssessment && (
                      <div className="p-5 bg-white rounded-lg border border-blue-100">
                        <h5 className="font-semibold text-blue-700 mb-3 text-lg">Final Psychological Assessment</h5>
                        <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                          <ReactMarkdown>{results.superThesis.finalPsychologicalAssessment}</ReactMarkdown>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {results.overallMetapsychologicalProfile && (
                  <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200">
                    <h4 className="font-bold text-purple-900 mb-4 text-lg">Overall Metapsychological Profile</h4>
                    <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                      <ReactMarkdown>{results.overallMetapsychologicalProfile}</ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Show Comprehensive Insights */}
            {results?.comprehensiveInsights && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-purple-800 flex items-center gap-2">
                  <Sparkles className="h-6 w-6" />
                  Comprehensive Insights
                </h3>
                
                <div className="p-6 bg-purple-50 rounded-lg border-2 border-purple-200">
                  <h4 className="font-bold text-purple-900 mb-4 text-lg">Overall Profile</h4>
                  <div className="text-gray-800 leading-relaxed">
                    {results.comprehensiveInsights.overallProfile}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
                    <h4 className="font-bold text-green-800 mb-3">Strengths</h4>
                    <ul className="space-y-2">
                      {results.comprehensiveInsights.uniqueStrengths?.map((strength: string, index: number) => (
                        <li key={index} className="text-green-700 flex items-start">
                          <span className="text-green-600 mr-2 font-bold">•</span>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
                    <h4 className="font-bold text-orange-800 mb-3">Development Areas</h4>
                    <ul className="space-y-2">
                      {results.comprehensiveInsights.developmentAreas?.map((area: string, index: number) => (
                        <li key={index} className="text-orange-700 flex items-start">
                          <span className="text-orange-600 mr-2 font-bold">•</span>
                          {area}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                {results.comprehensiveInsights.recommendations && (
                  <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                    <h4 className="font-bold text-blue-800 mb-3">Recommendations</h4>
                    <ul className="space-y-2">
                      {results.comprehensiveInsights.recommendations.map((rec: string, index: number) => (
                        <li key={index} className="text-blue-700 flex items-start">
                          <span className="text-blue-600 mr-2 font-bold">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}



            </div>
          </div>
          
          {/* Fixed footer with export options */}
          <div className="border-t border-gray-200 p-6 bg-white">
            <div className="flex justify-between items-center">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => exportProfile.mutate('pdf')}
                  disabled={exportProfile.isPending}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={() => exportProfile.mutate('docx')}
                  disabled={exportProfile.isPending}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Export Word
                </Button>
              </div>
              <Button 
                onClick={() => setShowResultsDialog(false)}
                className="bg-gray-600 hover:bg-gray-700"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}