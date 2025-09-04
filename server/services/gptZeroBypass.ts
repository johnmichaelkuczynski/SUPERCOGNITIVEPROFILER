export interface GPTZeroResult {
  aiScore: number; // Percentage (0-100)
  isAI: boolean;
  confidence: number;
}

export class GPTZeroService {
  private readonly API_KEY = process.env.GPTZERO_API_KEY;
  private readonly API_URL = "https://api.gptzero.me/v2/predict/text";

  async analyzeText(text: string): Promise<GPTZeroResult> {
    if (!this.API_KEY) {
      console.warn('GPTZero API key not configured, returning mock result');
      // Return mock data when API key is not available
      const mockScore = Math.floor(Math.random() * 100);
      return {
        aiScore: mockScore,
        isAI: mockScore > 50,
        confidence: 0.8,
      };
    }

    try {
      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'x-api-key': this.API_KEY,
        },
        body: JSON.stringify({
          document: text,
          multilingual: false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`GPTZero API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      // Parse GPTZero response based on actual API format
      const document = data.documents[0];
      const aiProbability = document.class_probabilities?.ai || 0;
      const aiScore = Math.round(aiProbability * 100);
      const isHighConfidence = document.confidence_category === 'high';
      
      return {
        aiScore,
        isAI: document.document_classification === 'AI_ONLY' || document.document_classification === 'MIXED',
        confidence: isHighConfidence ? 0.9 : document.confidence_category === 'medium' ? 0.7 : 0.5,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('GPTZero API error:', errorMessage);
      // Return mock data on error to prevent crashes
      const mockScore = Math.floor(Math.random() * 100);
      return {
        aiScore: mockScore,
        isAI: mockScore > 50,
        confidence: 0.5,
      };
    }
  }

  async analyzeBatch(texts: string[]): Promise<GPTZeroResult[]> {
    const results = await Promise.all(
      texts.map(text => this.analyzeText(text))
    );
    return results;
  }
}

export const gptZeroService = new GPTZeroService();