import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Brain, 
  Heart, 
  Zap, 
  Download, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Crown,
  ChevronDown,
  Sparkles,
  Users,
  Target,
  TrendingUp,
  Book,
  Lightbulb,
  Eye,
  MessageSquare,
  Shield
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { MathJax, MathJaxContext } from 'better-react-mathjax';

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
  
  // Metacognitive fields
  thesis?: {
    intellectualConfiguration?: string;
    cognitiveArchitecture?: string;
    reasoningPatterns?: string;
    metacognitiveAwareness?: string;
  };
  antithesis?: {
    counterConfiguration?: string;
    alternativeFramework?: string;
    criticalChallenges?: string;
    limitationsAndBiases?: string;
  };
  superThesis?: {
    reinforcedConfiguration?: string;
    synthesizedFramework?: string;
    strengthenedConclusions?: string;
    finalAssessment?: string;
  };
  
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

const mathJaxConfig = {
  loader: { load: ["[tex]/html"] },
  tex: {
    packages: { "[+]": ["html"] },
    inlineMath: [["$", "$"], ["\\(", "\\)"]],
    displayMath: [["$$", "$$"], ["\\[", "\\]"]]
  },
  options: {
    menuOptions: {
      settings: {
        assistiveMml: true
      }
    }
  }
};

export default function MindProfiler({ userId }: MindProfilerProps) {
  const [inputText, setInputText] = useState('');
  const [results, setResults] = useState<ProfileResults | null>(null);
  const [profileType, setProfileType] = useState<'psychological' | 'synthesis' | 'metacognitive'>('psychological');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const analyzeProfile = useMutation({
    mutationFn: async (data: { text: string; profileType: string; userId: number }) => {
      const response = await fetch('/api/analyze-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        throw new Error('Analysis failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setResults(data);
      setIsProcessing(false);
      setShowResultsDialog(true);
      toast({
        title: "Analysis Complete",
        description: "Your mind profile has been generated successfully."
      });
    },
    onError: (error: any) => {
      setIsProcessing(false);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze the text. Please try again.",
        variant: "destructive"
      });
    }
  });

  const exportProfile = useMutation({
    mutationFn: async (format: 'pdf' | 'docx') => {
      if (!results) throw new Error('No profile data to export');
      const response = await fetch(`/api/export-profile/${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          profileData: results, 
          profileType,
          userId 
        })
      });
      if (!response.ok) {
        throw new Error('Export failed');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mind-profile-${profileType}-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "Export Successful",
        description: "Your profile has been downloaded."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Export Failed", 
        description: error.message || "Failed to export profile.",
        variant: "destructive"
      });
    }
  });

  const handleAnalyze = () => {
    if (!inputText.trim()) {
      toast({
        title: "No Text Provided",
        description: "Please enter some text to analyze.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    analyzeProfile.mutate({
      text: inputText,
      profileType,
      userId
    });
  };

  return (
    <MathJaxContext config={mathJaxConfig}>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-blue-600" />
              Mind Profiler
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Profile Type</label>
              <Tabs value={profileType} onValueChange={(value) => setProfileType(value as any)} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="psychological" className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Psychological
                  </TabsTrigger>
                  <TabsTrigger value="synthesis" className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Synthesis
                  </TabsTrigger>
                  <TabsTrigger value="metacognitive" className="flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Metacognitive
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Text to Analyze</label>
              <Textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste your text here for cognitive profiling analysis..."
                className="min-h-[200px]"
              />
            </div>

            <Button 
              onClick={handleAnalyze}
              disabled={isProcessing || !inputText.trim()}
              className="w-full"
              size="lg"
            >
              {isProcessing ? 'Analyzing...' : 'Generate Profile'}
            </Button>
          </CardContent>
        </Card>

        {/* Results Dialog */}
        <Dialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] overflow-hidden p-0" aria-describedby="results-description">
            <DialogHeader className="p-6 border-b border-gray-200">
              <DialogTitle className="flex items-center gap-2">
                <Brain className="h-6 w-6 text-blue-600" />
                Mind Profile Analysis Results
              </DialogTitle>
            </DialogHeader>
            
            <div className="overflow-y-auto max-h-[calc(95vh-200px)] p-6">
              {profileType === 'psychological' && results && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-red-800 flex items-center gap-2">
                    <Heart className="h-6 w-6" />
                    Psychological Analysis
                  </h3>
                  
                  {results.emotionalPattern && (
                    <div className="p-6 bg-red-50 rounded-lg border-2 border-red-200">
                      <h4 className="font-bold text-red-900 mb-4 text-lg">Emotional Pattern</h4>
                      <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                        <MathJax>
                          <ReactMarkdown>{results.emotionalPattern}</ReactMarkdown>
                        </MathJax>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {results.motivationalStructure && (
                      <div className="p-4 bg-white rounded-lg border-2 border-red-200">
                        <h4 className="font-bold text-red-800 mb-3">Motivational Structure</h4>
                        <div className="text-gray-700 leading-relaxed prose prose-sm max-w-none">
                          <MathJax>
                            <ReactMarkdown>{results.motivationalStructure}</ReactMarkdown>
                          </MathJax>
                        </div>
                      </div>
                    )}
                    {results.interpersonalDynamics && (
                      <div className="p-4 bg-white rounded-lg border-2 border-red-200">
                        <h4 className="font-bold text-red-800 mb-3">Interpersonal Dynamics</h4>
                        <div className="text-gray-700 leading-relaxed prose prose-sm max-w-none">
                          <MathJax>
                            <ReactMarkdown>{results.interpersonalDynamics}</ReactMarkdown>
                          </MathJax>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {profileType === 'synthesis' && results && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-purple-800 flex items-center gap-2">
                    <Zap className="h-6 w-6" />
                    Synthesis Analysis
                  </h3>
                  
                  {results.intellectEmotionBalance && (
                    <div className="p-6 bg-purple-50 rounded-lg border-2 border-purple-200">
                      <h4 className="font-bold text-purple-900 mb-4 text-lg">Intellect-Emotion Balance</h4>
                      <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                        <MathJax>
                          <ReactMarkdown>{results.intellectEmotionBalance}</ReactMarkdown>
                        </MathJax>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {profileType === 'metacognitive' && results && (
                <div className="space-y-8">
                  <h3 className="text-2xl font-bold text-indigo-800 flex items-center gap-2">
                    <Brain className="h-6 w-6" />
                    Metacognitive Analysis
                  </h3>

                  {results.thesis && (
                    <div className="space-y-6">
                      <Collapsible>
                        <CollapsibleTrigger className="w-full p-6 bg-green-50 rounded-lg border-2 border-green-200 hover:bg-green-100 transition-colors">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-green-900 text-lg flex items-center gap-2">
                              <CheckCircle className="h-5 w-5" />
                              Thesis: Primary Analysis
                            </h4>
                            <ChevronDown className="h-5 w-5 text-green-700" />
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2">
                          <div className="p-6 bg-white rounded-lg border-2 border-green-200 space-y-6">
                            {results.thesis.intellectualConfiguration && (
                              <div>
                                <h5 className="font-semibold text-green-700 mb-3 text-lg">Intellectual Configuration</h5>
                                <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                                  <MathJax>
                                    <ReactMarkdown>{results.thesis.intellectualConfiguration}</ReactMarkdown>
                                  </MathJax>
                                </div>
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>

                      {results.antithesis && (
                        <Collapsible>
                          <CollapsibleTrigger className="w-full p-6 bg-red-50 rounded-lg border-2 border-red-200 hover:bg-red-100 transition-colors">
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-red-900 text-lg flex items-center gap-2">
                                <XCircle className="h-5 w-5" />
                                Antithesis: Dissenting Analysis
                              </h4>
                              <ChevronDown className="h-5 w-5 text-red-700" />
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-2">
                            <div className="p-6 bg-white rounded-lg border-2 border-red-200 space-y-6">
                              {results.antithesis.counterConfiguration && (
                                <div>
                                  <h5 className="font-semibold text-red-700 mb-3 text-lg">Counter Configuration</h5>
                                  <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                                    <MathJax>
                                      <ReactMarkdown>{results.antithesis.counterConfiguration}</ReactMarkdown>
                                    </MathJax>
                                  </div>
                                </div>
                              )}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )}

                      {results.superThesis && (
                        <Collapsible>
                          <CollapsibleTrigger className="w-full p-6 bg-blue-50 rounded-lg border-2 border-blue-200 hover:bg-blue-100 transition-colors">
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-blue-900 text-lg flex items-center gap-2">
                                <Crown className="h-5 w-5" />
                                Super-Thesis: Reinforced Analysis
                              </h4>
                              <ChevronDown className="h-5 w-5 text-blue-700" />
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-2">
                            <div className="p-6 bg-white rounded-lg border-2 border-blue-200 space-y-6">
                              {results.superThesis.reinforcedConfiguration && (
                                <div>
                                  <h5 className="font-semibold text-blue-700 mb-3 text-lg">Reinforced Configuration</h5>
                                  <div className="text-gray-800 leading-relaxed prose prose-sm max-w-none">
                                    <MathJax>
                                      <ReactMarkdown>{results.superThesis.reinforcedConfiguration}</ReactMarkdown>
                                    </MathJax>
                                  </div>
                                </div>
                              )}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            
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
    </MathJaxContext>
  );
}