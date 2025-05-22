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
import { detectAIContent } from "./services/aiDetection";
import { WebSocketServer } from 'ws';

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // LLM prompt processing route
  app.post('/api/llm/prompt', upload.array('files'), async (req: Request, res: Response) => {
    try {
      const { content, model, stream, temperature, chunkSize, maxTokens, conversation_history } = req.body;
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
      
      // Parse conversation history if provided
      let previousMessages = undefined;
      if (conversation_history) {
        try {
          previousMessages = JSON.parse(conversation_history);
          console.log("Using conversation history with " + previousMessages.length + " messages");
        } catch (error) {
          console.error("Error parsing conversation history:", error);
        }
      }
      
      // Create options including conversation history
      const options: any = {
        temperature: tempValue,
        stream: shouldStream,
        chunkSize,
        maxTokens: maxTokenValue
      };
      
      if (previousMessages && previousMessages.length > 0) {
        options.previousMessages = previousMessages;
      }
      
      switch (model) {
        case 'claude':
          result = await processClaude(processedContent, options);
          break;
        case 'gpt4':
          result = await processGPT4(processedContent, options);
          break;
        case 'perplexity':
          result = await processPerplexity(processedContent, options);
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
        
        // Create a conversation to store this interaction
        const conversation = await storage.createConversation({
          userId,
          title,
          model,
          contextDocumentIds: null,
          metadata: null
        });
        
        // Add user message to conversation
        await storage.createMessage({
          conversationId: conversation.id,
          role: 'user',
          content,
          metadata: null,
          documentReferences: null
        });
        
        // Add AI response to conversation
        await storage.createMessage({
          conversationId: conversation.id,
          role: 'assistant',
          content: result,
          metadata: null,
          documentReferences: null
        });
        
        // Also save as document for backwards compatibility
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
      const processed = await processDocument(file);
      const extractedText = processed.text;
      
      // Save the document to the database
      const userId = 1; // Mock user ID for now
      
      // Generate a title based on the content or use filename
      const filename = file.originalname.split('.')[0];
      const title = filename || extractedText.slice(0, 50).replace(/\n/g, ' ') + (extractedText.length > 50 ? '...' : '');
      
      // Add AI detection information
      let excerpt = extractedText.slice(0, 150) + (extractedText.length > 150 ? '...' : '');
      let aiMetadata = {};
      
      if (processed.aiDetection) {
        // Add AI detection info to the document metadata
        aiMetadata = {
          aiProbability: processed.aiDetection.aiProbability,
          humanProbability: processed.aiDetection.humanProbability,
          averageProbability: processed.aiDetection.averageProbability
        };
        
        // Add AI detection notice to the excerpt if high probability
        if (processed.aiDetection.aiProbability > 0.7) {
          excerpt = `[AI CONTENT DETECTED - ${Math.round(processed.aiDetection.aiProbability * 100)}% probability] ` + excerpt;
        }
      }
      
      // Store the document
      await storage.createDocument({
        userId,
        title,
        content: extractedText,
        model: 'claude', // Default model for file uploads
        excerpt,
        date: new Date(),
        metadata: JSON.stringify(aiMetadata)
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
  
  // AI detection route for analyzing highlighted text
  app.post('/api/ai-detection', async (req: Request, res: Response) => {
    try {
      const { text } = req.body;
      
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ message: 'Text is required and must be a string' });
      }
      
      if (text.length < 100) {
        return res.status(400).json({ 
          message: 'Text is too short for accurate AI detection. Please provide at least 100 characters.' 
        });
      }
      
      console.log(`Running AI detection on text of length ${text.length}`);
      
      const result = await detectAIContent(text);
      
      if (result.error) {
        console.error('AI detection error:', result.error);
        return res.status(500).json({ message: result.error });
      }
      
      res.json(result);
    } catch (error) {
      console.error('Error in AI detection:', error);
      res.status(500).json({ 
        message: 'Failed to analyze text',
        error: error instanceof Error ? error.message : String(error)
      });
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

  // Conversation routes
  app.get('/api/conversations', async (req: Request, res: Response) => {
    try {
      const userId = 1; // Mock user ID for now
      const conversations = await storage.getConversationsByUserId(userId);
      console.log(`Fetched ${conversations.length} conversations for user`, conversations);
      res.json(conversations);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      res.status(500).json({ message: 'Failed to fetch conversations', error: (error as Error).message });
    }
  });

  app.post('/api/conversations', async (req: Request, res: Response) => {
    try {
      const { title, model, contextDocumentIds } = req.body;
      const userId = 1; // Mock user ID for now
      
      if (!title) {
        return res.status(400).json({ message: 'Title is required' });
      }
      
      const conversation = await storage.createConversation({
        userId,
        title,
        model: model || 'claude',
        contextDocumentIds: contextDocumentIds ? JSON.stringify(contextDocumentIds) : null,
        metadata: null
      });
      
      res.status(201).json(conversation);
    } catch (error) {
      console.error('Error creating conversation:', error);
      res.status(500).json({ message: 'Failed to create conversation', error: (error as Error).message });
    }
  });

  app.get('/api/conversations/:id', async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id);
      const conversation = await storage.getConversation(conversationId);
      
      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }
      
      res.json(conversation);
    } catch (error) {
      console.error('Error fetching conversation:', error);
      res.status(500).json({ message: 'Failed to fetch conversation', error: (error as Error).message });
    }
  });

  app.delete('/api/conversations/:id', async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id);
      const success = await storage.deleteConversation(conversationId);
      
      if (!success) {
        return res.status(404).json({ message: 'Conversation not found' });
      }
      
      res.json({ message: 'Conversation deleted successfully' });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      res.status(500).json({ message: 'Failed to delete conversation', error: (error as Error).message });
    }
  });

  app.get('/api/conversations/:id/messages', async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id);
      const messages = await storage.getMessagesByConversationId(conversationId);
      res.json(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ message: 'Failed to fetch messages', error: (error as Error).message });
    }
  });

  app.post('/api/conversations/:id/messages', async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { content, role } = req.body;
      
      if (!content) {
        return res.status(400).json({ message: 'Content is required' });
      }
      
      if (!role || (role !== 'user' && role !== 'assistant')) {
        return res.status(400).json({ message: 'Valid role is required (user or assistant)' });
      }
      
      const message = await storage.createMessage({
        conversationId,
        content,
        role,
        metadata: null,
        documentReferences: null
      });
      
      res.status(201).json(message);
    } catch (error) {
      console.error('Error creating message:', error);
      res.status(500).json({ message: 'Failed to create message', error: (error as Error).message });
    }
  });

  // Setup HTTP server and WebSocket
  const httpServer = createServer(app);
  
  // Setup WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // WebSocket connection handling
  wss.on('connection', (socket) => {
    console.log('Client connected to WebSocket');
    
    // Handle messages from client
    socket.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle different message types
        if (data.type === 'chat_message') {
          // Store user message
          const userMessage = await storage.createMessage({
            conversationId: data.conversationId,
            role: 'user',
            content: data.content,
            metadata: null,
            documentReferences: null
          });
          
          // Send confirmation to client
          if (socket.readyState === 1) { // WebSocket.OPEN
            socket.send(JSON.stringify({
              type: 'message_received',
              messageId: userMessage.id
            }));
          }
          
          // Process with the appropriate model
          let responseContent = '';
          
          // Get conversation to determine model and context
          const conversation = await storage.getConversation(data.conversationId);
          if (!conversation) {
            throw new Error('Conversation not found');
          }
          
          // Get previous messages for context
          const messages = await storage.getMessagesByConversationId(data.conversationId);
          
          // Format messages for LLM context
          const context = messages.map(msg => ({ role: msg.role, content: msg.content }));
          
          // Get referenced documents if any
          let documentContext = '';
          if (conversation.contextDocumentIds) {
            try {
              const docIds = JSON.parse(conversation.contextDocumentIds);
              for (const docId of docIds) {
                const doc = await storage.getDocument(docId);
                if (doc) {
                  documentContext += `Document: ${doc.title}\n\n${doc.content}\n\n`;
                }
              }
            } catch (error) {
              console.error('Error parsing contextDocumentIds:', error);
            }
          }
          
          // Add document context if available
          let systemMessage = null;
          if (documentContext) {
            systemMessage = {
              role: 'system',
              content: `You have access to the following document(s):\n\n${documentContext}\nPlease use this information to provide accurate answers.`
            };
          }
          
          // Process with model
          const model = conversation.model || 'claude';
          const streamMode = data.stream !== false;
          
          try {
            // Common options
            const options = {
              temperature: parseFloat(data.temperature) || 0.7,
              stream: streamMode,
              chunkSize: data.chunkSize || 'auto',
              maxTokens: parseInt(data.maxTokens) || 2048
            };
            
            // Add previous messages as context
            if (systemMessage) {
              options.previousMessages = [systemMessage, ...context];
            } else {
              options.previousMessages = context;
            }
            
            switch (model) {
              case 'claude':
                responseContent = await processClaude(data.content, options);
                break;
              case 'gpt4':
                responseContent = await processGPT4(data.content, options);
                break;
              case 'perplexity':
                responseContent = await processPerplexity(data.content, options);
                break;
              default:
                responseContent = await processClaude(data.content, options);
            }
          } catch (error) {
            console.error('LLM processing error:', error);
            responseContent = "I'm sorry, I encountered an error processing your request. Please try again.";
          }
          
          // Store assistant message
          const assistantMessage = await storage.createMessage({
            conversationId: data.conversationId,
            role: 'assistant',
            content: responseContent,
            metadata: null,
            documentReferences: null
          });
          
          // Send response to client
          if (socket.readyState === 1) { // WebSocket.OPEN
            socket.send(JSON.stringify({
              type: 'chat_response',
              messageId: assistantMessage.id,
              conversationId: data.conversationId,
              content: responseContent
            }));
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        if (socket.readyState === 1) { // WebSocket.OPEN
          socket.send(JSON.stringify({
            type: 'error',
            message: 'Failed to process message'
          }));
        }
      }
    });
    
    // Handle disconnection
    socket.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
  });

  return httpServer;
}
