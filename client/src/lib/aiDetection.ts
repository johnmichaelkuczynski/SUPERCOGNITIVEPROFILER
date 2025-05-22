/**
 * Detect if text is AI-generated using the API
 */
export async function detectAIContent(text: string) {
  try {
    const response = await fetch('/api/ai-detection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error detecting AI content:', error);
    throw error;
  }
}

export interface AIDetectionResult {
  aiProbability: number;
  humanProbability: number;
  detailedAnalysis?: Array<{
    sentence: string;
    aiProbability: number;
  }>;
  mostAISentence?: {
    sentence: string;
    aiProbability: number;
  };
  mostHumanSentence?: {
    sentence: string;
    aiProbability: number;
  };
  error?: string;
}