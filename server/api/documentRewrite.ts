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
    const {
      content,
      instructions,
      model,
      documentName,
      insights
    } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Document content is required' });
    }
    
    if (!instructions) {
      return res.status(400).json({ error: 'Rewrite instructions are required' });
    }
    
    // Build the prompt with detailed instructions on how to rewrite the document
    let prompt = `I need you to rewrite the following document according to these specific instructions:

INSTRUCTIONS:
${instructions}

${insights ? `ADDITIONAL INSIGHTS TO INCORPORATE:
${insights}

` : ''}DOCUMENT TO REWRITE:
${content}

Please maintain the document's core information while applying the requested changes. 
Format the output in a clean, well-structured way. 
Do not include any commentary or explanations about the rewriting process in your response.
`;

    let rewrittenContent = '';
    
    // Process using the appropriate model
    switch (model) {
      case 'gpt4':
        rewrittenContent = await processGPT4(prompt, {
          temperature: 0.7,
          maxTokens: 12000
        });
        break;
      
      case 'perplexity':
        rewrittenContent = await processPerplexity(prompt, {
          temperature: 0.7,
          maxTokens: 12000
        });
        break;
      
      case 'claude':
      default:
        rewrittenContent = await processClaude(prompt, {
          temperature: 0.7,
          maxTokens: 12000
        });
        break;
    }
    
    return res.status(200).json({
      content: rewrittenContent,
      documentName: documentName || 'rewritten-document'
    });
    
  } catch (error) {
    console.error('Error rewriting document:', error);
    return res.status(500).json({ error: 'Failed to rewrite document' });
  }
}