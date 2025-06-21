import OpenAI from 'openai';
import { createReadStream } from 'fs';

// Create a client instance only when needed
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. 
// Do not change this unless explicitly requested by the user
const DEFAULT_MODEL = 'gpt-4o';

interface GPT4Options {
  temperature?: number;
  stream?: boolean;
  chunkSize?: string;
  maxTokens?: number;
  previousMessages?: Array<{role: 'user' | 'assistant' | 'system'; content: string}>;
}

/**
 * Process text with GPT-4
 */
export async function processGPT4(
  prompt: string,
  options: GPT4Options = {}
) {
  const {
    temperature = 0.7,
    stream = false,
    maxTokens = 4000,
    previousMessages = []
  } = options;

  const messages = [
    ...previousMessages,
    { role: 'user' as const, content: prompt }
  ];

  if (stream) {
    return processWithChunking(prompt, options);
  }

  try {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages,
      temperature,
      max_tokens: maxTokens,
    });

    return response.choices[0].message.content || '';
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw error;
  }
}

/**
 * Process text with GPT-4 in chunks for streaming
 */
async function processWithChunking(
  prompt: string,
  options: GPT4Options = {}
) {
  const { temperature = 0.7, chunkSize = 'medium', maxTokens = 4000 } = options;

  try {
    const client = getOpenAIClient();
    const stream = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens: maxTokens,
      stream: true,
    });

    let generatedText = '';
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      generatedText += content;
    }

    return generatedText;
  } catch (error) {
    console.error('Error streaming from OpenAI API:', error);
    throw error;
  }
}

/**
 * Generate a one-sentence summary of a document chunk
 */
export async function summarizeDocumentChunk(text: string): Promise<string> {
  try {
    // Truncate text to avoid exceeding token limits
    const truncatedText = text.length > 3000 ? 
      text.substring(0, 3000) + '...' : 
      text;
    
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system', 
          content: 'You are an expert document summarizer. Create a brief, informative title (1-2 sentences) that captures the essence of this document section.'
        },
        {
          role: 'user',
          content: `Summarize the following text in 1-2 sentences that could serve as an informative title:\n\n${truncatedText}`
        }
      ],
      temperature: 0.3, // Lower temperature for more focused output
      max_tokens: 60,   // Keep it brief
    });

    return response.choices[0].message.content || '';
  } catch (error) {
    console.error('Error generating document summary:', error);
    throw error;
  }
}