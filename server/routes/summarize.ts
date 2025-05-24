import { Router, Request, Response } from 'express';
import { summarizeDocumentChunk } from '../services/openai';

const router = Router();

// Document chunk summarization endpoint
router.post('/', async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Valid content is required' });
    }
    
    // Use OpenAI to generate a summary of the chunk
    const summary = await summarizeDocumentChunk(content);
    
    res.json({ summary });
  } catch (error) {
    console.error('Error summarizing chunk:', error);
    res.status(500).json({ 
      error: 'Failed to summarize document chunk',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;