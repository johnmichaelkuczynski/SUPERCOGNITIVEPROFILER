// GPTZero API service for AI text detection
import fetch from 'node-fetch';
import { log } from '../vite';

interface GPTZeroResponse {
  documents: Array<{
    completely_generated_prob: number;
    average_generated_prob: number;
    statistics: {
      sentences: Array<{
        generated_prob: number;
        perplexity: number;
        sentence: string;
      }>;
    };
  }>;
  request_id: string;
  error?: string;
}

export interface AIDetectionResult {
  aiProbability: number; // 0-1 scale where 1 means definitely AI
  humanProbability: number; // 0-1 scale where 1 means definitely human
  averageProbability: number; // Average AI probability
  detailedAnalysis: Array<{
    sentence: string;
    aiProbability: number;
    perplexity: number;
  }>;
  mostAISentence?: {
    sentence: string;
    aiProbability: number;
  };
  mostHumanSentence?: {
    sentence: string;
    aiProbability: number;
  };
  apiRequestId: string;
}

/**
 * Detect AI content using GPTZero's API
 * @param text The text to analyze
 * @returns Analysis results about AI content probability
 */
export async function detectAIContent(text: string): Promise<AIDetectionResult> {
  try {
    log('Detecting AI content with GPTZero...', 'gptzero');
    
    // Prepare request payload
    const requestBody = {
      document: text,
      // Optional configuration parameters
      // threshold: "default", // default, low, or high
    };

    // Make the API request
    const response = await fetch('https://api.gptzero.me/v2/predict/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
        'X-Api-Key': process.env.GPTZERO_API_KEY || '',
      },
      body: JSON.stringify(requestBody),
    });

    // Check for errors
    if (!response.ok) {
      const errorText = await response.text();
      log(`GPTZero API error: ${response.status} - ${errorText}`, 'gptzero');
      throw new Error(`GPTZero API error: ${response.status} - ${errorText}`);
    }

    // Parse the response
    const data = await response.json() as GPTZeroResponse;
    
    if (data.error) {
      throw new Error(`GPTZero API error: ${data.error}`);
    }
    
    // If no documents were analyzed
    if (!data.documents || data.documents.length === 0) {
      throw new Error('No analysis results returned from GPTZero');
    }
    
    const document = data.documents[0];
    const aiProbability = document.completely_generated_prob;
    const humanProbability = 1 - aiProbability;
    
    // Format and normalize the detailed sentence analysis
    const detailedAnalysis = document.statistics.sentences.map(sentence => ({
      sentence: sentence.sentence,
      aiProbability: sentence.generated_prob,
      perplexity: sentence.perplexity
    }));
    
    // Find the most AI-like and most human-like sentences
    let mostAISentence: {sentence: string, aiProbability: number} | undefined;
    let mostHumanSentence: {sentence: string, aiProbability: number} | undefined;
    
    if (detailedAnalysis.length > 0) {
      // Sort by AI probability in descending order
      const sorted = [...detailedAnalysis].sort((a, b) => b.aiProbability - a.aiProbability);
      
      mostAISentence = {
        sentence: sorted[0].sentence,
        aiProbability: sorted[0].aiProbability
      };
      
      mostHumanSentence = {
        sentence: sorted[sorted.length - 1].sentence,
        aiProbability: sorted[sorted.length - 1].aiProbability
      };
    }
    
    const result: AIDetectionResult = {
      aiProbability,
      humanProbability,
      averageProbability: document.average_generated_prob,
      detailedAnalysis,
      mostAISentence,
      mostHumanSentence,
      apiRequestId: data.request_id
    };
    
    log(`GPTZero detection results: AI probability ${(aiProbability * 100).toFixed(2)}%`, 'gptzero');
    return result;
  } catch (error) {
    log(`GPTZero API error: ${(error as Error).message}`, 'gptzero');
    throw new Error(`AI detection failed: ${(error as Error).message}`);
  }
}