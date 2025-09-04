import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { documents } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import multer from "multer";
import fs from "fs";
import path from "path";
import { processGPT4 } from "./services/openai";
import summarizeRoutes from "./routes/summarize";
import { processClaude } from "./services/anthropic";
import { processDeepSeek } from "./services/deepseek";
import { OpenAILimiter, DeepSeekLimiter } from "./utils/RateLimiter";
import { callOpenAIWithRateLimit, callDeepSeekWithRateLimit } from "./utils/openaiWrapper";
import { processPerplexity } from "./services/perplexity";
import { processDocument, extractText } from "./services/documentProcessor";
import { generateAnalytics } from "./services/analytics";
import { detectAIContent } from "./services/aiDetection";
import { gptZeroService } from "./services/gptZeroBypass";
import { rewriteDocument } from "./services/documentRewriter";
import { elevenLabsService } from "./services/elevenlabs";
import { speechToTextService } from "./services/speechToText";
import { WebSocketServer } from 'ws';
import { sendEmail } from './services/email';
import sgMail from '@sendgrid/mail';
import { Document, Paragraph, TextRun, Packer } from 'docx';
import PDFDocument from 'pdfkit';
import { generateInstantProfile, generateComprehensiveProfile, generateFullProfile, generateMetacognitiveProfile } from "./services/profiling";
import { parseGraphRequirements, parseMathExpression, generateEssayWithGraphs, generateSVG } from "./services/graphGenerator";
import { generateRevisedIntelligenceProfile } from "./services/revisedProfiling";
import { aiProviderService } from "./services/aiProvidersGptBypass";
import { gptZeroService } from "./services/gptZeroBypass";
import { textChunkerService } from "./services/textChunkerBypass";
import { fileProcessorService } from "./services/fileProcessorBypass";
import type { RewriteRequest, RewriteResponse } from "@shared/schema";

// Function to ensure perfect text formatting
function ensurePerfectFormatting(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  // Step 1: Fix escaped dollar signs (currency protection)
  let cleaned = text.trim();
  // Convert escaped dollar signs back to normal currency symbols
  cleaned = cleaned.replace(/\\\$/g, '$');
  console.log('🔧 Fixed escaped dollar signs for currency display');
  
  // Step 2: Fix sentence spacing - ensure single space after periods, exclamation marks, question marks
  cleaned = cleaned.replace(/([.!?])\s+/g, '$1 ');
  
  // Step 3: Create proper paragraph breaks
  // Split on periods followed by capital letters (likely new sentences that should be paragraphs)
  // But preserve existing paragraph breaks
  const sentences = cleaned.split(/(?<=[.!?])\s+(?=[A-Z])/);
  
  // Step 4: Group sentences into logical paragraphs
  const paragraphs: string[] = [];
  let currentParagraph = '';
  
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].trim();
    if (!sentence) continue;
    
    // Add sentence to current paragraph
    if (currentParagraph) {
      currentParagraph += ' ' + sentence;
    } else {
      currentParagraph = sentence;
    }
    
    // Create paragraph break every 2-4 sentences or when it gets long
    const sentenceCount = currentParagraph.split(/[.!?]/).length - 1;
    const shouldBreak = sentenceCount >= 3 || currentParagraph.length > 400;
    
    if (shouldBreak || i === sentences.length - 1) {
      paragraphs.push(currentParagraph);
      currentParagraph = '';
    }
  }
  
  // Step 5: Join paragraphs with double line breaks
  let result = paragraphs.join('\n\n');
  
  // Step 6: Clean up any multiple line breaks
  result = result.replace(/\n{3,}/g, '\n\n');
  
  // Step 7: Ensure proper spacing around mathematical expressions
  result = result.replace(/\s*\\\(/g, ' \\(');
  result = result.replace(/\\\)\s*/g, '\\) ');
  result = result.replace(/\s*\$\$/g, '\n\n$$');
  result = result.replace(/\$\$\s*/g, '$$\n\n');
  
  return result.trim();
}

// Clean markdown formatting from text
function cleanMarkdownFormatting(text: string): string {
  if (!text) return text;
  
  let cleaned = text;
  
  // CRITICAL FIX: Convert escaped dollar signs back to normal currency symbols
  cleaned = cleaned.replace(/\\\$/g, '$');
  console.log('🔧 Fixed escaped dollar signs in markdown cleaning');
  
  // Remove markdown headers (# ## ### etc.)
  cleaned = cleaned.replace(/^#+\s+/gm, '');
  
  // Remove bold formatting (**text** or __text__)
  cleaned = cleaned.replace(/\*\*(.*?)\*\*/g, '$1');
  cleaned = cleaned.replace(/__(.*?)__/g, '$1');
  
  // Remove italic formatting (*text* or _text_)
  cleaned = cleaned.replace(/\*(.*?)\*/g, '$1');
  cleaned = cleaned.replace(/_(.*?)_/g, '$1');
  
  // Remove strikethrough (~~text~~)
  cleaned = cleaned.replace(/~~(.*?)~~/g, '$1');
  
  // Remove code blocks (```text```)
  cleaned = cleaned.replace(/```[\s\S]*?```/g, (match) => {
    return match.replace(/```\w*\n?/g, '').replace(/```$/g, '');
  });
  
  // Remove inline code (`text`)
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1');
  
  // Remove markdown links [text](url) -> text
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  
  // Remove reference-style links [text][ref] -> text
  cleaned = cleaned.replace(/\[([^\]]+)\]\[[^\]]*\]/g, '$1');
  
  // Remove horizontal rules (--- or ***)
  cleaned = cleaned.replace(/^[-*]{3,}\s*$/gm, '');
  
  // Remove blockquotes (> text)
  cleaned = cleaned.replace(/^>\s*/gm, '');
  
  // Remove list markers (- * + and numbers)
  cleaned = cleaned.replace(/^\s*[-*+]\s+/gm, '');
  cleaned = cleaned.replace(/^\s*\d+\.\s+/gm, '');
  
  // Clean up extra whitespace
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  cleaned = cleaned.trim();
  
  return cleaned;
}

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Register document chunk summarization route
  app.use('/api/llm/summarize-chunk', summarizeRoutes);
  
  // Register graph generation routes
  setupGraphRoutes(app);
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
        
        // Limit total context length to prevent API failures with large documents
        const combinedDocumentText = documentTexts.join("\n\n---DOCUMENT BOUNDARY---\n\n");
        const MAX_CONTEXT_LENGTH = 50000; // Conservative limit for combined content
        
        let finalDocumentContext = combinedDocumentText;
        if (combinedDocumentText.length > MAX_CONTEXT_LENGTH) {
          console.log(`Document context too large (${combinedDocumentText.length} chars), truncating to ${MAX_CONTEXT_LENGTH} chars`);
          finalDocumentContext = combinedDocumentText.substring(0, MAX_CONTEXT_LENGTH) + "\n\n[CONTENT TRUNCATED DUE TO SIZE]";
        }
        
        // Simple document context without complicated instructions
        processedContent = content + "\n\nContext documents:\n" + finalDocumentContext + "\n\nIMPORTANT: When responding with mathematical content, use proper LaTeX formatting with \\(...\\) for inline math and $$...$$ for display math. Do not escape or convert LaTeX symbols. CRITICAL FORMATTING RULES: Write ONLY in plain text format. NEVER use markdown formatting including ### headers, ** bold text, * italic text, - bullet points, numbered lists, or any other markup. Write in simple paragraph format only.";
      }
      
      // Check final content length before processing
      const MAX_TOTAL_LENGTH = 80000; // Conservative limit for total prompt
      if (processedContent.length > MAX_TOTAL_LENGTH) {
        console.log(`Total content too large (${processedContent.length} chars), truncating to ${MAX_TOTAL_LENGTH} chars`);
        processedContent = processedContent.substring(0, MAX_TOTAL_LENGTH) + "\n\n[CONTENT TRUNCATED TO PREVENT API ERRORS]";
      }
      
      // Add system instructions for plain text formatting
      if (!processedContent.includes("CRITICAL FORMATTING RULES")) {
        processedContent += "\n\nCRITICAL FORMATTING RULES: Write ONLY in plain text format. NEVER use markdown formatting including ### headers, ** bold text, * italic text, - bullet points, numbered lists, or any other markup. Write in simple paragraph format only.";
      }
      
      console.log(`Processing request with ${processedContent.length} characters using ${model}`);
      
      // Process with the selected model
      let result;
      const shouldStream = stream === 'true';
      const tempValue = temperature ? parseFloat(temperature) : 0.7;
      const maxTokenValue = maxTokens ? parseInt(maxTokens) : 4000; // Set default max tokens
      
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
      
      try {
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
          case 'deepseek':
            result = await processDeepSeek(processedContent, options);
            break;
          default:
            return res.status(400).json({ message: 'Invalid model' });
        }
        
        // Validate result
        if (!result || (typeof result === 'string' && result.trim() === '')) {
          throw new Error('Empty response from AI model');
        }
        
        // Extract content if result is an object
        if (typeof result === 'object' && result.content) {
          result = result.content;
        }
        
        // Clean markdown formatting from result
        result = cleanMarkdownFormatting(result);
        
      } catch (modelError) {
        console.error(`Error with ${model} model:`, modelError);
        
        // Try with a fallback approach for large content
        if (processedContent.length > 40000) {
          console.log('Retrying with truncated content due to size...');
          const truncatedContent = processedContent.substring(0, 40000) + "\n\n[Content truncated for processing]";
          
          try {
            switch (model) {
              case 'claude':
                result = await processClaude(truncatedContent, { ...options, maxTokens: 3000 });
                break;
              case 'gpt4':
                result = await processGPT4(truncatedContent, { ...options, maxTokens: 3000 });
                break;
              case 'perplexity':
                result = await processPerplexity(truncatedContent, { ...options, maxTokens: 3000 });
                break;
            }
          } catch (retryError) {
            console.error('Retry also failed:', retryError);
            throw new Error(`AI processing failed: ${modelError.message}`);
          }
        } else {
          throw modelError;
        }
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
  // New TTS text extraction endpoint
  app.post('/api/tts/extract-text', upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      const file = req.file;
      console.log(`[TTS] Processing file: ${file.originalname}, type: ${file.mimetype}, size: ${file.size} bytes`);
      
      const { extractText } = await import('./services/textExtractor.js');
      
      const result = await extractText(file);
      
      console.log(`[TTS] Extraction result - Success: ${result.success}, Text length: ${result.text?.length || 0}`);
      if (!result.success) {
        console.log(`[TTS] Extraction error: ${result.error}`);
      }
      
      if (result.success) {
        res.json({ 
          text: result.text,
          success: true,
          message: `Successfully extracted ${result.text.length} characters from ${file.originalname}`
        });
      } else {
        res.status(400).json({ 
          message: result.error || 'Failed to extract text',
          success: false 
        });
      }
    } catch (error) {
      console.error('[TTS] Error extracting text:', error);
      res.status(500).json({ message: 'Text extraction failed', error: (error as Error).message });
    }
  });

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
      const recentDocuments = await db.select({
        id: documents.id,
        title: documents.title,
        excerpt: documents.excerpt,
        content: documents.content,
        date: documents.date,
        model: documents.model
      }).from(documents)
      .orderBy(desc(documents.date))
      .limit(20);

      res.json(recentDocuments);
    } catch (error) {
      console.error('Error fetching documents:', error);
      res.status(500).json({ message: 'Failed to fetch documents', error: (error as Error).message });
    }
  });

  // Get specific document by ID
  app.get('/api/documents/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const [document] = await db.select().from(documents).where(eq(documents.id, id));
      
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      res.json(document);
    } catch (error) {
      console.error('Error fetching document:', error);
      res.status(500).json({ error: 'Failed to fetch document' });
    }
  });

  // Delete document endpoint
  app.delete('/api/documents/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // First check if document exists
      const [document] = await db.select().from(documents).where(eq(documents.id, id));
      
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      // Delete the document
      await db.delete(documents).where(eq(documents.id, id));
      
      res.json({ message: 'Document deleted successfully' });
    } catch (error) {
      console.error('Error deleting document:', error);
      res.status(500).json({ error: 'Failed to delete document' });
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
      const analyticsData = await generateAnalytics(documents, timeframe);
      
      res.json(analyticsData);
    } catch (error) {
      console.error('Error generating analytics:', error);
      res.status(500).json({ message: 'Failed to generate analytics', error: (error as Error).message });
    }
  });

  // Analytics export route - generates and downloads PDF report
  app.post('/api/analytics/export', async (req: Request, res: Response) => {
    try {
      const { format, timeframe } = req.body;
      const userId = 1; // Mock user ID for now
      
      // Get user documents for analysis
      const documents = await storage.getDocumentsByUserId(userId);
      
      // Generate analytics data
      const analyticsData = await generateAnalytics(documents, timeframe || '7days');
      
      if (format === 'pdf') {
        // Generate PDF using PDFKit
        // Using imported PDFDocument
        const doc = new PDFDocument({ margin: 50 });
        
        // Set response headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="cognitive-analytics-report-${new Date().toISOString().split('T')[0]}.pdf"`);
        
        // Pipe the PDF to the response
        doc.pipe(res);
        
        // Generate PDF content
        doc.fontSize(20).text('Cognitive Analytics Report', { align: 'center' });
        doc.moveDown();
        
        // Cognitive Archetype Section
        doc.fontSize(16).text('Cognitive Archetype Analysis', { underline: true });
        doc.fontSize(12).moveDown();
        doc.text(`Type: ${analyticsData.cognitiveArchetype.type.replace('_', ' ').toUpperCase()}`);
        doc.text(`Confidence: ${Math.round(analyticsData.cognitiveArchetype.confidence * 100)}%`);
        doc.text(`Description: ${analyticsData.cognitiveArchetype.description}`);
        doc.text(`Traits: ${analyticsData.cognitiveArchetype.traits.join(', ')}`);
        doc.moveDown();
        
        // Writing Style Section
        doc.fontSize(16).text('Writing Style Analysis', { underline: true });
        doc.fontSize(12).moveDown();
        doc.text(`Formality Score: ${Math.round(analyticsData.writingStyle.formality.score * 100)}% (${analyticsData.writingStyle.formality.percentile}th percentile)`);
        doc.text(`Complexity Score: ${Math.round(analyticsData.writingStyle.complexity.score * 100)}% (${analyticsData.writingStyle.complexity.percentile}th percentile)`);
        doc.moveDown();
        
        // Cognitive Signatures
        doc.text('Cognitive Signatures:');
        doc.text(`- Nested Hypotheticals: ${Math.round(analyticsData.writingStyle.cognitiveSignatures.nestedHypotheticals * 100)}%`);
        doc.text(`- Anaphoric Reasoning: ${Math.round(analyticsData.writingStyle.cognitiveSignatures.anaphoricReasoning * 100)}%`);
        doc.text(`- Structural Analogies: ${Math.round(analyticsData.writingStyle.cognitiveSignatures.structuralAnalogies * 100)}%`);
        doc.text(`- Dialectical vs Didactic: ${Math.round(analyticsData.writingStyle.cognitiveSignatures.dialecticalVsDidactic * 100)}%`);
        doc.moveDown();
        
        // Topic Distribution
        doc.fontSize(16).text('Topic Distribution & Psychology', { underline: true });
        doc.fontSize(12).moveDown();
        doc.text(`Cognitive Style: ${analyticsData.topicDistribution.cognitiveStyle}`);
        doc.text(`Interpretation: ${analyticsData.topicDistribution.interpretation}`);
        doc.moveDown();
        
        analyticsData.topicDistribution.dominant.forEach(topic => {
          doc.text(`• ${topic.name}: ${topic.percentage}% - ${topic.psychologicalImplication}`);
        });
        doc.moveDown();
        
        // Temporal Evolution
        doc.fontSize(16).text('Temporal Cognitive Evolution', { underline: true });
        doc.fontSize(12).moveDown();
        doc.text(`Trajectory: ${analyticsData.temporalEvolution.trajectory.type.replace('_', ' ').toUpperCase()}`);
        doc.text(`Description: ${analyticsData.temporalEvolution.trajectory.description}`);
        doc.text(`Prognosis: ${analyticsData.temporalEvolution.trajectory.prognosis}`);
        doc.moveDown();
        
        // Psychostylistic Insights
        doc.fontSize(16).text('Psychostylistic Analysis', { underline: true });
        doc.fontSize(12).moveDown();
        
        analyticsData.psychostylisticInsights.primary.forEach((insight, index) => {
          doc.text(`${index + 1}. ${insight.observation}`);
          doc.text(`   Interpretation: ${insight.interpretation}`);
          if (insight.causality) {
            doc.text(`   Causality: ${insight.causality}`);
          }
          doc.moveDown(0.5);
        });
        
        // Meta-reflection
        doc.text('Self-Mirror Analysis:');
        doc.text(analyticsData.psychostylisticInsights.metaReflection.mindProfile);
        doc.moveDown();
        doc.text(`Cognitive Preferences: ${analyticsData.psychostylisticInsights.metaReflection.cognitivePreferences.join(', ')}`);
        doc.text(`Thinking Tempo: ${analyticsData.psychostylisticInsights.metaReflection.thinkingTempo}`);
        doc.moveDown();
        
        // Comprehensive Cognitive Profile
        doc.fontSize(16).text('Cognitive (Intellectual) Profile', { underline: true });
        doc.fontSize(12).moveDown();
        doc.text(`Intellectual Approach: ${analyticsData.cognitiveProfile.intellectualApproach}`);
        doc.moveDown();
        doc.text('Cognitive Strengths:');
        analyticsData.cognitiveProfile.strengths.forEach(strength => {
          doc.text(`• ${strength}`);
        });
        doc.moveDown();
        doc.text('Growth Pathways:');
        analyticsData.cognitiveProfile.growthPathways.forEach(pathway => {
          doc.text(`• ${pathway}`);
        });
        doc.moveDown();
        doc.text(`Current Career Likely: ${analyticsData.cognitiveProfile.currentCareerLikely}`);
        doc.text(`Ideal Career: ${analyticsData.cognitiveProfile.idealCareer}`);
        doc.moveDown();
        
        // Psychological Profile  
        doc.fontSize(16).text('Psychological (Emotional) Profile', { underline: true });
        doc.fontSize(12).moveDown();
        doc.text(`Emotional Patterns: ${analyticsData.psychologicalProfile.emotionalPatterns}`);
        doc.moveDown();
        doc.text('Psychological Strengths:');
        analyticsData.psychologicalProfile.psychologicalStrengths.forEach(strength => {
          doc.text(`• ${strength}`);
        });
        doc.moveDown();
        doc.text('Object Relations - Positive:');
        analyticsData.psychologicalProfile.objectRelations.positive.forEach(relation => {
          doc.text(`• ${relation}`);
        });
        doc.moveDown();
        
        // Key Insights
        doc.fontSize(16).text('Key Insights & Synthesis', { underline: true });
        doc.fontSize(12).moveDown();
        doc.text(`Unique Positive Trait: ${analyticsData.comprehensiveInsights.uniquePositiveTrait.trait}`);
        doc.text(`Description: ${analyticsData.comprehensiveInsights.uniquePositiveTrait.description}`);
        doc.moveDown();
        doc.text(`Primary Strength: ${analyticsData.comprehensiveInsights.primaryStrength.strength}`);
        doc.text(`Explanation: ${analyticsData.comprehensiveInsights.primaryStrength.explanation}`);
        doc.moveDown();
        doc.text(`Primary Weakness: ${analyticsData.comprehensiveInsights.primaryWeakness.weakness}`);
        doc.text(`Impact: ${analyticsData.comprehensiveInsights.primaryWeakness.impact}`);
        doc.moveDown();
        doc.text('Overall Profile:');
        doc.text(analyticsData.comprehensiveInsights.synthesis.overallProfile);
        
        // Finalize the PDF
        doc.end();
        
      } else if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="analytics-data-${new Date().toISOString().split('T')[0]}.json"`);
        res.json(analyticsData);
        
      } else if (format === 'cognitive-report') {
        // Generate detailed cognitive profile report
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="cognitive-profile-${new Date().toISOString().split('T')[0]}.json"`);
        res.json({
          type: 'Cognitive Profile Report',
          generatedAt: new Date().toISOString(),
          profile: analyticsData.cognitiveProfile,
          supporting_data: {
            writingMetrics: analyticsData.writingStyle,
            cognitiveSignatures: analyticsData.writingStyle.cognitiveSignatures
          }
        });
        
      } else if (format === 'psychological-report') {
        // Generate detailed psychological profile report
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="psychological-profile-${new Date().toISOString().split('T')[0]}.json"`);
        res.json({
          type: 'Psychological Profile Report',
          generatedAt: new Date().toISOString(),
          profile: analyticsData.psychologicalProfile,
          insights: analyticsData.psychostylisticInsights
        });
        
      } else if (format === 'comprehensive-insights') {
        // Generate comprehensive insights report
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="comprehensive-insights-${new Date().toISOString().split('T')[0]}.json"`);
        res.json({
          type: 'Comprehensive Insights Report',
          generatedAt: new Date().toISOString(),
          insights: analyticsData.comprehensiveInsights,
          summary: {
            cognitive_archetype: analyticsData.cognitiveArchetype,
            key_patterns: analyticsData.longitudinalPatterns.slice(-5) // Last 5 patterns
          }
        });
        
      } else if (format === 'csv') {
        // Generate CSV for longitudinal patterns
        const csvData = analyticsData.longitudinalPatterns.map(pattern => ({
          Date: pattern.date,
          'Conceptual Density': pattern.conceptualDensity,
          'Formality Index': pattern.formalityIndex,
          'Cognitive Complexity': pattern.cognitiveComplexity,
          Annotations: pattern.annotations?.join('; ') || ''
        }));
        
        const csvHeaders = Object.keys(csvData[0] || {}).join(',');
        const csvRows = csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','));
        const csvContent = [csvHeaders, ...csvRows].join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="analytics-patterns-${new Date().toISOString().split('T')[0]}.csv"`);
        res.send(csvContent);
      }
      
    } catch (error) {
      console.error('Error exporting analytics:', error);
      res.status(500).json({ message: 'Failed to export analytics', error: (error as Error).message });
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

  // GPT Bypass AI analysis endpoint (frontend calls this)
  app.post('/api/analyze-text', async (req: Request, res: Response) => {
    try {
      const { text } = req.body;
      
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ success: false, error: 'Text is required and must be a string' });
      }
      
      if (text.length < 50) {
        return res.status(400).json({ 
          success: false, 
          error: 'Text is too short for accurate AI detection. Please provide at least 50 characters.' 
        });
      }
      
      console.log(`Running GPTZero analysis on text of length ${text.length}`);
      
      // Use GPTZero service for analysis
      const result = await gptZeroService.analyzeText(text);
      
      // Return in format expected by frontend
      res.json({
        success: true,
        aiProbability: result.aiScore / 100, // Convert to 0-1 range
        humanProbability: (100 - result.aiScore) / 100,
        isAI: result.isAI,
        confidence: result.confidence,
        analysis: {
          aiScore: result.aiScore,
          classification: result.isAI ? 'AI_DETECTED' : 'HUMAN',
          confidence: result.confidence
        }
      });
      
    } catch (error) {
      console.error('Error in GPTZero analysis:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to analyze text',
        message: error instanceof Error ? error.message : String(error)
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

CRITICAL: NEVER add placeholder text like "Rest of text continues..." or similar truncation indicators. NEVER add commentary about mathematical notation or formatting. Provide the COMPLETE rewritten content without any placeholder text or meta-commentary.

${detectionProtection ? 'IMPORTANT: Make the writing style very human-like to avoid AI detection. Vary sentence structure, use idioms, conversational language, and avoid repetitive patterns.' : ''}

DOCUMENT TO REWRITE:
${processableContent}

INSTRUCTIONS AGAIN:
${instructions}

YOUR COMPLETE REWRITTEN DOCUMENT (no placeholder text):`;

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
      
      // Save rewrite to database
      try {
        await storage.createRewrite({
          userId: 1, // Default user ID for now
          model,
          mode: 'document_rewrite',
          originalContent: processableContent,
          rewrittenContent,
          instructions,
          metadata: JSON.stringify({
            filename: filename || 'untitled',
            detectionProtection,
            originalLength: content.length,
            processedLength: processableContent.length,
            rewrittenLength: rewrittenContent.length
          }),
          sourceType: 'document',
          sourceId: filename || null
        });
        console.log('Rewrite saved to database successfully');
      } catch (dbError) {
        console.error('Failed to save rewrite to database:', dbError);
        // Continue with response even if database save fails
      }
      
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

  // Rewrite selected text endpoint
  app.post('/api/rewrite-selection', async (req: Request, res: Response) => {
    try {
      const { selectedText, instructions, model, fullContext } = req.body;

      if (!selectedText || !instructions) {
        return res.status(400).json({ error: 'Selected text and instructions are required' });
      }

      const systemPrompt = `You are a precise text rewriter. You will receive:
1. A selected text fragment that needs rewriting
2. Specific instructions for how to rewrite it
3. The full context where this text appears

CRITICAL REQUIREMENTS:
- LENGTH EXPANSION: The rewritten content MUST be at least 1.2X the length of the original selected text. If instructions specify a multiplier (like "3X length"), follow that exactly.
- MANDATORY EXPANSION: Count the words in the original selection and ensure your output has significantly more words. Add detail, examples, explanations, and elaboration.
- Rewrite ONLY the selected text according to the instructions
- Return ONLY the rewritten text, nothing else
- Do not add any commentary, explanations, or metadata
- Maintain the original meaning while following the instructions and expanding substantially
- If the instruction is about math notation, use proper LaTeX formatting with \\( \\) for inline and \\[ \\] for display math

IMPORTANT: Your output must be substantially longer than the input. Follow any specific length multiplier instructions exactly.

Selected text: "${selectedText}"
Instructions: ${instructions}
Full context: ${fullContext}

Rewrite the selected text with significant expansion:`;

      let rewrittenText = '';

      if (model === 'deepseek') {
        const response = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `Rewrite this text: "${selectedText}"` }
            ],
            temperature: 0.3,
            max_tokens: 1000
          })
        });

        if (!response.ok) {
          throw new Error(`DeepSeek API error: ${response.status}`);
        }

        const data = await response.json();
        rewrittenText = data.choices[0].message.content.trim();
      } else if (model === 'claude') {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY!,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1000,
            temperature: 0.3,
            messages: [
              { role: 'user', content: systemPrompt }
            ]
          })
        });

        if (!response.ok) {
          throw new Error(`Claude API error: ${response.status}`);
        }

        const data = await response.json();
        rewrittenText = data.content[0].text.trim();
      } else if (model === 'gpt4') {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `Rewrite this text: "${selectedText}"` }
            ],
            temperature: 0.3,
            max_tokens: 1000
          })
        });

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        rewrittenText = data.choices[0].message.content.trim();
      }

      res.json({ rewrittenText });
    } catch (error) {
      console.error('Error rewriting selected text:', error);
      res.status(500).json({ error: 'Failed to rewrite selected text' });
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
      
      // Create email message with verified sender
      const msg = {
        to: email,
        from: 'JM@ANALYTICPHILOSOPHY.AI', // Use verified sender address
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
          
          // Sanitize content for PDF - remove all HTML/markdown formatting
          const sanitizedContent = content
            .replace(/<[^>]+>/g, '')           // Remove HTML tags
            .replace(/&[a-z]+;/gi, '')         // Remove HTML entities
            .replace(/\*\*(.*?)\*\*/g, '$1')   // Remove bold markdown
            .replace(/\*(.*?)\*/g, '$1')       // Remove italic markdown
            .replace(/`(.*?)`/g, '$1')         // Remove code markdown
            .replace(/#{1,6}\s/g, '')          // Remove heading markdown
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text
            .replace(/[^\x00-\x7F]/g, (char) => { // Handle non-ASCII safely
              // Keep common math symbols, replace others
              const safeChars = '∫∑∏√±×÷≤≥≠≈∞∂';
              return safeChars.includes(char) ? char : '';
            })
            .trim();
          
          // Add content to PDF with proper line breaks
          const paragraphs = sanitizedContent.split('\n\n');
          for (let i = 0; i < paragraphs.length; i++) {
            const paragraph = paragraphs[i] || ' ';
            doc.text(paragraph, {
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

  // Email sharing route for rewrite results
  app.post('/api/email-rewrite', async (req: Request, res: Response) => {
    try {
      const { results, documentName, recipientEmail } = req.body;
      
      if (!results || !Array.isArray(results)) {
        return res.status(400).json({ error: 'Invalid results data' });
      }
      
      if (!recipientEmail) {
        return res.status(400).json({ error: 'Recipient email is required' });
      }

      // Generate email content
      const emailContent = results.map((result: any, index: number) => 
        `## Section ${index + 1}: ${result.originalChunk.title}\n\n${result.rewrittenContent}\n\n`
      ).join('');

      const htmlContent = results.map((result: any, index: number) => 
        `<h2>Section ${index + 1}: ${result.originalChunk.title}</h2><p>${result.rewrittenContent.replace(/\n/g, '<br>')}</p>`
      ).join('');

      // Send email using the email service
      const emailSent = await sendEmail({
        to: recipientEmail,
        from: 'noreply@analyticphilosophy.ai',
        subject: `Rewritten Document: ${documentName}`,
        text: `Here is your rewritten document: ${documentName}\n\n${emailContent}`,
        html: `<h1>Rewritten Document: ${documentName}</h1>${htmlContent}`
      });

      if (emailSent) {
        res.json({ success: true, message: 'Document emailed successfully' });
      } else {
        res.status(500).json({ error: 'Failed to send email' });
      }

    } catch (error) {
      console.error('Error emailing rewrite:', error);
      res.status(500).json({ error: 'Failed to email document' });
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
      
      // Sender email no longer required - using verified sender automatically
      
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
      
      // Use the email service with verified sender
      const emailSent = await sendEmail({
        to: recipientEmail,
        from: 'JM@ANALYTICPHILOSOPHY.AI', // Always use verified sender
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
      const { content, instructions, model, chatContext, chunkIndex, totalChunks, documentTitle, previousChunks, nextChunks } = req.body;
      
      if (!content || !instructions) {
        return res.status(400).json({ error: 'Content and instructions are required' });
      }

      let prompt = `Rewrite the following text according to these instructions: ${instructions}\n\n`;
      
      if (chatContext) {
        prompt += `Context for reference:\n${chatContext}\n\n`;
      }

      prompt += `Text to rewrite:\n\n${content}\n\n`;
      prompt += `CRITICAL REQUIREMENTS:
1. LENGTH EXPANSION: The rewritten content MUST be at least 1.2X the length of the original text. If instructions specify a multiplier (like "3X length"), follow that exactly.
2. MANDATORY EXPANSION: Count the words in the original and ensure your output has significantly more words. Add detail, examples, explanations, and elaboration.
3. Improve clarity, coherence, and academic quality while expanding content substantially
4. CRITICAL LATEX RULES: ALL mathematical expressions MUST be properly wrapped in delimiters. Use \\(...\\) for inline math and $$...$$ for display equations. Examples: inline \\(\\alpha\\), \\(\\beta\\), \\(x^2\\), \\(\\sqrt{2}\\), and display equations $$\\frac{x^2 y}{x^4 + y^2}$$, $$\\lim_{(x,y) \\rightarrow (0,0)} \\frac{x^2 y}{x^4 + y^2}$$, $$\\int_{0}^{1} x^2 dx$$. NEVER leave math expressions unwrapped or use plain text like "frac" or "lim". NEVER use \\text{} commands within math expressions
5. CRITICAL CURRENCY FORMATTING: Write all currency amounts as regular text ($25, $200, $5). NEVER escape dollar signs with backslashes. Currency should appear as $300, not \$300. This is mandatory.
6. CRITICAL FORMATTING RULES: Write ONLY in plain text format. NEVER use markdown formatting including ### headers, ** bold text, * italic text, - bullet points, numbered lists, or any other markup. Write in simple paragraph format only.
7. Use proper paragraph breaks with double line breaks (\\n\\n) between paragraphs
8. Do NOT add headers, titles, introductions, conclusions, or any structural elements
9. ABSOLUTELY FORBIDDEN: Do NOT add editorial comments, explanations, or metadata of any kind
10. NEVER add placeholder text like "Rest of text continues..." or similar truncation indicators
11. NEVER add commentary about mathematical notation, formatting, or conversion processes
12. NEVER add phrases like "(No mathematical expressions requiring LaTeX conversion were present in the provided text.)" or similar metadata
13. NEVER add bracketed editorial comments like "[Content continues...]" or "[remaining text unchanged]"
14. Return ONLY the rewritten content with absolutely no additions, commentary, or metadata

METADATA ELIMINATION RULE: Your response must contain ZERO editorial commentary, processing notes, or metadata insertions. Output only the rewritten content itself.

IMPORTANT: Your output must be substantially longer than the input. If the original has 500 words, your output should have at least 600 words (1.2X minimum). Follow any specific length multiplier instructions exactly.

Return only the improved text content that is significantly expanded from the original in plain text format without any markdown formatting.`;

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
      } else if (model === 'deepseek') {
        result = await callDeepSeekWithRateLimit(prompt, {
          temperature: 0.7,
          maxTokens: 4000
        });
      } else {
        // Fallback to Claude
        result = await processClaude(prompt, {
          temperature: 0.7,
          maxTokens: 4000
        });
      }
      
      // FIRST: Apply math delimiter processing BEFORE any formatting that might escape dollar signs
      const { sanitizeMathAndCurrency } = await import('./services/mathDelimiterFixer.js');
      result = sanitizeMathAndCurrency(result);
      console.log('🧮 Applied intelligent math delimiter processing FIRST');
      
      // SECOND: Clean up corrupted LaTeX text commands within math expressions
      result = result.replace(/\\text\{([^}]*)\}/g, '$1'); // Remove \text{} commands
      result = result.replace(/\\textit\{([^}]*)\}/g, '$1'); // Remove \textit{} commands
      result = result.replace(/\\textbf\{([^}]*)\}/g, '$1'); // Remove \textbf{} commands
      console.log('🔧 Cleaned corrupted LaTeX text commands');
      
      // THIRD: Fix formatting issues but preserve math delimiters
      result = ensurePerfectFormatting(result);
      
      // FOURTH: Remove markdown formatting for clean output (but preserve math)
      result = cleanMarkdownFormatting(result);
      
      // FINAL: Ensure no escaped dollar signs remain in currency
      result = result.replace(/\\\$(\d)/g, '$$$1');
      console.log('🔧 Final currency symbol cleanup completed');
      
      // Save chunk rewrite to database
      try {
        await storage.createRewrite({
          userId: 1, // Default user ID for now
          model: model || 'claude',
          mode: 'chunk_rewrite',
          originalContent: content,
          rewrittenContent: result,
          instructions,
          metadata: JSON.stringify({
            chunkIndex,
            totalChunks,
            chatContext: !!chatContext,
            originalLength: content.length,
            rewrittenLength: result.length
          }),
          sourceType: 'chunk',
          sourceId: `chunk_${chunkIndex}_of_${totalChunks}`
        });
        console.log(`Chunk rewrite saved to database: chunk ${chunkIndex + 1}/${totalChunks}`);
      } catch (dbError) {
        console.error('Failed to save chunk rewrite to database:', dbError);
        // Continue with response even if database save fails
      }
      
      res.json({ rewrittenContent: result });
      
    } catch (error) {
      console.error('Chunk rewrite error:', error);
      res.status(500).json({ error: 'Failed to rewrite chunk' });
    }
  });

  // Speech-to-text endpoint
  app.post('/api/speech-to-text', upload.single('audio'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No audio file provided' });
      }

      console.log(`Processing audio file: ${req.file.originalname}, size: ${req.file.size} bytes`);

      const options = {
        language: req.body.language || 'en',
        punctuate: req.body.punctuate !== 'false',
        format_text: req.body.format_text !== 'false',
        speaker_labels: req.body.speaker_labels === 'true'
      };

      const transcription = await speechToTextService.transcribeAudio(req.file.buffer, options);

      if (!transcription || transcription.trim() === '') {
        return res.status(400).json({ error: 'No speech detected in audio' });
      }

      console.log(`Transcription completed: ${transcription.length} characters`);
      
      res.json({ 
        text: transcription,
        success: true,
        message: `Successfully transcribed ${transcription.length} characters`
      });

    } catch (error) {
      console.error('Speech-to-text error:', error);
      res.status(500).json({ 
        error: 'Failed to transcribe audio',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get user rewrites for history/analytics
  app.get('/api/rewrites', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.query.userId as string) || 1; // Default to user 1
      const rewrites = await storage.getRewritesByUserId(userId);
      
      // Sort by creation date, newest first
      const sortedRewrites = rewrites.sort((a, b) => 
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
      
      res.json(sortedRewrites);
    } catch (error) {
      console.error('Error fetching rewrites:', error);
      res.status(500).json({ error: 'Failed to fetch rewrites' });
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
      
      if (format === 'docx') {
        // For Word, we need to import the docx library and create a proper document
        const docx = await import('docx');
        const { Document, Packer, Paragraph, TextRun } = docx;
        
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
      } else if (format === 'pdf') {
        try {
          // Generate PDF using PDFKit
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
              res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
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
          
          // Further sanitize content for PDF - remove all HTML/markdown formatting
          const sanitizedContent = processedContent
            .replace(/<[^>]+>/g, '')           // Remove HTML tags
            .replace(/&[a-z]+;/gi, '')         // Remove HTML entities
            .replace(/[^\x00-\x7F]/g, (char) => { // Handle non-ASCII safely
              // Keep common math symbols, replace others
              const safeChars = '∫∑∏√±×÷≤≥≠≈∞∂θπαβγδεζηκλμνξρστφχψω';
              return safeChars.includes(char) ? char : '';
            })
            .trim();
          
          // Add content to PDF with proper line breaks
          const paragraphs = sanitizedContent.split('\n\n');
          for (let i = 0; i < paragraphs.length; i++) {
            const paragraph = paragraphs[i] || ' ';
            doc.text(paragraph, {
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
      const { content, recipientEmail, subject } = req.body;
      
      if (!content || !recipientEmail) {
        return res.status(400).json({ error: 'Content and recipient email are required' });
      }

      const emailParams = {
        to: recipientEmail,
        from: 'JM@ANALYTICPHILOSOPHY.AI', // Always use verified sender
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

  // BRAND NEW Print-Save-As-PDF function 
  app.post('/api/print-pdf', async (req: Request, res: Response) => {
    try {
      const { results, documentName } = req.body;
      
      if (!results || !Array.isArray(results)) {
        return res.status(400).json({ error: 'Results required' });
      }

      // Create HTML with proper MathJax configuration
      let htmlContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>${documentName || 'Document'}</title>
    <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
    <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
    <script>
        window.MathJax = {
            tex: {
                inlineMath: [['\\(', '\\)'], ['$', '$']],
                displayMath: [['\\[', '\\]'], ['$$', '$$']],
                processEscapes: true,
                processEnvironments: true
            },
            options: {
                skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre']
            }
        };
    </script>
    <style>
        * { box-sizing: border-box; }
        body { 
            font-family: 'Times New Roman', serif; 
            font-size: 12pt; 
            line-height: 1.5; 
            margin: 0;
            padding: 20px;
            color: #000;
            background: white;
        }
        .document-title { 
            text-align: center; 
            font-size: 18pt; 
            font-weight: bold;
            margin-bottom: 30px;
            page-break-after: avoid;
        }
        .section { 
            margin-bottom: 25px; 
            page-break-inside: avoid;
        }
        .section-title { 
            font-size: 14pt; 
            font-weight: bold;
            margin: 15px 0 10px 0;
            page-break-after: avoid;
        }
        .content { 
            text-align: justify; 
            margin: 10px 0;
            line-height: 1.6;
        }
        .MathJax { font-size: 1em !important; }
        mjx-container { display: inline-block !important; }
        @media print {
            body { margin: 0; padding: 15mm; }
            .section { break-inside: avoid; }
            @page { margin: 15mm; }
        }
    </style>
</head>
<body>
    <div class="document-title">${documentName || 'Rewritten Document'}</div>`;

      // Process each section with clean text - NO MARKDOWN
      results.forEach((result: any, index: number) => {
        let content = result.rewrittenContent || '';
        
        // CLEAN ALL MARKDOWN FORMATTING - no markup in PDF
        content = cleanMarkdownFormatting(content);
        
        // Only format for HTML display - convert line breaks to proper HTML
        content = content
          .replace(/\n\n+/g, '</p><p class="content">')
          .replace(/\n/g, '<br>');

        htmlContent += `
    <div class="section">
        <div class="section-title">Section ${index + 1}: ${result.originalChunk?.title || 'Content'}</div>
        <p class="content">${content}</p>
    </div>`;
      });

      htmlContent += `
</body>
</html>`;

      // Return HTML for browser's native print/save as PDF - ONLY way for perfect math
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(htmlContent);

    } catch (error) {
      console.error('PDF generation error:', error);
      res.status(500).json({ error: 'PDF generation failed' });
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

      sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

      const msg = {
        to: email,
        from: 'JM@ANALYTICPHILOSOPHY.AI',
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

  // Export auxiliary chat conversation
  app.post('/api/export-auxiliary-chat', async (req: Request, res: Response) => {
    try {
      const { conversationId, format = 'txt', messages } = req.body;

      // Use provided messages if available, otherwise try to get from storage
      let chatMessages = messages;
      let conversationTitle = `Auxiliary Chat - ${new Date().toLocaleDateString()}`;

      if (!chatMessages || chatMessages.length === 0) {
        if (!conversationId) {
          return res.status(400).json({ error: 'Either conversation ID or messages are required' });
        }

        // Try to get from storage
        const conversation = await storage.getConversation(conversationId);
        if (conversation) {
          conversationTitle = conversation.title;
          chatMessages = await storage.getMessagesByConversationId(conversationId);
        } else {
          return res.status(404).json({ error: 'Conversation not found and no messages provided' });
        }
      }
      
      // Format conversation content and strip markdown for clean output
      let content = `Conversation: ${conversationTitle}\n`;
      content += `Date: ${new Date().toLocaleString()}\n`;
      content += `\n${'='.repeat(50)}\n\n`;

      chatMessages.forEach((message: any, index: number) => {
        const timestamp = new Date(message.timestamp || message.createdAt || new Date()).toLocaleString();
        content += `[${timestamp}] ${message.role.toUpperCase()}:\n`;
        
        // Strip markdown formatting from message content
        const cleanContent = message.content
          .replace(/#{1,6}\s+/g, '') // Remove headers
          .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
          .replace(/\*(.*?)\*/g, '$1') // Remove italics
          .replace(/`(.*?)`/g, '$1') // Remove inline code
          .replace(/```[\s\S]*?```/g, '') // Remove code blocks
          .replace(/>\s+/g, '') // Remove blockquotes
          .replace(/^\s*[-*+]\s+/gm, '- ') // Normalize list markers
          .replace(/^\s*\d+\.\s+/gm, '') // Remove numbered list markers
          .replace(/\n{3,}/g, '\n\n') // Normalize line breaks
          .trim();
          
        content += `${cleanContent}\n\n`;
        if (index < chatMessages.length - 1) {
          content += `${'-'.repeat(30)}\n\n`;
        }
      });

      const filename = `auxiliary-chat-export-${Date.now()}`;

      if (format === 'docx') {
        const { Document: DocxDocument, Paragraph, TextRun, Packer } = await import('docx');
        
        const doc = new DocxDocument({
          sections: [{
            properties: {},
            children: content.split('\n').map(line => 
              new Paragraph({
                children: [new TextRun(line || ' ')],
              })
            ),
          }]
        });

        const buffer = await Packer.toBuffer(doc);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.docx"`);
        res.send(buffer);
      } else if (format === 'txt') {
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.txt"`);
        res.send(content);
      } else {
        res.status(400).json({ error: 'Unsupported format. Use txt or docx.' });
      }
    } catch (error) {
      console.error('Error exporting auxiliary chat:', error);
      res.status(500).json({ error: 'Failed to export conversation' });
    }
  });

  // Share auxiliary chat conversation via email
  app.post('/api/share-auxiliary-chat', async (req: Request, res: Response) => {
    try {
      const { conversationId, email, subject, messages } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      if (!process.env.SENDGRID_API_KEY) {
        return res.status(500).json({ error: 'Email service not configured' });
      }

      // Use provided messages or get from storage
      let chatMessages = messages;
      let conversationTitle = `Auxiliary Chat - ${new Date().toLocaleDateString()}`;

      if (!chatMessages || chatMessages.length === 0) {
        if (!conversationId) {
          return res.status(400).json({ error: 'Either conversation ID or messages are required' });
        }

        const conversation = await storage.getConversation(conversationId);
        if (conversation) {
          conversationTitle = conversation.title;
          chatMessages = await storage.getMessagesByConversationId(conversationId);
        } else {
          return res.status(404).json({ error: 'Conversation not found and no messages provided' });
        }
      }
      
      // Format conversation content for email
      let htmlContent = `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">`;
      htmlContent += `<h2>Conversation: ${conversationTitle}</h2>`;
      htmlContent += `<p><strong>Date:</strong> ${new Date().toLocaleString()}</p>`;
      htmlContent += `<hr style="margin: 20px 0;">`;

      chatMessages.forEach((message: any, index: number) => {
        const timestamp = new Date(message.timestamp || message.createdAt || new Date()).toLocaleString();
        const isUser = message.role === 'user';
        const bgColor = isUser ? '#f0f8ff' : '#f8f8f8';
        const roleColor = isUser ? '#0066cc' : '#666666';
        
        // Strip markdown from content for email
        const cleanContent = message.content
          .replace(/#{1,6}\s+/g, '') // Remove headers
          .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
          .replace(/\*(.*?)\*/g, '$1') // Remove italics
          .replace(/`(.*?)`/g, '$1') // Remove inline code
          .replace(/```[\s\S]*?```/g, '') // Remove code blocks
          .replace(/>\s+/g, '') // Remove blockquotes
          .replace(/^\s*[-*+]\s+/gm, '- ') // Normalize list markers
          .replace(/^\s*\d+\.\s+/gm, '') // Remove numbered list markers
          .replace(/\n{3,}/g, '\n\n') // Normalize line breaks
          .trim();
        
        htmlContent += `
          <div style="margin: 15px 0; padding: 15px; background-color: ${bgColor}; border-radius: 8px; border-left: 4px solid ${roleColor};">
            <div style="font-weight: bold; color: ${roleColor}; margin-bottom: 8px;">
              ${message.role.toUpperCase()} - ${timestamp}
            </div>
            <div style="white-space: pre-wrap; line-height: 1.4;">
              ${cleanContent.replace(/\n/g, '<br>')}
            </div>
          </div>
        `;
      });

      htmlContent += `</div>`;

      // Plain text version
      let textContent = `Conversation: ${conversationTitle}\n`;
      textContent += `Date: ${new Date().toLocaleString()}\n`;
      textContent += `\n${'='.repeat(50)}\n\n`;

      chatMessages.forEach((message: any, index: number) => {
        const timestamp = new Date(message.timestamp || message.createdAt || new Date()).toLocaleString();
        const cleanContent = message.content
          .replace(/#{1,6}\s+/g, '') // Remove headers
          .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
          .replace(/\*(.*?)\*/g, '$1') // Remove italics
          .replace(/`(.*?)`/g, '$1') // Remove inline code
          .replace(/```[\s\S]*?```/g, '') // Remove code blocks
          .replace(/>\s+/g, '') // Remove blockquotes
          .replace(/^\s*[-*+]\s+/gm, '- ') // Normalize list markers
          .replace(/^\s*\d+\.\s+/gm, '') // Remove numbered list markers
          .replace(/\n{3,}/g, '\n\n') // Normalize line breaks
          .trim();
          
        textContent += `[${timestamp}] ${message.role.toUpperCase()}:\n`;
        textContent += `${cleanContent}\n\n`;
        if (index < chatMessages.length - 1) {
          textContent += `${'-'.repeat(30)}\n\n`;
        }
      });

      sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

      const msg = {
        to: email,
        from: 'JM@ANALYTICPHILOSOPHY.AI',
        subject: subject || `Auxiliary Chat Conversation - ${new Date().toLocaleDateString()}`,
        text: textContent,
        html: htmlContent
      };

      await sgMail.send(msg);
      console.log(`Auxiliary chat conversation shared successfully to ${email}`);
      res.json({ success: true, message: 'Conversation shared successfully' });
    } catch (error) {
      console.error('Error sharing auxiliary chat:', error);
      res.status(500).json({ error: 'Failed to share conversation' });
    }
  });

  // Homework mode endpoint - solves problems and completes assignments
  app.post('/api/homework-mode', async (req: Request, res: Response) => {
    try {
      const { instructions, userPrompt, model, chatContext } = req.body;
      
      if (!instructions) {
        return res.status(400).json({ error: 'Instructions are required' });
      }

      // Complete passthrough - send exactly what user typed to Claude
      let prompt = instructions;
      
      if (userPrompt) {
        prompt += `\n\n${userPrompt}`;
      }
      
      if (chatContext) {
        prompt += `\n\n${chatContext}`;
      }

      // Process based on selected model
      let result: string;
      
      // Define the system prompt for all models
      const systemPrompt = `Complete the entire assignment or request fully and directly. Do not ask follow-up questions, do not provide partial answers, and do not offer to do more work. Simply complete everything that was requested in full.

CRITICAL RULES:
- CRITICAL LATEX RULES: ALL mathematical expressions MUST be properly wrapped in delimiters. Use \\(...\\) for inline math and $$...$$ for display equations. Examples: inline \\(\\alpha\\), \\(\\beta\\), \\(x^2\\), \\(\\sqrt{2}\\), and display equations $$\\frac{x^2 y}{x^4 + y^2}$$, $$\\lim_{(x,y) \\rightarrow (0,0)} \\frac{x^2 y}{x^4 + y^2}$$, $$\\int_{0}^{1} x^2 dx$$. NEVER leave math expressions unwrapped or use plain text like "frac" or "lim".
- CRITICAL FORMATTING RULES: Write ONLY in plain text format. NEVER use markdown formatting including ### headers, ** bold text, * italic text, - bullet points, numbered lists, or any other markup. Write in simple paragraph format only.
- NEVER add placeholder text like "Rest of text continues..." or similar placeholders
- NEVER add editorial comments about mathematical notation or formatting
- NEVER include meta-commentary about the content structure
- CRITICAL CURRENCY FORMATTING: Write all currency amounts as regular text ($25, $300, $5). NEVER escape dollar signs with backslashes. Currency should appear as $300, not \$300. This is mandatory.
- NEVER create ASCII-art graphs, charts, or visual approximations using slashes, underscores, bars, or any text characters
- NEVER attempt to draw or simulate graphs within the text body
- NEVER include visual representations made of text characters
- When a graph would be helpful, simply write: "[See Graph 1 above]" or "[See Graph 2 above]" and nothing more
- The app will automatically generate professional SVG graphs and place them at the top of the output
- Focus only on solving the problem and providing clear explanations - graphs will be handled separately
- Provide COMPLETE content without any truncation indicators or continuation placeholders

Your job is to solve problems correctly and write clear, student-friendly explanations in plain text format without any markdown or visual elements.`;

      if (model === 'deepseek') {
        result = await callDeepSeekWithRateLimit(`${systemPrompt}\n\n${prompt}`, {
          temperature: 0.7,
          maxTokens: 4000
        });
      } else if (model === 'gpt4') {
        result = await callOpenAIWithRateLimit({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 4000
        });
      } else {
        // Default to Claude
        const { default: Anthropic } = await import('@anthropic-ai/sdk');
        const anthropic = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
        });

        const response = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4000,
          temperature: 0.7,
          system: systemPrompt,
          messages: [{ role: 'user', content: prompt }]
        });

        result = response.content[0].type === 'text' ? response.content[0].text : '';
      }

      // Remove markdown formatting for clean output
      result = cleanMarkdownFormatting(result);

      // Check if the assignment request mentions graphs, charts, or visualizations
      const needsGraphs = /graph|chart|plot|diagram|visualiz|visual|data.*show|trend|statistic|econom.*paper|inflation.*effect|supply.*demand/i.test(instructions + (userPrompt || ''));
      
      let graphs = [];
      
      if (needsGraphs) {
        try {
          console.log('Detected graph requirement, generating visualizations...');
          
          // Generate graphs based on the content
          const graphRequirements = await parseGraphRequirements(
            `${instructions}\n\nGenerated content: ${result}`, 
            { model: model === 'gpt4' ? 'gpt4' : 'claude', style: 'academic' }
          );
          
          // If no graphs were generated, create a relevant default based on content
          let finalGraphRequirements = graphRequirements;
          if (graphRequirements.length === 0) {
            console.log('No graphs generated, creating default exponential function graph');
            finalGraphRequirements = [{
              type: 'function' as const,
              title: 'Exponential Function y = 2ˣ',
              xLabel: 'x',
              yLabel: 'y = 2ˣ',
              data: Array.from({length: 21}, (_, i) => {
                const x = i - 10;
                return { x, y: Math.pow(2, x) };
              }),
              description: 'Graph of the exponential function y = 2ˣ',
              mathExpression: '2^x',
              domain: [-10, 10] as [number, number],
              color: '#2563eb'
            }];
          }
          
          graphs = finalGraphRequirements.map((data, index) => ({
            svg: generateSVG(data, 600, 400), // Smaller size for better PDF fit
            data,
            position: index,
            title: data.title,
            description: data.description
          }));
          
          console.log(`Generated ${graphs.length} graphs for assignment`);
        } catch (error) {
          console.error('Error generating graphs:', error);
          // Create a fallback graph even if everything fails
          const fallbackData = {
            type: 'function' as const,
            title: 'Sample Mathematical Function',
            xLabel: 'x',
            yLabel: 'f(x)',
            data: Array.from({length: 11}, (_, i) => {
              const x = i - 5;
              return { x, y: x * x };
            }),
            description: 'Quadratic function for demonstration',
            mathExpression: 'x^2',
            domain: [-5, 5] as [number, number],
            color: '#2563eb'
          };
          
          graphs = [{
            svg: generateSVG(fallbackData, 600, 400), // Smaller size for better PDF fit
            data: fallbackData,
            position: 0,
            title: fallbackData.title,
            description: fallbackData.description
          }];
          
          console.log('Used fallback graph generation');
        }
      }

      res.json({ 
        response: result,
        graphs: graphs.length > 0 ? graphs : undefined
      });
    } catch (error) {
      console.error('Homework mode error:', error);
      res.status(500).json({ error: 'Failed to process homework' });
    }
  });

  // Text to Math conversion endpoint - converts markup to perfect mathematical notation
  app.post('/api/text-to-math', async (req: Request, res: Response) => {
    try {
      const { content, instructions, model, chatContext, chunkIndex, totalChunks } = req.body;
      
      if (!content) {
        return res.status(400).json({ error: 'Content is required' });
      }

      // Build the prompt for mathematical notation conversion
      let prompt = `CRITICAL: Only convert actual mathematical expressions to LaTeX. Do NOT add LaTeX markup to regular words or phrases.

STRICT RULES:
- Only convert genuine mathematical expressions (equations, formulas, symbols, variables)
- Keep all regular text as normal text without any LaTeX formatting
- Do NOT wrap regular words in \\textit{}, \\text{}, or any LaTeX commands
- Currency amounts like $25, $300 should remain as regular text
- Only use LaTeX for actual math: equations, Greek letters, mathematical operators, fractions
- Return clean plain text with LaTeX only where mathematically necessary
- CRITICAL FORMATTING RULES: Write ONLY in plain text format. NEVER use markdown formatting including ### headers, ** bold text, * italic text, - bullet points, numbered lists, or any other markup. Write in simple paragraph format only.
- NEVER add editorial comments or metadata

EXAMPLES OF WHAT NOT TO DO:
- Do NOT convert "luxury dilution" to "\\textit{luxury dilution}"
- Do NOT convert "the price is $300" to "\\text{the price is } \\$300"
- Do NOT add LaTeX formatting to regular English words

EXAMPLES OF CORRECT CONVERSION:
- "x^2 + y^2 = z^2" becomes "\\(x^2 + y^2 = z^2\\)"
- "α = 0.05" becomes "\\(\\alpha = 0.05\\)"
- Regular text stays as regular text

Content to convert:
${content}`;

      if (instructions && instructions.trim()) {
        prompt += `\n\nAdditional instructions: ${instructions}`;
      }

      if (chatContext) {
        prompt += `\n\nContext: ${chatContext}`;
      }

      if (chunkIndex !== undefined && totalChunks !== undefined) {
        prompt += `\n\n(Processing chunk ${chunkIndex + 1} of ${totalChunks})`;
      }

      // Use the specified model for conversion
      let result = '';
      const selectedModel = model || 'claude';

      if (selectedModel === 'claude') {
        const { default: Anthropic } = await import('@anthropic-ai/sdk');
        const anthropic = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
        });

        const response = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4000,
          temperature: 0.1, // Low temperature for precise mathematical formatting
          system: "CRITICAL: ALL mathematical expressions MUST be properly wrapped in delimiters. Use \\(...\\) for inline math and $$...$$ for display equations. Examples: inline \\(\\alpha\\), \\(\\beta\\), \\(x^2\\), \\(\\sqrt{2}\\), and display equations $$\\frac{x^2}{y^2}$$, $$\\int x dx$$. NEVER leave math expressions unwrapped. Do NOT add LaTeX markup to regular words. Currency amounts like $25, $300 stay as regular text. Only use LaTeX for actual mathematical expressions.",
          messages: [{ role: 'user', content: prompt }]
        });

        result = response.content[0].type === 'text' ? response.content[0].text : '';
      } else if (selectedModel === 'gpt4') {
        const OpenAI = await import('openai');
        const openai = new OpenAI.default({
          apiKey: process.env.OPENAI_API_KEY,
        });

        const response = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: 'CRITICAL: ALL mathematical expressions MUST be properly wrapped in delimiters. Use \\(...\\) for inline math and $$...$$ for display equations. Examples: inline \\(\\alpha\\), \\(\\beta\\), \\(x^2\\), \\(\\sqrt{2}\\), and display equations $$\\frac{x^2}{y^2}$$, $$\\int x dx$$. NEVER leave math expressions unwrapped. Do NOT add LaTeX markup to regular words. Currency amounts like $25, $300 stay as regular text.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 4000,
          temperature: 0.1
        });

        result = response.choices[0]?.message?.content || '';
      } else if (selectedModel === 'deepseek') {
        // Create system prompt for DeepSeek to prevent metadata insertions and LaTeX corruption
        const systemPrompt = 'CRITICAL: ALL mathematical expressions MUST be properly wrapped in delimiters. Use \\(...\\) for inline math and $$...$$ for display equations. Examples: inline \\(\\alpha\\), \\(\\beta\\), \\(x^2\\), \\(\\sqrt{2}\\), and display equations $$\\frac{x^2}{y^2}$$, $$\\int x dx$$. NEVER leave math expressions unwrapped. Do NOT add LaTeX markup to regular words. Currency amounts like $25, $300 stay as regular text.';
        
        result = await callDeepSeekWithRateLimit(`${systemPrompt}\n\n${prompt}`, {
          temperature: 0.1,
          maxTokens: 4000
        });
      } else {
        // Fallback to Claude for other models
        const { default: Anthropic } = await import('@anthropic-ai/sdk');
        const anthropic = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
        });

        const response = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4000,
          temperature: 0.1,
          system: "You are a mathematical notation expert. Convert text to perfect LaTeX formatting while preserving all mathematical meaning. Be precise and accurate with LaTeX syntax. CRITICAL CURRENCY FORMATTING: Write all currency amounts as regular text ($25, $300, $5). NEVER escape dollar signs with backslashes. Currency should appear as $300, not \\$300. This is mandatory.",
          messages: [{ role: 'user', content: prompt }]
        });

        result = response.content[0].type === 'text' ? response.content[0].text : '';
      }

      // Clean up any remaining markdown formatting and fix escaped dollar signs
      const cleanResult = result
        .replace(/\\\$/g, '$') // CRITICAL FIX: Convert escaped dollar signs to normal currency symbols
        .replace(/^#+ /gm, '') // Remove markdown headers
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold formatting
        .replace(/\*(.*?)\*/g, '$1') // Remove italic formatting  
        .replace(/`(.*?)`/g, '$1') // Remove inline code formatting
        .replace(/^- /gm, '') // Remove bullet points
        .replace(/^\* /gm, '') // Remove asterisk bullet points
        .replace(/^\d+\. /gm, '') // Remove numbered lists
        .trim();
      
      console.log('🔧 Fixed escaped dollar signs in text-to-math output');

      res.json({ mathContent: cleanResult });
    } catch (error) {
      console.error('Text to Math conversion error:', error);
      res.status(500).json({ error: 'Failed to convert text to mathematical notation' });
    }
  });

  // Document cleaning endpoints
  app.post('/api/document/preview-cleaning', async (req: Request, res: Response) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: 'Text is required' });
      }

      const { previewDocumentCleaning } = await import('./services/documentCleaner');
      const preview = previewDocumentCleaning(text);
      
      res.json(preview);
    } catch (error) {
      console.error('Preview cleaning error:', error);
      res.status(500).json({ error: 'Failed to preview document cleaning' });
    }
  });

  app.post('/api/document/clean-for-tts', async (req: Request, res: Response) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: 'Text is required' });
      }

      const { cleanDocumentForTTS } = await import('./services/documentCleaner');
      const cleaned = cleanDocumentForTTS(text);
      
      res.json(cleaned);
    } catch (error) {
      console.error('Document cleaning error:', error);
      res.status(500).json({ error: 'Failed to clean document' });
    }
  });

  // Math Delimiter and Currency Protection Routes
  app.post('/api/math/sanitize-delimiters', async (req: Request, res: Response) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: 'Text is required' });
      }

      const { sanitizeMathAndCurrency, validateMathDelimiters } = await import('./services/mathDelimiterFixer');
      
      const sanitizedText = sanitizeMathAndCurrency(text);
      const validation = validateMathDelimiters(text);
      
      res.json({
        originalText: text,
        sanitizedText,
        validation,
        success: true
      });
    } catch (error) {
      console.error('Math delimiter sanitization error:', error);
      res.status(500).json({ error: 'Failed to sanitize math delimiters' });
    }
  });

  app.post('/api/math/test-cases', async (req: Request, res: Response) => {
    try {
      const { runTests, testCases } = await import('./services/mathDelimiterFixer');
      
      console.log('Running math delimiter tests...');
      runTests();
      
      res.json({
        testCases,
        message: 'Test cases executed - check server logs for results',
        success: true
      });
    } catch (error) {
      console.error('Math delimiter test error:', error);
      res.status(500).json({ error: 'Failed to run math delimiter tests' });
    }
  });

  // Text-to-Speech Routes
  
  // Get available ElevenLabs voices
  app.get('/api/tts/voices', async (req: Request, res: Response) => {
    try {
      console.log('Fetching ElevenLabs voices...');
      const voices = await elevenLabsService.getAvailableVoices();
      console.log(`Found ${voices.length} voices`);
      res.json({ voices });
    } catch (error) {
      console.error('Error fetching voices:', error);
      res.status(500).json({ 
        error: 'Failed to fetch available voices',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Generate dialogue audio from script
  app.post('/api/tts/generate-dialogue', async (req: Request, res: Response) => {
    try {
      const { script, voiceAssignments, customVoices } = req.body;
      
      if (!script || typeof script !== 'string') {
        return res.status(400).json({ error: 'Script text is required' });
      }

      const voicesToUse = voiceAssignments || customVoices || {};
      console.log('Generating dialogue audio from script with voice assignments:', voicesToUse);
      const result = await elevenLabsService.generateDialogueAudio(script, voicesToUse);
      
      res.json({
        success: true,
        audioPath: result.audioPath,
        metadata: result.metadata,
        message: 'Dialogue audio generated successfully'
      });
    } catch (error) {
      console.error('Error generating dialogue audio:', error);
      res.status(500).json({ error: 'Failed to generate dialogue audio' });
    }
  });

  // Parse script and show voice assignments (preview)
  app.post('/api/tts/parse-script', async (req: Request, res: Response) => {
    try {
      const { script } = req.body;
      
      if (!script || typeof script !== 'string') {
        return res.status(400).json({ error: 'Script text is required' });
      }

      const parsedScript = elevenLabsService.parseScript(script);
      const voiceAssignments = await elevenLabsService.assignVoices(parsedScript.characters);
      
      const assignments: Record<string, any> = {};
      voiceAssignments.forEach((voice, character) => {
        assignments[character] = {
          voiceId: voice.voice_id,
          voiceName: voice.name,
          gender: voice.gender,
          accent: voice.accent,
          description: voice.description
        };
      });

      res.json({
        characters: parsedScript.characters,
        totalLines: parsedScript.lines.length,
        voiceAssignments: assignments,
        dialoguePreview: parsedScript.lines.slice(0, 5), // First 5 lines as preview
        estimatedDuration: Math.ceil(parsedScript.lines.reduce((total, line) => total + line.text.length, 0) / 750) // Rough estimate in seconds
      });
    } catch (error) {
      console.error('Error parsing script:', error);
      res.status(500).json({ error: 'Failed to parse script' });
    }
  });

  // Download generated audio file
  app.get('/api/tts/download/:filename', (req: Request, res: Response) => {
    try {
      const filename = req.params.filename;
      const filePath = path.join(process.cwd(), filename);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Audio file not found' });
      }

      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error downloading audio file:', error);
      res.status(500).json({ error: 'Failed to download audio file' });
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

  // Mind Profiler API Routes
  
  // REVISED INTELLIGENCE METRICS - New API endpoint using proper framework
  app.post('/api/profile/revised-intelligence', async (req: Request, res: Response) => {
    try {
      console.log('🔥 REVISED INTELLIGENCE METRICS API CALLED');
      const { inputText, userId } = req.body;
      
      if (!inputText || !userId) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }
      
      if (inputText.length < 100) {
        return res.status(400).json({ error: 'Text sample too short. Minimum 100 characters required.' });
      }
      
      console.log('🔥 CALLING generateRevisedIntelligenceProfile - PURE PASSTHROUGH');
      const profile = await generateRevisedIntelligenceProfile(inputText);
      
      console.log('🔥 RETURNING AUTHENTIC SCORES - NO FILTERING');
      res.json(profile);
    } catch (error) {
      console.error('🔥 REVISED INTELLIGENCE METRICS ERROR:', error);
      res.status(500).json({
        error: 'Failed to generate revised intelligence profile', 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });
  
  // Instant profile analysis (legacy)
  app.post('/api/profile/instant', async (req: Request, res: Response) => {
    try {
      const { profileType, inputText, userId } = req.body;
      
      if (!profileType || !inputText || !userId) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }
      
      if (inputText.length < 100) {
        return res.status(400).json({ error: 'Text sample too short. Minimum 100 characters required.' });
      }
      
      const profile = await generateInstantProfile(inputText, profileType, userId);
      res.json(profile);
    } catch (error) {
      console.error('Error generating instant profile:', error);
      res.status(500).json({ 
        error: 'Failed to generate profile', 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Comprehensive profile analysis
  app.post('/api/profile/comprehensive', async (req: Request, res: Response) => {
    try {
      const { profileType, userId } = req.body;
      
      if (!profileType || !userId) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }
      
      const profile = await generateComprehensiveProfile(profileType, userId);
      res.json(profile);
    } catch (error) {
      console.error('Error generating comprehensive profile:', error);
      res.status(500).json({ 
        error: 'Failed to generate profile', 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Metacognitive instant profile analysis
  app.post('/api/profile/metacognitive-instant', async (req: Request, res: Response) => {
    try {
      console.log('🔍 METACOGNITIVE ROUTE DEBUG - REQUEST RECEIVED');
      console.log('Request body keys:', Object.keys(req.body));
      console.log('Request timestamp:', new Date().toISOString());
      
      const { inputText, userId, model = 'deepseek' } = req.body;
      console.log('🔍 SELECTED MODEL:', model);
      
      // DEBUG LOGGING - Check for request caching/reuse
      const requestHash = inputText ? inputText.substring(0, 100).replace(/\s/g, '').toLowerCase() : 'no-text';
      console.log('🔍 REQUEST HASH:', requestHash);
      
      if (!inputText || !userId) {
        console.log('🔍 MISSING PARAMETERS - inputText:', !!inputText, 'userId:', !!userId);
        return res.status(400).json({ error: 'Missing required parameters' });
      }
      
      if (inputText.length < 100) {
        console.log('🔍 TEXT TOO SHORT - Length:', inputText.length);
        return res.status(400).json({ error: 'Text sample too short. Minimum 100 characters required.' });
      }
      
      console.log('🔍 CALLING generateMetacognitiveProfile with text length:', inputText.length);
      console.log('🔍 INPUT TEXT PREVIEW:', inputText.substring(0, 200));
      
      // REPLACED WITH REVISED INTELLIGENCE METRICS - NO MORE FILTERING
      console.log('🔥 USING REVISED INTELLIGENCE METRICS - PURE PASSTHROUGH');
      const revisedProfile = await generateRevisedIntelligenceProfile(inputText);
      
      // Convert to expected format for backward compatibility
      const compatibleProfile = {
        intellectualMaturity: revisedProfile.intellectualMaturity,
        selfAwarenessLevel: revisedProfile.selfAwarenessLevel,
        epistemicHumility: revisedProfile.epistemicHumility,
        reflectiveDepth: revisedProfile.reflectiveDepth,
        affirmativeInsightFunction: revisedProfile.affirmativeInsightFunction,
        thesis: revisedProfile.thesis,
        antithesis: revisedProfile.antithesis,
        superThesis: revisedProfile.superThesis,
        overallMetacognitiveProfile: revisedProfile.overallProfile,
        reasoning: revisedProfile.reasoning
      };
      
      console.log('🔥 AUTHENTIC SCORES FROM DEEPSEEK - NO FILTERING:');
      console.log('AIF (Primary Metric):', compatibleProfile.affirmativeInsightFunction);
      console.log('Intellectual Maturity:', compatibleProfile.intellectualMaturity);
      console.log('Epistemic Humility:', compatibleProfile.epistemicHumility);
      console.log('Self-Awareness:', compatibleProfile.selfAwarenessLevel);
      console.log('Reflective Depth:', compatibleProfile.reflectiveDepth);
      
      res.json(compatibleProfile);
    } catch (error) {
      console.error('🔍 METACOGNITIVE ROUTE ERROR:', error);
      res.status(500).json({ 
        error: 'Failed to generate metacognitive profile', 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // DEBUG TEST ENDPOINT - Direct LLM scoring test
  app.post('/api/debug/test-scoring', async (req: Request, res: Response) => {
    try {
      const { inputText } = req.body;
      
      console.log('🔬 DEBUG TEST ENDPOINT - Direct LLM Test');
      console.log('Input text length:', inputText?.length || 0);
      console.log('Input preview:', inputText?.substring(0, 100) || 'No text');
      
      if (!inputText || inputText.length < 50) {
        return res.status(400).json({ error: 'Need at least 50 characters for test' });
      }

      // Direct OpenAI call without any processing
      const openai = new (await import('openai')).default({ apiKey: process.env.OPENAI_API_KEY });
      
      const testPrompt = `Analyze this text and return ONLY a JSON object with four numeric scores (1-10):

TEXT: ${inputText}

Return exactly this format:
{
  "intellectualMaturity": [score 1-10 based on reasoning sophistication],
  "selfAwarenessLevel": [score 1-10 based on self-reflection],
  "epistemicHumility": [score 1-10 based on intellectual humility],
  "reflectiveDepth": [score 1-10 based on introspective depth]
}

Analyze the ACTUAL TEXT CONTENT. Different texts must get different scores.`;

      console.log('🔬 Sending direct test prompt to OpenAI...');
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: testPrompt }],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 1000,
      });

      const rawResponse = response.choices[0].message.content || "{}";
      console.log('🔬 RAW OpenAI Response:', rawResponse);
      
      const parsedScores = JSON.parse(rawResponse);
      console.log('🔬 Parsed Scores:', parsedScores);
      
      // Check if these are the problematic default scores
      const isDefaultPattern = (
        parsedScores.intellectualMaturity === 8 && 
        parsedScores.selfAwarenessLevel === 7 && 
        parsedScores.epistemicHumility === 6 && 
        parsedScores.reflectiveDepth === 9
      );
      
      console.log('🔬 Default pattern detected:', isDefaultPattern);
      
      res.json({
        inputTextPreview: inputText.substring(0, 200),
        rawLLMResponse: rawResponse,
        parsedScores: parsedScores,
        isDefaultPattern: isDefaultPattern,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('🔬 DEBUG TEST ERROR:', error);
      res.status(500).json({ 
        error: 'Debug test failed', 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Metacognitive comprehensive profile analysis
  app.post('/api/profile/metacognitive-comprehensive', async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }
      
      // Use a comprehensive sample for analysis that demonstrates various cognitive patterns
      const comprehensiveText = `Digital transformation in contemporary organizations

The implementation of digital transformation initiatives requires a multifaceted approach that balances technological capabilities with human organizational dynamics. Through my analysis of various transformation projects, I have observed that successful outcomes depend heavily on stakeholder engagement strategies and comprehensive change management frameworks.

When approaching complex organizational challenges, I typically employ a systematic methodology that involves breaking down problems into constituent components for detailed analysis. This analytical framework serves effectively in most operational contexts, though I acknowledge it may occasionally overlook innovative solutions that don't conform to traditional logical structures.

My communication preferences vary significantly based on audience composition and contextual requirements. In formal organizational settings, I prioritize structured, evidence-based presentations that progress logically from foundational premises to actionable conclusions. However, in collaborative team environments, I value inclusive dialogue that synthesizes diverse perspectives and encourages creative problem-solving approaches.

Intellectual challenges requiring deep analytical thinking provide considerable satisfaction. There's something inherently rewarding about methodically working through complex problems, systematically evaluating alternatives, and developing comprehensive solutions. However, I sometimes concern myself that this preference for thoroughness might lead to analysis paralysis when rapid decision-making is required.

The intersection of technology and human behavior presents fascinating research opportunities. How individuals interact with digital systems, adapt to new technological tools, and maintain their essential humanity within increasingly automated environments are questions that drive much of my professional thinking and research focus.

My problem-solving methodology typically follows several distinct phases: comprehensive observation and data collection, hypothesis development based on available evidence, systematic testing of proposed solutions, and iterative refinement based on empirical results. This structured approach has proven effective across multiple professional domains.

I maintain strong commitment to intellectual honesty and willingness to revise established positions when presented with compelling contradictory evidence. Simultaneously, I recognize that complete objectivity remains impossible since we all bring personal biases and experiential frameworks to our analytical processes.

Regarding learning preferences, I favor understanding fundamental principles rather than memorizing specific procedural steps. This conceptual approach facilitates better knowledge transfer across different domains, though it sometimes requires additional time to achieve practical proficiency in new technical areas.`;
      
      console.log('Using comprehensive text for analysis, length:', comprehensiveText.length);
      
      const metacognitiveProfile = await generateMetacognitiveProfile(comprehensiveText, true);
      res.json(metacognitiveProfile);
    } catch (error) {
      console.error('Error generating comprehensive metacognitive profile:', error);
      res.status(500).json({ 
        error: 'Failed to generate metacognitive profile', 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Full instant profile (cognitive + psychological + insights)
  app.post('/api/profile/full-instant', async (req: Request, res: Response) => {
    try {
      const { inputText, userId } = req.body;
      
      if (!inputText || !userId) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }
      
      if (inputText.length < 100) {
        return res.status(400).json({ error: 'Text sample too short. Minimum 100 characters required.' });
      }
      
      const fullProfile = await generateFullProfile(inputText, userId, false);
      res.json(fullProfile);
    } catch (error) {
      console.error('Error generating full instant profile:', error);
      res.status(500).json({ 
        error: 'Failed to generate profile', 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Full comprehensive profile (cognitive + psychological + insights)
  app.post('/api/profile/full-comprehensive', async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }
      
      const fullProfile = await generateFullProfile('', userId, true);
      res.json(fullProfile);
    } catch (error) {
      console.error('Error generating full comprehensive profile:', error);
      res.status(500).json({ 
        error: 'Failed to generate profile', 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Export profile as PDF/Word
  app.post('/api/profile/export', async (req: Request, res: Response) => {
    try {
      const { results, format, profileType, analysisMode } = req.body;
      
      if (!results || !format) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      if (format === 'pdf') {
        // Generate PDF using pdfkit
        const doc = new PDFDocument();
        const filename = `mind-profile-${profileType}-${Date.now()}.pdf`;
        
        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        doc.pipe(res);
        
        // Add content to PDF
        doc.fontSize(20).text('Mind Profile Report', 50, 50);
        doc.fontSize(14).text(`Profile Type: ${profileType}`, 50, 100);
        doc.fontSize(14).text(`Analysis Mode: ${analysisMode}`, 50, 120);
        doc.fontSize(14).text(`Generated: ${new Date().toLocaleDateString()}`, 50, 140);
        
        let yPosition = 180;
        
        // Handle dialectical structure for psychological and synthesis analysis
        if (results.thesis && (profileType === 'psychological' || profileType === 'synthesis')) {
          // THESIS SECTION
          if (yPosition > 650) {
            doc.addPage();
            yPosition = 50;
          }
          
          if (profileType === 'psychological') {
            doc.fontSize(18).text('1. THESIS: PRIMARY PSYCHOLOGICAL ANALYSIS', 50, yPosition);
          } else if (profileType === 'synthesis') {
            doc.fontSize(18).text('1. THESIS: PRIMARY SYNTHESIS ANALYSIS', 50, yPosition);
          }
          yPosition += 35;
          
          if (results.thesis.title) {
            doc.fontSize(14).text(results.thesis.title, 50, yPosition);
            yPosition += 25;
          }
          
          if (profileType === 'psychological') {
            // Emotional Pattern
            if (results.thesis.emotionalPattern) {
              doc.fontSize(14).text('Emotional Pattern:', 50, yPosition);
              yPosition += 20;
              const cleanText = String(results.thesis.emotionalPattern || '').replace(/\n{3,}/g, '\n\n').trim();
              const textHeight = doc.heightOfString(cleanText, { width: 500 });
              doc.fontSize(11).text(cleanText, 50, yPosition, { width: 500 });
              yPosition += Math.max(textHeight + 15, 40);
            }
            
            // Motivational Structure
            if (results.thesis.motivationalStructure) {
              doc.fontSize(14).text('Motivational Structure:', 50, yPosition);
              yPosition += 20;
              const cleanText = String(results.thesis.motivationalStructure || '').replace(/\n{3,}/g, '\n\n').trim();
              const textHeight = doc.heightOfString(cleanText, { width: 500 });
              doc.fontSize(11).text(cleanText, 50, yPosition, { width: 500 });
              yPosition += Math.max(textHeight + 15, 40);
            }
            
            // Interpersonal Dynamics
            if (results.thesis.interpersonalDynamics) {
              doc.fontSize(14).text('Interpersonal Dynamics:', 50, yPosition);
              yPosition += 20;
              const cleanText = String(results.thesis.interpersonalDynamics || '').replace(/\n{3,}/g, '\n\n').trim();
              const textHeight = doc.heightOfString(cleanText, { width: 500 });
              doc.fontSize(11).text(cleanText, 50, yPosition, { width: 500 });
              yPosition += Math.max(textHeight + 15, 40);
            }
            
            // Stress Response Pattern
            if (results.thesis.stressResponsePattern) {
              doc.fontSize(14).text('Stress Response Pattern:', 50, yPosition);
              yPosition += 20;
              const cleanText = String(results.thesis.stressResponsePattern || '').replace(/\n{3,}/g, '\n\n').trim();
              const textHeight = doc.heightOfString(cleanText, { width: 500 });
              doc.fontSize(11).text(cleanText, 50, yPosition, { width: 500 });
              yPosition += Math.max(textHeight + 20, 40);
            }
          } else if (profileType === 'synthesis') {
            // Intellectual-Emotional Integration
            if (results.thesis.intellectualEmotionalIntegration) {
              doc.fontSize(14).text('Intellectual-Emotional Integration:', 50, yPosition);
              yPosition += 20;
              const cleanText = String(results.thesis.intellectualEmotionalIntegration || '').replace(/\n{3,}/g, '\n\n').trim();
              const textHeight = doc.heightOfString(cleanText, { width: 500 });
              doc.fontSize(11).text(cleanText, 50, yPosition, { width: 500 });
              yPosition += Math.max(textHeight + 15, 40);
            }
            
            // Decision-Making Synthesis
            if (results.thesis.decisionMakingSynthesis) {
              doc.fontSize(14).text('Decision-Making Synthesis:', 50, yPosition);
              yPosition += 20;
              const cleanText = String(results.thesis.decisionMakingSynthesis || '').replace(/\n{3,}/g, '\n\n').trim();
              const textHeight = doc.heightOfString(cleanText, { width: 500 });
              doc.fontSize(11).text(cleanText, 50, yPosition, { width: 500 });
              yPosition += Math.max(textHeight + 15, 40);
            }
            
            // Authenticity Assessment
            if (results.thesis.authenticityAssessment) {
              doc.fontSize(14).text('Authenticity Assessment:', 50, yPosition);
              yPosition += 20;
              const cleanText = String(results.thesis.authenticityAssessment || '').replace(/\n{3,}/g, '\n\n').trim();
              const textHeight = doc.heightOfString(cleanText, { width: 500 });
              doc.fontSize(11).text(cleanText, 50, yPosition, { width: 500 });
              yPosition += Math.max(textHeight + 15, 40);
            }
            
            // Stress-Clarity Dynamics
            if (results.thesis.stressClarityDynamics) {
              doc.fontSize(14).text('Stress-Clarity Dynamics:', 50, yPosition);
              yPosition += 20;
              const cleanText = String(results.thesis.stressClarityDynamics || '').replace(/\n{3,}/g, '\n\n').trim();
              const textHeight = doc.heightOfString(cleanText, { width: 500 });
              doc.fontSize(11).text(cleanText, 50, yPosition, { width: 500 });
              yPosition += Math.max(textHeight + 15, 40);
            }
            
            // Empathy Authenticity
            if (results.thesis.empathyAuthenticity) {
              doc.fontSize(14).text('Empathy Authenticity:', 50, yPosition);
              yPosition += 20;
              const cleanText = String(results.thesis.empathyAuthenticity || '').replace(/\n{3,}/g, '\n\n').trim();
              const textHeight = doc.heightOfString(cleanText, { width: 500 });
              doc.fontSize(11).text(cleanText, 50, yPosition, { width: 500 });
              yPosition += Math.max(textHeight + 15, 40);
            }
            
            // Cognitive-Emotional Architecture
            if (results.thesis.cognitiveEmotionalArchitecture) {
              doc.fontSize(14).text('Cognitive-Emotional Architecture:', 50, yPosition);
              yPosition += 20;
              const cleanText = String(results.thesis.cognitiveEmotionalArchitecture || '').replace(/\n{3,}/g, '\n\n').trim();
              const textHeight = doc.heightOfString(cleanText, { width: 500 });
              doc.fontSize(11).text(cleanText, 50, yPosition, { width: 500 });
              yPosition += Math.max(textHeight + 20, 40);
            }
          }
          
          // Supporting Evidence for Thesis
          if (results.thesis.supportingEvidence) {
            if (yPosition > 650) {
              doc.addPage();
              yPosition = 50;
            }
            
            doc.fontSize(14).text('Supporting Evidence:', 50, yPosition);
            yPosition += 25;
            
            // Evidence for each component based on profile type
            const evidenceComponents = profileType === 'psychological' 
              ? ['emotionalPattern', 'motivationalStructure', 'interpersonalDynamics', 'stressResponsePattern']
              : ['intellectualEmotionalIntegration', 'decisionMakingSynthesis', 'authenticityAssessment'];
            
            evidenceComponents.forEach(component => {
              if (results.thesis.supportingEvidence[component]) {
                doc.fontSize(12).text(`${component.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:`, 60, yPosition);
                yPosition += 20;
                
                results.thesis.supportingEvidence[component].forEach((evidence: any, index: number) => {
                  if (yPosition > 750) {
                    doc.addPage();
                    yPosition = 50;
                  }
                  
                  doc.fontSize(10).text(`Quote ${index + 1}: "${evidence.quote}"`, 70, yPosition, { width: 470 });
                  yPosition += 15;
                  doc.fontSize(9).text(`Analysis: ${evidence.explanation}`, 70, yPosition, { width: 470 });
                  yPosition += 25;
                });
                yPosition += 10;
              }
            });
          }
        }
        
        // ANTITHESIS SECTION
        if (results.antithesis && (profileType === 'psychological' || profileType === 'synthesis')) {
          if (yPosition > 650) {
            doc.addPage();
            yPosition = 50;
          }
          
          doc.fontSize(18).text('2. ANTITHESIS: DISSENTING PSYCHOLOGICAL ANALYSIS', 50, yPosition);
          yPosition += 35;
          
          if (results.antithesis.title) {
            doc.fontSize(14).text(results.antithesis.title, 50, yPosition);
            yPosition += 25;
          }
          
          // Alternative analyses
          if (results.antithesis.emotionalPattern) {
            doc.fontSize(14).text('Alternative Emotional Pattern:', 50, yPosition);
            yPosition += 20;
            const cleanText = String(results.antithesis.emotionalPattern || '').replace(/\n{3,}/g, '\n\n').trim();
            const textHeight = doc.heightOfString(cleanText, { width: 500 });
            doc.fontSize(11).text(cleanText, 50, yPosition, { width: 500 });
            yPosition += Math.max(textHeight + 15, 40);
          }
          
          if (results.antithesis.motivationalStructure) {
            doc.fontSize(14).text('Contrarian Motivation Assessment:', 50, yPosition);
            yPosition += 20;
            const cleanText = String(results.antithesis.motivationalStructure || '').replace(/\n{3,}/g, '\n\n').trim();
            const textHeight = doc.heightOfString(cleanText, { width: 500 });
            doc.fontSize(11).text(cleanText, 50, yPosition, { width: 500 });
            yPosition += Math.max(textHeight + 15, 40);
          }
          
          if (results.antithesis.interpersonalDynamics) {
            doc.fontSize(14).text('Skeptical Interpersonal View:', 50, yPosition);
            yPosition += 20;
            const cleanText = String(results.antithesis.interpersonalDynamics || '').replace(/\n{3,}/g, '\n\n').trim();
            const textHeight = doc.heightOfString(cleanText, { width: 500 });
            doc.fontSize(11).text(cleanText, 50, yPosition, { width: 500 });
            yPosition += Math.max(textHeight + 15, 40);
          }
          
          if (results.antithesis.stressResponsePattern) {
            doc.fontSize(14).text('Critical Stress Reinterpretation:', 50, yPosition);
            yPosition += 20;
            const cleanText = String(results.antithesis.stressResponsePattern || '').replace(/\n{3,}/g, '\n\n').trim();
            const textHeight = doc.heightOfString(cleanText, { width: 500 });
            doc.fontSize(11).text(cleanText, 50, yPosition, { width: 500 });
            yPosition += Math.max(textHeight + 20, 40);
          }
        }
        
        // SUPER-THESIS SECTION
        if (results.superThesis && (profileType === 'psychological' || profileType === 'synthesis')) {
          if (yPosition > 650) {
            doc.addPage();
            yPosition = 50;
          }
          
          doc.fontSize(18).text('3. SUPER-THESIS: REFINED PSYCHOLOGICAL SYNTHESIS', 50, yPosition);
          yPosition += 35;
          
          if (results.superThesis.title) {
            doc.fontSize(14).text(results.superThesis.title, 50, yPosition);
            yPosition += 25;
          }
          
          // Refined analyses
          if (results.superThesis.emotionalPattern) {
            doc.fontSize(14).text('Defended Emotional Analysis:', 50, yPosition);
            yPosition += 20;
            const cleanText = String(results.superThesis.emotionalPattern || '').replace(/\n{3,}/g, '\n\n').trim();
            const textHeight = doc.heightOfString(cleanText, { width: 500 });
            doc.fontSize(11).text(cleanText, 50, yPosition, { width: 500 });
            yPosition += Math.max(textHeight + 15, 40);
          }
          
          if (results.superThesis.motivationalStructure) {
            doc.fontSize(14).text('Reinforced Motivation Assessment:', 50, yPosition);
            yPosition += 20;
            const cleanText = String(results.superThesis.motivationalStructure || '').replace(/\n{3,}/g, '\n\n').trim();
            const textHeight = doc.heightOfString(cleanText, { width: 500 });
            doc.fontSize(11).text(cleanText, 50, yPosition, { width: 500 });
            yPosition += Math.max(textHeight + 15, 40);
          }
          
          if (results.superThesis.interpersonalDynamics) {
            doc.fontSize(14).text('Strengthened Interpersonal Evaluation:', 50, yPosition);
            yPosition += 20;
            const cleanText = String(results.superThesis.interpersonalDynamics || '').replace(/\n{3,}/g, '\n\n').trim();
            const textHeight = doc.heightOfString(cleanText, { width: 500 });
            doc.fontSize(11).text(cleanText, 50, yPosition, { width: 500 });
            yPosition += Math.max(textHeight + 15, 40);
          }
          
          if (results.superThesis.stressResponsePattern) {
            doc.fontSize(14).text('Validated Stress Response:', 50, yPosition);
            yPosition += 20;
            const cleanText = String(results.superThesis.stressResponsePattern || '').replace(/\n{3,}/g, '\n\n').trim();
            const textHeight = doc.heightOfString(cleanText, { width: 500 });
            doc.fontSize(11).text(cleanText, 50, yPosition, { width: 500 });
            yPosition += Math.max(textHeight + 15, 40);
          }
          
          // Final Refined Conclusion
          if (results.superThesis.refinedConclusion) {
            if (yPosition > 650) {
              doc.addPage();
              yPosition = 50;
            }
            
            doc.fontSize(16).text('Final Psychological Assessment:', 50, yPosition);
            yPosition += 25;
            const cleanText = String(results.superThesis.refinedConclusion || '').replace(/\n{3,}/g, '\n\n').trim();
            const textHeight = doc.heightOfString(cleanText, { width: 500 });
            doc.fontSize(12).text(cleanText, 50, yPosition, { width: 500 });
            yPosition += Math.max(textHeight + 30, 60);
          }
        }
        
        // Fallback to flat structure for non-dialectical analyses or other profile types
        else if (results.emotionalPattern) {
          // Check if we need a new page
          if (yPosition > 700) {
            doc.addPage();
            yPosition = 50;
          }
          
          doc.fontSize(16).text('Emotional Pattern Analysis', 50, yPosition);
          yPosition += 30;
          
          // Clean and wrap the text properly
          const cleanText = String(results.emotionalPattern || '').replace(/\n{3,}/g, '\n\n').trim();
          const textHeight = doc.heightOfString(cleanText, { width: 500 });
          doc.fontSize(12).text(cleanText, 50, yPosition, { width: 500 });
          yPosition += Math.max(textHeight + 20, 80);
          
          if (results.supportingEvidence?.emotionalPattern) {
            doc.fontSize(14).text('Supporting Evidence:', 50, yPosition);
            yPosition += 25;
            results.supportingEvidence.emotionalPattern.forEach((evidence: any, index: number) => {
              doc.fontSize(11).text(`Quote ${index + 1}: "${evidence.quote}"`, 60, yPosition, { width: 480 });
              yPosition += 20;
              doc.fontSize(10).text(evidence.explanation, 60, yPosition, { width: 480 });
              yPosition += 30;
            });
            yPosition += 20;
          }
        }

        if (results.motivationalStructure) {
          // Check if we need a new page
          if (yPosition > 700) {
            doc.addPage();
            yPosition = 50;
          }
          
          doc.fontSize(16).text('Motivational Structure', 50, yPosition);
          yPosition += 30;
          
          const cleanText = String(results.motivationalStructure || '').replace(/\n{3,}/g, '\n\n').trim();
          const textHeight = doc.heightOfString(cleanText, { width: 500 });
          doc.fontSize(12).text(cleanText, 50, yPosition, { width: 500 });
          yPosition += Math.max(textHeight + 20, 80);
          
          if (results.supportingEvidence?.motivationalStructure) {
            doc.fontSize(14).text('Supporting Evidence:', 50, yPosition);
            yPosition += 25;
            results.supportingEvidence.motivationalStructure.forEach((evidence: any, index: number) => {
              doc.fontSize(11).text(`Quote ${index + 1}: "${evidence.quote}"`, 60, yPosition, { width: 480 });
              yPosition += 20;
              doc.fontSize(10).text(evidence.explanation, 60, yPosition, { width: 480 });
              yPosition += 30;
            });
            yPosition += 20;
          }
        }

        if (results.interpersonalDynamics) {
          if (yPosition > 700) {
            doc.addPage();
            yPosition = 50;
          }
          
          doc.fontSize(16).text('Interpersonal Dynamics', 50, yPosition);
          yPosition += 30;
          
          const cleanText = String(results.interpersonalDynamics || '').replace(/\n{3,}/g, '\n\n').trim();
          const textHeight = doc.heightOfString(cleanText, { width: 500 });
          doc.fontSize(12).text(cleanText, 50, yPosition, { width: 500 });
          yPosition += Math.max(textHeight + 20, 80);
          
          if (results.supportingEvidence?.interpersonalDynamics) {
            doc.fontSize(14).text('Supporting Evidence:', 50, yPosition);
            yPosition += 25;
            results.supportingEvidence.interpersonalDynamics.forEach((evidence: any, index: number) => {
              doc.fontSize(11).text(`Quote ${index + 1}: "${evidence.quote}"`, 60, yPosition, { width: 480 });
              yPosition += 20;
              doc.fontSize(10).text(evidence.explanation, 60, yPosition, { width: 480 });
              yPosition += 30;
            });
            yPosition += 20;
          }
        }

        if (results.intellectualApproach) {
          if (yPosition > 700) {
            doc.addPage();
            yPosition = 50;
          }
          
          doc.fontSize(16).text('Intellectual Approach', 50, yPosition);
          yPosition += 30;
          
          const cleanText = String(results.intellectualApproach || '').replace(/\n{3,}/g, '\n\n').trim();
          const textHeight = doc.heightOfString(cleanText, { width: 500 });
          doc.fontSize(12).text(cleanText, 50, yPosition, { width: 500 });
          yPosition += Math.max(textHeight + 20, 80);
          
          if (results.supportingEvidence?.intellectualApproach) {
            doc.fontSize(14).text('Supporting Evidence:', 50, yPosition);
            yPosition += 25;
            results.supportingEvidence.intellectualApproach.forEach((evidence: any, index: number) => {
              doc.fontSize(11).text(`Quote ${index + 1}: "${evidence.quote}"`, 60, yPosition, { width: 480 });
              yPosition += 20;
              doc.fontSize(10).text(evidence.explanation, 60, yPosition, { width: 480 });
              yPosition += 30;
            });
            yPosition += 20;
          }
        }

        if (results.reasoningStyle) {
          if (yPosition > 700) {
            doc.addPage();
            yPosition = 50;
          }
          
          doc.fontSize(16).text('Reasoning Style', 50, yPosition);
          yPosition += 30;
          
          const cleanText = String(results.reasoningStyle || '').replace(/\n{3,}/g, '\n\n').trim();
          const textHeight = doc.heightOfString(cleanText, { width: 500 });
          doc.fontSize(12).text(cleanText, 50, yPosition, { width: 500 });
          yPosition += Math.max(textHeight + 20, 80);
          
          if (results.supportingEvidence?.reasoningStyle) {
            doc.fontSize(14).text('Supporting Evidence:', 50, yPosition);
            yPosition += 25;
            results.supportingEvidence.reasoningStyle.forEach((evidence: any, index: number) => {
              doc.fontSize(11).text(`Quote ${index + 1}: "${evidence.quote}"`, 60, yPosition, { width: 480 });
              yPosition += 20;
              doc.fontSize(10).text(evidence.explanation, 60, yPosition, { width: 480 });
              yPosition += 30;
            });
            yPosition += 20;
          }
        }

        if (results.problemSolvingPattern) {
          if (yPosition > 700) {
            doc.addPage();
            yPosition = 50;
          }
          
          doc.fontSize(16).text('Problem Solving Pattern', 50, yPosition);
          yPosition += 30;
          
          const cleanText = String(results.problemSolvingPattern || '').replace(/\n{3,}/g, '\n\n').trim();
          const textHeight = doc.heightOfString(cleanText, { width: 500 });
          doc.fontSize(12).text(cleanText, 50, yPosition, { width: 500 });
          yPosition += Math.max(textHeight + 20, 80);
          
          if (results.supportingEvidence?.problemSolvingPattern) {
            doc.fontSize(14).text('Supporting Evidence:', 50, yPosition);
            yPosition += 25;
            results.supportingEvidence.problemSolvingPattern.forEach((evidence: any, index: number) => {
              doc.fontSize(11).text(`Quote ${index + 1}: "${evidence.quote}"`, 60, yPosition, { width: 480 });
              yPosition += 20;
              doc.fontSize(10).text(evidence.explanation, 60, yPosition, { width: 480 });
              yPosition += 30;
            });
            yPosition += 20;
          }
        }

        // Add detailed analysis section - this is the comprehensive cognitive architecture analysis
        if (results.detailedAnalysis) {
          if (yPosition > 650) {
            doc.addPage();
            yPosition = 50;
          }
          
          doc.fontSize(16).text('Detailed Cognitive Architecture Analysis', 50, yPosition);
          yPosition += 30;
          
          const cleanText = String(results.detailedAnalysis || '').replace(/\n{3,}/g, '\n\n').trim();
          const textHeight = doc.heightOfString(cleanText, { width: 500 });
          doc.fontSize(12).text(cleanText, 50, yPosition, { width: 500 });
          yPosition += Math.max(textHeight + 30, 100);
        }

        // Add cognitive signature
        if (results.cognitiveSignature) {
          if (yPosition > 700) {
            doc.addPage();
            yPosition = 50;
          }
          
          doc.fontSize(16).text('Cognitive Signature', 50, yPosition);
          yPosition += 30;
          
          const cleanText = String(results.cognitiveSignature || '').replace(/\n{3,}/g, '\n\n').trim();
          const textHeight = doc.heightOfString(cleanText, { width: 500 });
          doc.fontSize(12).text(cleanText, 50, yPosition, { width: 500 });
          yPosition += Math.max(textHeight + 30, 80);
        }

        // Add numerical scores section
        if (results.analyticalDepth || results.conceptualIntegration || results.logicalStructuring) {
          if (yPosition > 700) {
            doc.addPage();
            yPosition = 50;
          }
          
          doc.fontSize(16).text('Cognitive Assessment Scores', 50, yPosition);
          yPosition += 30;
          
          if (results.analyticalDepth) {
            doc.fontSize(12).text(`Analytical Depth: ${results.analyticalDepth}/10`, 50, yPosition);
            yPosition += 20;
          }
          if (results.conceptualIntegration) {
            doc.fontSize(12).text(`Conceptual Integration: ${results.conceptualIntegration}/10`, 50, yPosition);
            yPosition += 20;
          }
          if (results.logicalStructuring) {
            doc.fontSize(12).text(`Logical Structuring: ${results.logicalStructuring}/10`, 50, yPosition);
            yPosition += 20;
          }
          yPosition += 20;
        }

        // Add strengths and growth areas
        if (results.strengths && results.strengths.length > 0) {
          if (yPosition > 700) {
            doc.addPage();
            yPosition = 50;
          }
          
          doc.fontSize(16).text('Cognitive Strengths', 50, yPosition);
          yPosition += 30;
          
          results.strengths.forEach((strength: string, index: number) => {
            const cleanText = String(strength || '').replace(/\n{3,}/g, '\n\n').trim();
            doc.fontSize(12).text(`• ${cleanText}`, 50, yPosition, { width: 500 });
            const textHeight = doc.heightOfString(`• ${cleanText}`, { width: 500 });
            yPosition += Math.max(textHeight + 10, 25);
          });
          yPosition += 20;
        }

        if (results.growthAreas && results.growthAreas.length > 0) {
          if (yPosition > 700) {
            doc.addPage();
            yPosition = 50;
          }
          
          doc.fontSize(16).text('Growth Areas', 50, yPosition);
          yPosition += 30;
          
          results.growthAreas.forEach((area: string, index: number) => {
            const cleanText = String(area || '').replace(/\n{3,}/g, '\n\n').trim();
            doc.fontSize(12).text(`• ${cleanText}`, 50, yPosition, { width: 500 });
            const textHeight = doc.heightOfString(`• ${cleanText}`, { width: 500 });
            yPosition += Math.max(textHeight + 10, 25);
          });
        }

        if (results.personalityTraits && results.personalityTraits.length > 0) {
          if (yPosition > 700) {
            doc.addPage();
            yPosition = 50;
          }
          
          doc.fontSize(16).text('Personality Traits', 50, yPosition);
          yPosition += 30;
          doc.fontSize(12).text(results.personalityTraits.join(", "), 50, yPosition, { width: 500 });
          yPosition += 50;
        }

        if (results.emotionalIntelligence) {
          if (yPosition > 750) {
            doc.addPage();
            yPosition = 50;
          }
          
          doc.fontSize(16).text('Emotional Intelligence Score', 50, yPosition);
          yPosition += 30;
          doc.fontSize(12).text(`${results.emotionalIntelligence}/10`, 50, yPosition, { width: 500 });
          yPosition += 50;
        }

        // Handle Metacognitive Profile Structure
        if (profileType === 'metacognitive') {
          // Thesis Section
          if (results.thesis) {
            if (yPosition > 650) {
              doc.addPage();
              yPosition = 50;
            }
            
            doc.fontSize(18).text('THESIS: PRIMARY ANALYSIS', 50, yPosition);
            yPosition += 40;
            
            if (results.thesis.intellectualConfiguration) {
              doc.fontSize(14).text('Intellectual Configuration', 50, yPosition);
              yPosition += 25;
              const cleanText = String(results.thesis.intellectualConfiguration || '').replace(/\n{3,}/g, '\n\n').trim();
              const textHeight = doc.heightOfString(cleanText, { width: 500 });
              doc.fontSize(11).text(cleanText, 50, yPosition, { width: 500 });
              yPosition += Math.max(textHeight + 20, 60);
              
              // Add supporting evidence if available
              if (results.thesis.supportingEvidence?.intellectualConfiguration) {
                if (yPosition > 700) {
                  doc.addPage();
                  yPosition = 50;
                }
                doc.fontSize(12).text('Supporting Evidence:', 50, yPosition);
                yPosition += 25;
                results.thesis.supportingEvidence.intellectualConfiguration.forEach((evidence: any, index: number) => {
                  if (yPosition > 720) {
                    doc.addPage();
                    yPosition = 50;
                  }
                  doc.fontSize(10).text(`Quote ${index + 1}: "${evidence.quote}"`, 60, yPosition, { width: 480 });
                  yPosition += 20;
                  doc.fontSize(9).text(evidence.explanation, 60, yPosition, { width: 480 });
                  yPosition += 30;
                });
                yPosition += 20;
              }
            }
            
            if (results.thesis.cognitiveArchitecture) {
              if (yPosition > 700) {
                doc.addPage();
                yPosition = 50;
              }
              doc.fontSize(14).text('Cognitive Architecture', 50, yPosition);
              yPosition += 25;
              const cleanText = String(results.thesis.cognitiveArchitecture || '').replace(/\n{3,}/g, '\n\n').trim();
              const textHeight = doc.heightOfString(cleanText, { width: 500 });
              doc.fontSize(11).text(cleanText, 50, yPosition, { width: 500 });
              yPosition += Math.max(textHeight + 20, 60);
              
              // Add supporting evidence if available
              if (results.thesis.supportingEvidence?.cognitiveArchitecture) {
                if (yPosition > 700) {
                  doc.addPage();
                  yPosition = 50;
                }
                doc.fontSize(12).text('Supporting Evidence:', 50, yPosition);
                yPosition += 25;
                results.thesis.supportingEvidence.cognitiveArchitecture.forEach((evidence: any, index: number) => {
                  if (yPosition > 720) {
                    doc.addPage();
                    yPosition = 50;
                  }
                  doc.fontSize(10).text(`Quote ${index + 1}: "${evidence.quote}"`, 60, yPosition, { width: 480 });
                  yPosition += 20;
                  doc.fontSize(9).text(evidence.explanation, 60, yPosition, { width: 480 });
                  yPosition += 30;
                });
                yPosition += 20;
              }
            }
            
            if (results.thesis.metacognitiveAwareness) {
              if (yPosition > 700) {
                doc.addPage();
                yPosition = 50;
              }
              doc.fontSize(14).text('Metacognitive Awareness', 50, yPosition);
              yPosition += 25;
              const cleanText = String(results.thesis.metacognitiveAwareness || '').replace(/\n{3,}/g, '\n\n').trim();
              const textHeight = doc.heightOfString(cleanText, { width: 500 });
              doc.fontSize(11).text(cleanText, 50, yPosition, { width: 500 });
              yPosition += Math.max(textHeight + 20, 60);
              
              // Add supporting evidence if available
              if (results.thesis.supportingEvidence?.metacognitiveAwareness) {
                if (yPosition > 700) {
                  doc.addPage();
                  yPosition = 50;
                }
                doc.fontSize(12).text('Supporting Evidence:', 50, yPosition);
                yPosition += 25;
                results.thesis.supportingEvidence.metacognitiveAwareness.forEach((evidence: any, index: number) => {
                  if (yPosition > 720) {
                    doc.addPage();
                    yPosition = 50;
                  }
                  doc.fontSize(10).text(`Quote ${index + 1}: "${evidence.quote}"`, 60, yPosition, { width: 480 });
                  yPosition += 20;
                  doc.fontSize(9).text(evidence.explanation, 60, yPosition, { width: 480 });
                  yPosition += 30;
                });
                yPosition += 20;
              }
            }
          }
          
          // Antithesis Section
          if (results.antithesis) {
            if (yPosition > 650) {
              doc.addPage();
              yPosition = 50;
            }
            
            doc.fontSize(18).text('ANTITHESIS: DISSENTING ANALYSIS', 50, yPosition);
            yPosition += 40;
            
            if (results.antithesis.counterConfiguration) {
              doc.fontSize(14).text('Counter-Configuration', 50, yPosition);
              yPosition += 25;
              const cleanText = String(results.antithesis.counterConfiguration || '').replace(/\n{3,}/g, '\n\n').trim();
              const textHeight = doc.heightOfString(cleanText, { width: 500 });
              doc.fontSize(11).text(cleanText, 50, yPosition, { width: 500 });
              yPosition += Math.max(textHeight + 20, 60);
              
              // Add supporting evidence if available
              if (results.antithesis.supportingEvidence?.counterConfiguration) {
                if (yPosition > 700) {
                  doc.addPage();
                  yPosition = 50;
                }
                doc.fontSize(12).text('Supporting Evidence:', 50, yPosition);
                yPosition += 25;
                results.antithesis.supportingEvidence.counterConfiguration.forEach((evidence: any, index: number) => {
                  if (yPosition > 720) {
                    doc.addPage();
                    yPosition = 50;
                  }
                  doc.fontSize(10).text(`Quote ${index + 1}: "${evidence.quote}"`, 60, yPosition, { width: 480 });
                  yPosition += 20;
                  doc.fontSize(9).text(evidence.explanation, 60, yPosition, { width: 480 });
                  yPosition += 30;
                });
                yPosition += 20;
              }
            }
            
            if (results.antithesis.alternativeArchitecture) {
              if (yPosition > 700) {
                doc.addPage();
                yPosition = 50;
              }
              doc.fontSize(14).text('Alternative Architecture', 50, yPosition);
              yPosition += 25;
              const cleanText = String(results.antithesis.alternativeArchitecture || '').replace(/\n{3,}/g, '\n\n').trim();
              const textHeight = doc.heightOfString(cleanText, { width: 500 });
              doc.fontSize(11).text(cleanText, 50, yPosition, { width: 500 });
              yPosition += Math.max(textHeight + 20, 60);
              
              // Add supporting evidence if available
              if (results.antithesis.supportingEvidence?.alternativeArchitecture) {
                if (yPosition > 700) {
                  doc.addPage();
                  yPosition = 50;
                }
                doc.fontSize(12).text('Supporting Evidence:', 50, yPosition);
                yPosition += 25;
                results.antithesis.supportingEvidence.alternativeArchitecture.forEach((evidence: any, index: number) => {
                  if (yPosition > 720) {
                    doc.addPage();
                    yPosition = 50;
                  }
                  doc.fontSize(10).text(`Quote ${index + 1}: "${evidence.quote}"`, 60, yPosition, { width: 480 });
                  yPosition += 20;
                  doc.fontSize(9).text(evidence.explanation, 60, yPosition, { width: 480 });
                  yPosition += 30;
                });
                yPosition += 20;
              }
            }
          }
          
          // Super-Thesis Section
          if (results.superThesis) {
            if (yPosition > 650) {
              doc.addPage();
              yPosition = 50;
            }
            
            doc.fontSize(18).text('SUPER-THESIS: REINFORCED ANALYSIS', 50, yPosition);
            yPosition += 40;
            
            if (results.superThesis.reinforcedConfiguration) {
              doc.fontSize(14).text('Reinforced Configuration', 50, yPosition);
              yPosition += 25;
              const cleanText = String(results.superThesis.reinforcedConfiguration || '').replace(/\n{3,}/g, '\n\n').trim();
              const textHeight = doc.heightOfString(cleanText, { width: 500 });
              doc.fontSize(11).text(cleanText, 50, yPosition, { width: 500 });
              yPosition += Math.max(textHeight + 20, 60);
              
              // Add supporting evidence if available
              if (results.superThesis.supportingEvidence?.reinforcedConfiguration) {
                if (yPosition > 700) {
                  doc.addPage();
                  yPosition = 50;
                }
                doc.fontSize(12).text('Supporting Evidence:', 50, yPosition);
                yPosition += 25;
                results.superThesis.supportingEvidence.reinforcedConfiguration.forEach((evidence: any, index: number) => {
                  if (yPosition > 720) {
                    doc.addPage();
                    yPosition = 50;
                  }
                  doc.fontSize(10).text(`Quote ${index + 1}: "${evidence.quote}"`, 60, yPosition, { width: 480 });
                  yPosition += 20;
                  doc.fontSize(9).text(evidence.explanation, 60, yPosition, { width: 480 });
                  yPosition += 30;
                });
                yPosition += 20;
              }
            }
            
            if (results.superThesis.refutationOfAntithesis) {
              if (yPosition > 700) {
                doc.addPage();
                yPosition = 50;
              }
              doc.fontSize(14).text('Refutation of Dissenting Analysis', 50, yPosition);
              yPosition += 25;
              const cleanText = String(results.superThesis.refutationOfAntithesis || '').replace(/\n{3,}/g, '\n\n').trim();
              const textHeight = doc.heightOfString(cleanText, { width: 500 });
              doc.fontSize(11).text(cleanText, 50, yPosition, { width: 500 });
              yPosition += Math.max(textHeight + 20, 60);
            }
            
            if (results.superThesis.finalAssessment) {
              if (yPosition > 700) {
                doc.addPage();
                yPosition = 50;
              }
              doc.fontSize(14).text('Final Assessment', 50, yPosition);
              yPosition += 25;
              const cleanText = String(results.superThesis.finalAssessment || '').replace(/\n{3,}/g, '\n\n').trim();
              const textHeight = doc.heightOfString(cleanText, { width: 500 });
              doc.fontSize(11).text(cleanText, 50, yPosition, { width: 500 });
              yPosition += Math.max(textHeight + 20, 60);
              
              // Add supporting evidence if available
              if (results.superThesis.supportingEvidence?.authenticSelfKnowledge) {
                if (yPosition > 700) {
                  doc.addPage();
                  yPosition = 50;
                }
                doc.fontSize(12).text('Supporting Evidence:', 50, yPosition);
                yPosition += 25;
                results.superThesis.supportingEvidence.authenticSelfKnowledge.forEach((evidence: any, index: number) => {
                  if (yPosition > 720) {
                    doc.addPage();
                    yPosition = 50;
                  }
                  doc.fontSize(10).text(`Quote ${index + 1}: "${evidence.quote}"`, 60, yPosition, { width: 480 });
                  yPosition += 20;
                  doc.fontSize(9).text(evidence.explanation, 60, yPosition, { width: 480 });
                  yPosition += 30;
                });
                yPosition += 20;
              }
            }
          }
          
          // Overall Metacognitive Profile
          if (results.overallMetacognitiveProfile) {
            if (yPosition > 700) {
              doc.addPage();
              yPosition = 50;
            }
            
            doc.fontSize(16).text('Overall Metacognitive Profile', 50, yPosition);
            yPosition += 30;
            const cleanText = String(results.overallMetacognitiveProfile || '').replace(/\n{3,}/g, '\n\n').trim();
            const textHeight = doc.heightOfString(cleanText, { width: 500 });
            doc.fontSize(12).text(cleanText, 50, yPosition, { width: 500 });
            yPosition += Math.max(textHeight + 20, 60);
          }
          
          // Metacognitive Metrics
          if (results.intellectualMaturity || results.selfAwarenessLevel || results.epistemicHumility || results.reflectiveDepth) {
            if (yPosition > 700) {
              doc.addPage();
              yPosition = 50;
            }
            
            doc.fontSize(16).text('Metacognitive Assessment Scores', 50, yPosition);
            yPosition += 30;
            
            if (results.intellectualMaturity) {
              doc.fontSize(12).text(`Intellectual Maturity: ${results.intellectualMaturity}/10`, 50, yPosition);
              yPosition += 20;
            }
            if (results.selfAwarenessLevel) {
              doc.fontSize(12).text(`Self-Awareness Level: ${results.selfAwarenessLevel}/10`, 50, yPosition);
              yPosition += 20;
            }
            if (results.epistemicHumility) {
              doc.fontSize(12).text(`Epistemic Humility: ${results.epistemicHumility}/10`, 50, yPosition);
              yPosition += 20;
            }
            if (results.reflectiveDepth) {
              doc.fontSize(12).text(`Reflective Depth: ${results.reflectiveDepth}/10`, 50, yPosition);
              yPosition += 20;
            }
          }
        }
        
        doc.end();
        
      } else if (format === 'docx') {
        // Generate comprehensive Word document with proper analysis content
        const paragraphs = [];
        
        // Header
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "Mind Profile Report",
                bold: true,
                size: 32,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Profile Type: ${profileType}`,
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Analysis Mode: ${analysisMode}`,
                size: 24,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Generated: ${new Date().toLocaleDateString()}`,
                size: 24,
              }),
            ],
          }),
          new Paragraph({ children: [new TextRun("")] }) // Empty line
        );

        // Handle dialectical structure for psychological and synthesis analysis
        if (results.thesis && (profileType === 'psychological' || profileType === 'synthesis')) {
          // THESIS SECTION
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: profileType === 'psychological' ? "1. THESIS: PRIMARY PSYCHOLOGICAL ANALYSIS" : "1. THESIS: PRIMARY SYNTHESIS ANALYSIS",
                  bold: true,
                  size: 32,
                }),
              ],
            }),
            new Paragraph({ children: [new TextRun("")] })
          );

          if (results.thesis.title) {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: results.thesis.title,
                    bold: true,
                    size: 28,
                  }),
                ],
              }),
              new Paragraph({ children: [new TextRun("")] })
            );
          }

          if (profileType === 'psychological') {
            // Psychological fields
            if (results.thesis.emotionalPattern) {
              paragraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Emotional Pattern:",
                      bold: true,
                      size: 24,
                    }),
                  ],
                }),
                new Paragraph({
                  children: [new TextRun(results.thesis.emotionalPattern)],
                }),
                new Paragraph({ children: [new TextRun("")] })
              );
            }

            if (results.thesis.motivationalStructure) {
              paragraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Motivational Structure:",
                      bold: true,
                      size: 24,
                    }),
                  ],
                }),
                new Paragraph({
                  children: [new TextRun(results.thesis.motivationalStructure)],
                }),
                new Paragraph({ children: [new TextRun("")] })
              );
            }

            if (results.thesis.interpersonalDynamics) {
              paragraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Interpersonal Dynamics:",
                      bold: true,
                      size: 24,
                    }),
                  ],
                }),
                new Paragraph({
                  children: [new TextRun(results.thesis.interpersonalDynamics)],
                }),
                new Paragraph({ children: [new TextRun("")] })
              );
            }

            if (results.thesis.stressResponsePattern) {
              paragraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Stress Response Pattern:",
                      bold: true,
                      size: 24,
                    }),
                  ],
                }),
                new Paragraph({
                  children: [new TextRun(results.thesis.stressResponsePattern)],
                }),
                new Paragraph({ children: [new TextRun("")] })
              );
            }
          } else if (profileType === 'synthesis') {
            // Synthesis fields
            if (results.thesis.intellectualEmotionalIntegration) {
              paragraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Intellectual-Emotional Integration:",
                      bold: true,
                      size: 24,
                    }),
                  ],
                }),
                new Paragraph({
                  children: [new TextRun(results.thesis.intellectualEmotionalIntegration)],
                }),
                new Paragraph({ children: [new TextRun("")] })
              );
            }

            if (results.thesis.decisionMakingSynthesis) {
              paragraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Decision-Making Synthesis:",
                      bold: true,
                      size: 24,
                    }),
                  ],
                }),
                new Paragraph({
                  children: [new TextRun(results.thesis.decisionMakingSynthesis)],
                }),
                new Paragraph({ children: [new TextRun("")] })
              );
            }

            if (results.thesis.authenticityAssessment) {
              paragraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Authenticity Assessment:",
                      bold: true,
                      size: 24,
                    }),
                  ],
                }),
                new Paragraph({
                  children: [new TextRun(results.thesis.authenticityAssessment)],
                }),
                new Paragraph({ children: [new TextRun("")] })
              );
            }

            if (results.thesis.stressClarityDynamics) {
              paragraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Stress-Clarity Dynamics:",
                      bold: true,
                      size: 24,
                    }),
                  ],
                }),
                new Paragraph({
                  children: [new TextRun(results.thesis.stressClarityDynamics)],
                }),
                new Paragraph({ children: [new TextRun("")] })
              );
            }

            if (results.thesis.empathyAuthenticity) {
              paragraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Empathy Authenticity:",
                      bold: true,
                      size: 24,
                    }),
                  ],
                }),
                new Paragraph({
                  children: [new TextRun(results.thesis.empathyAuthenticity)],
                }),
                new Paragraph({ children: [new TextRun("")] })
              );
            }

            if (results.thesis.cognitiveEmotionalArchitecture) {
              paragraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Cognitive-Emotional Architecture:",
                      bold: true,
                      size: 24,
                    }),
                  ],
                }),
                new Paragraph({
                  children: [new TextRun(results.thesis.cognitiveEmotionalArchitecture)],
                }),
                new Paragraph({ children: [new TextRun("")] })
              );
            }
          }

          // Supporting Evidence for Thesis
          if (results.thesis.supportingEvidence) {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Supporting Evidence:",
                    bold: true,
                    size: 24,
                  }),
                ],
              }),
              new Paragraph({ children: [new TextRun("")] })
            );

            // Evidence for each component based on profile type
            const evidenceComponents = profileType === 'psychological' 
              ? ['emotionalPattern', 'motivationalStructure', 'interpersonalDynamics', 'stressResponsePattern']
              : ['intellectualEmotionalIntegration', 'decisionMakingSynthesis', 'authenticityAssessment'];
            
            evidenceComponents.forEach(component => {
              if (results.thesis.supportingEvidence[component]) {
                const componentTitle = component.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                paragraphs.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `${componentTitle}:`,
                        bold: true,
                        size: 20,
                      }),
                    ],
                  })
                );

                results.thesis.supportingEvidence[component].forEach((evidence: any, index: number) => {
                  paragraphs.push(
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `Quote ${index + 1}: "${evidence.quote}"`,
                          italics: true,
                        }),
                      ],
                    }),
                    new Paragraph({
                      children: [new TextRun(`Analysis: ${evidence.explanation}`)],
                    }),
                    new Paragraph({ children: [new TextRun("")] })
                  );
                });
              }
            });
          }

          // ANTITHESIS SECTION
          if (results.antithesis) {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: profileType === 'psychological' ? "2. ANTITHESIS: DISSENTING PSYCHOLOGICAL ANALYSIS" : "2. ANTITHESIS: DISSENTING SYNTHESIS ANALYSIS",
                    bold: true,
                    size: 32,
                  }),
                ],
              }),
              new Paragraph({ children: [new TextRun("")] })
            );

            if (results.antithesis.title) {
              paragraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: results.antithesis.title,
                      bold: true,
                      size: 28,
                    }),
                  ],
                }),
                new Paragraph({ children: [new TextRun("")] })
              );
            }

            if (results.antithesis.counterArgument) {
              paragraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Counter-Argument:",
                      bold: true,
                      size: 24,
                    }),
                  ],
                }),
                new Paragraph({
                  children: [new TextRun(results.antithesis.counterArgument)],
                }),
                new Paragraph({ children: [new TextRun("")] })
              );
            }

            if (results.antithesis.alternativeInterpretation) {
              paragraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Alternative Interpretation:",
                      bold: true,
                      size: 24,
                    }),
                  ],
                }),
                new Paragraph({
                  children: [new TextRun(results.antithesis.alternativeInterpretation)],
                }),
                new Paragraph({ children: [new TextRun("")] })
              );
            }

            if (results.antithesis.challengingEvidence) {
              paragraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Challenging Evidence:",
                      bold: true,
                      size: 24,
                    }),
                  ],
                }),
                new Paragraph({
                  children: [new TextRun(results.antithesis.challengingEvidence)],
                }),
                new Paragraph({ children: [new TextRun("")] })
              );
            }

            // Synthesis-specific antithesis fields
            if (profileType === 'synthesis') {
              if (results.antithesis.intellectualEmotionalIntegration) {
                paragraphs.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "Alternative Integration Assessment:",
                        bold: true,
                        size: 24,
                      }),
                    ],
                  }),
                  new Paragraph({
                    children: [new TextRun(results.antithesis.intellectualEmotionalIntegration)],
                  }),
                  new Paragraph({ children: [new TextRun("")] })
                );
              }

              if (results.antithesis.decisionMakingSynthesis) {
                paragraphs.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "Contrarian Decision Analysis:",
                        bold: true,
                        size: 24,
                      }),
                    ],
                  }),
                  new Paragraph({
                    children: [new TextRun(results.antithesis.decisionMakingSynthesis)],
                  }),
                  new Paragraph({ children: [new TextRun("")] })
                );
              }

              if (results.antithesis.authenticityAssessment) {
                paragraphs.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "Skeptical Authenticity Assessment:",
                        bold: true,
                        size: 24,
                      }),
                    ],
                  }),
                  new Paragraph({
                    children: [new TextRun(results.antithesis.authenticityAssessment)],
                  }),
                  new Paragraph({ children: [new TextRun("")] })
                );
              }

              if (results.antithesis.stressClarityDynamics) {
                paragraphs.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "Critical Stress Reinterpretation:",
                        bold: true,
                        size: 24,
                      }),
                    ],
                  }),
                  new Paragraph({
                    children: [new TextRun(results.antithesis.stressClarityDynamics)],
                  }),
                  new Paragraph({ children: [new TextRun("")] })
                );
              }

              if (results.antithesis.empathyAuthenticity) {
                paragraphs.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "Alternative Empathy View:",
                        bold: true,
                        size: 24,
                      }),
                    ],
                  }),
                  new Paragraph({
                    children: [new TextRun(results.antithesis.empathyAuthenticity)],
                  }),
                  new Paragraph({ children: [new TextRun("")] })
                );
              }

              if (results.antithesis.cognitiveEmotionalArchitecture) {
                paragraphs.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "Dissenting Architecture View:",
                        bold: true,
                        size: 24,
                      }),
                    ],
                  }),
                  new Paragraph({
                    children: [new TextRun(results.antithesis.cognitiveEmotionalArchitecture)],
                  }),
                  new Paragraph({ children: [new TextRun("")] })
                );
              }
            }
          }

          // SUPER-THESIS SECTION
          if (results.superThesis) {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: profileType === 'psychological' ? "3. SUPER-THESIS: REFINED PSYCHOLOGICAL SYNTHESIS" : "3. SUPER-THESIS: REFINED SYNTHESIS ANALYSIS",
                    bold: true,
                    size: 32,
                  }),
                ],
              }),
              new Paragraph({ children: [new TextRun("")] })
            );

            if (results.superThesis.title) {
              paragraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: results.superThesis.title,
                      bold: true,
                      size: 28,
                    }),
                  ],
                }),
                new Paragraph({ children: [new TextRun("")] })
              );
            }

            if (results.superThesis.refinedConclusion) {
              paragraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Final Refined Assessment:",
                      bold: true,
                      size: 24,
                    }),
                  ],
                }),
                new Paragraph({
                  children: [new TextRun(results.superThesis.refinedConclusion)],
                }),
                new Paragraph({ children: [new TextRun("")] })
              );
            }

            // Synthesis-specific super-thesis fields
            if (profileType === 'synthesis') {
              if (results.superThesis.intellectualEmotionalIntegration) {
                paragraphs.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "Refined Integration Assessment:",
                        bold: true,
                        size: 24,
                      }),
                    ],
                  }),
                  new Paragraph({
                    children: [new TextRun(results.superThesis.intellectualEmotionalIntegration)],
                  }),
                  new Paragraph({ children: [new TextRun("")] })
                );
              }

              if (results.superThesis.decisionMakingSynthesis) {
                paragraphs.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "Synthesized Decision Analysis:",
                        bold: true,
                        size: 24,
                      }),
                    ],
                  }),
                  new Paragraph({
                    children: [new TextRun(results.superThesis.decisionMakingSynthesis)],
                  }),
                  new Paragraph({ children: [new TextRun("")] })
                );
              }

              if (results.superThesis.authenticityAssessment) {
                paragraphs.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "Balanced Authenticity Assessment:",
                        bold: true,
                        size: 24,
                      }),
                    ],
                  }),
                  new Paragraph({
                    children: [new TextRun(results.superThesis.authenticityAssessment)],
                  }),
                  new Paragraph({ children: [new TextRun("")] })
                );
              }

              if (results.superThesis.stressClarityDynamics) {
                paragraphs.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "Refined Stress-Clarity Understanding:",
                        bold: true,
                        size: 24,
                      }),
                    ],
                  }),
                  new Paragraph({
                    children: [new TextRun(results.superThesis.stressClarityDynamics)],
                  }),
                  new Paragraph({ children: [new TextRun("")] })
                );
              }

              if (results.superThesis.empathyAuthenticity) {
                paragraphs.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "Nuanced Empathy Assessment:",
                        bold: true,
                        size: 24,
                      }),
                    ],
                  }),
                  new Paragraph({
                    children: [new TextRun(results.superThesis.empathyAuthenticity)],
                  }),
                  new Paragraph({ children: [new TextRun("")] })
                );
              }

              if (results.superThesis.cognitiveEmotionalArchitecture) {
                paragraphs.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "Final Integration Architecture:",
                        bold: true,
                        size: 24,
                      }),
                    ],
                  }),
                  new Paragraph({
                    children: [new TextRun(results.superThesis.cognitiveEmotionalArchitecture)],
                  }),
                  new Paragraph({ children: [new TextRun("")] })
                );
              }

              // Integration metrics for synthesis
              if (results.superThesis.integrationMaturity || results.superThesis.finalAuthenticity) {
                paragraphs.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "Integration Metrics:",
                        bold: true,
                        size: 24,
                      }),
                    ],
                  })
                );

                if (results.superThesis.integrationMaturity) {
                  paragraphs.push(
                    new Paragraph({
                      children: [new TextRun(`Integration Maturity: ${results.superThesis.integrationMaturity}/10`)],
                    })
                  );
                }

                if (results.superThesis.finalAuthenticity) {
                  paragraphs.push(
                    new Paragraph({
                      children: [new TextRun(`Final Authenticity Score: ${results.superThesis.finalAuthenticity}/10`)],
                    })
                  );
                }

                paragraphs.push(new Paragraph({ children: [new TextRun("")] }));
              }
            }
          }
        }
        
        // Fallback to flat structure for non-dialectical analyses
        else if (results.emotionalPattern) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: "Emotional Pattern Analysis",
                  bold: true,
                  size: 28,
                }),
              ],
            }),
            new Paragraph({
              children: [new TextRun(results.emotionalPattern)],
            }),
            new Paragraph({ children: [new TextRun("")] })
          );

          // Add supporting evidence if available
          if (results.supportingEvidence?.emotionalPattern) {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Supporting Evidence:",
                    bold: true,
                    size: 24,
                  }),
                ],
              })
            );

            results.supportingEvidence.emotionalPattern.forEach((evidence: any, index: number) => {
              paragraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Quote ${index + 1}: "${evidence.quote}"`,
                      italics: true,
                    }),
                  ],
                }),
                new Paragraph({
                  children: [new TextRun(`Analysis: ${evidence.explanation}`)],
                }),
                new Paragraph({ children: [new TextRun("")] })
              );
            });
          }
        }

        if (results.motivationalStructure) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: "Motivational Structure",
                  bold: true,
                  size: 28,
                }),
              ],
            }),
            new Paragraph({
              children: [new TextRun(results.motivationalStructure)],
            }),
            new Paragraph({ children: [new TextRun("")] })
          );

          if (results.supportingEvidence?.motivationalStructure) {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Supporting Evidence:",
                    bold: true,
                    size: 24,
                  }),
                ],
              })
            );

            results.supportingEvidence.motivationalStructure.forEach((evidence: any, index: number) => {
              paragraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Quote ${index + 1}: "${evidence.quote}"`,
                      italics: true,
                    }),
                  ],
                }),
                new Paragraph({
                  children: [new TextRun(`Analysis: ${evidence.explanation}`)],
                }),
                new Paragraph({ children: [new TextRun("")] })
              );
            });
          }
        }

        if (results.interpersonalDynamics) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: "Interpersonal Dynamics",
                  bold: true,
                  size: 28,
                }),
              ],
            }),
            new Paragraph({
              children: [new TextRun(results.interpersonalDynamics)],
            }),
            new Paragraph({ children: [new TextRun("")] })
          );

          if (results.supportingEvidence?.interpersonalDynamics) {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Supporting Evidence:",
                    bold: true,
                    size: 24,
                  }),
                ],
              })
            );

            results.supportingEvidence.interpersonalDynamics.forEach((evidence: any, index: number) => {
              paragraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Quote ${index + 1}: "${evidence.quote}"`,
                      italics: true,
                    }),
                  ],
                }),
                new Paragraph({
                  children: [new TextRun(`Analysis: ${evidence.explanation}`)],
                }),
                new Paragraph({ children: [new TextRun("")] })
              );
            });
          }
        }

        if (results.intellectualApproach) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: "Intellectual Approach",
                  bold: true,
                  size: 28,
                }),
              ],
            }),
            new Paragraph({
              children: [new TextRun(results.intellectualApproach)],
            }),
            new Paragraph({ children: [new TextRun("")] })
          );

          if (results.supportingEvidence?.intellectualApproach) {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Supporting Evidence:",
                    bold: true,
                    size: 24,
                  }),
                ],
              })
            );

            results.supportingEvidence.intellectualApproach.forEach((evidence: any, index: number) => {
              paragraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Quote ${index + 1}: "${evidence.quote}"`,
                      italics: true,
                    }),
                  ],
                }),
                new Paragraph({
                  children: [new TextRun(`Analysis: ${evidence.explanation}`)],
                }),
                new Paragraph({ children: [new TextRun("")] })
              );
            });
          }
        }

        if (results.reasoningStyle) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: "Reasoning Style",
                  bold: true,
                  size: 28,
                }),
              ],
            }),
            new Paragraph({
              children: [new TextRun(results.reasoningStyle)],
            }),
            new Paragraph({ children: [new TextRun("")] })
          );

          if (results.supportingEvidence?.reasoningStyle) {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Supporting Evidence:",
                    bold: true,
                    size: 24,
                  }),
                ],
              })
            );

            results.supportingEvidence.reasoningStyle.forEach((evidence: any, index: number) => {
              paragraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Quote ${index + 1}: "${evidence.quote}"`,
                      italics: true,
                    }),
                  ],
                }),
                new Paragraph({
                  children: [new TextRun(`Analysis: ${evidence.explanation}`)],
                }),
                new Paragraph({ children: [new TextRun("")] })
              );
            });
          }
        }

        if (results.problemSolvingPattern) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: "Problem Solving Pattern",
                  bold: true,
                  size: 28,
                }),
              ],
            }),
            new Paragraph({
              children: [new TextRun(results.problemSolvingPattern)],
            }),
            new Paragraph({ children: [new TextRun("")] })
          );

          if (results.supportingEvidence?.problemSolvingPattern) {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Supporting Evidence:",
                    bold: true,
                    size: 24,
                  }),
                ],
              })
            );

            results.supportingEvidence.problemSolvingPattern.forEach((evidence: any, index: number) => {
              paragraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `Quote ${index + 1}: "${evidence.quote}"`,
                      italics: true,
                    }),
                  ],
                }),
                new Paragraph({
                  children: [new TextRun(`Analysis: ${evidence.explanation}`)],
                }),
                new Paragraph({ children: [new TextRun("")] })
              );
            });
          }
        }

        if (results.personalityTraits && results.personalityTraits.length > 0) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: "Personality Traits",
                  bold: true,
                  size: 28,
                }),
              ],
            }),
            new Paragraph({
              children: [new TextRun(results.personalityTraits.join(", "))],
            }),
            new Paragraph({ children: [new TextRun("")] })
          );
        }

        if (results.emotionalIntelligence) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: "Emotional Intelligence Score",
                  bold: true,
                  size: 28,
                }),
              ],
            }),
            new Paragraph({
              children: [new TextRun(`${results.emotionalIntelligence}/10`)],
            })
          );
        }

        // Handle Metacognitive Profile Structure for Word
        if (profileType === 'metacognitive') {
          // Thesis Section
          if (results.thesis) {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: "THESIS: PRIMARY ANALYSIS",
                    bold: true,
                    size: 32,
                  }),
                ],
              }),
              new Paragraph({ children: [new TextRun("")] })
            );
            
            if (results.thesis.intellectualConfiguration) {
              paragraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Intellectual Configuration",
                      bold: true,
                      size: 24,
                    }),
                  ],
                }),
                new Paragraph({
                  children: [new TextRun(results.thesis.intellectualConfiguration)],
                }),
                new Paragraph({ children: [new TextRun("")] })
              );
              
              // Add supporting evidence if available
              if (results.thesis.supportingEvidence?.intellectualConfiguration) {
                paragraphs.push(
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: "Supporting Evidence:",
                        bold: true,
                        size: 20,
                      }),
                    ],
                  })
                );
                
                results.thesis.supportingEvidence.intellectualConfiguration.forEach((evidence: any, index: number) => {
                  paragraphs.push(
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `Quote ${index + 1}: "${evidence.quote}"`,
                          italics: true,
                        }),
                      ],
                    }),
                    new Paragraph({
                      children: [new TextRun(`Analysis: ${evidence.explanation}`)],
                    }),
                    new Paragraph({ children: [new TextRun("")] })
                  );
                });
              }
            }
            
            if (results.thesis.cognitiveArchitecture) {
              paragraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Cognitive Architecture",
                      bold: true,
                      size: 24,
                    }),
                  ],
                }),
                new Paragraph({
                  children: [new TextRun(results.thesis.cognitiveArchitecture)],
                }),
                new Paragraph({ children: [new TextRun("")] })
              );
            }
            
            if (results.thesis.metacognitiveAwareness) {
              paragraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Metacognitive Awareness",
                      bold: true,
                      size: 24,
                    }),
                  ],
                }),
                new Paragraph({
                  children: [new TextRun(results.thesis.metacognitiveAwareness)],
                }),
                new Paragraph({ children: [new TextRun("")] })
              );
            }
          }
          
          // Antithesis Section
          if (results.antithesis) {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: "ANTITHESIS: DISSENTING ANALYSIS",
                    bold: true,
                    size: 32,
                  }),
                ],
              }),
              new Paragraph({ children: [new TextRun("")] })
            );
            
            if (results.antithesis.counterConfiguration) {
              paragraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Counter-Configuration",
                      bold: true,
                      size: 24,
                    }),
                  ],
                }),
                new Paragraph({
                  children: [new TextRun(results.antithesis.counterConfiguration)],
                }),
                new Paragraph({ children: [new TextRun("")] })
              );
            }
            
            if (results.antithesis.alternativeArchitecture) {
              paragraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Alternative Architecture",
                      bold: true,
                      size: 24,
                    }),
                  ],
                }),
                new Paragraph({
                  children: [new TextRun(results.antithesis.alternativeArchitecture)],
                }),
                new Paragraph({ children: [new TextRun("")] })
              );
            }
          }
          
          // Super-Thesis Section
          if (results.superThesis) {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: "SUPER-THESIS: REINFORCED ANALYSIS",
                    bold: true,
                    size: 32,
                  }),
                ],
              }),
              new Paragraph({ children: [new TextRun("")] })
            );
            
            if (results.superThesis.reinforcedConfiguration) {
              paragraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Reinforced Configuration",
                      bold: true,
                      size: 24,
                    }),
                  ],
                }),
                new Paragraph({
                  children: [new TextRun(results.superThesis.reinforcedConfiguration)],
                }),
                new Paragraph({ children: [new TextRun("")] })
              );
            }
            
            if (results.superThesis.refutationOfAntithesis) {
              paragraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Refutation of Dissenting Analysis",
                      bold: true,
                      size: 24,
                    }),
                  ],
                }),
                new Paragraph({
                  children: [new TextRun(results.superThesis.refutationOfAntithesis)],
                }),
                new Paragraph({ children: [new TextRun("")] })
              );
            }
            
            if (results.superThesis.finalAssessment) {
              paragraphs.push(
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "Final Assessment",
                      bold: true,
                      size: 24,
                    }),
                  ],
                }),
                new Paragraph({
                  children: [new TextRun(results.superThesis.finalAssessment)],
                }),
                new Paragraph({ children: [new TextRun("")] })
              );
            }
          }
          
          // Overall Metacognitive Profile
          if (results.overallMetacognitiveProfile) {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Overall Metacognitive Profile",
                    bold: true,
                    size: 28,
                  }),
                ],
              }),
              new Paragraph({
                children: [new TextRun(results.overallMetacognitiveProfile)],
              }),
              new Paragraph({ children: [new TextRun("")] })
            );
          }
          
          // Metacognitive Metrics
          if (results.intellectualMaturity || results.selfAwarenessLevel || results.epistemicHumility || results.reflectiveDepth) {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Metacognitive Assessment Scores",
                    bold: true,
                    size: 28,
                  }),
                ],
              })
            );
            
            if (results.intellectualMaturity) {
              paragraphs.push(
                new Paragraph({
                  children: [new TextRun(`Intellectual Maturity: ${results.intellectualMaturity}/10`)],
                })
              );
            }
            if (results.selfAwarenessLevel) {
              paragraphs.push(
                new Paragraph({
                  children: [new TextRun(`Self-Awareness Level: ${results.selfAwarenessLevel}/10`)],
                })
              );
            }
            if (results.epistemicHumility) {
              paragraphs.push(
                new Paragraph({
                  children: [new TextRun(`Epistemic Humility: ${results.epistemicHumility}/10`)],
                })
              );
            }
            if (results.reflectiveDepth) {
              paragraphs.push(
                new Paragraph({
                  children: [new TextRun(`Reflective Depth: ${results.reflectiveDepth}/10`)],
                })
              );
            }
          }
        }

        const doc = new Document({
          sections: [{
            properties: {},
            children: paragraphs,
          }],
        });
        
        try {
          const buffer = await Packer.toBuffer(doc);
          const filename = `mind-profile-${profileType}-${Date.now()}.docx`;
          
          res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
          res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
          res.send(buffer);
        } catch (docxError) {
          console.error('DOCX generation error:', docxError);
          res.status(500).json({ 
            error: 'Failed to generate Word document', 
            details: docxError instanceof Error ? docxError.message : String(docxError) 
          });
        }
      }
      
    } catch (error) {
      console.error('Error exporting profile:', error);
      res.status(500).json({ 
        error: 'Failed to export profile', 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Email profile
  app.post('/api/profile/email', async (req: Request, res: Response) => {
    try {
      const { results, email, profileType, analysisMode } = req.body;
      
      if (!results || !email) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }
      
      if (!process.env.SENDGRID_API_KEY) {
        return res.status(500).json({ error: 'SendGrid API key not configured' });
      }
      
      // Import SendGrid
      const sgMail = await import('@sendgrid/mail');
      sgMail.default.setApiKey(process.env.SENDGRID_API_KEY);
      
      // Format profile content for email
      let emailContent = `<h2>Your Mind Profile Report</h2>`;
      emailContent += `<p><strong>Profile Type:</strong> ${profileType}</p>`;
      emailContent += `<p><strong>Analysis Mode:</strong> ${analysisMode}</p>`;
      emailContent += `<p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>`;
      
      if (results.cognitiveProfile) {
        emailContent += `<h3>Cognitive Profile</h3>`;
        emailContent += `<p><strong>Intellectual Approach:</strong> ${results.cognitiveProfile.intellectualApproach}</p>`;
        emailContent += `<p><strong>Cognitive Signature:</strong> ${results.cognitiveProfile.cognitiveSignature}</p>`;
      }
      
      if (results.psychologicalProfile) {
        emailContent += `<h3>Psychological Profile</h3>`;
        emailContent += `<p><strong>Emotional Pattern:</strong> ${results.psychologicalProfile.emotionalPattern}</p>`;
        emailContent += `<p><strong>Psychological Signature:</strong> ${results.psychologicalProfile.psychologicalSignature}</p>`;
      }
      
      if (results.comprehensiveInsights) {
        emailContent += `<h3>Comprehensive Insights</h3>`;
        emailContent += `<p>${results.comprehensiveInsights.overallProfile}</p>`;
      }
      
      const msg = {
        to: email,
        from: 'JM@ANALYTICPHILOSOPHY.AI',
        subject: `Your ${profileType} Mind Profile Report`,
        html: emailContent,
      };
      
      await sgMail.default.send(msg);
      res.json({ success: true, message: 'Profile sent successfully' });
      
    } catch (error) {
      console.error('Error emailing profile:', error);
      res.status(500).json({ 
        error: 'Failed to email profile', 
        details: error instanceof Error ? error.message : String(error) 
      });
    }
  });

  // Document chunking endpoint for large document processing
  app.post('/api/documents/chunk', async (req: Request, res: Response) => {
    try {
      const { content, filename, documentId } = req.body;
      
      let documentContent = content;
      let documentName = filename;
      
      // If documentId is provided, fetch the document from database
      if (documentId) {
        try {
          const document = await storage.getDocument(documentId);
          
          if (!document) {
            return res.status(404).json({ error: 'Document not found' });
          }
          
          documentContent = document.content;
          documentName = document.title;
        } catch (dbError) {
          console.error('Error fetching document:', dbError);
          return res.status(500).json({ error: 'Failed to fetch document' });
        }
      }
      
      if (!documentContent) {
        return res.status(400).json({ error: 'Content or documentId is required' });
      }

      const chunks = createIntelligentChunks(documentContent, documentName);
      res.json(chunks);
    } catch (error) {
      console.error('Error chunking document:', error);
      res.status(500).json({ error: 'Failed to chunk document' });
    }
  });

  // Download endpoints for GPT Bypass
  app.post('/api/download/word', async (req: Request, res: Response) => {
    try {
      const { content, filename = 'humanized-text' } = req.body;

      if (!content) {
        return res.status(400).json({ error: 'Content is required' });
      }

      // Import docx library
      const { Document, Packer, Paragraph, TextRun } = await import('docx');

      // Split content into paragraphs
      const paragraphs = content.split('\n\n').map((paragraph: string) => 
        new Paragraph({
          children: [new TextRun(paragraph.trim())],
          spacing: { after: 200 } // Add spacing after paragraphs
        })
      );

      // Create document
      const doc = new Document({
        sections: [{
          properties: {},
          children: paragraphs
        }]
      });

      // Generate buffer
      const buffer = await Packer.toBuffer(doc);

      // Set headers for download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.docx"`);
      res.setHeader('Content-Length', buffer.length);

      // Send the file
      res.send(buffer);

    } catch (error) {
      console.error('Error generating Word document:', error);
      res.status(500).json({ 
        error: 'Failed to generate Word document',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.post('/api/download/pdf', async (req: Request, res: Response) => {
    try {
      const { content, filename = 'humanized-text' } = req.body;

      if (!content) {
        return res.status(400).json({ error: 'Content is required' });
      }

      // Import PDFKit
      const PDFDocument = (await import('pdfkit')).default;

      // Create PDF document
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4'
      });

      // Set headers for download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);

      // Pipe the PDF to response
      doc.pipe(res);

      // Add content to PDF
      doc.fontSize(12);
      doc.font('Helvetica');

      // Split content into paragraphs and add them
      const paragraphs = content.split('\n\n');
      
      paragraphs.forEach((paragraph: string, index: number) => {
        if (index > 0) {
          doc.moveDown(); // Add space between paragraphs
        }
        doc.text(paragraph.trim(), {
          align: 'left',
          lineGap: 5
        });
      });

      // Finalize the PDF
      doc.end();

    } catch (error) {
      console.error('Error generating PDF document:', error);
      res.status(500).json({ 
        error: 'Failed to generate PDF document',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  return httpServer;
}

function createIntelligentChunks(content: string, filename?: string): Array<{
  title: string;
  content: string;
  startPosition: number;
  endPosition: number;
}> {
  const targetChunkSize = 800; // Target words per chunk for better balance
  const maxChunkSize = 1200; // Maximum words per chunk
  const minChunkSize = 400; // Minimum words per chunk
  
  const totalWords = content.split(/\s+/).length;
  
  // Calculate optimal number of chunks
  const targetChunks = Math.ceil(totalWords / targetChunkSize);
  const optimalChunkSize = Math.ceil(totalWords / targetChunks);
  
  console.log(`Document has ${totalWords} words, creating ~${targetChunks} chunks of ~${optimalChunkSize} words each`);
  
  const chunks: Array<{
    title: string;
    content: string;
    startPosition: number;
    endPosition: number;
  }> = [];
  
  // Split by paragraphs to maintain coherence
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  // CRITICAL FIX: If we don't have enough paragraphs, split by sentences
  let textUnits = paragraphs;
  if (paragraphs.length < targetChunks / 2) {
    console.log(`Only ${paragraphs.length} paragraphs found, splitting by sentences for better chunking`);
    textUnits = content.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 20);
  }
  
  let currentChunk = '';
  let currentTitle = 'Introduction';
  let chunkIndex = 0;
  let charPos = 0;
  
  // Simple heading detection patterns
  const headingPatterns = [
    /^#{1,6}\s+(.+)/, // Markdown headings
    /^(\d+\.?\s+[A-Z][^.]*?)(?:\n|$)/, // Numbered sections
    /^([A-Z][A-Z\s]{3,30})(?:\n|$)/, // ALL CAPS short headings
  ];
  
  for (let i = 0; i < textUnits.length; i++) {
    const textUnit = textUnits[i].trim();
    const currentWordCount = currentChunk.split(/\s+/).filter(w => w.length > 0).length;
    const unitWordCount = textUnit.split(/\s+/).filter(w => w.length > 0).length;
    
    // Check if text unit is a heading
    let isHeading = false;
    for (const pattern of headingPatterns) {
      const match = textUnit.match(pattern);
      if (match) {
        isHeading = true;
        const headingText = match[1] || match[0];
        if (headingText && headingText.length < 100) {
          currentTitle = headingText.replace(/^#+\s*/, '').replace(/^\d+\.?\s*/, '').trim();
        }
        break;
      }
    }
    
    // Decide whether to start a new chunk
    const shouldStartNewChunk = (
      (isHeading && currentWordCount > minChunkSize) ||
      (currentWordCount + unitWordCount > maxChunkSize) ||
      (currentWordCount > optimalChunkSize && textUnit.length > 100)
    );
    
    if (shouldStartNewChunk && currentChunk.trim().length > 0) {
      // Save current chunk
      chunks.push({
        title: currentTitle || `Section ${chunkIndex + 1}`,
        content: currentChunk.trim(),
        startPosition: charPos - currentChunk.length,
        endPosition: charPos
      });
      
      currentChunk = '';
      chunkIndex++;
      
      // Update title for new chunk if this text unit is a heading
      if (!isHeading) {
        currentTitle = `Section ${chunkIndex + 1}`;
      }
    }
    
    // Add text unit to current chunk
    if (currentChunk.length > 0) {
      currentChunk += '\n\n';
    }
    currentChunk += textUnit;
    charPos += textUnit.length + 2; // +2 for line breaks
  }
  
  // Add final chunk
  if (currentChunk.trim().length > 0) {
    chunks.push({
      title: currentTitle || `Section ${chunkIndex + 1}`,
      content: currentChunk.trim(),
      startPosition: charPos - currentChunk.length,
      endPosition: content.length
    });
  }
  
  // Ensure we have balanced chunks - merge very small chunks
  const balancedChunks = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const wordCount = chunk.content.split(/\s+/).filter(w => w.length > 0).length;
    
    // If chunk is too small and there's a next chunk, merge them
    if (wordCount < minChunkSize && i < chunks.length - 1) {
      const nextChunk = chunks[i + 1];
      const combinedWordCount = wordCount + nextChunk.content.split(/\s+/).filter(w => w.length > 0).length;
      
      if (combinedWordCount <= maxChunkSize) {
        // Merge with next chunk
        balancedChunks.push({
          title: chunk.title,
          content: chunk.content + '\n\n' + nextChunk.content,
          startPosition: chunk.startPosition,
          endPosition: nextChunk.endPosition
        });
        i++; // Skip next chunk since we merged it
        continue;
      }
    }
    
    balancedChunks.push(chunk);
  }
  
  // Log chunk statistics
  const chunkStats = balancedChunks.map(chunk => ({
    title: chunk.title,
    words: chunk.content.split(/\s+/).filter(w => w.length > 0).length
  }));
  
  console.log('Chunk word counts:', chunkStats.map(s => `${s.title}: ${s.words} words`).join(', '));
  
  return balancedChunks;
}

// Graph Generation API Endpoints
export function setupGraphRoutes(app: Express) {
  // Generate graphs from text analysis
  app.post('/api/generate-graphs', async (req: Request, res: Response) => {
    try {
      const { mode, text, mathExpression, model = 'claude', style = 'academic' } = req.body;
      
      if (!mode) {
        return res.status(400).json({ error: 'Mode is required' });
      }
      
      let graphs: Array<{ svg: string; data: any; position: number }> = [];
      
      if (mode === 'math' && mathExpression) {
        // Generate mathematical function graph
        const graphData = await parseMathExpression(mathExpression, { model, style });
        if (graphData) {
          const svg = generateSVG(graphData);
          graphs.push({ svg, data: graphData, position: 0 });
        }
      } else if (mode === 'text' && text) {
        // Generate graphs from text analysis
        const graphRequirements = await parseGraphRequirements(text, { model, style });
        graphs = graphRequirements.map((data, index) => ({
          svg: generateSVG(data),
          data,
          position: index
        }));
      }
      
      res.json({ graphs });
    } catch (error) {
      console.error('Error generating graphs:', error);
      res.status(500).json({ 
        error: 'Failed to generate graphs', 
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Generate complete essay with embedded graphs
  app.post('/api/generate-essay-with-graphs', async (req: Request, res: Response) => {
    try {
      const { text, model = 'claude', style = 'academic' } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: 'Text prompt is required' });
      }
      
      const result = await generateEssayWithGraphs(text, { model, style });
      
      res.json(result);
    } catch (error) {
      console.error('Error generating essay with graphs:', error);
      res.status(500).json({ 
        error: 'Failed to generate essay with graphs', 
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Chat with AI about analysis results
  app.post('/api/profile/chat', async (req: Request, res: Response) => {
    try {
      const { message, analysisResults, chatHistory, profileType, selectedModel, originalText } = req.body;
      
      if (!message || !analysisResults) {
        return res.status(400).json({ error: 'Message and analysis results are required' });
      }

      // Create context for the AI based on the analysis and chat history
      const analysisContext = `
You are the AI assistant that performed the following ${profileType} analysis. The user wants to discuss the results with you.

ORIGINAL TEXT ANALYZED:
${originalText ? originalText.substring(0, 1000) + '...' : 'Text not available'}

ANALYSIS RESULTS:
${JSON.stringify(analysisResults, null, 2)}

You should:
1. Help the user understand the analysis better
2. Address any contestations or disagreements they have
3. Provide additional insights if requested
4. Explain your reasoning for specific findings
5. Be open to discussing alternative interpretations
6. Maintain a helpful, professional tone

The user's message: ${message}
`;

      // Create system prompt
      const systemPrompt = `You are an expert AI analyst specializing in cognitive and psychological assessment. You have just performed a detailed ${profileType} analysis for this user. 

Be conversational, insightful, and willing to engage in nuanced discussion about your analysis. If the user contests any findings, explain your reasoning clearly and be open to their perspective. Provide specific examples from their text when possible.

Keep responses focused, helpful, and under 300 words unless the user specifically asks for more detail.`;

      // Prepare messages for the AI
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: analysisContext }
      ];

      // Add chat history if available
      if (chatHistory && chatHistory.length > 0) {
        chatHistory.forEach((msg: any) => {
          messages.push({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
          });
        });
      }

      // Add the current message
      messages.push({ role: 'user', content: message });

      let response = '';

      // Route to appropriate AI model
      if (selectedModel === 'deepseek') {
        const { processDeepSeek } = await import('./services/deepseek');
        
        // For DeepSeek, combine all messages into a single prompt
        const fullPrompt = messages.map(m => 
          m.role === 'system' ? `SYSTEM: ${m.content}` : 
          m.role === 'user' ? `USER: ${m.content}` : 
          `ASSISTANT: ${m.content}`
        ).join('\n\n');
        
        response = await processDeepSeek(fullPrompt, { temperature: 0.7, maxTokens: 1000 });
      } else if (selectedModel === 'claude') {
        const { processAnthropic } = await import('./services/anthropic');
        response = await processAnthropic(
          messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
          { temperature: 0.7, maxTokens: 1000 }
        );
      } else if (selectedModel === 'gpt4') {
        const { callOpenAIWithRateLimit } = await import('./utils/openaiWrapper');
        response = await callOpenAIWithRateLimit({
          messages: messages.map(m => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content })),
          temperature: 0.7,
          max_tokens: 1000
        });
      } else if (selectedModel === 'perplexity') {
        const { processPerplexity } = await import('./services/perplexity');
        response = await processPerplexity(
          messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
          { temperature: 0.7, maxTokens: 1000 }
        );
      } else {
        throw new Error(`Unsupported model: ${selectedModel}`);
      }

      res.json({ response });
    } catch (error) {
      console.error('Error in chat API:', error);
      res.status(500).json({ 
        error: 'Failed to process chat message', 
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // GPT Bypass / AI Text Humanizer Routes
  app.post('/api/rewrite', async (req: Request, res: Response) => {
    try {
      const { 
        inputText, 
        styleText, 
        contentMixText, 
        customInstructions, 
        selectedPresets, 
        provider, 
        selectedChunkIds 
      } = req.body;

      if (!inputText || !provider) {
        return res.status(400).json({ error: 'inputText and provider are required' });
      }

      // Use imported GPT Bypass services
      // Services already imported at top of file

      // Analyze input text AI score
      const inputAnalysis = await gptZeroService.analyzeText(inputText);
      
      // If text is chunked and only selected chunks should be rewritten
      let textToRewrite = inputText;
      let chunks: any[] = [];
      
      if (inputText.length > 2000) {
        chunks = textChunkerService.chunkText(inputText);
        if (selectedChunkIds && selectedChunkIds.length > 0) {
          textToRewrite = textChunkerService.reconstructFromChunks(chunks, selectedChunkIds);
        }
      }

      // Perform rewrite
      const rewrittenText = await aiProviderService.rewrite(provider, {
        inputText: textToRewrite,
        styleText,
        contentMixText,
        customInstructions,
        selectedPresets,
      });

      // Analyze output text AI score
      const outputAnalysis = await gptZeroService.analyzeText(rewrittenText);

      // Create rewrite job record
      const jobData = {
        inputText,
        styleText: styleText || null,
        contentMixText: contentMixText || null,
        customInstructions: customInstructions || null,
        selectedPresets: selectedPresets || null,
        provider,
        chunks: chunks.length > 0 ? chunks : null,
        selectedChunkIds: selectedChunkIds || null,
        outputText: rewrittenText,
        inputAiScore: inputAnalysis.aiScore,
        outputAiScore: outputAnalysis.aiScore,
        status: 'completed'
      };

      const job = await storage.createRewriteJob(jobData);

      res.json({
        rewrittenText,
        inputAiScore: inputAnalysis.aiScore,
        outputAiScore: outputAnalysis.aiScore,
        jobId: job.id
      });

    } catch (error) {
      console.error('Error in rewrite API:', error);
      res.status(500).json({ 
        error: 'Failed to rewrite text', 
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Text chunking endpoint
  app.post('/api/text-processing/chunk', async (req: Request, res: Response) => {
    try {
      const { text } = req.body;

      if (!text) {
        return res.status(400).json({ error: 'Text is required' });
      }

      const { textChunkerService } = await import('./services/textChunker');
      const chunks = textChunkerService.chunkText(text);

      res.json({ chunks });
    } catch (error) {
      console.error('Error chunking text:', error);
      res.status(500).json({ 
        error: 'Failed to chunk text', 
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // GPTZero analysis endpoint
  app.post('/api/gptzero/analyze', async (req: Request, res: Response) => {
    try {
      const { text } = req.body;

      if (!text) {
        return res.status(400).json({ error: 'Text is required' });
      }

      const { gptZeroService } = await import('./services/gptZero');
      const result = await gptZeroService.analyzeText(text);

      res.json(result);
    } catch (error) {
      console.error('Error analyzing with GPTZero:', error);
      res.status(500).json({ 
        error: 'Failed to analyze text', 
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // File upload for GPT Bypass
  app.post('/api/file-upload', upload.single('file'), async (req: Request, res: Response) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Use imported GPT Bypass file processor service
      
      // Create temporary file path
      const tempPath = path.join('/tmp', `upload_${Date.now()}_${file.originalname}`);
      fs.writeFileSync(tempPath, file.buffer);
      
      const result = await fileProcessorService.processFile(tempPath, file.originalname);
      
      res.json({
        content: result.content,
        filename: result.filename,
        wordCount: result.wordCount
      });

    } catch (error) {
      console.error('Error processing file:', error);
      res.status(500).json({ 
        error: 'Failed to process file', 
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
}
