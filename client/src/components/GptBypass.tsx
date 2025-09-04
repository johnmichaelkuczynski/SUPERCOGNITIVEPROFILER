import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Upload, FileText, MessageCircle, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface GptBypassProps {}

// Instruction presets (30+ as required)
const instructionPresets = [
  "Academic Writing Enhancement",
  "Conversational Tone Adaptation",
  "Creative Expression Amplification",
  "Technical Documentation Style",
  "Journalistic Objectivity",
  "Persuasive Argumentation",
  "Narrative Storytelling",
  "Professional Business Communication",
  "Educational Content Simplification",
  "Analytical Critical Thinking",
  "Descriptive Vivid Imagery",
  "Explanatory Clarity Focus",
  "Historical Context Integration",
  "Scientific Precision",
  "Literary Sophistication",
  "Marketing Copy Optimization",
  "Research Paper Formality",
  "Blog Post Engagement",
  "Social Media Adaptation",
  "Email Communication Polish",
  "Report Writing Structure",
  "Presentation Script Flow",
  "Interview Response Preparation",
  "Product Description Enhancement",
  "News Article Objectivity",
  "Opinion Piece Conviction",
  "Tutorial Step-by-Step Clarity",
  "Review Content Balance",
  "FAQ Response Helpfulness",
  "Biography Narrative Flow",
  "Manual Instructions Precision",
  "Diplomatic Language Tact",
  "Youth-Oriented Communication",
  "Senior-Friendly Explanation"
];

// Default style sample (The Raven Paradox)
const defaultStyleSample = `The Raven Paradox, first formulated by philosopher Carl Gustav Hempel in the 1940s, presents a fascinating challenge to our intuitive understanding of logical confirmation. The paradox emerges when we consider the statement "all ravens are black" and attempt to gather evidence supporting this claim.

Logically, the statement "all ravens are black" is equivalent to "all non-black things are non-ravens." This equivalence means that observing a white shoe should provide the same confirmatory evidence for "all ravens are black" as observing a black raven. After all, the white shoe is both non-black and non-raven, perfectly fitting our logically equivalent statement.

Yet this conclusion strikes most people as absurd. How could examining objects in your living room possibly tell us anything meaningful about ravens? This intuitive resistance reveals a deep tension between formal logical rules and human reasoning patterns.

The paradox illuminates several important philosophical issues: the nature of confirmation, the role of background knowledge in scientific reasoning, and the sometimes counterintuitive implications of logical equivalence. Various solutions have been proposed, from questioning the logical equivalence to arguing that context and prior knowledge play crucial roles in determining what counts as relevant evidence.

Ultimately, the Raven Paradox serves as a powerful reminder that logical consistency doesn't always align with intuitive plausibility, challenging us to think more carefully about how we gather and evaluate evidence in both scientific and everyday contexts.`;

export function GptBypass({}: GptBypassProps) {
  const [inputText, setInputText] = useState('');
  const [styleText, setStyleText] = useState(defaultStyleSample);
  const [contentMixText, setContentMixText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [selectedPresets, setSelectedPresets] = useState<string[]>([]);
  const [provider, setProvider] = useState('deepseek'); // Default to ZHI 1 (DeepSeek)
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputAiScore, setInputAiScore] = useState<number | null>(null);
  const [outputAiScore, setOutputAiScore] = useState<number | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{role: string, content: string}>>([]);
  const [isChatting, setIsChatting] = useState(false);
  const [showChat, setShowChat] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Get AI score color based on score
  const getScoreColor = (score: number) => {
    if (score < 0.3) return 'text-green-600';
    if (score < 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get AI score badge variant
  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score < 0.3) return 'default';
    if (score < 0.7) return 'secondary';
    return 'destructive';
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('File upload failed');

      const result = await response.json();
      setInputText(result.document?.content || result.content || '');
      toast({
        title: "File uploaded successfully",
        description: `Processed ${result.document?.filename || file.name}`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    }
  };

  // Analyze text with GPTZero
  const analyzeText = async (text: string, isOutput = false) => {
    if (!text.trim()) return null;

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!response.ok) throw new Error('Analysis failed');

      const result = await response.json();
      const score = result.aiScore || 0;

      if (isOutput) {
        setOutputAiScore(score);
      } else {
        setInputAiScore(score);
      }

      return score;
    } catch (error) {
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle rewrite
  const handleRewrite = async () => {
    if (!inputText.trim()) {
      toast({
        title: "Input required",
        description: "Please enter text to rewrite in Box A",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Analyze input text first
      await analyzeText(inputText, false);

      const response = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputText,
          styleText: styleText || undefined,
          contentMixText: contentMixText || undefined,
          customInstructions: customInstructions || undefined,
          selectedPresets,
          provider
        })
      });

      if (!response.ok) throw new Error('Rewrite failed');

      const result = await response.json();
      setOutputText(result.rewrittenText);
      setInputAiScore(result.inputAiScore);
      setOutputAiScore(result.outputAiScore);
      setJobId(result.jobId);

      toast({
        title: "Text rewritten successfully",
        description: `AI Score: ${(result.inputAiScore * 100).toFixed(1)}% → ${(result.outputAiScore * 100).toFixed(1)}%`,
      });
    } catch (error) {
      toast({
        title: "Rewrite failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle re-rewrite
  const handleReRewrite = async () => {
    if (!jobId || !outputText) {
      toast({
        title: "No previous output",
        description: "You need to rewrite text first before re-rewriting",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/re-rewrite/${jobId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customInstructions: customInstructions || undefined,
          selectedPresets,
          provider
        })
      });

      if (!response.ok) throw new Error('Re-rewrite failed');

      const result = await response.json();
      setOutputText(result.rewrittenText);
      setOutputAiScore(result.outputAiScore);
      setJobId(result.jobId);

      toast({
        title: "Text re-rewritten successfully",
        description: `New AI Score: ${(result.outputAiScore * 100).toFixed(1)}%`,
      });
    } catch (error) {
      toast({
        title: "Re-rewrite failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle chat
  const handleChat = async () => {
    if (!chatMessage.trim()) return;

    const message = chatMessage.trim();
    setChatMessage('');
    setIsChatting(true);

    // Add user message to history
    const updatedHistory = [...chatHistory, { role: 'user', content: message }];
    setChatHistory(updatedHistory);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          provider,
          context: {
            inputText,
            styleText,
            contentMixText,
            outputText
          }
        })
      });

      if (!response.ok) throw new Error('Chat failed');

      const result = await response.json();
      
      // Add assistant response to history
      setChatHistory(prev => [...prev, { role: 'assistant', content: result.response }]);
    } catch (error) {
      toast({
        title: "Chat failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive",
      });
    } finally {
      setIsChatting(false);
    }
  };

  // Toggle preset selection
  const togglePreset = (preset: string) => {
    setSelectedPresets(prev => 
      prev.includes(preset) 
        ? prev.filter(p => p !== preset)
        : [...prev, preset]
    );
  };

  // Get provider display name
  const getProviderName = (p: string) => {
    switch (p) {
      case 'deepseek': return 'ZHI 1';
      case 'anthropic': return 'ZHI 2';
      case 'openai': return 'ZHI 3';
      case 'perplexity': return 'ZHI 4';
      default: return p;
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight">GPT Bypass</h2>
        <p className="text-muted-foreground">
          Transform AI-generated text using surgical style mimicking across multiple providers
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          REWRITE WHAT IS IN BOX A SO THAT IT IS EXACTLY IN THE STYLE OF WHAT IS IN BOX B
        </p>
      </div>

      {/* Provider and Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4">
          <Label htmlFor="provider">AI Provider:</Label>
          <Select value={provider} onValueChange={setProvider}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="deepseek">ZHI 1 (Primary)</SelectItem>
              <SelectItem value="anthropic">ZHI 2</SelectItem>
              <SelectItem value="openai">ZHI 3</SelectItem>
              <SelectItem value="perplexity">ZHI 4</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.pdf,.doc,.docx"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload File
          </Button>
          
          <Dialog open={showChat} onOpenChange={setShowChat}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <MessageCircle className="h-4 w-4 mr-2" />
                Chat
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[600px] flex flex-col">
              <DialogHeader>
                <DialogTitle>Chat with {getProviderName(provider)}</DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto space-y-4 min-h-[300px]">
                {chatHistory.length === 0 ? (
                  <p className="text-muted-foreground text-center">Start a conversation...</p>
                ) : (
                  chatHistory.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-lg p-3 ${
                        msg.role === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}>
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    </div>
                  ))
                )}
                {isChatting && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-3">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isChatting && handleChat()}
                  disabled={isChatting}
                />
                <Button 
                  onClick={handleChat} 
                  disabled={!chatMessage.trim() || isChatting}
                  size="sm"
                >
                  Send
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 4-Box Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Box A - Input Text */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">A</span>
                Input Text
              </CardTitle>
              {inputAiScore !== null && (
                <Badge variant={getScoreBadgeVariant(inputAiScore)}>
                  AI: {(inputAiScore * 100).toFixed(1)}%
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Textarea
                placeholder="Enter the text you want to rewrite..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="min-h-[200px] resize-none"
              />
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>{inputText.length} characters</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => analyzeText(inputText, false)}
                  disabled={!inputText.trim() || isAnalyzing}
                >
                  {isAnalyzing ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Analyze'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Box B - Style Sample */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">B</span>
              Style Sample
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Textarea
                placeholder="Paste a writing sample that represents the target style..."
                value={styleText}
                onChange={(e) => setStyleText(e.target.value)}
                className="min-h-[200px] resize-none"
              />
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>{styleText.length} characters</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStyleText(defaultStyleSample)}
                >
                  Use Default
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Box C - Content Mix */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded">C</span>
              Content Mix
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Textarea
                placeholder="Optional: Add content to blend with the rewrite..."
                value={contentMixText}
                onChange={(e) => setContentMixText(e.target.value)}
                className="min-h-[200px] resize-none"
              />
              <div className="text-sm text-muted-foreground">
                {contentMixText.length} characters
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Box D - Output */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded">D</span>
                Rewritten Output
              </CardTitle>
              {outputAiScore !== null && (
                <Badge variant={getScoreBadgeVariant(outputAiScore)}>
                  AI: {(outputAiScore * 100).toFixed(1)}%
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Textarea
                placeholder="Rewritten text will appear here..."
                value={outputText}
                onChange={(e) => setOutputText(e.target.value)}
                className="min-h-[200px] resize-none"
                readOnly
              />
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>{outputText.length} characters</span>
                {outputText && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(outputText)}
                  >
                    Copy
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Instructions and Presets */}
      <Card>
        <CardHeader>
          <CardTitle>Instructions & Presets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="custom-instructions">Custom Instructions</Label>
            <Textarea
              id="custom-instructions"
              placeholder="Add specific instructions for the rewrite..."
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Instruction Presets ({selectedPresets.length} selected)</Label>
            <div className="mt-2 flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded">
              {instructionPresets.map((preset) => (
                <Badge
                  key={preset}
                  variant={selectedPresets.includes(preset) ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                  onClick={() => togglePreset(preset)}
                >
                  {preset}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          onClick={handleRewrite}
          disabled={isProcessing || !inputText.trim()}
          className="flex-1 sm:flex-none"
        >
          {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
          {isProcessing ? 'Rewriting...' : 'Rewrite Text'}
        </Button>
        
        <Button
          variant="outline"
          onClick={handleReRewrite}
          disabled={isProcessing || !outputText}
          className="flex-1 sm:flex-none"
        >
          {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Re-Rewrite
        </Button>
      </div>

      {/* Score Comparison */}
      {inputAiScore !== null && outputAiScore !== null && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h4 className="font-medium mb-2">AI Detection Score</h4>
              <div className="flex items-center justify-center gap-4">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Input</div>
                  <div className={`text-lg font-bold ${getScoreColor(inputAiScore)}`}>
                    {(inputAiScore * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="text-muted-foreground">→</div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Output</div>
                  <div className={`text-lg font-bold ${getScoreColor(outputAiScore)}`}>
                    {(outputAiScore * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground">Improvement</div>
                  <div className={`text-lg font-bold ${
                    outputAiScore < inputAiScore ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {outputAiScore < inputAiScore ? '-' : '+'}{Math.abs((outputAiScore - inputAiScore) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}