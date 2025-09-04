import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { 
  Shuffle, 
  Bot, 
  FileText, 
  Upload,
  RotateCcw,
  Loader2,
  CheckCircle,
  Copy,
  Target,
  Sparkles
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { type TextChunk, type InstructionPreset } from '@shared/schema';

const INSTRUCTION_PRESETS: InstructionPreset[] = [
  { 
    id: 'compression-light', 
    name: 'Compression — light (−15%)', 
    description: 'Cut filler; merge short clauses; keep meaning. Target ≈15% shorter.', 
    category: 'Structure', 
    instruction: 'Cut filler; merge short clauses; keep meaning. Target ≈15% shorter.' 
  },
  { 
    id: 'compression-medium', 
    name: 'Compression — medium (−30%)', 
    description: 'Trim hard; delete throat-clearing; tighten syntax. Target ≈30% shorter.', 
    category: 'Structure', 
    instruction: 'Trim hard; delete throat-clearing; tighten syntax. Target ≈30% shorter.' 
  },
  { 
    id: 'compression-heavy', 
    name: 'Compression — heavy (−45%)', 
    description: 'Sever redundancies; collapse repeats; keep core claims. Target ≈45% shorter.', 
    category: 'Structure', 
    instruction: 'Sever redundancies; collapse repeats; keep core claims. Target ≈45% shorter.' 
  },
  { 
    id: 'mixed-cadence', 
    name: 'Mixed cadence', 
    description: 'Alternate short (5–12 words) and long (20–35 words) sentences; avoid uniform rhythm.', 
    category: 'Style', 
    instruction: 'Alternate short (5–12 words) and long (20–35 words) sentences; avoid uniform rhythm.' 
  },
  { 
    id: 'clause-surgery', 
    name: 'Clause surgery', 
    description: 'Reorder main/subordinate clauses in ~30% of sentences without changing meaning.', 
    category: 'Style', 
    instruction: 'Reorder main/subordinate clauses in ~30% of sentences without changing meaning.' 
  },
  { 
    id: 'front-load-claim', 
    name: 'Front-load claim', 
    description: 'Put the main conclusion in sentence 1; evidence follows.', 
    category: 'Logic', 
    instruction: 'Put the main conclusion in sentence 1; evidence follows.' 
  },
  { 
    id: 'back-load-claim', 
    name: 'Back-load claim', 
    description: 'Delay the main conclusion to the final 2–3 sentences.', 
    category: 'Logic', 
    instruction: 'Delay the main conclusion to the final 2–3 sentences.' 
  },
  { 
    id: 'kill-stock-transitions', 
    name: 'Kill stock transitions', 
    description: 'Delete Moreover/Furthermore/In conclusion everywhere.', 
    category: 'Language', 
    instruction: 'Delete Moreover/Furthermore/In conclusion everywhere.' 
  },
  { 
    id: 'drop-intensifiers', 
    name: 'Drop intensifiers', 
    description: 'Remove very/clearly/obviously/significantly.', 
    category: 'Language', 
    instruction: 'Remove very/clearly/obviously/significantly.' 
  },
  { 
    id: 'exact-nouns', 
    name: 'Exact nouns', 
    description: 'Replace ambiguous pronouns with exact nouns.', 
    category: 'Language', 
    instruction: 'Replace ambiguous pronouns with exact nouns.' 
  },
  { 
    id: 'no-lists', 
    name: 'No lists', 
    description: 'Output as continuous prose; remove bullets/numbering.', 
    category: 'Format', 
    instruction: 'Output as continuous prose; remove bullets/numbering.' 
  },
  { 
    id: 'claim-lock', 
    name: 'Claim lock', 
    description: 'Do not add examples, scenarios, or data not present in the source.', 
    category: 'Precision', 
    instruction: 'Do not add examples, scenarios, or data not present in the source.' 
  },
];

const CATEGORY_GROUPS = {
  Structure: ['compression-light', 'compression-medium', 'compression-heavy'],
  Style: ['mixed-cadence', 'clause-surgery'],
  Logic: ['front-load-claim', 'back-load-claim'],
  Language: ['kill-stock-transitions', 'drop-intensifiers', 'exact-nouns'],
  Format: ['no-lists'],
  Precision: ['claim-lock']
};

interface RewriteRequest {
  inputText: string;
  styleText?: string;
  contentMixText?: string;
  customInstructions?: string;
  selectedPresets?: string[];
  provider: string;
  selectedChunkIds?: string[];
  mixingMode?: 'style' | 'content' | 'both';
}

interface RewriteResponse {
  rewrittenText: string;
  inputAiScore: number;
  outputAiScore: number;
  jobId: string;
}

export default function AITextHumanizer() {
  const [inputText, setInputText] = useState('');
  const [styleText, setStyleText] = useState('');
  const [contentMixText, setContentMixText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [selectedPresets, setSelectedPresets] = useState<string[]>([]);
  const [customInstructions, setCustomInstructions] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<'openai' | 'anthropic' | 'deepseek' | 'perplexity'>('deepseek');
  const [chunks, setChunks] = useState<TextChunk[]>([]);
  const [selectedChunkIds, setSelectedChunkIds] = useState<string[]>([]);
  const [inputAiScore, setInputAiScore] = useState<number | null>(null);
  const [outputAiScore, setOutputAiScore] = useState<number | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handlePresetToggle = (presetId: string) => {
    setSelectedPresets(prev => 
      prev.includes(presetId) 
        ? prev.filter(id => id !== presetId)
        : [...prev, presetId]
    );
  };

  const chunkText = useMutation({
    mutationFn: async (text: string) => {
      const response = await fetch('/api/text-processing/chunk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      return response.json() as Promise<{ chunks: TextChunk[] }>;
    },
    onSuccess: (data: { chunks: TextChunk[] }) => {
      setChunks(data.chunks);
      setSelectedChunkIds(data.chunks.map(c => c.id));
    }
  });

  const analyzeWithGPTZero = useMutation({
    mutationFn: async (text: string) => {
      const response = await fetch('/api/gptzero/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      return response.json() as Promise<{ aiScore: number }>;
    },
  });

  const rewriteText = useMutation({
    mutationFn: async (request: RewriteRequest) => {
      const response = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      return response.json() as Promise<RewriteResponse>;
    },
    onSuccess: (data: RewriteResponse) => {
      setOutputText(data.rewrittenText);
      setOutputAiScore(data.outputAiScore);
      setCurrentJobId(data.jobId);
      toast({
        title: "Rewrite Complete",
        description: `AI score reduced from ${inputAiScore}% to ${data.outputAiScore}%`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Rewrite Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      
      fetch('/api/file-upload', { method: 'POST', body: formData })
        .then(res => res.json())
        .then(data => {
          if (data.content) {
            setInputText(data.content);
            toast({ title: "File Uploaded", description: `${data.filename} uploaded successfully` });
          }
        })
        .catch((err: any) => {
          toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
        });
    }
  }, [toast]);

  const handleRewrite = async () => {
    if (!inputText.trim()) {
      toast({ title: "Input Required", description: "Please enter text to rewrite", variant: "destructive" });
      return;
    }

    setIsRewriting(true);
    
    try {
      // Analyze input text with GPTZero
      const gptZeroResult = await analyzeWithGPTZero.mutateAsync(inputText);
      setInputAiScore(gptZeroResult.aiScore);

      // Chunk text if needed
      if (inputText.length > 2000) {
        const chunkResult = await chunkText.mutateAsync(inputText);
        setChunks(chunkResult.chunks);
        setSelectedChunkIds(chunkResult.chunks.map(c => c.id));
      }

      // Perform rewrite
      await rewriteText.mutateAsync({
        inputText,
        styleText: styleText || undefined,
        contentMixText: contentMixText || undefined,
        customInstructions: customInstructions || undefined,
        selectedPresets,
        provider: selectedProvider,
        selectedChunkIds: chunks.length > 0 ? selectedChunkIds : undefined,
      });
    } finally {
      setIsRewriting(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: `${label} copied to clipboard` });
  };

  const handleClear = () => {
    setInputText('');
    setStyleText('');
    setContentMixText('');
    setOutputText('');
    setSelectedPresets([]);
    setCustomInstructions('');
    setChunks([]);
    setSelectedChunkIds([]);
    setInputAiScore(null);
    setOutputAiScore(null);
    setCurrentJobId(null);
  };

  const getPresetsByCategory = (category: string) => {
    return INSTRUCTION_PRESETS.filter(preset => preset.category === category);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-2">
          <Bot className="w-8 h-8" />
          AI Text Humanizer
        </h1>
        <p className="text-muted-foreground text-lg">
          Rewrite content to match specific writing styles with advanced customization
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Box A - Input Text */}
        <Card className="relative">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Box A: Input Text
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-1" />
                  Upload
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                {inputText && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(inputText, 'Input text')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Enter the text you want to rewrite..."
              className="min-h-[300px] text-sm"
            />
            {inputAiScore !== null && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">AI Detection Score</span>
                  <Badge variant={inputAiScore > 70 ? "destructive" : inputAiScore > 30 ? "secondary" : "default"}>
                    {inputAiScore}% AI
                  </Badge>
                </div>
                <Progress value={inputAiScore} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Box B - Style Sample */}
        <Card className="relative">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Box B: Style Sample
              </span>
              {styleText && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(styleText, 'Style sample')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={styleText}
              onChange={(e) => setStyleText(e.target.value)}
              placeholder="Enter a writing sample that demonstrates the style you want to match... (Leave empty to use The Raven Paradox default)"
              className="min-h-[300px] text-sm"
            />
            <div className="mt-2 text-xs text-muted-foreground">
              Empty? We'll use The Raven Paradox as the default style sample.
            </div>
          </CardContent>
        </Card>

        {/* Box C - Content Reference */}
        <Card className="relative">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Box C: Content Mix (Optional)
              </span>
              {contentMixText && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(contentMixText, 'Content reference')}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={contentMixText}
              onChange={(e) => setContentMixText(e.target.value)}
              placeholder="Enter additional content to integrate into the rewrite (optional)..."
              className="min-h-[300px] text-sm"
            />
          </CardContent>
        </Card>

        {/* Box D - Output */}
        <Card className="relative">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Box D: Rewritten Output
              </span>
              <div className="flex gap-2">
                {outputText && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(outputText, 'Rewritten text')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRewrite}
                      disabled={isRewriting}
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Re-rewrite
                    </Button>
                  </>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={outputText}
              readOnly
              placeholder="Your rewritten text will appear here..."
              className="min-h-[300px] text-sm bg-gray-50"
            />
            {outputAiScore !== null && (
              <div className="mt-3 p-3 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">AI Detection Score</span>
                  <Badge variant={outputAiScore > 70 ? "destructive" : outputAiScore > 30 ? "secondary" : "default"}>
                    {outputAiScore}% AI
                  </Badge>
                </div>
                <Progress value={outputAiScore} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Control Panel */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Provider Selection */}
            <div>
              <Label className="text-sm font-medium">AI Model</Label>
              <Select value={selectedProvider} onValueChange={(value: any) => setSelectedProvider(value)}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deepseek">ZHI 1 (DeepSeek)</SelectItem>
                  <SelectItem value="anthropic">ZHI 2 (Claude)</SelectItem>
                  <SelectItem value="openai">ZHI 3 (GPT-4)</SelectItem>
                  <SelectItem value="perplexity">ZHI 4 (Perplexity)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Preset Instructions */}
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Instruction Presets</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPresets(true)}
                >
                  {selectedPresets.length} Selected
                </Button>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {selectedPresets.length === 0 
                  ? 'No presets selected'
                  : `${selectedPresets.length} presets active`
                }
              </div>
            </div>

            {/* Custom Instructions */}
            <div>
              <Label className="text-sm font-medium">Custom Instructions</Label>
              <Textarea
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="Add custom rewrite instructions..."
                className="mt-2"
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              onClick={handleRewrite}
              disabled={!inputText.trim() || isRewriting}
              className="flex-1"
            >
              {isRewriting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Shuffle className="w-4 h-4 mr-2" />
              )}
              {isRewriting ? 'Rewriting...' : 'Rewrite Text'}
            </Button>
            <Button variant="outline" onClick={handleClear}>
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Instruction Presets Dialog */}
      <Dialog open={showPresets} onOpenChange={setShowPresets}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Instruction Presets</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {Object.entries(CATEGORY_GROUPS).map(([category, presetIds]) => (
              <div key={category}>
                <h3 className="font-semibold text-sm mb-3 text-blue-600">{category}</h3>
                <div className="grid gap-3">
                  {presetIds.map(presetId => {
                    const preset = INSTRUCTION_PRESETS.find(p => p.id === presetId);
                    if (!preset) return null;
                    
                    return (
                      <div key={preset.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                        <Checkbox
                          checked={selectedPresets.includes(preset.id)}
                          onCheckedChange={() => handlePresetToggle(preset.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <Label className="font-medium cursor-pointer">
                            {preset.name}
                          </Label>
                          <p className="text-sm text-muted-foreground mt-1">
                            {preset.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setSelectedPresets([])}>
              Clear All
            </Button>
            <Button onClick={() => setShowPresets(false)}>
              Done ({selectedPresets.length} selected)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}