import { createWorker } from 'tesseract.js';
import { PdfReader } from 'pdfreader';
import mammoth from 'mammoth';
import { detectAIContent, type AIDetectionResult } from './gptZero';
import { log } from '../vite';

export interface ProcessedDocument {
  text: string;
  aiDetection?: AIDetectionResult;
}

// Process and extract text from uploaded files
export async function processDocument(file: Express.Multer.File): Promise<ProcessedDocument> {
  try {
    const fileType = file.originalname.split('.').pop()?.toLowerCase();
    
    if (!fileType) {
      throw new Error("Could not determine file type");
    }
    
    let extractedText = '';
    
    switch (fileType) {
      case 'pdf':
        extractedText = await extractTextFromPDF(file.buffer);
        break;
      case 'docx':
        extractedText = await extractTextFromDOCX(file.buffer);
        break;
      case 'txt':
        extractedText = await extractTextFromTXT(file.buffer);
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
        aiDetection = await detectAIContent(extractedText);
      } catch (error) {
        log(`AI detection failed: ${(error as Error).message}`, 'document');
        // Don't fail the whole process if AI detection fails
      }
    } else if (!process.env.GPTZERO_API_KEY) {
      log('GPTZERO_API_KEY not found in environment variables, skipping AI detection', 'document');
    }
    
    return {
      text: extractedText,
      aiDetection
    };
  } catch (error) {
    console.error("Document processing error:", error);
    throw new Error(`Failed to process document: ${(error as Error).message}`);
  }
}

// Extract text from any file type
export async function extractText(file: Express.Multer.File): Promise<string> {
  const processed = await processDocument(file);
  return processed.text;
}

// Extract text from PDF using pdfreader
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new PdfReader();
    const textByPage: { [key: number]: string[] } = {};
    
    // Start with a safety fallback if parser returns nothing
    setTimeout(() => {
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
      resolve("The PDF content could not be extracted. This may be a scanned document or have content protection.");
    }, 10000); // 10 second timeout
    
    reader.parseBuffer(buffer, (err, item) => {
      if (err) {
        console.error("PDF parsing error:", err);
        // Don't reject - try to continue parsing
      }
      
      if (!item) {
        // End of file, concatenate all text
        const text = Object.keys(textByPage)
          .sort((a, b) => parseInt(a) - parseInt(b))
          .map(pageNum => textByPage[parseInt(pageNum)].join(' '))
          .join('\n\n');
        
        console.log(`Extracted ${text.length} characters from PDF`);
        resolve(text);
        return;
      }
      
      if (item.page) {
        // New page
        textByPage[item.page] = [];
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

// Extract text from DOCX using mammoth
async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

// Extract text from TXT files
async function extractTextFromTXT(buffer: Buffer): Promise<string> {
  return buffer.toString('utf-8');
}

// Extract text from images using Tesseract OCR
async function extractTextFromImage(buffer: Buffer): Promise<string> {
  const worker = await createWorker();
  
  try {
    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    
    const { data } = await worker.recognize(buffer);
    await worker.terminate();
    
    return data.text;
  } catch (error) {
    if (worker) {
      await worker.terminate();
    }
    throw error;
  }
}
