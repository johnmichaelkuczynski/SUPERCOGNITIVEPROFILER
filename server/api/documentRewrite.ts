import { Request, Response } from 'express';
import { processClaude } from '../services/anthropic';
import { processGPT4 } from '../services/openai';
import { processPerplexity } from '../services/perplexity';

/**
 * Handle document rewrite request
 * This is a specialized endpoint for large document rewrites that
 * handles the request separately from the regular chat flow
 */
export async function rewriteDocument(req: Request, res: Response) {
  try {
    const { content, instructions, model, documentName } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Document content is required' });
    }
    
    if (!instructions) {
      return res.status(400).json({ error: 'Rewrite instructions are required' });
    }
    
    console.log(`Processing document rewrite request for "${documentName || 'unnamed document'}"`);
    console.log(`Using model: ${model}, Content length: ${content.length} chars`);
    
    // Create a prompt that includes the document and instructions
    const prompt = `
I need you to rewrite the following document according to these specific instructions:

${instructions}

Here is the document to rewrite:

${content}

Please provide ONLY the rewritten document without any additional comments, explanations, or metadata.
`;
    
    let rewrittenContent;
    
    // Route to the appropriate LLM service based on model selection
    switch (model) {
      case 'claude':
        rewrittenContent = await processClaude(prompt, {
          temperature: 0.7,
          maxTokens: 100000,
        });
        break;
      case 'gpt4':
        rewrittenContent = await processGPT4(prompt, {
          temperature: 0.7,
          maxTokens: 32000,
        });
        break;
      case 'perplexity':
        rewrittenContent = await processPerplexity(prompt, {
          temperature: 0.7,
          maxTokens: 16000,
        });
        break;
      default:
        rewrittenContent = await processClaude(prompt, {
          temperature: 0.7,
          maxTokens: 100000,
        });
    }
    
    res.json({
      content: rewrittenContent,
      success: true
    });
    
  } catch (error) {
    console.error('Document rewrite error:', error);
    res.status(500).json({ 
      error: 'Failed to rewrite document', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}