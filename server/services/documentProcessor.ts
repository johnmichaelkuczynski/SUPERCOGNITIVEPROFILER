import { extractMathWithMathpix, isMathematicalContent } from './mathpix';
import { PdfReader } from 'pdfreader';
import mammoth from 'mammoth';
import { detectAIContent, type AIDetectionResult } from './gptZero';
import { log } from '../vite';
import * as fs from 'fs';
import * as path from 'path';
import { PDFDocument } from 'pdf-lib';
import { getDocument } from 'pdfjs-dist';


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

// Extract text from PDF using pdfjs-dist with proper formatting preservation
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    console.log("Extracting text from PDF using pdfjs-dist...");
    
    // Load PDF document
    const data = new Uint8Array(buffer);
    const pdf = await getDocument(data).promise;
    
    let extractedText = '';
    const numPages = pdf.numPages;
    console.log(`PDF has ${numPages} pages`);
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Group text items by line using Y coordinates
        const textByLine = groupTextByLines(textContent.items);
        
        // Reconstruct page text with proper formatting
        const pageText = reconstructPageText(textByLine);
        
        if (pageText.trim()) {
          extractedText += pageText + '\n\n';
        }
        
        console.log(`Processed page ${pageNum}/${numPages}`);
      } catch (pageError) {
        console.error(`Error processing page ${pageNum}:`, pageError);
        // Continue with next page
      }
    }
    
    if (!extractedText || extractedText.trim().length < 100) {
      console.log("pdfjs-dist extraction yielded minimal text, using fallback...");
      return await extractTextWithFallbackMethod(buffer);
    }
    
    console.log(`PDF extraction completed: ${extractedText.length} characters from ${numPages} pages`);
    return extractedText.trim();
    
  } catch (error) {
    console.error("pdfjs-dist extraction failed:", error);
    console.log("Using fallback extraction method...");
    return await extractTextWithFallbackMethod(buffer);
  }
}

// Group text items by lines based on Y coordinates
function groupTextByLines(textItems: any[]): any[][] {
  const lines: any[][] = [];
  const lineThreshold = 5; // Y coordinate difference threshold for same line
  
  // Sort items by Y coordinate (top to bottom), then X coordinate (left to right)
  const sortedItems = textItems.sort((a, b) => {
    const yDiff = Math.abs(a.transform[5] - b.transform[5]);
    if (yDiff < lineThreshold) {
      return a.transform[4] - b.transform[4]; // Sort by X coordinate
    }
    return b.transform[5] - a.transform[5]; // Sort by Y coordinate (reversed because PDF coordinates start from bottom)
  });
  
  let currentLine: any[] = [];
  let lastY = -1;
  
  for (const item of sortedItems) {
    const currentY = item.transform[5];
    
    if (lastY === -1 || Math.abs(currentY - lastY) < lineThreshold) {
      // Same line
      currentLine.push(item);
    } else {
      // New line
      if (currentLine.length > 0) {
        lines.push([...currentLine]);
      }
      currentLine = [item];
    }
    lastY = currentY;
  }
  
  // Add the last line
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }
  
  return lines;
}

// Reconstruct text from grouped lines with proper spacing
function reconstructPageText(textLines: any[][]): string {
  let pageText = '';
  
  for (const line of textLines) {
    let lineText = '';
    let lastX = -1;
    
    // Sort items in line by X coordinate
    const sortedLineItems = line.sort((a, b) => a.transform[4] - b.transform[4]);
    
    for (const item of sortedLineItems) {
      if (!item.str || !item.str.trim()) continue;
      
      const currentX = item.transform[4];
      const text = item.str;
      
      // Add spacing between words based on X coordinate gaps
      if (lastX !== -1 && currentX - lastX > 20) {
        // Large gap - likely word boundary
        lineText += ' ';
      }
      
      lineText += text;
      lastX = currentX + (item.width || 0);
    }
    
    if (lineText.trim()) {
      pageText += lineText.trim() + '\n';
    }
  }
  
  return pageText;
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