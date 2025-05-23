import { Anthropic } from '@anthropic-ai/sdk';
import OpenAI from 'openai';

const MODEL_CLAUDE = 'claude-3-opus-20240229';
const MODEL_GPT4 = 'gpt-4-turbo-preview';

// Initialize API clients
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

/**
 * Process large document using Claude
 */
export async function processLargeDocumentWithClaude(prompt: string, maxTokens = 4000): Promise<string> {
  try {
    const response = await anthropic.messages.create({
      model: MODEL_CLAUDE,
      max_tokens: maxTokens,
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
    });
    
    return response.content[0].text || '';
  } catch (error) {
    console.error('Claude API error:', error);
    throw new Error(`Claude processing failed: ${(error as Error).message}`);
  }
}

/**
 * Process large document using GPT-4
 */
export async function processLargeDocumentWithGPT4(prompt: string, maxTokens = 4000): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: MODEL_GPT4,
      messages: [
        { role: 'system', content: 'You are a professional document editor and rewriter.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    });
    
    return response.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('GPT-4 API error:', error);
    throw new Error(`GPT-4 processing failed: ${(error as Error).message}`);
  }
}

/**
 * Process large document chunks
 * This is used for processing very large documents by breaking them into chunks
 */
export async function processDocumentChunks(
  documentContent: string,
  instructions: string,
  model: 'claude' | 'gpt4',
  chunkSize = 10000
): Promise<string> {
  // Split the document into manageable chunks
  const chunks = [];
  for (let i = 0; i < documentContent.length; i += chunkSize) {
    chunks.push(documentContent.slice(i, i + chunkSize));
  }
  
  console.log(`Processing document in ${chunks.length} chunks`);
  
  // Process each chunk separately
  const processedChunks = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const chunkPrompt = `
You are rewriting part ${i+1} of ${chunks.length} of a larger document.
Instructions: ${instructions}

Here is the content to rewrite:
${chunk}

Important:
1. Keep the same information, just change the writing style
2. Rewrite this chunk ONLY, don't try to start or end the document
3. If this is in the middle of a sentence, that's OK
`;

    let result;
    if (model === 'claude') {
      result = await processLargeDocumentWithClaude(chunkPrompt, 2000);
    } else {
      result = await processLargeDocumentWithGPT4(chunkPrompt, 2000);
    }
    
    processedChunks.push(result);
    console.log(`Processed chunk ${i+1}/${chunks.length}`);
  }
  
  // If we have multiple chunks, we need one more pass to smooth transitions
  if (chunks.length > 1) {
    const combinedContent = processedChunks.join('\n\n');
    
    const finalPrompt = `
I have a document that was rewritten in chunks, and now I need you to improve the flow between sections.
Here is the current document:

${combinedContent}

Please improve the transitions between sections to make this read as a single, cohesive document.
Keep all the information and just make it flow better.
`;
    
    if (model === 'claude') {
      return await processLargeDocumentWithClaude(finalPrompt, 4000);
    } else {
      return await processLargeDocumentWithGPT4(finalPrompt, 4000);
    }
  } else {
    // Just return the single chunk
    return processedChunks[0];
  }
}