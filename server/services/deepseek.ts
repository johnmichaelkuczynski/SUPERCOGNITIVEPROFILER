import OpenAI from 'openai';

// DeepSeek uses OpenAI-compatible API
const deepseek = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY || "",
});

// Log API key status for debugging
console.log("DeepSeek API key available:", !!process.env.DEEPSEEK_API_KEY);
console.log("DeepSeek API key first few chars:", process.env.DEEPSEEK_API_KEY?.substring(0, 5) + "...");

interface DeepSeekOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export async function processDeepSeek(
  content: string,
  options: DeepSeekOptions = {}
): Promise<string> {
  const {
    temperature = 0.7,
    maxTokens = 4000,
    model = 'deepseek-chat'
  } = options;

  try {
    const response = await deepseek.chat.completions.create({
      model: model,
      messages: [
        { role: 'user', content: content }
      ],
      temperature,
      max_tokens: maxTokens,
    });

    return response.choices[0].message.content || '';
  } catch (error) {
    console.error("Error calling DeepSeek API:", error);
    throw new Error(`DeepSeek processing failed: ${(error as Error).message}`);
  }
}