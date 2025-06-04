import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';

export interface ExtractedText {
  text: string;
  success: boolean;
  error?: string;
}

/**
 * Extract text from Word documents with perfect formatting preservation
 */
async function extractFromWord(buffer: Buffer): Promise<ExtractedText> {
  try {
    console.log(`[Word] Processing buffer of size: ${buffer.length} bytes`);
    
    // First try HTML conversion to preserve formatting
    const htmlResult = await mammoth.convertToHtml({ buffer });
    
    if (htmlResult.value && htmlResult.value.trim()) {
      // Convert HTML to properly formatted text
      let text = htmlResult.value
        // Remove HTML tags but preserve structure
        .replace(/<\/p>/g, '\n\n')  // Paragraph breaks
        .replace(/<br\s*\/?>/g, '\n')  // Line breaks
        .replace(/<\/h[1-6]>/g, '\n\n')  // Heading breaks
        .replace(/<\/div>/g, '\n')  // Div breaks
        .replace(/<\/li>/g, '\n')  // List item breaks
        .replace(/<[^>]*>/g, '')  // Remove all other HTML tags
        // Clean up HTML entities
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        // Normalize whitespace while preserving intentional breaks
        .replace(/[ \t]+/g, ' ')  // Multiple spaces to single space
        .replace(/\n[ \t]+/g, '\n')  // Remove spaces at start of lines
        .replace(/[ \t]+\n/g, '\n')  // Remove spaces at end of lines
        .replace(/\n{3,}/g, '\n\n')  // Max 2 consecutive newlines
        .trim();
      
      console.log(`[Word] HTML extraction successful: ${text.length} characters`);
      return {
        text: text,
        success: true
      };
    }
    
    // Fallback to raw text if HTML conversion fails
    console.log(`[Word] HTML conversion failed, trying raw text extraction`);
    const rawResult = await mammoth.extractRawText({ buffer });
    
    if (rawResult.value && rawResult.value.trim()) {
      return {
        text: rawResult.value,
        success: true
      };
    } else {
      console.log(`[Word] No text extracted from either method`);
      return {
        text: '',
        success: false,
        error: 'No text found in document'
      };
    }
  } catch (error) {
    console.error(`[Word] Extraction error:`, error);
    return {
      text: '',
      success: false,
      error: `Word extraction failed: ${(error as Error).message}`
    };
  }
}

/**
 * Extract text from PDF documents with perfect formatting preservation
 */
async function extractFromPDF(buffer: Buffer): Promise<ExtractedText> {
  try {
    console.log(`[PDF] Processing buffer of size: ${buffer.length} bytes`);
    
    const data = await pdfParse(buffer);
    
    if (!data || !data.text) {
      return {
        text: '',
        success: false,
        error: 'No readable content found in PDF'
      };
    }

    let extractedText = data.text;
    
    // Clean up the text while preserving dialogue structure
    extractedText = extractedText
      // Normalize line endings
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Fix character names that got split across lines
      .replace(/([A-Za-z]+)\s*\n\s*:/g, '$1:')
      // Add proper spacing after character names
      .replace(/([A-Za-z]+:)([^\n])/g, '$1 $2')
      // Preserve paragraph breaks but limit excessive newlines
      .replace(/\n{4,}/g, '\n\n\n')
      // Clean up spacing
      .trim();

    console.log(`[PDF] Extraction successful: ${extractedText.length} characters`);
    
    return {
      text: extractedText,
      success: true
    };
  } catch (error) {
    console.error(`[PDF] Extraction error:`, error);
    return {
      text: '',
      success: false,
      error: `PDF extraction failed: ${(error as Error).message}`
    };
  }
}

/**
 * Extract text from plain text files
 */
async function extractFromText(buffer: Buffer): Promise<ExtractedText> {
  try {
    const text = buffer.toString('utf-8');
    
    if (text && text.trim()) {
      return {
        text: text,
        success: true
      };
    } else {
      return {
        text: '',
        success: false,
        error: 'Empty text file'
      };
    }
  } catch (error) {
    return {
      text: '',
      success: false,
      error: `Text extraction failed: ${(error as Error).message}`
    };
  }
}

/**
 * Main text extraction function
 */
export async function extractText(file: Express.Multer.File): Promise<ExtractedText> {
  const mimeType = file.mimetype;
  const buffer = file.buffer;

  if (!buffer || buffer.length === 0) {
    return {
      text: '',
      success: false,
      error: 'Empty file buffer'
    };
  }

  // PDF documents
  if (mimeType === 'application/pdf') {
    return extractFromPDF(buffer);
  }

  // Word documents
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/msword') {
    return extractFromWord(buffer);
  }

  // Plain text files
  if (mimeType === 'text/plain') {
    return extractFromText(buffer);
  }

  return {
    text: '',
    success: false,
    error: `Unsupported file type: ${mimeType}`
  };
}