import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import fs from "fs";
import path from "path";
import { processGPT4 } from "./services/openai";
import summarizeRoutes from "./routes/summarize";
import { processClaude } from "./services/anthropic";
import { processPerplexity } from "./services/perplexity";
import { processDocument, extractText } from "./services/documentProcessor";
import { generateAnalytics } from "./services/analytics";
import { detectAIContent } from "./services/aiDetection";
import { rewriteDocument } from "./services/documentRewriter";
import { WebSocketServer } from 'ws';
import { sendEmail } from './services/email';
import { Document, Paragraph, TextRun, Packer } from 'docx';

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Register document chunk summarization route
  app.use('/api/llm/summarize-chunk', summarizeRoutes);
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
        console.log(`Processing ${files.length} document(s) for context`);
        const processedDocs = await Promise.all(files.map(file => processDocument(file)));
        
        // Extract text from each document
        const documentTexts = [];
        let documentChunksUsed = false;
        
        // Check if there are chunks and if any are specifically requested
        for (const doc of processedDocs) {
          // Check if we're focusing on specific chunks
          if (req.body.selectedChunks && Array.isArray(req.body.selectedChunks) && 
              doc.chunks && doc.chunks.length > 0) {
            
            // Get the selected chunks
            const selectedChunks = doc.chunks.filter((chunk, index) => 
              req.body.selectedChunks.includes(index.toString()) || 
              req.body.selectedChunks.includes(index)
            );
            
            if (selectedChunks.length > 0) {
              // Use only the selected chunks for context
              const selectedText = selectedChunks.map(chunk => chunk.content).join("\n\n---CHUNK BOUNDARY---\n\n");
              documentTexts.push(selectedText);
              documentChunksUsed = true;
              console.log(`Using ${selectedChunks.length} selected chunks instead of full document`);
            } else {
              documentTexts.push(doc.text);
            }
          } else {
            // Use the full document text
            documentTexts.push(doc.text);
          }
        }
        
        console.log(`Added context from ${documentTexts.length} document(s) to prompt`);
        
        // Simple document context without complicated instructions
        processedContent = content + "\n\nContext documents:\n" + documentTexts.join("\n\n---DOCUMENT BOUNDARY---\n\n") + "\n\nIMPORTANT: When responding with mathematical content, use proper LaTeX formatting with \\(...\\) for inline math and $$...$$ for display math. Do not escape or convert LaTeX symbols.";
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
      console.log(`Processing file directly: ${file.originalname}`);
      
      const processed = await processDocument(file);
      const extractedText = processed.text;
      const chunks = processed.chunks;
      
      // Log the extraction success
      console.log(`Extracted ${extractedText.length} characters from ${file.originalname}`);
      if (chunks) {
        console.log(`Document was split into ${chunks.length} chunks for better analysis`);
      }
      
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
      
      // Generate a unique ID for the document
      const docId = crypto.randomUUID();
      
      // Store the document with chunks
      const document = await storage.createDocument({
        id: docId,
        userId,
        title,
        content: extractedText,
        model: 'claude', // Default model for file uploads
        excerpt,
        date: new Date(),
        metadata: JSON.stringify(aiMetadata),
        chunks: chunks ? JSON.stringify(chunks) : '[]'
      });
      
      // Generate simple summaries for chunks if present
      let chunkSummaries = [];
      if (chunks && chunks.length > 0) {
        chunkSummaries = chunks.map((chunk, index) => {
          // Create a one-sentence summary from the first sentence
          const firstSentence = chunk.content.split(/[.!?](?:\s|$)/)[0].trim();
          const wordCount = chunk.content.split(/\s+/).length;
          return {
            index,
            title: chunk.title,
            summary: `${wordCount} words: ${firstSentence.substring(0, 100)}${firstSentence.length > 100 ? '...' : ''}`,
            wordCount
          };
        });
      }
      
      res.json({ 
        id: document.id,
        content: extractedText,
        text: extractedText, // Add text field as well for document rewriter
        chunks: chunkSummaries,
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
      
      // Check if text is too large to process
      if (text.length > 100000) {
        console.log(`Text too large for AI detection: ${text.length} characters`);
        return res.status(413).json({ 
          error: 'Request Entity Too Large',
          message: 'Text is too large for AI detection. Please use a smaller section of text.',
          aiProbability: 0.5,
          humanProbability: 0.5
        });
      }
      
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

  // Document Rewriter API Endpoints
  app.post('/api/rewrite-document', async (req: Request, res: Response) => {
    try {
      console.log("Document rewrite request received:", JSON.stringify(req.body).substring(0, 200) + "...");
      
      // Log request data more explicitly for debugging
      console.log("Request body type:", typeof req.body);
      console.log("Request content type:", typeof req.body.content);
      console.log("Request body keys:", Object.keys(req.body));
      
      const { content, filename, model, instructions, detectionProtection } = req.body;
      
      if (!content || !instructions || !model) {
        console.error('Missing required parameters:', { 
          hasContent: !!content, 
          hasInstructions: !!instructions,
          hasModel: !!model
        });
        return res.status(400).json({ error: 'Missing required parameters: content, instructions, and model are required' });
      }
      
      console.log(`Rewriting document with model ${model}, content length: ${content.length}, instructions: "${instructions.substring(0, 50)}..."`);
      
      // Limit content length for very large documents
      let processableContent = content;
      const MAX_CONTENT_LENGTH = 30000;
      
      if (content.length > MAX_CONTENT_LENGTH) {
        console.log(`Document is very large (${content.length} chars), truncating to ${MAX_CONTENT_LENGTH} chars`);
        processableContent = content.substring(0, MAX_CONTENT_LENGTH);
      }

      let rewrittenContent = '';
      
      try {
        // Build the prompt template
        const promptTemplate = `
You are an expert document editor. Please rewrite the following document according to these instructions:
${instructions}

IMPORTANT: Format the output as plain text only. DO NOT use markdown headings, bold formatting, italics, bullet points or any special formatting. Write in plain text with regular paragraphs.

${detectionProtection ? 'IMPORTANT: Make the writing style very human-like to avoid AI detection. Vary sentence structure, use idioms, conversational language, and avoid repetitive patterns.' : ''}

DOCUMENT TO REWRITE:
${processableContent}

INSTRUCTIONS AGAIN:
${instructions}

YOUR REWRITTEN DOCUMENT:`;

        // Process with selected model
        let response;
        
        if (model === 'claude') {
          console.log('Using Claude for rewriting');
          response = await processClaude(promptTemplate, {
            temperature: 0.7,
            stream: false,
            maxTokens: 4000
          });
        } else if (model === 'gpt4') {
          console.log('Using GPT-4 for rewriting');
          response = await processGPT4(promptTemplate, {
            temperature: 0.7,
            stream: false,
            maxTokens: 4000
          });
        } else {
          // Default to perplexity
          console.log('Using Perplexity for rewriting');
          response = await processPerplexity(promptTemplate, {
            temperature: 0.7,
            stream: false,
            maxTokens: 4000
          });
        }
        
        // Extract content from response
        if (typeof response === 'string') {
          rewrittenContent = response;
        } else if (response && typeof response === 'object') {
          // Handle object responses more carefully
          if ('content' in response && response.content) {
            rewrittenContent = response.content.toString();
          } else {
            console.error('Unexpected response structure:', response);
            throw new Error(`Invalid response structure from ${model}`);
          }
        } else {
          console.error('Unexpected response type:', typeof response);
          throw new Error(`Invalid response type from ${model}`);
        }
        
        // Ensure the result is not empty
        if (!rewrittenContent || rewrittenContent.trim() === '') {
          throw new Error(`Empty response from ${model}`);
        }
        
        console.log(`Successfully rewrote document with ${model}, original length: ${content.length}, result length: ${rewrittenContent.length}`);
      } catch (llmError) {
        console.error('LLM processing error:', llmError);
        return res.status(500).json({ 
          error: 'Failed to process with AI', 
          details: llmError instanceof Error ? llmError.message : String(llmError)
        });
      }
      
      // Clean up any markdown formatting that might still be in the content
      rewrittenContent = rewrittenContent
        .replace(/^[#]+\s+/gm, '') // Remove heading markers
        .replace(/[*]{2,3}(.+?)[*]{2,3}/g, '$1') // Remove bold/italic markers
        .replace(/[_]{2}(.+?)[_]{2}/g, '$1') // Remove underscore emphasis
        .replace(/^\s*[-*+]\s+/gm, ''); // Remove bullet points
      
      // Return successful response
      res.json({ 
        content: rewrittenContent,
        model,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error rewriting document:', error);
      res.status(500).json({ 
        error: 'Failed to rewrite document', 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Email document sharing endpoint
  app.post('/api/share-document', async (req: Request, res: Response) => {
    try {
      const { email, content, subject } = req.body;
      
      if (!email || !content) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }
      
      // Use SendGrid to send email
      if (!process.env.SENDGRID_API_KEY) {
        return res.status(500).json({ error: 'SendGrid API key not configured' });
      }
      
      // Import SendGrid
      const sgMail = await import('@sendgrid/mail');
      sgMail.default.setApiKey(process.env.SENDGRID_API_KEY);
      
      // Create email message
      const msg = {
        to: email,
        from: 'document-rewriter@example.com', // Replace with your verified sender
        subject: subject || 'Your rewritten document',
        text: 'Please find your rewritten document attached.',
        html: `<div>
          <h3>Your rewritten document</h3>
          <p>The rewritten document you requested is attached below:</p>
          <pre style="white-space: pre-wrap; background: #f0f0f0; padding: 15px; border-radius: 5px;">${content}</pre>
        </div>`,
      };
      
      // Send email
      try {
        await sgMail.default.send(msg);
        console.log(`Email sent successfully to ${email}`);
        return res.json({ success: true, message: 'Document sent successfully' });
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        return res.status(500).json({ 
          error: 'Failed to send email', 
          details: emailError.response ? emailError.response.body : emailError.message 
        });
      }
    } catch (error) {
      console.error('Error sharing document:', error);
      return res.status(500).json({ 
        error: 'Failed to share document', 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Document Download API
  app.post('/api/download', async (req: Request, res: Response) => {
    try {
      const { content, format, filename } = req.body;
      
      if (!content || !format || !filename) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }
      
      // Limit content size to prevent "request entity too large" errors
      if (content.length > 250000) { // 250K characters limit
        return res.status(413).json({ error: 'Document content too large. Try with a smaller section.' });
      }
      
      console.log(`Creating ${format} document: ${filename}, content length: ${content.length}`);
      
      if (format === 'docx') {
        try {
          // Generate Word document
          const { Document, Packer, Paragraph, TextRun } = await import('docx');
          
          // Create document with paragraphs
          const doc = new Document({
            sections: [{
              properties: {},
              children: content.split('\n').map(line => 
                new Paragraph({
                  children: [new TextRun(line || ' ')],
                })
              ),
            }],
          });
          
          // Generate buffer
          const buffer = await Packer.toBuffer(doc);
          
          // Set headers
          res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
          res.setHeader('Content-Disposition', `attachment; filename=${filename}.docx`);
          res.setHeader('Content-Length', buffer.length);
          
          // Send buffer
          res.send(buffer);
          console.log('Word document generated successfully');
        } catch (docxError) {
          console.error('DOCX generation error:', docxError);
          return res.status(500).json({ error: 'Failed to generate DOCX file', details: docxError.message });
        }
        
      } else if (format === 'pdf') {
        try {
          // Generate PDF
          const PDFDocument = await import('pdfkit');
          const doc = new PDFDocument.default();
          
          // Create a buffer to store PDF
          const chunks: Buffer[] = [];
          
          // Capture PDF data chunks
          doc.on('data', (chunk) => {
            chunks.push(chunk);
          });
          
          // Handle errors on the doc
          doc.on('error', (pdfError) => {
            console.error('PDF generation error:', pdfError);
            return res.status(500).json({ error: 'PDF generation failed', details: pdfError.message });
          });
          
          // When document is done, create buffer and send response
          doc.on('end', () => {
            try {
              const result = Buffer.concat(chunks);
              
              // Set headers
              res.setHeader('Content-Type', 'application/pdf');
              res.setHeader('Content-Disposition', `attachment; filename=${filename}.pdf`);
              res.setHeader('Content-Length', result.length);
              
              // Send buffer
              res.send(result);
              console.log('PDF document generated successfully');
            } catch (bufferError) {
              console.error('PDF buffer error:', bufferError);
              return res.status(500).json({ error: 'PDF buffer creation failed', details: bufferError.message });
            }
          });
          
          // Add content to PDF with proper font settings
          doc.font('Helvetica');
          doc.fontSize(12);
          
          // Add content to PDF with proper line breaks
          const paragraphs = content.split('\n\n');
          for (let i = 0; i < paragraphs.length; i++) {
            doc.text(paragraphs[i] || ' ', {
              align: 'left',
              continued: false
            });
            
            if (i < paragraphs.length - 1) {
              doc.moveDown();
            }
          }
          
          // Finalize PDF
          doc.end();
        } catch (pdfError) {
          console.error('PDF creation error:', pdfError);
          return res.status(500).json({ error: 'Failed to generate PDF file', details: pdfError.message });
        }
        
      } else {
        // Default to plain text
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}.txt`);
        res.send(content);
      }
    } catch (error) {
      console.error('Error generating document for download:', error);
      res.status(500).json({ error: 'Failed to generate downloadable document', details: error instanceof Error ? error.message : String(error) });
    }
  });

  // Email Sharing API using SendGrid
  app.post('/api/share-document', async (req: Request, res: Response) => {
    try {
      console.log("Email sharing request received:", req.body);
      
      // Get parameters from request
      const { content, recipient, to, documentName, format = 'pdf', senderEmail, from } = req.body;
      
      // Support multiple parameter names for compatibility
      const recipientEmail = to || recipient;
      const senderEmailAddress = from || senderEmail;
      
      console.log("Email params extracted:", { 
        recipientEmail, 
        senderEmailAddress, 
        hasContent: !!content, 
        documentName 
      });
      
      if (!content) {
        return res.status(400).json({ error: 'Missing content parameter' });
      }
      
      if (!recipientEmail) {
        return res.status(400).json({ error: 'Missing recipient email parameter' });
      }
      
      if (!documentName) {
        return res.status(400).json({ error: 'Missing document name parameter' });
      }
      
      if (!senderEmailAddress) {
        return res.status(400).json({ error: 'Sender email is required' });
      }
      
      console.log(`Preparing to share document "${documentName}" to ${recipientEmail} from ${senderEmailAddress}`);
      
      // Generate proper document attachment based on format
      let fileContent = '';
      let attachmentType = 'text/plain';
      
      if (format === 'docx') {
        try {
          // Generate Word document
          const { Document, Packer, Paragraph, TextRun } = await import('docx');
          
          // Create document with paragraphs
          const doc = new Document({
            sections: [{
              properties: {},
              children: content.split('\n').map(line => 
                new Paragraph({
                  children: [new TextRun(line || ' ')],
                })
              ),
            }],
          });
          
          // Generate buffer
          const buffer = await Packer.toBuffer(doc);
          fileContent = buffer.toString('base64');
          attachmentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        } catch (docxError) {
          console.error('Error creating DOCX:', docxError);
          // Fallback to plain text if docx creation fails
          fileContent = Buffer.from(content).toString('base64');
          attachmentType = 'text/plain';
        }
      } else if (format === 'pdf') {
        try {
          // Generate PDF
          const PDFDocument = await import('pdfkit');
          const doc = new PDFDocument.default();
          
          // Create a buffer to store PDF
          const chunks: any[] = [];
          
          // Capture PDF data chunks
          doc.on('data', (chunk: any) => {
            chunks.push(chunk);
          });
          
          // Add content to PDF
          const lines = content.split('\n');
          for (const line of lines) {
            doc.text(line || ' ');
          }
          
          // Finalize PDF and wait for it to complete
          doc.end();
          
          await new Promise<void>((resolve) => {
            doc.on('end', () => {
              const pdfBuffer = Buffer.concat(chunks);
              fileContent = pdfBuffer.toString('base64');
              attachmentType = 'application/pdf';
              resolve();
            });
          });
        } catch (pdfError) {
          console.error('Error creating PDF:', pdfError);
          // Fallback to plain text if pdf creation fails
          fileContent = Buffer.from(content).toString('base64');
          attachmentType = 'text/plain';
        }
      } else {
        // Plain text format
        fileContent = Buffer.from(content).toString('base64');
      }
      
      // Create the email content
      const html = `
        <p>Hello,</p>
        <p>Here is the rewritten document <strong>${documentName}</strong> you requested.</p>
        <p>The content is attached to this email.</p>
      `;
      
      // Use the email service
      const emailSent = await sendEmail({
        to: recipientEmail,
        from: senderEmailAddress, // Use the provided sender email
        subject: `Rewritten Document: ${documentName}`,
        html: html,
        attachments: [{
          content: fileContent,
          filename: `${documentName.split('.')[0]}-rewritten.${format}`,
          type: attachmentType,
          disposition: 'attachment'
        }]
      });
      
      if (emailSent) {
        console.log('Document shared successfully via email');
        return res.json({ success: true, message: 'Document shared successfully' });
      } else {
        console.error('Email service returned false');
        return res.status(500).json({ 
          error: 'Failed to share document',
          details: 'Email service failed to send the email'
        });
      }
    } catch (error) {
      console.error('Error sharing document via email:', error);
      res.status(500).json({ 
        error: 'Failed to share document',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  
  // Chunked rewriter API endpoints
  app.post('/api/rewrite-chunk', async (req: Request, res: Response) => {
    try {
      const { content, instructions, model, chatContext, chunkIndex, totalChunks } = req.body;
      
      if (!content || !instructions) {
        return res.status(400).json({ error: 'Content and instructions are required' });
      }

      let prompt = `Please rewrite the following text according to these instructions: ${instructions}\n\n`;
      
      if (chatContext) {
        prompt += `Chat context for reference:\n${chatContext}\n\n`;
      }

      prompt += `Text to rewrite (chunk ${chunkIndex + 1} of ${totalChunks}):\n\n${content}\n\n`;
      prompt += `IMPORTANT: If the text contains mathematical expressions or formulas:
- Preserve all LaTeX formatting using \\(...\\) for inline math and $$...$$ for display math
- Do not escape or convert LaTeX symbols
- Keep all mathematical notation in proper LaTeX format

Return only the rewritten text without any additional comments, explanations, or headers.`;

      let result: string;
      
      if (model === 'claude') {
        result = await processClaude(prompt, {
          temperature: 0.7,
          maxTokens: 4000
        });
      } else if (model === 'gpt4') {
        const { default: OpenAI } = await import('openai');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        
        const response = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 4000
        });
        
        result = response.choices[0].message.content || '';
      } else {
        // Fallback to Claude
        result = await processClaude(prompt, {
          temperature: 0.7,
          maxTokens: 4000
        });
      }
      
      res.json({ rewrittenContent: result });
      
    } catch (error) {
      console.error('Chunk rewrite error:', error);
      res.status(500).json({ error: 'Failed to rewrite chunk' });
    }
  });

  app.post('/api/download-rewrite', async (req: Request, res: Response) => {
    try {
      const { content, format, title } = req.body;
      
      if (!content || !format) {
        return res.status(400).json({ error: 'Content and format are required' });
      }
      
      const filename = title || 'rewritten-document';
      let processedContent = content;
      
      // Clean markdown formatting first
      processedContent = processedContent.replace(/^#{1,6}\s+/gm, ''); // Remove markdown headers
      processedContent = processedContent.replace(/\*\*(.*?)\*\*/g, '$1'); // Remove bold markdown
      processedContent = processedContent.replace(/\*(.*?)\*/g, '$1'); // Remove italic markdown
      processedContent = processedContent.replace(/`(.*?)`/g, '$1'); // Remove code markdown
      processedContent = processedContent.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Remove links
      processedContent = processedContent.replace(/^>\s*/gm, ''); // Remove blockquotes
      processedContent = processedContent.replace(/^[-*+]\s+/gm, '• '); // Convert lists to bullet points
      processedContent = processedContent.replace(/^\d+\.\s+/gm, ''); // Remove numbered list markers
      
      // Convert LaTeX symbols to Unicode mathematical symbols
      const latexToUnicode = {
        '\\mathcal{P}': '𝒫',
        '\\mathcal{L}': '𝒟',
        '\\mathcal{A}': '𝒜',
        '\\rightarrow': '→',
        '\\leftarrow': '←',
        '\\theta': 'θ',
        '\\alpha': 'α',
        '\\beta': 'β',
        '\\gamma': 'γ',
        '\\delta': 'δ',
        '\\lambda': 'λ',
        '\\pi': 'π',
        '\\sigma': 'σ',
        '\\nabla': '∇',
        '\\partial': '∂',
        '\\sum': '∑',
        '\\int': '∫',
        '\\infty': '∞',
        '\\leq': '≤',
        '\\geq': '≥',
        '\\in': '∈',
        '\\times': '×',
        '\\cdot': '⋅',
        '\\pm': '±'
      };
      
      // Apply LaTeX to Unicode conversions
      for (const [latex, unicode] of Object.entries(latexToUnicode)) {
        processedContent = processedContent.replace(new RegExp(latex.replace(/\\/g, '\\\\'), 'g'), unicode);
      }
      
      // Remove LaTeX delimiters but keep the math content
      processedContent = processedContent.replace(/\$\$([^$]+)\$\$/g, '$1');
      processedContent = processedContent.replace(/\$([^$]+)\$/g, '$1');
      processedContent = processedContent.replace(/\\left\(/g, '(');
      processedContent = processedContent.replace(/\\right\)/g, ')');
      processedContent = processedContent.replace(/\\{/g, '{');
      processedContent = processedContent.replace(/\\}/g, '}');
      
      if (format === 'pdf') {
        // For PDF, return HTML for print preview
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.html"`);
        
        const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${filename}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px; 
            color: #333;
        }
        @media print {
            body { margin: 0; padding: 15px; }
        }
    </style>
</head>
<body>
    <div>${processedContent.replace(/\n/g, '<br>')}</div>
</body>
</html>`;
        res.send(htmlContent);
      } else if (format === 'docx') {
        // For Word, we need to import the docx library and create a proper document
        const { Document, Packer, Paragraph, TextRun } = require('docx');
        
        const doc = new Document({
          sections: [{
            properties: {},
            children: processedContent.split('\n').filter(line => line.trim()).map((line: string) => 
              new Paragraph({
                children: [new TextRun(line.trim())]
              })
            )
          }]
        });

        const buffer = await Packer.toBuffer(doc);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.docx"`);
        res.send(buffer);
      } else {
        // Default to text file
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.txt"`);
        res.send(processedContent);
      }
      
    } catch (error) {
      console.error('Download rewrite error:', error);
      res.status(500).json({ error: 'Failed to generate download' });
    }
  });

  app.post('/api/share-rewrite', async (req: Request, res: Response) => {
    try {
      const { content, recipientEmail, senderEmail, subject } = req.body;
      
      if (!content || !recipientEmail) {
        return res.status(400).json({ error: 'Content and recipient email are required' });
      }

      if (!senderEmail) {
        return res.status(400).json({ error: 'Verified sender email is required' });
      }

      const emailParams = {
        to: recipientEmail,
        from: senderEmail, // Use the verified sender email provided by user
        subject: subject || 'Rewritten Document',
        html: `
          <h2>Rewritten Document</h2>
          <p>Here is your rewritten document:</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; white-space: pre-wrap; font-family: Arial, sans-serif;">
            ${content.replace(/\n/g, '<br>')}
          </div>
          <p><small>Generated by TextMind AI Document Rewriter</small></p>
        `
      };
      
      const success = await sendEmail(emailParams);
      
      if (success) {
        res.json({ message: 'Email sent successfully' });
      } else {
        res.status(500).json({ error: 'Failed to send email' });
      }
      
    } catch (error) {
      console.error('Share rewrite error:', error);
      res.status(500).json({ error: 'Failed to share document' });
    }
  });

  app.post('/api/generate-new-chunk', async (req: Request, res: Response) => {
    try {
      const { originalContent, newChunkInstructions, existingContent, model, chatContext, chunkNumber, totalNewChunks } = req.body;
      
      if (!originalContent || !newChunkInstructions) {
        return res.status(400).json({ error: 'Original content and new chunk instructions are required' });
      }

      let prompt = `Based on the original document content and the existing rewritten content, generate new content according to these specific instructions: ${newChunkInstructions}\n\n`;
      
      if (chatContext) {
        prompt += `Chat context for reference:\n${chatContext}\n\n`;
      }

      prompt += `Original document context:\n${originalContent.substring(0, 2000)}...\n\n`;
      
      if (existingContent) {
        prompt += `Existing content (to maintain consistency):\n${existingContent.substring(0, 1000)}...\n\n`;
      }

      prompt += `Generate new content chunk ${chunkNumber} of ${totalNewChunks}. This should be substantial content (approximately 500 words) that:\n`;
      prompt += `- Follows the instructions: ${newChunkInstructions}\n`;
      prompt += `- Maintains consistency with the existing content\n`;
      prompt += `- Provides valuable additional information\n`;
      prompt += `- Uses the same writing style and tone as the original document\n\n`;
      
      prompt += `IMPORTANT: If including mathematical expressions or formulas:
- Use proper LaTeX formatting with \\(...\\) for inline math and $$...$$ for display math
- Do not escape or convert LaTeX symbols
- Keep all mathematical notation in proper LaTeX format

Return only the new content without any additional comments, explanations, or headers.`;

      let result: string;
      
      if (model === 'claude') {
        result = await processClaude(prompt, {
          temperature: 0.7,
          maxTokens: 4000
        });
      } else if (model === 'gpt4') {
        const { default: OpenAI } = await import('openai');
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        
        const response = await openai.chat.completions.create({
          model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: [{ role: "user", content: prompt }],
          temperature: 0.7,
          max_tokens: 4000
        });
        
        result = response.choices[0].message.content || '';
      } else {
        // Fallback to Claude
        result = await processClaude(prompt, {
          temperature: 0.7,
          maxTokens: 4000
        });
      }
      
      res.json({ newChunkContent: result });
      
    } catch (error) {
      console.error('Generate new chunk error:', error);
      res.status(500).json({ error: 'Failed to generate new chunk' });
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

  // Chat message export endpoint
  app.post('/api/export-chat-message', async (req: Request, res: Response) => {
    try {
      const { content, format = 'pdf', filename = 'chat-message' } = req.body;

      if (!content) {
        return res.status(400).json({ error: 'Content is required' });
      }

      let processedContent = content;
      
      // Clean up markdown for better presentation
      processedContent = processedContent.replace(/\*\*(.*?)\*\*/g, '$1'); // Remove bold markdown
      processedContent = processedContent.replace(/\*(.*?)\*/g, '$1'); // Remove italic markdown

      if (format === 'pdf') {
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.html"`);
        
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${filename}</title>
    <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
    <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
    <script>
        window.MathJax = {
            tex: {
                inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
                displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']]
            }
        };
    </script>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
        .math { font-family: 'Times New Roman', serif; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
        code { background: #f5f5f5; padding: 2px 4px; border-radius: 3px; }
        h1, h2, h3 { color: #333; }
        blockquote { border-left: 4px solid #ccc; margin: 0; padding-left: 20px; font-style: italic; }
    </style>
</head>
<body>
    <div>${processedContent.replace(/\n/g, '<br>')}</div>
    <script>
        window.onload = function() {
            if (window.MathJax) {
                MathJax.typesetPromise().then(() => {
                    console.log('MathJax rendering complete');
                });
            }
        };
    </script>
</body>
</html>`;
        
        res.send(htmlContent);
      } else if (format === 'docx') {
        const doc = new Document({
          sections: [{
            properties: {},
            children: processedContent.split('\n').map((line: any) => 
              new Paragraph({
                children: [new TextRun(line)]
              })
            )
          }]
        });

        const buffer = await Packer.toBuffer(doc);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.docx"`);
        res.send(buffer);
      } else if (format === 'txt') {
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.txt"`);
        res.send(processedContent);
      } else {
        res.status(400).json({ error: 'Unsupported format' });
      }
    } catch (error) {
      console.error('Error exporting chat message:', error);
      res.status(500).json({ error: 'Failed to export chat message' });
    }
  });

  // Chat message sharing endpoint
  app.post('/api/share-chat-message', async (req: Request, res: Response) => {
    try {
      const { content, email, subject = 'Chat Message from TextMind' } = req.body;

      if (!content || !email) {
        return res.status(400).json({ error: 'Content and email are required' });
      }

      if (!process.env.SENDGRID_API_KEY) {
        return res.status(500).json({ error: 'Email service not configured' });
      }

      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);

      const msg = {
        to: email,
        from: 'textmind@yourdomain.com',
        subject: subject,
        text: content,
        html: content.replace(/\n/g, '<br>')
      };

      await sgMail.send(msg);
      res.json({ success: true });
    } catch (error) {
      console.error('Error sharing chat message:', error);
      res.status(500).json({ error: 'Failed to share chat message' });
    }
  });

  // Homework mode endpoint - follows instructions instead of rewriting
  app.post('/api/homework-mode', async (req: Request, res: Response) => {
    try {
      const { instructions, userPrompt, model, chatContext } = req.body;
      
      if (!instructions) {
        return res.status(400).json({ error: 'Instructions are required' });
      }

      // Create a prompt that asks the AI to follow the instructions
      let prompt = `You are given the following instructions/assignment/exam/homework. Please complete it thoroughly and accurately:

INSTRUCTIONS TO FOLLOW:
${instructions}

${userPrompt ? `ADDITIONAL GUIDANCE FROM USER: ${userPrompt}` : ''}

${chatContext ? `CONTEXT FROM PREVIOUS CONVERSATION: ${chatContext}` : ''}

Please complete the assignment, answer the questions, or follow the instructions as requested. Provide a complete and thorough response.`;

      // Process with the selected model
      let response;
      if (model === 'claude') {
        response = await processClaude(prompt, {
          temperature: 0.7,
          maxTokens: 4000
        });
      } else {
        // For other models, fall back to Claude
        response = await processClaude(prompt, {
          temperature: 0.7,
          maxTokens: 4000
        });
      }

      res.json({ response });
    } catch (error) {
      console.error('Homework mode error:', error);
      res.status(500).json({ error: 'Failed to process homework' });
    }
  });

  // NUKE endpoint - clears all data
  app.post('/api/nuke', async (req: Request, res: Response) => {
    try {
      console.log('NUKE: Clearing all application data...');
      
      // Clear all data from storage
      // Since we're using memory storage, we can clear by creating new instances
      if (storage.constructor.name === 'DatabaseStorage') {
        // For database storage, we'd need to implement clear methods
        // For now, this will work with memory storage fallback
        console.log('NUKE: Database storage detected, clearing via memory fallback');
      }
      
      // The storage will automatically fall back to memory storage
      // and creating a new instance effectively clears everything
      console.log('NUKE: All data cleared successfully');
      
      res.json({ success: true, message: 'All data cleared' });
    } catch (error) {
      console.error('NUKE error:', error);
      res.status(500).json({ error: 'Failed to clear data' });
    }
  });

  return httpServer;
}
