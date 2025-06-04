import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';
import { PDFExtract } from 'pdf.js-extract';

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
    const pdfExtract = new PDFExtract();
    
    const data = await new Promise<any>((resolve, reject) => {
      pdfExtract.extractBuffer(buffer, {}, (err: any, data: any) => {
        if (err) reject(err);
        else resolve(data);
      });
    });

    if (!data || !data.pages || data.pages.length === 0) {
      return {
        text: '',
        success: false,
        error: 'No readable content found in PDF'
      };
    }

    // Extract text with proper line breaks and spacing
    let extractedText = '';
    
    for (const page of data.pages) {
      if (page.content && page.content.length > 0) {
        // Sort content by Y position (top to bottom) then X position (left to right)
        const sortedContent = page.content.sort((a: any, b: any) => {
          const yDiff = Math.abs(a.y - b.y);
          if (yDiff < 2) { // Same line
            return a.x - b.x;
          }
          return b.y - a.y; // Higher Y values first (top to bottom)
        });

        let currentY = -1;
        let lineText = '';
        
        for (const item of sortedContent) {
          if (item.str && item.str.trim()) {
            // Check if we're on a new line
            if (currentY === -1 || Math.abs(item.y - currentY) > 2) {
              if (lineText.trim()) {
                extractedText += lineText.trim() + '\n';
              }
              lineText = item.str;
              currentY = item.y;
            } else {
              // Same line, add space if needed
              if (lineText && !lineText.endsWith(' ') && !item.str.startsWith(' ')) {
                lineText += ' ';
              }
              lineText += item.str;
            }
          }
        }
        
        // Add the last line
        if (lineText.trim()) {
          extractedText += lineText.trim() + '\n';
        }
        
        // Add page break for multi-page documents
        if (data.pages.length > 1) {
          extractedText += '\n';
        }
      }
    }

    if (extractedText && extractedText.trim()) {
      return {
        text: extractedText.trim(),
        success: true
      };
    } else {
      return {
        text: '',
        success: false,
        error: 'No text content found in PDF'
      };
    }
  } catch (error) {
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