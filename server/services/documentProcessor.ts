import { extractMathWithMathpix, isMathematicalContent } from './mathpix';
import { PdfReader } from 'pdfreader';
import mammoth from 'mammoth';
import { detectAIContent, type AIDetectionResult } from './gptZero';
import { log } from '../vite';
import * as fs from 'fs';
import * as path from 'path';
import { PDFDocument } from 'pdf-lib';



export interface ProcessedDocument {
  text: string;
  chunks?: Array<{title: string, content: string}>;
  aiDetection?: AIDetectionResult;
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
        aiDetection = await detectAIContent(textSample);
      } catch (error) {
        log(`AI detection failed: ${(error as Error).message}`, 'document');
      }
    } else if (!process.env.GPTZERO_API_KEY) {
      log('GPTZERO_API_KEY not found in environment variables, skipping AI detection', 'document');
    }
    
    // Clean up the extracted text to remove excessive spacing
    const cleanedText = cleanExtractedText(extractedText);
    
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

// Clean extracted text specifically for dialogue scripts and TTS processing
function cleanExtractedText(text: string): string {
  if (!text) return text;
  
  let cleaned = text;
  
  // Basic cleanup
  cleaned = cleaned.replace(/\r\n/g, '\n'); // Windows line endings to Unix
  cleaned = cleaned.replace(/\t/g, ' '); // Tabs to spaces
  
  // Fix excessive whitespace while preserving paragraph structure
  cleaned = cleaned.replace(/[ \t]{2,}/g, ' '); // Multiple spaces/tabs to single space
  cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n'); // Multiple newlines to double
  
  // Fix punctuation spacing
  cleaned = cleaned.replace(/\s+([.,;:!?])/g, '$1'); // Remove space before punctuation
  cleaned = cleaned.replace(/([.,;:!?])([A-Za-z])/g, '$1 $2'); // Add space after punctuation
  
  // Fix dialogue formatting specifically
  cleaned = cleaned.replace(/([A-Za-z]+)\s*:\s*/g, '$1: '); // Normalize character name format
  cleaned = cleaned.replace(/([A-Za-z])\s+([A-Za-z])\s*:/g, '$1$2:'); // Fix broken character names
  
  // Clean up common PDF artifacts
  cleaned = cleaned.replace(/\s+$/gm, ''); // Remove trailing spaces from lines
  cleaned = cleaned.replace(/^\s+/gm, ''); // Remove leading spaces from lines
  
  // Final trim
  cleaned = cleaned.trim();
  
  return cleaned;
}

// Extract text from any file type
export async function extractText(file: Express.Multer.File): Promise<string> {
  const processed = await processDocument(file);
  return processed.text;
}

// Extract text from PDF with position-aware text reconstruction
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    console.log("Extracting text from PDF with position-aware reconstruction...");
    
    return new Promise((resolve, reject) => {
      const reader = new PdfReader();
      const textItems: Array<{page: number, x: number, y: number, text: string}> = [];
      let currentPage = 0;
      
      const timeout = setTimeout(() => {
        if (textItems.length > 0) {
          const reconstructedText = reconstructTextFromPositions(textItems);
          console.log(`PDF extraction completed: ${reconstructedText.length} characters with position-aware reconstruction`);
          resolve(reconstructedText);
        } else {
          resolve("PDF extraction failed - no text items found.");
        }
      }, 30000); // 30 second timeout for complex PDFs
      
      reader.parseBuffer(buffer, (err, item) => {
        if (err) {
          console.error("PDF parsing error:", err);
          return;
        }
        
        if (!item) {
          // End of file
          clearTimeout(timeout);
          if (textItems.length > 0) {
            const reconstructedText = reconstructTextFromPositions(textItems);
            console.log(`PDF extraction completed: ${reconstructedText.length} characters from ${currentPage} pages`);
            resolve(reconstructedText);
          } else {
            resolve("PDF extraction failed - no text content found.");
          }
          return;
        }
        
        if (item.page) {
          currentPage = item.page;
        } else if (item.text && item.text.trim()) {
          // Store text with approximate position (pdfreader provides limited position info)
          textItems.push({
            page: currentPage,
            x: item.x || 0,
            y: item.y || 0,
            text: item.text.trim()
          });
        }
      });
    });
    
  } catch (error) {
    console.error("Position-aware PDF extraction failed:", error);
    return await extractTextWithFallbackMethod(buffer);
  }
}

// Reconstruct text from positioned text items with intelligent formatting
function reconstructTextFromPositions(textItems: Array<{page: number, x: number, y: number, text: string}>): string {
  if (!textItems.length) return '';
  
  // Group by page
  const pageGroups: { [page: number]: Array<{x: number, y: number, text: string}> } = {};
  
  textItems.forEach(item => {
    if (!pageGroups[item.page]) {
      pageGroups[item.page] = [];
    }
    pageGroups[item.page].push({x: item.x, y: item.y, text: item.text});
  });
  
  let fullText = '';
  
  // Process each page
  Object.keys(pageGroups).sort((a, b) => parseInt(a) - parseInt(b)).forEach(pageNum => {
    const pageItems = pageGroups[parseInt(pageNum)];
    
    // Sort items by Y position (reading order), then by X position
    pageItems.sort((a, b) => {
      const yDiff = Math.abs(a.y - b.y);
      if (yDiff < 10) { // Same line threshold
        return a.x - b.x;
      }
      return a.y - b.y;
    });
    
    // Reconstruct page text with intelligent spacing
    let pageText = '';
    let lastY = -1;
    let lastX = -1;
    
    for (const item of pageItems) {
      const text = item.text;
      
      // Determine if this is a new line
      if (lastY !== -1 && Math.abs(item.y - lastY) > 10) {
        pageText += '\n';
      } else if (lastX !== -1 && item.x - lastX > 50) {
        // Large horizontal gap - add space
        pageText += ' ';
      } else if (pageText && !pageText.endsWith(' ') && !text.startsWith(' ')) {
        // Ensure word separation
        pageText += ' ';
      }
      
      pageText += text;
      lastY = item.y;
      lastX = item.x;
    }
    
    if (pageText.trim()) {
      fullText += pageText.trim() + '\n\n';
    }
  });
  
  // Apply intelligent text reconstruction to fix any remaining issues
  return applyIntelligentReconstruction(fullText.trim());
}

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



// Fallback method for when primary extraction fails
async function extractTextWithFallbackMethod(buffer: Buffer): Promise<string> {
  return new Promise((resolve) => {
    const reader = new PdfReader();
    const textItems: string[] = [];
    
    const timeout = setTimeout(() => {
      if (textItems.length > 0) {
        // Join all text items with appropriate spacing
        const text = textItems.join(' ').replace(/\s+/g, ' ').trim();
        resolve(text);
      } else {
        resolve("PDF text extraction failed - document may be image-based or protected.");
      }
    }, 15000);
    
    reader.parseBuffer(buffer, (err, item) => {
      if (err) {
        console.error("Fallback PDF parsing error:", err);
        return;
      }
      
      if (!item) {
        clearTimeout(timeout);
        if (textItems.length > 0) {
          const text = textItems.join(' ').replace(/\s+/g, ' ').trim();
          console.log(`Fallback extraction completed: ${text.length} characters`);
          resolve(text);
        } else {
          resolve("PDF text extraction failed - document may be image-based or protected.");
        }
        return;
      }
      
      if (item.text && item.text.trim()) {
        textItems.push(item.text.trim());
      }
    });
  });
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

// Extract text from images using Mathpix OCR (specialized for mathematical content)
async function extractTextFromImage(buffer: Buffer): Promise<string> {
  try {
    console.log(`[document] Processing image with Mathpix OCR for mathematical content...`);
    const extractedText = await extractMathWithMathpix(buffer);
    
    // Check if content appears to be mathematical
    const isMathContent = await isMathematicalContent(extractedText);
    if (isMathContent) {
      console.log(`[document] Mathematical content detected and processed successfully`);
    }
    
    return extractedText;
  } catch (error) {
    console.error(`[document] Mathpix OCR failed:`, error);
    throw new Error(`Failed to extract text from image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}