import { Router, Request, Response } from 'express';
import { detectAIContent } from '../services/aiDetection';

const router = Router();

// API endpoint for AI detection on selected text
router.post('/', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required and must be a string' });
    }
    
    if (text.length < 100) {
      return res.status(400).json({ 
        error: 'Text is too short for accurate AI detection. Please provide at least 100 characters.' 
      });
    }
    
    console.log(`Running AI detection on text of length ${text.length}`);
    
    const result = await detectAIContent(text);
    
    if (result.error) {
      console.error('AI detection error:', result.error);
      return res.status(500).json({ error: result.error });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error in AI detection:', error);
    res.status(500).json({ 
      error: 'Failed to analyze text',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;