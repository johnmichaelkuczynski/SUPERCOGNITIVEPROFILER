import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Zap } from 'lucide-react';

interface DebugTestResult {
  inputTextPreview: string;
  rawLLMResponse: string;
  parsedScores: {
    intellectualMaturity: number;
    selfAwarenessLevel: number;
    epistemicHumility: number;
    reflectiveDepth: number;
  };
  isDefaultPattern: boolean;
  timestamp: string;
}

export default function DebugTester() {
  const [testText, setTestText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<DebugTestResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const presetTexts = {
    nonsense: "if the moon is made of rock, and rocks come from the ground, then the moon must have come out of the ground. but the ground is on earth. so the moon is probably just a big rock that bounced really high and got stuck. maybe australia did it. they have kangaroos and kangaroos jump.",
    academic: "The methodological framework employed in this research utilizes a mixed-methods approach, integrating quantitative data analysis with qualitative phenomenological inquiry. This synthesis allows for a comprehensive examination of the underlying theoretical constructs while maintaining empirical rigor. The epistemological foundations of this study are grounded in critical realism, acknowledging both the existence of an objective reality and the subjective nature of human understanding.",
    creative: "The starlight danced across the midnight ocean, each wave carrying whispers of ancient stories. In the distance, a lighthouse stood sentinel, its beam cutting through the darkness like hope piercing despair. The sailor's weathered hands gripped the wheel as memories of distant shores flooded his mind, each one a chapter in his endless journey between worlds."
  };

  const runDirectTest = async () => {
    if (!testText.trim()) {
      setError('Please enter some text to test');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/debug/test-scoring', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputText: testText
        }),
      });

      if (!response.ok) {
        throw new Error(`Test failed: ${response.statusText}`);
      }

      const result = await response.json();
      setResults(prev => [result, ...prev]);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Cognitive Scoring Debug Tester
          </CardTitle>
          <p className="text-sm text-gray-600">
            Test the LLM scoring system directly to verify dynamic analysis versus hardcoded responses
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Test Text Input</label>
            <Textarea
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder="Enter text to analyze for cognitive scoring..."
              className="min-h-32"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => setTestText(presetTexts.nonsense)}
              variant="outline"
              size="sm"
            >
              Load Nonsense Text
            </Button>
            <Button
              onClick={() => setTestText(presetTexts.academic)}
              variant="outline"
              size="sm"
            >
              Load Academic Text
            </Button>
            <Button
              onClick={() => setTestText(presetTexts.creative)}
              variant="outline"
              size="sm"
            >
              Load Creative Text
            </Button>
          </div>

          <Button onClick={runDirectTest} disabled={isLoading} className="w-full">
            {isLoading ? 'Testing...' : 'Run Direct LLM Test'}
          </Button>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-red-700">{error}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Test Results</h3>
          {results.map((result, index) => (
            <Card key={index} className={`${result.isDefaultPattern ? 'border-red-500' : 'border-green-500'}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  {result.isDefaultPattern ? (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  Test {index + 1} - {result.timestamp}
                  {result.isDefaultPattern && (
                    <span className="text-red-600 font-bold">HARDCODED SCORES DETECTED</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <strong>Input Preview:</strong>
                  <p className="text-sm text-gray-600 mt-1">{result.inputTextPreview}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <div className="text-xs text-blue-600">Intellectual Maturity</div>
                    <div className="text-lg font-bold">{result.parsedScores.intellectualMaturity}/10</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="text-xs text-green-600">Self Awareness</div>
                    <div className="text-lg font-bold">{result.parsedScores.selfAwarenessLevel}/10</div>
                  </div>
                  <div className="text-center p-2 bg-orange-50 rounded">
                    <div className="text-xs text-orange-600">Epistemic Humility</div>
                    <div className="text-lg font-bold">{result.parsedScores.epistemicHumility}/10</div>
                  </div>
                  <div className="text-center p-2 bg-purple-50 rounded">
                    <div className="text-xs text-purple-600">Reflective Depth</div>
                    <div className="text-lg font-bold">{result.parsedScores.reflectiveDepth}/10</div>
                  </div>
                </div>

                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-medium">Raw LLM Response</summary>
                  <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-x-auto">
                    {result.rawLLMResponse}
                  </pre>
                </details>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}