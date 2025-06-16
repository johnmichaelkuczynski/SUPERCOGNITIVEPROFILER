import { OpenAILimiter } from './RateLimiter';

interface OpenAICallOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  messages: Array<{role: 'user' | 'assistant' | 'system'; content: string}>;
}

export async function callOpenAIWithRateLimit(options: OpenAICallOptions): Promise<string> {
  const { default: OpenAI } = await import('openai');
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  // Estimate tokens for rate limiting
  const totalContent = options.messages.map(m => m.content).join(' ');
  const estimatedTokens = Math.ceil(totalContent.split(" ").length * 2) + (options.max_tokens || 4000);
  
  const response = await OpenAILimiter.execute(estimatedTokens, async () => {
    return await openai.chat.completions.create({
      model: options.model || "gpt-4o",
      messages: options.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 4000
    });
  });
  
  return response.choices[0].message.content || '';
}