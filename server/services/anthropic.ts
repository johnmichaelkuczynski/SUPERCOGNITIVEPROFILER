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
    // Implement chunking strategy for all documents over 3000 characters
    // Essential for processing very large documents up to 400k words
    if (content.length > 3000) {
      return await processWithChunking(content, temperature, chunkSize || 'auto', maxTokens, previousMessages);
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
  console.log(`Processing large document (${content.length} characters) with chunking`);
  
  // Determine word chunk size based on document size and user preference
  // Use ~500 words per chunk as the baseline for very large documents
  let wordsPerChunk: number;
  
  switch (chunkSize) {
    case 'small':
      wordsPerChunk = 250; // Approx 500-750 tokens
      break;
    case 'medium':
      wordsPerChunk = 500; // Approx 1000-1500 tokens
      break;
    case 'large':
      wordsPerChunk = 800; // Approx 1600-2400 tokens
      break;
    case 'xlarge':
      wordsPerChunk = 1200; // Approx 2400-3600 tokens
      break;
    default: // auto - adapt based on document size
      if (content.length > 2000000) { // ~2M chars ≈ 400k words
        wordsPerChunk = 500; // Smaller chunks for very large docs to ensure reliability
      } else if (content.length > 500000) { // ~500k chars ≈ 100k words
        wordsPerChunk = 600;
      } else {
        wordsPerChunk = 700; // Default for medium-sized docs
      }
  }
  
  console.log(`Using chunks of approximately ${wordsPerChunk} words for document processing`);
  
  // Improved chunking that respects paragraph and sentence boundaries
  // First split into paragraphs
  const paragraphs = content.split(/\n\s*\n/);
  
  // Initialize variables for chunking
  let chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentWordCount = 0;
  let totalWords = 0;
  
  // Process each paragraph to create proper chunks
  for (const paragraph of paragraphs) {
    // Count words in paragraph (approximate)
    const paragraphWordCount = paragraph.split(/\s+/).length;
    totalWords += paragraphWordCount;
    
    // If adding this paragraph would exceed chunk size and we already have content
    if (currentWordCount + paragraphWordCount > wordsPerChunk && currentChunk.length > 0) {
      // Save current chunk
      chunks.push(currentChunk.join("\n\n"));
      currentChunk = [paragraph];
      currentWordCount = paragraphWordCount;
    } 
    // If this paragraph alone exceeds chunk size, split it by sentences
    else if (paragraphWordCount > wordsPerChunk) {
      // Complete current chunk if it has content
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.join("\n\n"));
        currentChunk = [];
        currentWordCount = 0;
      }
      
      // Split paragraph by sentences and create chunks
      const sentences = paragraph.split(/(?<=[.!?])\s+/);
      let sentenceChunk: string[] = [];
      let sentenceWordCount = 0;
      
      for (const sentence of sentences) {
        const sentenceWords = sentence.split(/\s+/).length;
        
        if (sentenceWordCount + sentenceWords > wordsPerChunk && sentenceChunk.length > 0) {
          chunks.push(sentenceChunk.join(" "));
          sentenceChunk = [sentence];
          sentenceWordCount = sentenceWords;
        } else {
          sentenceChunk.push(sentence);
          sentenceWordCount += sentenceWords;
        }
      }
      
      // Add any remaining sentences as a chunk
      if (sentenceChunk.length > 0) {
        chunks.push(sentenceChunk.join(" "));
      }
    } 
    // Normal case: add paragraph to current chunk
    else {
      currentChunk.push(paragraph);
      currentWordCount += paragraphWordCount;
    }
  }
  
  // Add final chunk if there's content remaining
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join("\n\n"));
  }
  
  console.log(`Document divided into ${chunks.length} chunks for processing (estimated ${totalWords} total words)`);
  
  // Process each chunk sequentially
  let results: string[] = [];
  let runningContext = "";
  
  for (let i = 0; i < chunks.length; i++) {
    const isFirstChunk = i === 0;
    const isLastChunk = i === chunks.length - 1;
    const progressPercent = Math.round((i / chunks.length) * 100);
    
    console.log(`Processing chunk ${i+1}/${chunks.length} (${progressPercent}% complete)`);
    
    let currentChunk = chunks[i];
    let promptContent = '';
    
    // Build prompt based on chunk position
    if (isFirstChunk) {
      promptContent = `You are processing the first part of a large document that will be divided into ${chunks.length} sequential chunks.\n\n${currentChunk}`;
    } else if (isLastChunk) {
      promptContent = `You are processing the final part (${i+1} of ${chunks.length}) of a large document.\n\nContext from previous sections:\n${runningContext}\n\nFinal section to process:\n\n${currentChunk}`;
    } else {
      promptContent = `You are processing part ${i+1} of ${chunks.length} of a large document.\n\nContext from previous sections:\n${runningContext}\n\nContinue processing with this section:\n\n${currentChunk}`;
    }
    
    // Add processing instructions
    if (!isLastChunk) {
      promptContent += "\n\nNote: This is not the end of the document. Process this chunk independently while maintaining consistency with previous content.";
    }
    
    // Format messages array
    let messages: Array<{role: string, content: string}> = [];
    
    // Add previous conversation messages if this is the first chunk
    if (isFirstChunk && previousMessages && previousMessages.length > 0) {
      messages = previousMessages.map(msg => ({
        role: (msg.role === 'system' || msg.role === 'user') ? 'user' : 'assistant',
        content: msg.content
      }));
    }
    
    // Add the current prompt
    messages.push({ role: 'user', content: promptContent });
    
    try {
      // Process chunk with Claude
      const response = await anthropic.messages.create({
        model: MODEL,
        messages,
        temperature,
        max_tokens: maxTokens || 4000,
      });
      
      // Extract and store the result
      const result = ('text' in response.content[0]) ? response.content[0].text : JSON.stringify(response.content[0]);
      results.push(result);
      
      // Generate or update context for next chunk
      if (!isLastChunk) {
        // For very large documents, maintain a running summary to provide context
        if (chunks.length > 10) {
          const summaryPrompt = `Create a brief summary (maximum 200 words) of the following content to use as context for the next section of processing:\n\n${result}`;
          
          const summaryResponse = await anthropic.messages.create({
            model: MODEL,
            messages: [{ role: 'user', content: summaryPrompt }],
            temperature: 0.3,
            max_tokens: 300,
          });
          
          // Update the running context for the next chunk
          if (runningContext) {
            runningContext += "\n\n" + summaryResponse.content[0].text;
            
            // If context gets too long, summarize it again to keep it manageable
            if (runningContext.length > 2000) {
              const contextSummaryPrompt = `Condense the following context summary into a shorter version (maximum 400 words) while preserving all key information:\n\n${runningContext}`;
              
              const contextSummaryResponse = await anthropic.messages.create({
                model: MODEL,
                messages: [{ role: 'user', content: contextSummaryPrompt }],
                temperature: 0.3,
                max_tokens: 600,
              });
              
              runningContext = contextSummaryResponse.content[0].text;
            }
          } else {
            runningContext = summaryResponse.content[0].text;
          }
        } else {
          // For smaller documents, just use the last part of the processed content
          runningContext = result.slice(-800);
        }
      }
      
      // Add progress indicators
      console.log(`Completed chunk ${i+1}/${chunks.length} (${progressPercent}% complete)`);
      
    } catch (error) {
      console.error(`Error processing chunk ${i+1}/${chunks.length}:`, error);
      throw new Error(`Failed processing document chunk ${i+1}: ${(error as Error).message}`);
    }
  }
  
  // For large multi-chunk documents, ensure proper consolidation
  if (chunks.length > 3) {
    console.log("Consolidating all processed chunks into final output...");
    
    try {
      const consolidationPrompt = `You have processed a large document in ${chunks.length} sequential chunks. 
Create a coherent final version by combining these processed sections, ensuring consistency throughout:

${results.join("\n\n=== SECTION BREAK ===\n\n")}

Produce a polished, continuous document that flows naturally between sections.`;
      
      const consolidationResponse = await anthropic.messages.create({
        model: MODEL,
        messages: [{ role: 'user', content: consolidationPrompt }],
        temperature: 0.3,
        max_tokens: maxTokens || 4000,
      });
      
      console.log("Document processing complete!");
      return consolidationResponse.content[0].text;
    } catch (error) {
      console.error("Error during final consolidation:", error);
      // Fallback to joining results if consolidation fails
      console.log("Using fallback method to join processed chunks");
      return results.join("\n\n");
    }
  }
  
  // For smaller documents with few chunks
  console.log("Document processing complete!");
  return results.join("\n\n");
}
