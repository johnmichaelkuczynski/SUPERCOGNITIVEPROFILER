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

  console.log('🔍 DeepSeek API Call Details:', {
    contentLength: content.length,
    temperature,
    maxTokens,
    model,
    hasApiKey: !!process.env.DEEPSEEK_API_KEY
  });

  try {
    const response = await deepseek.chat.completions.create({
      model: model,
      messages: [
        { role: 'user', content: content }
      ],
      temperature,
      max_tokens: maxTokens,
    });

    console.log('✅ DeepSeek API Response:', {
      choices: response.choices?.length || 0,
      hasContent: !!response.choices?.[0]?.message?.content,
      contentLength: response.choices?.[0]?.message?.content?.length || 0
    });

    return response.choices[0].message.content || '';
  } catch (error: any) {
    console.error("❌ DeepSeek API Error Details:", {
      message: error.message,
      status: error.status,
      code: error.code,
      type: error.type,
      response: error.response?.data || error.response,
      stack: error.stack
    });
    
    if (error.status === 401) {
      throw new Error('DeepSeek API authentication failed - please check your API key');
    } else if (error.status === 429) {
      throw new Error('DeepSeek API rate limit exceeded - please try again later');
    } else if (error.status >= 500) {
      throw new Error('DeepSeek API server error - please try again later');
    }
    
    throw new Error(`DeepSeek processing failed: ${error.message}`);
  }
}