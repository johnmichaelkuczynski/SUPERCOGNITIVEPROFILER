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

// REAL Instruction presets for humanization (1-8 are most important)
const instructionPresets = [
  // MOST IMPORTANT FOR HUMANIZATION (1-8)
  "1. Mixed cadence + clause sprawl",
  "2. Asymmetric emphasis", 
  "3. One aside",
  "4. Hedge twice",
  "5. Local disfluency",
  "6. Analogy injection",
  "7. Topic snap",
  "8. Friction detail",
  
  // Structure & Cadence
  "Compression — light (−15%)",
  "Compression — medium (−30%)",
  "Compression — heavy (−45%)",
  "DECREASE BY 50%",
  "INCREASE BY 150%",
  "Mixed cadence",
  "Clause surgery",
  "Front-load claim",
  "Back-load claim",
  "Seam/pivot",
  
  // Framing & Inference
  "Imply one step",
  "Conditional framing",
  "Local contrast", 
  "Scope check",
  
  // Diction & Tone
  "Deflate jargon",
  "Kill stock transitions",
  "Hedge once",
  "Drop intensifiers",
  "Low-heat voice",
  "One aside",
  
  // Concreteness & Benchmarks
  "Concrete benchmark",
  "Swap generic example",
  "Metric nudge",
  
  // Asymmetry & Focus
  "Asymmetric emphasis",
  "Cull repeats",
  "Topic snap",
  
  // Formatting & Output Hygiene
  "No lists",
  "No meta",
  "Exact nouns",
  "Quote once",
  
  // Safety / Guardrails
  "Claim lock",
  "Entity lock",
  
  // Combo presets
  "Lean & Sharp",
  "Analytic"
];

// Predefined style samples
const styleSamples = {
  "FORMAL AND FUNCTIONAL RELATIONSHIPS": `There are two broad types of relationships: formal and functional.
Formal relationships hold between descriptions. A description is any statement that can be true or false.
Example of a formal relationship: The description that a shape is a square cannot be true unless the description that it has four equal sides is true. Therefore, a shape's being a square depends on its having four equal sides.

Functional relationships hold between events or conditions. (An event is anything that happens in time.)
Example of a functional relationship: A plant cannot grow without water. Therefore, a plant's growth depends on its receiving water.

The first type is structural, i.e., it holds between statements about features.
The second is operational, i.e., it holds between things in the world as they act or change.

Descriptions as objects of consideration
The objects of evaluation are descriptions. Something is not evaluated unless it is described, and it is not described unless it can be stated. One can notice non-descriptions — sounds, objects, movements — but in the relevant sense one evaluates descriptions of them.

Relationships not known through direct observation
Some relationships are known, not through direct observation, but through reasoning. Such relationships are structural, as opposed to observational. Examples of structural relationships are:

If A, then A or B.

All tools require some form of use.

Nothing can be both moving and perfectly still.

There are no rules without conditions.

1 obviously expresses a relationship; 2–4 do so less obviously, as their meanings are:

2*. A tool's being functional depends on its being usable.
3*. An object's being both moving and still depends on contradictory conditions, which cannot occur together.
4*. The existence of rules depends on the existence of conditions to which they apply.

Structural truth and structural understanding
Structural understanding is always understanding of relationships. Observational understanding can be either direct or indirect; the same is true of structural understanding.`,

  "ALTERNATIVE ACCOUNT OF EXPLANATORY EFFICIENCY": `A continuation of the earlier case will make it clear what this means and why it matters. Why doesn't the outcome change under the given conditions? Because, says the standard account, the key factor remained in place. But, the skeptic will counter, perhaps we can discard that account; perhaps there's an alternative that fits the observations equally well. But, I would respond, even granting for argument's sake that such an alternative exists, it doesn't follow that it avoids more general problems of the sort we've been discussing. An alternative explanation is better than the original only if it can account for the data more efficiently—that is, with fewer theoretical commitments or with commitments that are independently better supported.`,

  "RATIONAL BELIEF AND UNDERLYING STRUCTURE": `When would it become rational to believe that, next time, you're more likely than not to roll this as opposed to that number—that, for example, you're especially likely to roll a 27? This belief becomes rational when, and only when, you have reason to believe that a 27-roll is favored by the structures involved in the game. And that belief, in its turn, is rational if you know that circumstances at all like the following obtain: The dice are magnetically attracted to the 27-slot. The wheel's center of gravity biases it toward the 27-slot. The 27-slot is wider than the others. The person running the game has reasons to fix it so that 27 comes up.`,

  "HUME, INDUCTION, AND THE LOGIC OF EXPLANATION": `We haven't yet refuted Hume's argument—we've only taken the first step towards doing so. Hume could defend his view against what we've said thus by far by saying the following: Suppose that, to explain why all phi's thus far known are psi's, you posit some underlying structure or law that disposes phi's to be psi's. Unless you think that nature is uniform, you have no right to expect that connection to continue to hold. But if, in order to deal with this, you suppose that nature is uniform, then you're making an assumption that you have no right to make, since that assumption itself depends on induction.`,

  "EXPLANATORY GOODNESS VS. CORRECTNESS": `For an explanation to be good isn't for it to be correct. Sometimes the right explanations are bad ones. A story will make this clear. I'm on a bus. The bus driver is smiling. A mystery! 'What on Earth does he have to smile about?' I ask myself. His job is so boring, and his life must therefore be such a horror.' But then I remember that, just a minute ago, a disembarking passenger gave him fifty $100 bills as a tip. So I have my explanation: 'he just came into a lot of money.' But wait! There's something fishy about this. Those bills looked fake. In which case the bus driver's smile isn't explained by his having come into a lot of money but by his thinking that he has. The correct explanation is: 'he thinks he just came into a lot of money.' But the false explanation—'he just came into a lot of money'—is better, since it's simpler and achieves the same explanatory work.`,

  "KNOWLEDGE VS. AWARENESS": `Knowledge is conceptually articulated awareness. In order for me to know that my shoes are uncomfortably tight, I need to have the concepts shoe, tight, discomfort, etc. I do not need to have these concepts—or, arguably, any concepts—to be aware of the uncomfortable tightness in my shoes. My knowledge of that truth is a conceptualization of my awareness of that state of affairs. Equivalently, there are two kinds of awareness: propositional and objectual. My visual perception of the tree is objectual awareness of the tree. My belief that there is a tree in front of me is propositional awareness of the tree's being there.`,

  "THE LOSER PARADOX": `People who are the bottom of a hierarchy are far less likely to spurn that hierarchy than they are to use it against people who are trying to climb the ranks of that hierarchy. The person who never graduates from college may in some contexts claim that a college degree is worthless, but he is unlikely to act accordingly. When he comes across someone without a college degree who is trying to make something of himself, he is likely to pounce on that person, claiming he is an uncredentialed fraud. This is because it would be psychologically difficult for him to maintain that college degrees are worthless if someone without credentials is succeeding.`,

  "PARADOX OF CONNECTEDNESS": `Communications technology is supposed to connect us but separates us into self-contained, non-interacting units. Solution: Communications technology is not supposed to connect us emotionally. On the contrary, it is supposed to connect us in such a way that we can transact without having to bond emotionally. And that is what it does. It connects us logically while disconnecting us emotionally.`,

  "ANALYSIS PARALYSIS PARADOX": `Given that there is almost always a more rational course of action, the ability to identify rational courses of action may lead to a failure to act. Solution: There is a difference between intelligence and rationality. Intelligence answers the question: What is it objectively possible to do? Rationality answers the question: What do my limited resources of time, energy and intelligence make it incumbent on me to do? And the second answer breaks any deadlocks created by the first.`
};

// Default style sample (first content-neutral sample)
const defaultStyleSample = styleSamples["FORMAL AND FUNCTIONAL RELATIONSHIPS"];

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
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label htmlFor="style-selector" className="text-sm font-medium">Predefined Samples:</Label>
                <Select 
                  value={Object.keys(styleSamples).find(key => styleSamples[key] === styleText) || "custom"}
                  onValueChange={(value) => {
                    if (value !== "custom" && styleSamples[value]) {
                      setStyleText(styleSamples[value]);
                    }
                  }}
                >
                  <SelectTrigger className="w-[300px]">
                    <SelectValue placeholder="Select a style sample" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(styleSamples).map((sampleName) => (
                      <SelectItem key={sampleName} value={sampleName}>
                        {sampleName}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Custom Sample</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                  Reset to Default
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