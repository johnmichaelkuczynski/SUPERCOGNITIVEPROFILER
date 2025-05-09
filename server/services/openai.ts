import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const MODEL = "gpt-4o";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ""
});

export async function processGPT4(
  content: string, 
  temperature: number = 0.7, 
  stream: boolean = false,
  chunkSize?: string,
  maxTokens?: number
): Promise<string> {
  try {
    // Implement chunking strategy if needed
    if (chunkSize && content.length > 10000) {
      return await processWithChunking(content, temperature, chunkSize, maxTokens);
    }
    
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "user", content }
      ],
      temperature,
      max_tokens: maxTokens,
      stream: false // We manually handle streaming for consistent API
    });
    
    return response.choices[0].message.content || "";
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    throw new Error(`GPT-4 processing failed: ${(error as Error).message}`);
  }
}

async function processWithChunking(
  content: string, 
  temperature: number,
  chunkSize: string,
  maxTokens?: number
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
    
    const response = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "user", content: prompt }
      ],
      temperature,
      max_tokens: maxTokens,
      stream: false
    });
    
    const result = response.choices[0].message.content || "";
    results.push(result);
    
    // Update context with a summary of what was processed so far
    if (chunks.length > 1 && !isLastChunk) {
      const contextResponse = await openai.chat.completions.create({
        model: MODEL,
        messages: [
          { 
            role: "user", 
            content: `Summarize the following content in 200 words or less to provide context for continuation:\n\n${chunks[i]}\n\n${result}`
          }
        ],
        temperature: 0.3,
        stream: false
      });
      
      context = contextResponse.choices[0].message.content || "";
    }
  }
  
  // For multiple chunks, ensure proper consolidation
  if (chunks.length > 1) {
    const consolidationResponse = await openai.chat.completions.create({
      model: MODEL,
      messages: [
        { 
          role: "user", 
          content: `You have processed a document in ${chunks.length} chunks. Please combine and revise the following outputs to create a coherent whole:\n\n${results.join("\n\n===CHUNK BOUNDARY===\n\n")}`
        }
      ],
      temperature: 0.3,
      stream: false
    });
    
    return consolidationResponse.choices[0].message.content || results.join("\n\n");
  }
  
  return results.join("\n\n");
}
