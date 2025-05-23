import Anthropic from '@anthropic-ai/sdk';

// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const MODEL = "claude-3-7-sonnet-20250219";

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

interface LLMOptions {
  temperature?: number;
  stream?: boolean;
  chunkSize?: string;
  maxTokens?: number;
  previousMessages?: Array<{role: string; content: string}>;
}

export async function processClaude(
  content: string,
  options: LLMOptions = {}
): Promise<string> {
  const {
    temperature = 0.7,
    stream = false,
    chunkSize,
    maxTokens = 2048,
    previousMessages = []
  } = options;
  try {
    // Implement chunking strategy if needed
    if (chunkSize && content.length > 10000) {
      return await processWithChunking(content, temperature, chunkSize, maxTokens, previousMessages);
    }
    
    // Format messages array with conversation history
    let messages: Array<{role: string, content: string}> = [];
    
    // Add previous messages if available
    if (previousMessages && previousMessages.length > 0) {
      // Ensure roles are valid for Anthropic (only 'user' and 'assistant' are allowed)
      messages = previousMessages.map(msg => ({
        role: (msg.role === 'system' || msg.role === 'user') ? 'user' : 'assistant',
        content: msg.content
      }));
    }
    
    // Add the current message
    messages.push({ role: 'user', content });
    
    const response = await anthropic.messages.create({
      model: MODEL,
      messages,
      temperature,
      max_tokens: maxTokens,
    });
    
    // Get the response content and handle the different types
    return ('text' in response.content[0]) ? response.content[0].text : JSON.stringify(response.content[0]);
  } catch (error) {
    console.error("Error calling Anthropic API:", error);
    throw new Error(`Claude processing failed: ${(error as Error).message}`);
  }
}

async function processWithChunking(
  content: string, 
  temperature: number,
  chunkSize: string,
  maxTokens?: number,
  previousMessages: Array<{role: string; content: string}> = []
): Promise<string> {
  // Determine chunk size based on the strategy
  let chunkTokens: number;
  switch (chunkSize) {
    case 'small':
      chunkTokens = 1000;
      break;
    case 'medium':
      chunkTokens = 2000;
      break;
    case 'large':
      chunkTokens = 4000;
      break;
    default: // auto
      chunkTokens = 2000;
  }
  
  // Simple text chunking by paragraphs (in a real app, we would use a more sophisticated chunking strategy)
  const paragraphs = content.split("\n\n");
  
  // Estimate tokens (rough approximation)
  const estimatedTokensPerChar = 0.25;
  
  let chunks: string[] = [];
  let currentChunk = "";
  
  for (const paragraph of paragraphs) {
    const paragraphTokens = paragraph.length * estimatedTokensPerChar;
    
    if (currentChunk.length * estimatedTokensPerChar + paragraphTokens > chunkTokens && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = paragraph;
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  // Process each chunk
  let results: string[] = [];
  let context = "";
  
  for (let i = 0; i < chunks.length; i++) {
    const isFirstChunk = i === 0;
    const isLastChunk = i === chunks.length - 1;
    
    let prompt = chunks[i];
    
    if (!isFirstChunk) {
      prompt = `Previous context:\n${context}\n\nContinue processing with this chunk:\n${prompt}`;
    }
    
    if (!isLastChunk) {
      prompt += "\n\nNote: This is not the end of the document. More content follows in subsequent chunks.";
    }
    
    // Format messages array including previous messages
    let messages: Array<{role: string, content: string}> = [];
    
    // Add previous messages if this is the first chunk
    if (isFirstChunk && previousMessages && previousMessages.length > 0) {
      messages = previousMessages.map(msg => ({
        role: (msg.role === 'system' || msg.role === 'user') ? 'user' : 'assistant',
        content: msg.content
      }));
    }
    
    // Add the current prompt
    messages.push({ role: 'user', content: prompt });
    
    const response = await anthropic.messages.create({
      model: MODEL,
      messages,
      temperature,
      max_tokens: maxTokens || 4000,
    });
    
    // Get the response content and handle different types
    const result = ('text' in response.content[0]) ? response.content[0].text : JSON.stringify(response.content[0]);
    results.push(result);
    
    // Update context with a summary of what was processed so far
    if (chunks.length > 1 && !isLastChunk) {
      const contextResponse = await anthropic.messages.create({
        model: MODEL,
        messages: [
          { 
            role: 'user', 
            content: `Summarize the following content in 200 words or less to provide context for continuation:\n\n${chunks[i]}\n\n${result}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });
      
      context = contextResponse.content[0].text;
    }
  }
  
  // For multiple chunks, ensure proper consolidation
  if (chunks.length > 1) {
    const consolidationResponse = await anthropic.messages.create({
      model: MODEL,
      messages: [
        { 
          role: 'user', 
          content: `You have processed a document in ${chunks.length} chunks. Please combine and revise the following outputs to create a coherent whole:\n\n${results.join("\n\n===CHUNK BOUNDARY===\n\n")}`
        }
      ],
      temperature: 0.3,
      max_tokens: maxTokens || 4000,
    });
    
    return consolidationResponse.content[0].text;
  }
  
  return results.join("\n\n");
}
