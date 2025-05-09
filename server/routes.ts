import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import fs from "fs";
import path from "path";
import { processGPT4 } from "./services/openai";
import { processClaude } from "./services/anthropic";
import { processPerplexity } from "./services/perplexity";
import { processDocument, extractText } from "./services/documentProcessor";
import { generateAnalytics } from "./services/analytics";

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // LLM prompt processing route
  app.post('/api/llm/prompt', upload.array('files'), async (req: Request, res: Response) => {
    try {
      const { content, model, stream, temperature, chunkSize, maxTokens } = req.body;
      const files = req.files as Express.Multer.File[];
      
      // Validate required fields
      if (!content) {
        return res.status(400).json({ message: 'Content is required' });
      }
      
      if (!model) {
        return res.status(400).json({ message: 'Model is required' });
      }
      
      // Process document files if any
      let processedContent = content;
      if (files && files.length > 0) {
        const extractedTexts = await Promise.all(files.map(file => extractText(file)));
        processedContent = content + "\n\nContext documents:\n" + extractedTexts.join("\n\n");
      }
      
      // Process with the selected model
      let result;
      const shouldStream = stream === 'true';
      const tempValue = temperature ? parseFloat(temperature) : 0.7;
      const maxTokenValue = maxTokens ? parseInt(maxTokens) : undefined;
      
      switch (model) {
        case 'claude':
          result = await processClaude(processedContent, tempValue, shouldStream, chunkSize, maxTokenValue);
          break;
        case 'gpt4':
          result = await processGPT4(processedContent, tempValue, shouldStream, chunkSize, maxTokenValue);
          break;
        case 'perplexity':
          result = await processPerplexity(processedContent, tempValue, shouldStream, chunkSize, maxTokenValue);
          break;
        default:
          return res.status(400).json({ message: 'Invalid model' });
      }
      
      // Store the interaction in history if requested
      const saveToHistory = req.body.saveToHistory !== 'false';
      if (saveToHistory) {
        const userId = 1; // Mock user ID for now
        
        // Generate a title based on the content
        const title = content.split('\n')[0].slice(0, 50) + (content.split('\n')[0].length > 50 ? '...' : '');
        
        await storage.createDocument({
          userId,
          title,
          content: result,
          model,
          excerpt: result.slice(0, 150) + (result.length > 150 ? '...' : ''),
          date: new Date(),
        });
      }
      
      if (shouldStream) {
        // For streaming responses, we'd implement Server-Sent Events here
        // This is a simplified version
        res.setHeader('Content-Type', 'text/plain');
        res.send(result);
      } else {
        // For non-streaming, return a standard JSON response
        res.json({ content: result });
      }
    } catch (error) {
      console.error('Error processing LLM request:', error);
      res.status(500).json({ message: 'Failed to process request', error: (error as Error).message });
    }
  });
  
  // Document processing route
  app.post('/api/documents/process', upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      const file = req.file;
      const extractedText = await processDocument(file);
      
      // Save the document to the database
      const userId = 1; // Mock user ID for now
      
      // Generate a title based on the content or use filename
      const filename = file.originalname.split('.')[0];
      const title = filename || extractedText.slice(0, 50).replace(/\n/g, ' ') + (extractedText.length > 50 ? '...' : '');
      
      // Store the document
      await storage.createDocument({
        userId,
        title,
        content: extractedText,
        model: 'claude', // Default model for file uploads
        excerpt: extractedText.slice(0, 150) + (extractedText.length > 150 ? '...' : ''),
        date: new Date(),
      });
      
      res.json({ 
        content: extractedText,
        message: 'Document successfully processed and saved'
      });
    } catch (error) {
      console.error('Error processing document:', error);
      res.status(500).json({ message: 'Failed to process document', error: (error as Error).message });
    }
  });
  
  // Get documents route
  app.get('/api/documents', async (req: Request, res: Response) => {
    try {
      const userId = 1; // Mock user ID for now
      const documents = await storage.getDocumentsByUserId(userId);
      res.json(documents);
    } catch (error) {
      console.error('Error fetching documents:', error);
      res.status(500).json({ message: 'Failed to fetch documents', error: (error as Error).message });
    }
  });
  
  // Analytics route
  app.get('/api/analytics', async (req: Request, res: Response) => {
    try {
      const timeframe = req.query.timeframe as string || '7days';
      const userId = 1; // Mock user ID for now
      
      // Get user documents for analysis
      const documents = await storage.getDocumentsByUserId(userId);
      
      // Generate analytics data
      const analyticsData = generateAnalytics(documents, timeframe);
      
      res.json(analyticsData);
    } catch (error) {
      console.error('Error generating analytics:', error);
      res.status(500).json({ message: 'Failed to generate analytics', error: (error as Error).message });
    }
  });
  
  // Download formatted output route
  app.post('/api/llm/download', async (req: Request, res: Response) => {
    try {
      const { content, format, filename } = req.body;
      
      if (!content) {
        return res.status(400).json({ message: 'Content is required' });
      }
      
      if (!format) {
        return res.status(400).json({ message: 'Format is required' });
      }
      
      // Set the appropriate headers based on format
      switch (format) {
        case 'txt':
          res.setHeader('Content-Type', 'text/plain');
          res.setHeader('Content-Disposition', `attachment; filename="${filename || 'download'}.txt"`);
          res.send(content);
          break;
        case 'pdf':
          // In a real app, we'd use a PDF library to generate a PDF
          // For now, just sending plain text with PDF extension
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="${filename || 'download'}.pdf"`);
          res.send(content);
          break;
        case 'docx':
          // In a real app, we'd use a DOCX library to generate a Word document
          // For now, just sending plain text with DOCX extension
          res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
          res.setHeader('Content-Disposition', `attachment; filename="${filename || 'download'}.docx"`);
          res.send(content);
          break;
        default:
          return res.status(400).json({ message: 'Invalid format' });
      }
    } catch (error) {
      console.error('Error downloading output:', error);
      res.status(500).json({ message: 'Failed to download output', error: (error as Error).message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
