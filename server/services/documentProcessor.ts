import { extractMathWithMathpix, isMathematicalContent } from './mathpix';
import { PDFExtract } from 'pdf.js-extract';
import mammoth from 'mammoth';
import { gptZeroService, type GPTZeroResult } from './gptZero';
import { log } from '../vite';
import * as fs from 'fs';
import * as path from 'path';
import { PDFDocument } from 'pdf-lib';



export interface ProcessedDocument {
  text: string;
  chunks?: Array<{title: string, content: string}>;
  aiDetection?: GPTZeroResult;
}

import { splitIntoChunks, generateSimpleSummaries } from './documentChunker';

// Process and extract text from uploaded files
export async function processDocument(file: Express.Multer.File): Promise<ProcessedDocument> {
  try {
    const fileType = file.originalname.split('.').pop()?.toLowerCase();
    
    if (!fileType) {
      throw new Error("Could not determine file type");
    }
    
    let extractedText = '';
    let chunks: Array<{title: string, content: string}> | undefined;
    
    console.log(`Processing file directly: ${file.originalname}`);
    console.log(`Processing file ${file.originalname} (${file.size} bytes)`);
    
    switch (fileType) {
      case 'pdf':
        extractedText = await extractTextFromPDF(file.buffer);
        log(`Extracted ${extractedText.length} characters from PDF`, 'document');
        
        if (extractedText.length > 10000) {
          chunks = splitIntoChunks(extractedText);
          log(`Created ${chunks.length} document chunks for better processing`, 'document');
        }
        break;
      case 'docx':
        extractedText = await extractTextFromDOCX(file.buffer);
        if (extractedText.length > 10000) {
          chunks = splitIntoChunks(extractedText);
        }
        break;
      case 'txt':
        extractedText = await extractTextFromTXT(file.buffer);
        if (extractedText.length > 10000) {
          chunks = splitIntoChunks(extractedText);
        }
        break;
      case 'doc':
        extractedText = await extractTextFromDOCX(file.buffer);
        if (extractedText.length > 10000) {
          chunks = splitIntoChunks(extractedText);
        }
        break;
      case 'jpg':
      case 'jpeg':
      case 'png':
        extractedText = await extractTextFromImage(file.buffer);
        break;
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
    
    // Run AI detection on the extracted text if GPTZero API key is available
    let aiDetection: AIDetectionResult | undefined;
    if (process.env.GPTZERO_API_KEY && extractedText.length > 0) {
      try {
        log(`Running AI detection on ${file.originalname}...`, 'document');
        const textSample = extractedText.length > 5000 ? extractedText.substring(0, 5000) : extractedText;
        aiDetection = await gptZeroService.analyzeText(textSample);
      } catch (error) {
        log(`AI detection failed: ${(error as Error).message}`, 'document');
      }
    } else if (!process.env.GPTZERO_API_KEY) {
      log('GPTZERO_API_KEY not found in environment variables, skipping AI detection', 'document');
    }
    
    // Clean up the extracted text to remove excessive spacing
    let cleanedText = cleanExtractedText(extractedText);
    
    // Apply math delimiter conversion to properly format mathematical expressions
    try {
      const { sanitizeMathAndCurrency } = await import('./mathDelimiterFixer');
      cleanedText = sanitizeMathAndCurrency(cleanedText);
      
      // Also apply math conversion to chunks if they exist
      if (chunks && chunks.length > 0) {
        chunks = chunks.map(chunk => ({
          ...chunk,
          content: sanitizeMathAndCurrency(chunk.content)
        }));
      }
      
      log('Applied math delimiter conversion to document content and chunks', 'document');
    } catch (mathError) {
      log(`Math delimiter conversion failed: ${(mathError as Error).message}`, 'document');
      // Continue with original text if math conversion fails
    }
    
    return {
      text: cleanedText,
      chunks,
      aiDetection
    };
  } catch (error) {
    console.error("Document processing error:", error);
    throw new Error(`Failed to process document: ${(error as Error).message}`);
  }
}

// Preserve original text formatting for dialogue scripts and TTS processing
function cleanExtractedText(text: string): string {
  if (!text) return text;
  
  let cleaned = text;
  
  // Only do minimal cleanup to preserve formatting
  cleaned = cleaned.replace(/\r\n/g, '\n'); // Windows line endings to Unix
  cleaned = cleaned.replace(/\r/g, '\n'); // Mac line endings to Unix
  
  // Only remove truly excessive whitespace (3+ consecutive spaces)
  cleaned = cleaned.replace(/   +/g, '  '); // 3+ spaces to 2 spaces max
  
  // Only remove excessive newlines (4+ consecutive)
  cleaned = cleaned.replace(/\n{4,}/g, '\n\n\n'); // Max 3 consecutive newlines
  
  // Preserve all character names, formatting, and structure
  return cleaned;
}

// Extract text from any file type
export async function extractText(file: Express.Multer.File): Promise<string> {
  const processed = await processDocument(file);
  return processed.text;
}

// Extract text from PDF using pdf.js-extract library
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    console.log("Extracting text from PDF using pdf.js-extract...");
    
    const pdfExtract = new PDFExtract();
    
    return new Promise((resolve, reject) => {
      pdfExtract.extractBuffer(buffer, {}, (err: any, data: any) => {
        if (err) {
          console.error("PDF extraction error:", err);
          resolve("PDF extraction failed - document may be corrupted or password-protected.");
          return;
        }
        
        if (!data || !data.pages || data.pages.length === 0) {
          resolve("PDF extraction failed - no readable content found.");
          return;
        }
        
        let extractedText = '';
        
        // Extract text from each page
        for (const page of data.pages) {
          if (page.content && page.content.length > 0) {
            // Sort content by y position (top to bottom) then x position (left to right)
            const sortedContent = page.content
              .filter((item: any) => item.str && item.str.trim())
              .sort((a: any, b: any) => {
                const yDiff = Math.abs(a.y - b.y);
                if (yDiff < 5) { // Same line
                  return a.x - b.x;
                }
                return b.y - a.y; // PDF coordinates are inverted
              });
            
            // Group content by lines
            const lines: string[] = [];
            let currentLine = '';
            let lastY = -1;
            
            for (const item of sortedContent) {
              const text = item.str.trim();
              if (!text) continue;
              
              // Check if this is a new line
              if (lastY !== -1 && Math.abs(item.y - lastY) > 5) {
                if (currentLine.trim()) {
                  lines.push(currentLine.trim());
                }
                currentLine = text;
              } else {
                // Same line - add with space if needed
                if (currentLine && !currentLine.endsWith(' ') && !text.startsWith(' ')) {
                  currentLine += ' ';
                }
                currentLine += text;
              }
              
              lastY = item.y;
            }
            
            // Add the last line
            if (currentLine.trim()) {
              lines.push(currentLine.trim());
            }
            
            // Join lines with newlines
            if (lines.length > 0) {
              extractedText += lines.join('\n') + '\n\n';
            }
          }
        }
        
        // Clean up the extracted text
        const cleanText = extractedText
          .replace(/\n{3,}/g, '\n\n') // Limit consecutive newlines
          .replace(/[ \t]{2,}/g, ' ') // Normalize spaces
          .trim();
        
        console.log(`PDF extraction completed: ${cleanText.length} characters from ${data.pages.length} pages`);
        resolve(cleanText || "PDF extraction completed but no readable text found.");
      });
    });
    
  } catch (error) {
    console.error("PDF extraction failed:", error);
    return "PDF extraction failed due to processing errors.";
  }
}

// Remove this function completely - it's causing the gibberish text

// Apply intelligent reconstruction to fix common PDF extraction issues
function applyIntelligentReconstruction(text: string): string {
  if (!text) return text;
  
  let fixed = text;
  
  // Fix broken character names in dialogue
  const nameFixPatterns = [
    { broken: /F\s*r\s*e\s*u\s*d\s*:/gi, fixed: 'Freud:' },
    { broken: /S\s*a\s*r\s*t\s*r\s*e\s*:/gi, fixed: 'Sartre:' },
    { broken: /F\s*o\s*u\s*c\s*a\s*u\s*l\s*t\s*:/gi, fixed: 'Foucault:' },
    { broken: /S\s*o\s*c\s*r\s*a\s*t\s*e\s*s\s*:/gi, fixed: 'Socrates:' },
    { broken: /P\s*l\s*a\s*t\s*o\s*:/gi, fixed: 'Plato:' },
    { broken: /A\s*r\s*i\s*s\s*t\s*o\s*t\s*l\s*e\s*:/gi, fixed: 'Aristotle:' },
    { broken: /N\s*i\s*e\s*t\s*z\s*s\s*c\s*h\s*e\s*:/gi, fixed: 'Nietzsche:' },
    { broken: /H\s*e\s*i\s*d\s*e\s*g\s*g\s*e\s*r\s*:/gi, fixed: 'Heidegger:' },
    { broken: /K\s*a\s*n\s*t\s*:/gi, fixed: 'Kant:' },
    { broken: /D\s*e\s*s\s*c\s*a\s*r\s*t\s*e\s*s\s*:/gi, fixed: 'Descartes:' },
    { broken: /L\s*e\s*i\s*b\s*n\s*i\s*z\s*:/gi, fixed: 'Leibniz:' },
    { broken: /L\s*o\s*c\s*k\s*e\s*:/gi, fixed: 'Locke:' }
  ];
  
  nameFixPatterns.forEach(pattern => {
    fixed = fixed.replace(pattern.broken, pattern.fixed);
  });
  
  // Fix broken common words
  fixed = fixed.replace(/c\s*o\s*n\s*s\s*c\s*i\s*o\s*u\s*s\s*n\s*e\s*s\s*s/gi, 'consciousness');
  fixed = fixed.replace(/u\s*n\s*c\s*o\s*n\s*s\s*c\s*i\s*o\s*u\s*s/gi, 'unconscious');
  fixed = fixed.replace(/e\s*x\s*i\s*s\s*t\s*e\s*n\s*c\s*e/gi, 'existence');
  fixed = fixed.replace(/p\s*h\s*e\s*n\s*o\s*m\s*e\s*n\s*o\s*l\s*o\s*g\s*y/gi, 'phenomenology');
  fixed = fixed.replace(/p\s*s\s*y\s*c\s*h\s*o\s*a\s*n\s*a\s*l\s*y\s*s\s*i\s*s/gi, 'psychoanalysis');
  
  // Clean up excessive whitespace
  fixed = fixed.replace(/\s{3,}/g, ' ');
  fixed = fixed.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  // Ensure proper dialogue formatting
  fixed = fixed.replace(/^([A-Z][a-z]+)\s*:\s*/gm, '$1: ');
  
  return fixed.trim();
}

// Reconstruct broken text by fixing character spacing issues
function reconstructBrokenText(text: string): string {
  if (!text) return text;
  
  let fixed = text;
  
  // Fix broken character names (like "Fr eud:" -> "Freud:")
  const commonNames = [
    'Freud', 'Sartre', 'Socrates', 'Plato', 'Aristotle', 'Kant', 'Nietzsche', 
    'Heidegger', 'Marx', 'Jung', 'Lacan', 'Foucault', 'Derrida', 'Wittgenstein',
    'Jesus', 'Buddha', 'Confucius', 'Lao', 'Tzu', 'Muhammad', 'Moses',
    'Descartes', 'Spinoza', 'Leibniz', 'Hume', 'Locke', 'Berkeley', 'Mill',
    'Hegel', 'Kierkegaard', 'Schopenhauer', 'Husserl', 'Merleau', 'Ponty'
  ];
  
  // Fix broken names by pattern matching
  for (const name of commonNames) {
    // Create pattern to match broken name (e.g., "Fr eud" -> "Freud")
    const chars = name.split('');
    const brokenPattern = new RegExp(chars.join('\\s+'), 'gi');
    fixed = fixed.replace(brokenPattern, name);
  }
  
  // Fix common broken words in philosophical/psychological dialogue
  const commonWords = [
    'consciousness', 'unconscious', 'existence', 'essence', 'being', 'time',
    'freedom', 'determinism', 'reality', 'truth', 'knowledge', 'experience',
    'phenomenology', 'psychoanalysis', 'interpretation', 'meaning', 'language',
    'thought', 'thinking', 'rational', 'irrational', 'emotion', 'feeling',
    'authentic', 'inauthentic', 'anxiety', 'death', 'nothingness', 'absurd'
  ];
  
  for (const word of commonWords) {
    if (word.length > 4) { // Only fix longer words to avoid false positives
      const chars = word.split('');
      const brokenPattern = new RegExp(chars.join('\\s+'), 'gi');
      fixed = fixed.replace(brokenPattern, word);
    }
  }
  
  // Fix general spacing issues
  // Remove spaces between single characters that should form words
  fixed = fixed.replace(/\b([a-zA-Z])\s+([a-zA-Z])\s+([a-zA-Z])\b/g, '$1$2$3');
  fixed = fixed.replace(/\b([a-zA-Z])\s+([a-zA-Z])\b/g, '$1$2');
  
  // Fix broken character name patterns specifically (Character + colon)
  fixed = fixed.replace(/([A-Z][a-z]+)\s+([a-z]+)\s*:/g, '$1$2:');
  
  // Fix spacing around punctuation
  fixed = fixed.replace(/\s+([.,:;!?])/g, '$1');
  fixed = fixed.replace(/([.,:;!?])\s*([A-Z])/g, '$1 $2');
  
  // Clean up excessive whitespace
  fixed = fixed.replace(/\s{2,}/g, ' ');
  fixed = fixed.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  // Ensure character names are properly formatted
  fixed = fixed.replace(/^([A-Z][a-z]+[a-z]*)\s*:/gm, '$1:');
  
  return fixed.trim();
}



// Simple fallback: return a clear error message
async function extractTextWithFallbackMethod(buffer: Buffer): Promise<string> {
  return "PDF text extraction failed - document may be corrupted, password-protected, or image-based.";
}

// Extract text from DOCX using mammoth
async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

// Extract text from TXT files
async function extractTextFromTXT(buffer: Buffer): Promise<string> {
  return buffer.toString('utf-8');
}

// Extract text from images using OCR
async function extractTextFromImage(buffer: Buffer): Promise<string> {
  console.log(`[document] Processing image file (${buffer.length} bytes)...`);
  
  // Try Mathpix first for mathematical content if credentials are available
  try {
    console.log(`[document] Attempting Mathpix OCR for mathematical content...`);
    const extractedText = await extractMathWithMathpix(buffer);
    
    if (extractedText && extractedText.trim()) {
      console.log(`[document] Mathpix successfully extracted ${extractedText.length} characters`);
      return extractedText;
    }
    
    throw new Error('Mathpix returned empty text');
    
  } catch (mathpixError) {
    console.log(`[document] Mathpix not available: ${mathpixError instanceof Error ? mathpixError.message : 'Unknown error'}`);
  }
  
  // Try Tesseract.js as fallback
  try {
    console.log(`[document] Attempting Tesseract OCR...`);
    const { tesseractService } = await import('./tesseractOcr');
    const extractedText = await tesseractService.extractText(buffer);
    
    if (extractedText && extractedText.trim()) {
      console.log(`[document] Tesseract successfully extracted ${extractedText.length} characters`);
      return extractedText;
    }
    
    throw new Error('Tesseract returned empty text');
    
  } catch (tesseractError) {
    console.log(`[document] Tesseract OCR failed: ${tesseractError instanceof Error ? tesseractError.message : 'Unknown error'}`);
  }
  
  // Final fallback
  console.log(`[document] OCR processing failed, providing guidance`);
  
  const imageInfo = `Image file uploaded successfully (${Math.round(buffer.length / 1024)}KB). 

OCR text extraction failed. For best results, please:

1. Use text-based documents (.txt, .docx, .pdf)
2. Copy and paste text directly into the input area
3. Use the voice dictation feature (microphone button) to speak your content

The image has been received but cannot be processed for text content at this time.`;

  return imageInfo;
}