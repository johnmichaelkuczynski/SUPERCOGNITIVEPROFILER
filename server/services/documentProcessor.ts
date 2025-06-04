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

// Extract text from PDF using hybrid approach: OCR + text extraction
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    console.log("Extracting text from PDF using hybrid approach...");
    
    // First, try standard text extraction
    const standardText = await extractTextWithFallbackMethod(buffer);
    
    // Check if the text quality is poor (has character spacing issues)
    const hasSpacingIssues = checkForSpacingIssues(standardText);
    
    if (!hasSpacingIssues && standardText.length > 500) {
      console.log("Standard extraction produced good quality text");
      return standardText;
    }
    
    console.log("Text quality is poor, attempting OCR extraction...");
    
    // If text quality is poor, try OCR extraction for first few pages
    try {
      const ocrText = await extractTextWithOCR(buffer, 5); // Process first 5 pages with OCR
      
      if (ocrText && ocrText.length > 200) {
        console.log(`OCR extraction successful: ${ocrText.length} characters`);
        return ocrText;
      }
    } catch (ocrError) {
      console.error("OCR extraction failed:", ocrError);
    }
    
    // If OCR fails, return the best text we have
    console.log("Falling back to standard extraction result");
    return standardText;
    
  } catch (error) {
    console.error("All PDF extraction methods failed:", error);
    return "PDF text extraction failed - document may be image-based or corrupted.";
  }
}

// Check if extracted text has character spacing issues
function checkForSpacingIssues(text: string): boolean {
  if (!text || text.length < 100) return true;
  
  // Look for common spacing issues in dialogue scripts
  const spacingIssuePatterns = [
    /[A-Za-z]\s+[A-Za-z]\s*:/g, // "Fr eud:" or "Sar tre:"
    /[A-Za-z]\s+[A-Za-z]\s+[A-Za-z]/g, // "w h a t" instead of "what"
    /:\s*[A-Za-z]\s+[A-Za-z]/g, // ": w h a t" after character names
  ];
  
  let issueCount = 0;
  for (const pattern of spacingIssuePatterns) {
    const matches = text.match(pattern);
    if (matches) {
      issueCount += matches.length;
    }
  }
  
  // If more than 5% of the text has spacing issues, consider it poor quality
  const totalWords = text.split(/\s+/).length;
  return issueCount > totalWords * 0.05;
}

// Extract text using OCR for high-quality text extraction
async function extractTextWithOCR(buffer: Buffer, maxPages: number = 5): Promise<string> {
  try {
    // Convert PDF pages to images
    const convert = pdf(buffer, {
      density: 200,
      saveFilename: "page",
      savePath: "/tmp",
      format: "png",
      width: 1200,
      height: 1600
    });
    
    let extractedText = '';
    
    // Process up to maxPages pages
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      try {
        console.log(`Processing page ${pageNum} with OCR...`);
        
        // Convert page to image
        const pageImage = await convert(pageNum, { responseType: "buffer" });
        
        if (pageImage.buffer) {
          // Create Tesseract worker
          const worker = await createWorker();
          await worker.loadLanguage('eng');
          await worker.initialize('eng');
          
          // Extract text from image
          const { data: { text } } = await worker.recognize(pageImage.buffer);
          
          if (text && text.trim()) {
            extractedText += text.trim() + '\n\n';
          }
          
          await worker.terminate();
        }
      } catch (pageError) {
        console.error(`OCR failed for page ${pageNum}:`, pageError);
        // Continue with next page
      }
    }
    
    return extractedText.trim();
    
  } catch (error) {
    console.error("OCR extraction failed:", error);
    throw error;
  }
}

// Simple page-by-page text extraction
async function extractPageTextWithSimpleMethod(buffer: Buffer, pageNum: number): Promise<string> {
  return new Promise((resolve) => {
    const reader = new PdfReader();
    let pageText = '';
    let currentPage = 0;
    let foundTargetPage = false;
    
    const timeout = setTimeout(() => {
      resolve(pageText);
    }, 5000);
    
    reader.parseBuffer(buffer, (err, item) => {
      if (err) {
        clearTimeout(timeout);
        resolve(pageText);
        return;
      }
      
      if (!item) {
        clearTimeout(timeout);
        resolve(pageText);
        return;
      }
      
      if (item.page) {
        currentPage = item.page;
        if (currentPage === pageNum) {
          foundTargetPage = true;
        } else if (currentPage > pageNum && foundTargetPage) {
          // We've moved past our target page
          clearTimeout(timeout);
          resolve(pageText);
          return;
        }
      } else if (item.text && foundTargetPage && currentPage === pageNum) {
        // Add text with proper spacing - ensure words don't get concatenated
        const text = item.text.trim();
        if (text) {
          // Add space before text if the previous text doesn't end with whitespace
          if (pageText && !pageText.endsWith(' ') && !text.startsWith(' ')) {
            pageText += ' ';
          }
          pageText += text;
        }
      }
    });
  });
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