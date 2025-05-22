// Implementation of Perplexity API service
import fetch from 'node-fetch';

// Default to the smallest model unless specified otherwise
// the newest Perplexity model is "llama-3.1-sonar-small-128k-online" which was released February 24, 2025
const DEFAULT_MODEL = "llama-3.1-sonar-small-128k-online";

export async function processPerplexity(
  content: string, 
  options: any = {}
): Promise<string> {
  // Extract options with defaults
  const temperature = typeof options === 'object' ? (options.temperature || 0.7) : 0.7;
  const stream = typeof options === 'object' ? (options.stream || false) : false;
  const chunkSize = typeof options === 'object' ? options.chunkSize : undefined;
  const maxTokens = typeof options === 'object' ? options.maxTokens : undefined;
  const previousMessages = typeof options === 'object' ? options.previousMessages : [];
  try {
    console.log("Processing with Perplexity...");
    
    // API key validation
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      throw new Error("PERPLEXITY_API_KEY not found in environment variables");
    }
    
    console.log(`API key available: ${apiKey.substring(0, 3)}...${apiKey.substring(apiKey.length - 3)}`);

    // Implement chunking strategy if needed
    if (chunkSize && content.length > 10000) {
      console.log(`Content length (${content.length}) exceeds threshold, using chunking strategy: ${chunkSize}`);
      return await processWithChunking(content, temperature, chunkSize, maxTokens);
    }

    // Prepare the request payload
    // Build messages array including conversation history
    let messages = [];
    
    // Add system message first
    messages.push({
      role: "system",
      content: "You are an advanced text processing assistant. Provide thoughtful, comprehensive, and well-structured responses."
    });
    
    // Add previous messages if provided
    if (previousMessages && previousMessages.length > 0) {
      messages.push(...previousMessages.map(msg => ({
        role: msg.role === 'system' ? 'system' : (msg.role === 'user' ? 'user' : 'assistant'),
        content: msg.content
      })));
    }
    
    // Add current message
    messages.push({ role: "user", content });
    
    const requestBody = {
      model: DEFAULT_MODEL,
      messages: messages,
      temperature: temperature,
      max_tokens: maxTokens || 2048,
      search_domain_filter: ["perplexity.ai"],
      return_images: false,
      return_related_questions: false,
      search_recency_filter: "month",
      top_k: 0,
      stream: false, // We manually handle streaming for consistent API
      presence_penalty: 0,
      frequency_penalty: 1
    };

    console.log("Perplexity request payload:", JSON.stringify({
      model: requestBody.model,
      temperature: requestBody.temperature,
      max_tokens: requestBody.max_tokens,
      message_count: requestBody.messages.length
    }));

    // Make the API request
    console.log("Sending request to Perplexity API...");
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    // Log response status
    console.log(`Perplexity API response status: ${response.status} ${response.statusText}`);

    // Check for errors
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Perplexity API error details:", errorText);
      throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
    }

    // Parse the response
    const data = await response.json();
    console.log("Perplexity API response:", JSON.stringify({
      id: data.id,
      model: data.model,
      completion_tokens: data.usage?.completion_tokens,
      total_tokens: data.usage?.total_tokens,
      choices_count: data.choices?.length
    }));
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Invalid response structure from Perplexity API:", JSON.stringify(data));
      throw new Error("Invalid response structure from Perplexity API");
    }
    
    return data.choices[0].message.content || "";
  } catch (error) {
    console.error("Error calling Perplexity API:", error);
    throw new Error(`Perplexity processing failed: ${(error as Error).message}`);
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
  
  // Simple text chunking by paragraphs
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
  
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    throw new Error("PERPLEXITY_API_KEY not found in environment variables");
  }
  
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
    
    // Prepare request for this chunk
    const requestBody = {
      model: DEFAULT_MODEL,
      messages: [
        {
          role: "system",
          content: "You are an advanced text processing assistant. Provide thoughtful, comprehensive, and well-structured responses."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature,
      max_tokens: maxTokens,
      search_domain_filter: ["perplexity.ai"],
      return_images: false,
      return_related_questions: false,
      search_recency_filter: "month",
      top_k: 0,
      stream: false,
      presence_penalty: 0,
      frequency_penalty: 1
    };
    
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    const result = data.choices[0].message.content || "";
    results.push(result);
    
    // Update context with a summary of what was processed so far
    if (chunks.length > 1 && !isLastChunk) {
      const contextRequestBody = {
        model: DEFAULT_MODEL,
        messages: [
          {
            role: "system",
            content: "You are a summarization expert. Be concise and focus on key points."
          },
          {
            role: "user",
            content: `Summarize the following content in 200 words or less to provide context for continuation:\n\n${chunks[i]}\n\n${result}`
          }
        ],
        temperature: 0.3,
        search_domain_filter: ["perplexity.ai"],
        return_images: false,
        return_related_questions: false,
        search_recency_filter: "month",
        top_k: 0,
        stream: false,
        presence_penalty: 0,
        frequency_penalty: 1
      };
      
      const contextResponse = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(contextRequestBody)
      });
      
      if (!contextResponse.ok) {
        const errorText = await contextResponse.text();
        throw new Error(`Perplexity API error: ${contextResponse.status} - ${errorText}`);
      }
      
      const contextData = await contextResponse.json();
      context = contextData.choices[0].message.content || "";
    }
  }
  
  // For multiple chunks, ensure proper consolidation
  if (chunks.length > 1) {
    const consolidationRequestBody = {
      model: DEFAULT_MODEL,
      messages: [
        {
          role: "system",
          content: "You are a content integration specialist. Create coherent unified content from separate chunks."
        },
        {
          role: "user",
          content: `You have processed a document in ${chunks.length} chunks. Please combine and revise the following outputs to create a coherent whole:\n\n${results.join("\n\n===CHUNK BOUNDARY===\n\n")}`
        }
      ],
      temperature: 0.3,
      search_domain_filter: ["perplexity.ai"],
      return_images: false,
      return_related_questions: false,
      search_recency_filter: "month",
      top_k: 0,
      stream: false,
      presence_penalty: 0,
      frequency_penalty: 1
    };
    
    const consolidationResponse = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(consolidationRequestBody)
    });
    
    if (!consolidationResponse.ok) {
      const errorText = await consolidationResponse.text();
      throw new Error(`Perplexity API error: ${consolidationResponse.status} - ${errorText}`);
    }
    
    const consolidationData = await consolidationResponse.json();
    return consolidationData.choices[0].message.content || results.join("\n\n");
  }
  
  return results.join("\n\n");
}
