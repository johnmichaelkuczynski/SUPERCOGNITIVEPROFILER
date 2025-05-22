import fetch from 'node-fetch';

export interface AIDetectionResult {
  aiProbability: number; // 0-1 scale where 1 means definitely AI
  humanProbability: number; // 0-1 scale where 1 means definitely human
  averageProbability: number; // Average AI probability
  detailedAnalysis?: Array<{
    sentence: string;
    aiProbability: number;
    perplexity?: number;
  }>;
  mostAISentence?: {
    sentence: string;
    aiProbability: number;
  };
  mostHumanSentence?: {
    sentence: string;
    aiProbability: number;
  };
  apiRequestId?: string;
  error?: string;
}

/**
 * Detect AI content in the provided text using GPTZero API
 * @param text The text to analyze
 * @returns Analysis results with AI content probability
 */
export async function detectAIContent(text: string): Promise<AIDetectionResult> {
  try {
    if (!process.env.GPTZERO_API_KEY) {
      throw new Error('GPTZERO_API_KEY is not defined');
    }
    
    const response = await fetch('https://api.gptzero.me/v2/predict/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Api-Key': process.env.GPTZERO_API_KEY
      },
      body: JSON.stringify({
        document: text,
        truncation_point: 'auto'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('GPTZero API error:', errorData);
      return {
        aiProbability: 0,
        humanProbability: 0,
        averageProbability: 0,
        error: `GPTZero API error: ${response.status} - ${JSON.stringify(errorData)}`
      };
    }

    const data = await response.json() as any;
    
    // Validate response structure
    if (!data.documents || !data.documents[0]) {
      throw new Error('Invalid response format from GPTZero API');
    }

    const document = data.documents[0];
    const aiProbability = document.completely_generated_prob || 0;
    const humanProbability = 1 - aiProbability;
    const averageProbability = document.average_generated_prob || 0;
    
    // Create detailed analysis if statistics are available
    let detailedAnalysis: AIDetectionResult['detailedAnalysis'] = undefined;
    let mostAISentence: AIDetectionResult['mostAISentence'] = undefined;
    let mostHumanSentence: AIDetectionResult['mostHumanSentence'] = undefined;
    
    if (document.statistics && document.statistics.sentences) {
      const sentences = document.statistics.sentences;
      
      // Create detailed analysis for each sentence
      detailedAnalysis = sentences.map((sentence: any) => ({
        sentence: sentence.sentence,
        aiProbability: sentence.generated_prob,
        perplexity: sentence.perplexity
      }));
      
      // Find most AI and most human sentences
      if (sentences.length > 0) {
        // Sort by AI probability (highest to lowest)
        const sortedSentences = [...sentences].sort((a: any, b: any) => 
          b.generated_prob - a.generated_prob
        );
        
        if (sortedSentences.length > 0) {
          mostAISentence = {
            sentence: sortedSentences[0].sentence,
            aiProbability: sortedSentences[0].generated_prob
          };
          
          mostHumanSentence = {
            sentence: sortedSentences[sortedSentences.length - 1].sentence,
            aiProbability: sortedSentences[sortedSentences.length - 1].generated_prob
          };
        }
      }
    }
    
    return {
      aiProbability,
      humanProbability,
      averageProbability,
      detailedAnalysis,
      mostAISentence,
      mostHumanSentence,
      apiRequestId: data.request_id
    };
  } catch (error) {
    console.error('Error in AI detection:', error);
    return {
      aiProbability: 0,
      humanProbability: 0,
      averageProbability: 0,
      error: `AI detection failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}