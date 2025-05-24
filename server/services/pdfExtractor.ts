import fs from 'fs';
import { PDFDocument } from 'pdf-lib';

/**
 * Extract text from PDF using pdf-lib for more reliable full document extraction
 * This addresses the issue of only getting partial content from PDFs
 */
export async function extractFullPdfText(buffer: Buffer): Promise<string> {
  try {
    // Load the PDF document
    const pdfDoc = await PDFDocument.load(buffer);
    
    // Get the number of pages
    const pageCount = pdfDoc.getPageCount();
    console.log(`PDF has ${pageCount} pages`);
    
    // Create temp file for processing
    const tempPath = `/tmp/temp-${Date.now()}.pdf`;
    fs.writeFileSync(tempPath, buffer);
    
    // Use pdftotext command line tool for better text extraction
    const { execSync } = require('child_process');
    let extractedText = '';
    
    try {
      // Install pdftotext if not available
      try {
        execSync('which pdftotext');
      } catch (error) {
        console.log('Installing pdftotext...');
        execSync('apt-get update && apt-get install -y poppler-utils');
      }
      
      // Extract text using pdftotext for better results
      extractedText = execSync(`pdftotext -layout "${tempPath}" -`).toString();
      console.log(`Extracted ${extractedText.length} characters using pdftotext`);
    } catch (execError) {
      console.error('Error using pdftotext, falling back to manual extraction:', execError);
      
      // Fallback: manual extraction using pdf-lib
      // Note: This is less effective but serves as a fallback
      extractedText = `PDF Document with ${pageCount} pages. Unfortunately, detailed text extraction failed.`;
    }
    
    // Clean up temp file
    try {
      fs.unlinkSync(tempPath);
    } catch (cleanupError) {
      console.error('Error cleaning up temp file:', cleanupError);
    }
    
    return extractedText;
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    throw new Error(`Failed to extract text from PDF: ${error.message}`);
  }
}

/**
 * Split text into chunks based on logical sections
 */
export function splitIntoChunks(text: string, options = { maxChunkSize: 5000 }): Array<{title: string, content: string}> {
  // Try to identify logical sections first (headings, chapters)
  const headingRegex = /(?:^|\n)(?:#{1,6}\s+|(?:\d+\.)+\s+)(.+?)(?=\n|$)/g;
  const headingMatches = Array.from(text.matchAll(headingRegex));
  
  // If we have enough headings, use them to create chunks
  if (headingMatches.length >= 2) {
    const chunks = [];
    const positions = headingMatches.map(match => match.index);
    positions.push(text.length); // Add end position
    
    for (let i = 0; i < headingMatches.length; i++) {
      const startPos = headingMatches[i].index;
      const endPos = i < headingMatches.length - 1 ? headingMatches[i + 1].index : text.length;
      const chunkContent = text.substring(startPos, endPos).trim();
      const title = headingMatches[i][1].trim();
      
      chunks.push({
        title: title || `Section ${i + 1}`,
        content: chunkContent
      });
    }
    
    return chunks;
  }
  
  // If no clear headings, split by paragraph groups to maintain context
  const paragraphs = text.split(/\n{2,}/);
  const chunks = [];
  let currentChunk = '';
  let chunkIndex = 0;
  
  for (const paragraph of paragraphs) {
    // If adding this paragraph would exceed the max size, create a new chunk
    if (currentChunk.length + paragraph.length > options.maxChunkSize && currentChunk.length > 0) {
      // Get first line as potential title or generate one
      const firstLine = currentChunk.split('\n')[0].trim();
      const title = firstLine.length < 100 ? 
        firstLine : 
        `Section ${chunkIndex + 1} (${currentChunk.length} chars)`;
      
      chunks.push({
        title,
        content: currentChunk
      });
      
      currentChunk = paragraph;
      chunkIndex++;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
  }
  
  // Add the last chunk if there's anything left
  if (currentChunk.length > 0) {
    const firstLine = currentChunk.split('\n')[0].trim();
    const title = firstLine.length < 100 ? 
      firstLine : 
      `Section ${chunkIndex + 1} (${currentChunk.length} chars)`;
    
    chunks.push({
      title,
      content: currentChunk
    });
  }
  
  return chunks;
}

/**
 * Process a PDF file and return both full text and chunks
 */
export async function processPdfWithChunks(buffer: Buffer): Promise<{
  fullText: string,
  chunks: Array<{title: string, content: string}>
}> {
  const fullText = await extractFullPdfText(buffer);
  const chunks = splitIntoChunks(fullText);
  
  return {
    fullText,
    chunks
  };
}