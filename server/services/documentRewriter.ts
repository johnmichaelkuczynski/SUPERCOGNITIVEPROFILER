import { processClaude } from './anthropic';
import { processGPT4 } from './openai';
import { processPerplexity } from './perplexity';

interface RewriteOptions {
  model: 'claude' | 'gpt4' | 'perplexity';
  instructions: string;
  detectionProtection: boolean;
}

/**
 * Rewrite a document using the specified AI model
 * @param documentContent The original document content
 * @param options Rewrite options including model, instructions, and detection protection
 * @returns The rewritten document content
 */
export async function rewriteDocument(
  documentContent: string,
  documentName: string,
  options: RewriteOptions
): Promise<string> {
  try {
    // Set up the prompt for rewriting
    let prompt = `I have a document titled "${documentName}" that I need rewritten according to these instructions: ${options.instructions}\n\n`;
    
    // Add prompt for detection protection if enabled
    if (options.detectionProtection) {
      prompt += `IMPORTANT: The rewritten text should be resistant to AI content detectors. Please ensure the output has the following characteristics:
      - Varies sentence structure and length
      - Uses rich vocabulary and natural phrasing
      - Avoids repetitive patterns in transitions
      - Includes natural imperfections and nuance typical of human writing
      - Maintains a conversational and authentic tone\n\n`;
    }
    
    // Add the document content
    prompt += `Here is the document content to rewrite:\n\n${documentContent}\n\n`;
    
    // Add final instructions
    prompt += `Please rewrite this document according to the instructions. Maintain the original information and meaning, but improve it according to the specified requirements. Return only the rewritten text without any additional comments, explanations, or headers.`;
    
    // Choose the model to use for rewriting
    let result: string;
    
    // For large documents, we need a different approach
    const documentLength = documentContent.length;
    
    // Let's use GPT-4 as default for large documents since it handles long context better
    if (documentLength > 30000 && options.model === 'claude') {
      console.log(`Document is large (${documentLength} chars), using GPT-4 instead of Claude`);
      options.model = 'gpt4';
    }
    
    switch (options.model) {
      case 'claude':
        const claudeResponse = await processClaude(prompt, {
          temperature: 0.7,
          stream: false,
          maxTokens: 4000, // Limit token output for Claude
        });
        result = typeof claudeResponse === 'string' ? claudeResponse : claudeResponse.content;
        break;
        
      case 'gpt4':
        const gpt4Response = await processGPT4(prompt, {
          temperature: 0.7, 
          stream: false,
          maxTokens: 4000, // Limit to prevent timeouts
        });
        result = typeof gpt4Response === 'string' ? gpt4Response : gpt4Response.content;
        break;
        
      case 'perplexity':
        const perplexityResponse = await processPerplexity(prompt, {
          temperature: 0.7,
          stream: false,
          maxTokens: 4000, // Standard limit
        });
        result = typeof perplexityResponse === 'string' ? perplexityResponse : perplexityResponse.content;
        break;
        
      default:
        throw new Error(`Unsupported model: ${options.model}`);
    }
    
    return result;
  } catch (error) {
    console.error('Error rewriting document:', error);
    throw new Error(`Failed to rewrite document: ${error instanceof Error ? error.message : String(error)}`);
  }
}