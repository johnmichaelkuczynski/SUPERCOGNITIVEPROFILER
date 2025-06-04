import { extractMathWithMathpix, isMathematicalContent } from './mathpix';
import { PdfReader } from 'pdfreader';
import mammoth from 'mammoth';
import { detectAIContent, type AIDetectionResult } from './gptZero';
import { log } from '../vite';

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
    
    console.log(`Processing file ${file.originalname} (${file.size} bytes)`);
    
    switch (fileType) {
      case 'pdf':
        // Use enhanced extraction for PDFs
        extractedText = await extractTextFromPDF(file.buffer);
        log(`Extracted ${extractedText.length} characters from PDF`, 'document');
        
        // Create chunks for large documents
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
      case 'jpg':
      case 'jpeg':
      case 'png':
        extractedText = await extractTextFromImage(file.buffer);
        break;
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
    
    // Run AI detection on the extracted text if GPTZero API key is available
    // Only use a sample of the text for detection to avoid API limits
    let aiDetection: AIDetectionResult | undefined;
    if (process.env.GPTZERO_API_KEY && extractedText.length > 0) {
      try {
        log(`Running AI detection on ${file.originalname}...`, 'document');
        // Use only first 5000 chars for detection to avoid API limits
        const textSample = extractedText.length > 5000 ? extractedText.substring(0, 5000) : extractedText;
        aiDetection = await detectAIContent(textSample);
      } catch (error) {
        log(`AI detection failed: ${(error as Error).message}`, 'document');
        // Don't fail the whole process if AI detection fails
      }
    } else if (!process.env.GPTZERO_API_KEY) {
      log('GPTZERO_API_KEY not found in environment variables, skipping AI detection', 'document');
    }
    
    // Clean up the extracted text to remove excessive spacing
    const cleanedText = cleanExtractedText(extractedText);
    
    // Always return the full document text and chunks if available
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

// Extract text from PDF using enhanced pdfreader with better text processing
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    console.log("Extracting text from PDF with enhanced processing...");
    
    // Use enhanced pdfreader extraction
    const extractedText = await extractWithEnhancedPdfReader(buffer);
    
    if (!extractedText || extractedText.length < 100) {
      console.log("Enhanced extraction yielded minimal text, trying standard method...");
      return await extractWithPdfReader(buffer);
    }
    
    console.log(`Enhanced PDF extraction successfully extracted ${extractedText.length} characters`);
    return extractedText;
    
  } catch (error) {
    console.error("Enhanced PDF extraction failed, trying standard method:", error);
    try {
      return await extractWithPdfReader(buffer);
    } catch (fallbackError) {
      console.error("All PDF extraction methods failed:", fallbackError);
      throw new Error("Failed to extract text from PDF using all available methods");
    }
  }
}

// Method 1: Extract with PdfReader
async function extractWithPdfReader(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new PdfReader();
    const textByPage: { [key: number]: string[] } = {};
    let pageCount = 0;
    
    // Start with a safety fallback if parser returns nothing
    const timeout = setTimeout(() => {
      // If we've collected any text at all, return it
      if (Object.keys(textByPage).length > 0) {
        const text = Object.keys(textByPage)
          .sort((a, b) => parseInt(a) - parseInt(b))
          .map(pageNum => textByPage[parseInt(pageNum)].join(' '))
          .join('\n\n');
        
        if (text.trim().length > 0) {
          resolve(text);
          return;
        }
      }
      
      // If we got nothing, provide a fallback message
      resolve("The PDF content could not be extracted with method 1.");
    }, 15000); // 15 second timeout
    
    reader.parseBuffer(buffer, (err, item) => {
      if (err) {
        console.error("PDF parsing error:", err);
        // Don't reject - try to continue parsing
      }
      
      if (!item) {
        // End of file, concatenate all text
        clearTimeout(timeout);
        
        const text = Object.keys(textByPage)
          .sort((a, b) => parseInt(a) - parseInt(b))
          .map(pageNum => textByPage[parseInt(pageNum)].join(' '))
          .join('\n\n');
        
        console.log(`Method 1: Extracted ${text.length} characters from PDF with ${pageCount} pages`);
        resolve(text);
        return;
      }
      
      if (item.page) {
        // New page
        pageCount = Math.max(pageCount, item.page);
        textByPage[item.page] = textByPage[item.page] || [];
      } else if (item.text) {
        // Add text to current page
        const pageNum = Object.keys(textByPage).length;
        if (pageNum > 0 && textByPage[pageNum]) {
          textByPage[pageNum].push(item.text);
        }
      }
    });
  });
}

// Method 2: Extract with pdf.js
async function extractWithPdfJs(buffer: Buffer): Promise<string> {
  try {
    const pdfjsLib = await import('pdfjs-dist');
    
    // Configure the workerSrc property for Node.js environment
    if (typeof window === 'undefined') {
      const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.js');
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
    }
    
    const data = new Uint8Array(buffer);
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdf = await loadingTask.promise;
    
    let extractedText = '';
    const numPages = pdf.numPages;
    
    console.log(`Method 2: PDF has ${numPages} pages`);
    
    // Extract text from each page
    for (let i = 1; i <= numPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Extract text from the page, preserving some layout
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        extractedText += pageText + '\n\n';
      } catch (pageError) {
        console.error(`Error extracting text from page ${i}:`, pageError);
        extractedText += `[Error extracting page ${i}]\n\n`;
      }
    }
    
    console.log(`Method 2: Extracted ${extractedText.length} characters from PDF`);
    return extractedText;
  } catch (error) {
    console.error('Error in PDF.js extraction:', error);
    return "The PDF content could not be extracted with method 2.";
  }
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
