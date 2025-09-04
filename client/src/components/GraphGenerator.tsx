import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { BarChart3, TrendingUp, Loader2, Download } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { processContentForMathRendering } from '@/utils/mathRenderer';

interface GraphData {
  type: 'line' | 'bar' | 'scatter' | 'pie' | 'area' | 'function' | 'histogram';
  title: string;
  xLabel: string;
  yLabel: string;
  data: Array<{
    x: number | string;
    y: number;
    label?: string;
  }>;
  description: string;
  mathExpression?: string;
  domain?: [number, number];
  color?: string;
}

interface GeneratedGraph {
  svg: string;
  data: GraphData;
  position: number;
}

interface GraphGeneratorProps {
  onGraphGenerated?: (graphs: GeneratedGraph[]) => void;
  embedded?: boolean;
}

export default function GraphGenerator({ onGraphGenerated, embedded = false }: GraphGeneratorProps) {
  const [mode, setMode] = useState<'text' | 'math' | 'essay'>('text');
  const [inputText, setInputText] = useState('');
  const [mathExpression, setMathExpression] = useState('');
  const [model, setModel] = useState<'claude' | 'gpt4' | 'deepseek'>('deepseek');
  const [style, setStyle] = useState<'academic' | 'business' | 'scientific'>('academic');
  const [generatedGraphs, setGeneratedGraphs] = useState<GeneratedGraph[]>([]);
  const [essayContent, setEssayContent] = useState('');
  
  const { toast } = useToast();

  const generateGraphsMutation = useMutation({
    mutationFn: async (data: {
      mode: string;
      text?: string;
      mathExpression?: string;
      model: string;
      style: string;
    }) => {
      const endpoint = data.mode === 'essay' ? '/api/generate-essay-with-graphs' : '/api/generate-graphs';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate graphs');
      }
      
      return response.json();
    },
    onSuccess: (response) => {
      if (mode === 'essay') {
        setEssayContent(response.content);
        setGeneratedGraphs(response.graphs);
      } else {
        setGeneratedGraphs(response.graphs || []);
      }
      
      if (onGraphGenerated) {
        onGraphGenerated(response.graphs || []);
      }
      
      toast({
        title: "Graphs Generated",
        description: `Successfully created ${response.graphs?.length || 0} graph(s)`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate graphs",
        variant: "destructive",
      });
    },
  });

  const handleGenerate = () => {
    if (mode === 'text' || mode === 'essay') {
      if (!inputText.trim()) {
        toast({
          title: "Input Required",
          description: "Please enter text to analyze for graph generation",
          variant: "destructive",
        });
        return;
      }
    } else if (mode === 'math') {
      if (!mathExpression.trim()) {
        toast({
          title: "Expression Required",
          description: "Please enter a mathematical expression to plot",
          variant: "destructive",
        });
        return;
      }
    }

    generateGraphsMutation.mutate({
      mode,
      text: mode !== 'math' ? inputText : undefined,
      mathExpression: mode === 'math' ? mathExpression : undefined,
      model,
      style,
    });
  };

  const downloadSVG = (svg: string, title: string) => {
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (embedded) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Select value={mode} onValueChange={(value: any) => setMode(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text Analysis</SelectItem>
              <SelectItem value="math">Math Function</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={model} onValueChange={(value: any) => setModel(value)}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="claude">ZHI 2</SelectItem>
              <SelectItem value="gpt4">ZHI 3</SelectItem>
              <SelectItem value="deepseek">ZHI 1</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={handleGenerate} disabled={generateGraphsMutation.isPending} size="sm">
            {generateGraphsMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <BarChart3 className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        {mode === 'math' ? (
          <Input
            placeholder="Enter mathematical expression (e.g., x^2 + 2*x - 1)"
            value={mathExpression}
            onChange={(e) => setMathExpression(e.target.value)}
          />
        ) : (
          <div className="space-y-2">
            <Textarea
              placeholder="Enter text to analyze for graph opportunities..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={3}
            />
            <div className="text-xs text-gray-500">
              {inputText.trim().split(/\s+/).filter(word => word.length > 0).length} words | {inputText.length} characters
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Graph Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="mode">Generation Mode</Label>
              <Select value={mode} onValueChange={(value: any) => setMode(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text Analysis</SelectItem>
                  <SelectItem value="math">Mathematical Function</SelectItem>
                  <SelectItem value="essay">Complete Essay with Graphs</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="model">AI Model</Label>
              <Select value={model} onValueChange={(value: any) => setModel(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deepseek">ZHI 1</SelectItem>
                  <SelectItem value="claude">ZHI 2</SelectItem>
                  <SelectItem value="gpt4">ZHI 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="style">Style</Label>
              <Select value={style} onValueChange={(value: any) => setStyle(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="academic">Academic</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="scientific">Scientific</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {mode === 'math' ? (
            <div>
              <Label htmlFor="mathExpression">Mathematical Expression</Label>
              <Input
                id="mathExpression"
                placeholder="Enter mathematical expression (e.g., x^2 + 2*x - 1, sin(x), log(x))"
                value={mathExpression}
                onChange={(e) => setMathExpression(e.target.value)}
              />
            </div>
          ) : (
            <div>
              <Label htmlFor="inputText">
                {mode === 'essay' ? 'Essay Prompt' : 'Text to Analyze'}
              </Label>
              <Textarea
                id="inputText"
                placeholder={
                  mode === 'essay' 
                    ? "Enter your essay prompt (e.g., 'Write an economics paper about inflation effects and use graphs to prove your point')"
                    : "Enter text to analyze for graph generation opportunities..."
                }
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={6}
              />
            </div>
          )}

          <Button
            onClick={handleGenerate}
            disabled={generateGraphsMutation.isPending}
            className="w-full"
          >
            {generateGraphsMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <BarChart3 className="w-4 h-4 mr-2" />
                Generate {mode === 'essay' ? 'Essay with Graphs' : 'Graphs'}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Essay Content (for essay mode) */}
      {mode === 'essay' && essayContent && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Essay</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              {essayContent.split(/\[GRAPH_\d+\]/).map((section, index) => (
                <div key={index}>
                  <div className="whitespace-pre-wrap">{section}</div>
                  {index < generatedGraphs.length && (
                    <div className="my-6 p-4 border rounded-lg bg-gray-50">
                      <div 
                        dangerouslySetInnerHTML={{ __html: generatedGraphs[index].svg }}
                        className="flex justify-center"
                      />
                      <p className="text-sm text-gray-600 mt-2 text-center">
                        {generatedGraphs[index].data.description}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated Graphs (for text/math mode) */}
      {mode !== 'essay' && generatedGraphs.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {generatedGraphs.map((graph, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">
                  <div dangerouslySetInnerHTML={{ __html: processContentForMathRendering(graph.data.title) }} />
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadSVG(graph.svg, graph.data.title)}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div 
                  dangerouslySetInnerHTML={{ __html: graph.svg }}
                  className="flex justify-center mb-4"
                />
                <div className="text-sm text-gray-600">
                  <div dangerouslySetInnerHTML={{ __html: processContentForMathRendering(graph.data.description) }} />
                </div>
                {graph.data.mathExpression && (
                  <div className="text-xs text-gray-500 mt-2 font-mono">
                    <div dangerouslySetInnerHTML={{ __html: processContentForMathRendering(`f(x) = ${graph.data.mathExpression}`) }} />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}