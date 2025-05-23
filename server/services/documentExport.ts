/**
 * Document export service for converting text content to different document formats
 */
import * as fs from 'fs';
import * as path from 'path';
import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, HeadingLevel, TextRun } from 'docx';

// Convert markdown content to HTML
export function markdownToHtml(markdown: string): string {
  // Very basic markdown conversion for simple formatting
  let html = markdown
    // Headers
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
    .replace(/^##### (.*$)/gim, '<h5>$1</h5>')
    .replace(/^###### (.*$)/gim, '<h6>$1</h6>')
    // Bold
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    // Italics
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    // Code blocks
    .replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>')
    // Inline code
    .replace(/`(.*?)`/gim, '<code>$1</code>')
    // Lists
    .replace(/^\s*\*\s+(.*$)/gim, '<li>$1</li>')
    // Paragraphs - wrap any content not already wrapped
    .replace(/^(?!<[oh][1-6l]|<pre|<p)(.*$)/gim, '<p>$1</p>');
  
  // Wrap lists
  html = html.replace(/(<li>.*?<\/li>\s*)+/gim, '<ul>$&</ul>');
  
  // Return fully formatted HTML document
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document Export</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1, h2, h3, h4, h5, h6 { margin-top: 1.5em; margin-bottom: 0.5em; }
    p { margin-bottom: 1em; }
    pre { background-color: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
    code { background-color: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
    ul, ol { margin-bottom: 1em; }
  </style>
</head>
<body>
  ${html}
</body>
</html>`;
}

/**
 * Generate a proper Word document using docx library
 * @param content Markdown content to convert to Word format
 * @returns Buffer containing the Word document
 */
export async function generateWordDocument(content: string, documentName: string = 'document'): Promise<Buffer> {
  try {
    // Parse markdown into structured content for Word
    const lines = content.split('\n');
    const docElements = [];
    
    // Process each line and convert to Word document elements
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines
      if (!line) continue;
      
      // Handle headers
      if (line.startsWith('# ')) {
        docElements.push(new Paragraph({
          text: line.substring(2),
          heading: HeadingLevel.HEADING_1
        }));
      } else if (line.startsWith('## ')) {
        docElements.push(new Paragraph({
          text: line.substring(3),
          heading: HeadingLevel.HEADING_2
        }));
      } else if (line.startsWith('### ')) {
        docElements.push(new Paragraph({
          text: line.substring(4),
          heading: HeadingLevel.HEADING_3
        }));
      } else {
        // Handle regular paragraphs
        // Remove markdown formatting
        let textContent = line
          .replace(/\*\*(.*?)\*\*/g, '$1')  // Bold
          .replace(/\*(.*?)\*/g, '$1')      // Italic
          .replace(/`(.*?)`/g, '$1');       // Code
          
        docElements.push(new Paragraph({
          children: [new TextRun(textContent)]
        }));
      }
    }
    
    // Create the document with the elements
    const doc = new Document({
      sections: [{
        properties: {},
        children: docElements
      }]
    });
    
    // Generate the Word document buffer
    return await Packer.toBuffer(doc);
  } catch (error) {
    console.error('Error generating Word document:', error);
    throw error;
  }
}

/**
 * Generate a proper PDF document using PDFKit
 * @param content Markdown content to convert to PDF
 * @returns Buffer containing the PDF document
 */
export function generatePDFDocument(content: string): Buffer {
  return new Promise((resolve, reject) => {
    try {
      // Create a PDF document
      const doc = new PDFDocument({
        margin: 50,
        size: 'letter'
      });
      
      // Collect PDF data in a buffer
      const chunks: Buffer[] = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      
      // Add a title
      doc.fontSize(18).text('Document Export', { align: 'center' });
      doc.moveDown();
      
      // Process the markdown content
      const lines = content.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip empty lines but add space
        if (!line) {
          doc.moveDown(0.5);
          continue;
        }
        
        // Handle headers
        if (line.startsWith('# ')) {
          doc.fontSize(16).text(line.substring(2));
          doc.moveDown();
        } else if (line.startsWith('## ')) {
          doc.fontSize(14).text(line.substring(3));
          doc.moveDown();
        } else if (line.startsWith('### ')) {
          doc.fontSize(12).text(line.substring(4), { underline: true });
          doc.moveDown();
        } else {
          // Regular text - clean up markdown
          let textContent = line
            .replace(/\*\*(.*?)\*\*/g, '$1')  // Bold
            .replace(/\*(.*?)\*/g, '$1')      // Italic
            .replace(/`(.*?)`/g, '$1');       // Code
            
          doc.fontSize(10).text(textContent);
          doc.moveDown(0.5);
        }
      }
      
      // Finalize the PDF
      doc.end();
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      reject(error);
    }
  });
}

/**
 * Create a plain text version of the document
 * Strips markdown formatting for clean text
 */
export function createPlainText(markdown: string): string {
  return markdown
    // Remove headers
    .replace(/^#+\s+(.*$)/gim, '$1\n')
    // Remove bold/italic markers
    .replace(/\*\*(.*?)\*\*/gim, '$1')
    .replace(/\*(.*?)\*/gim, '$1')
    // Remove code blocks 
    .replace(/```([\s\S]*?)```/gim, '$1')
    // Remove inline code
    .replace(/`(.*?)`/gim, '$1');
}

/**
 * Generate document in requested format
 * @param content Document content (markdown format)
 * @param format Output format (txt, html, docx, pdf)
 * @returns Promise resolving to Buffer or string content and mime type
 */
export async function generateDocument(content: string, format: 'txt' | 'html' | 'docx' | 'pdf', documentName: string = 'document'): Promise<{content: string | Buffer, mimeType: string, isBuffer: boolean}> {
  try {
    switch (format) {
      case 'html':
        return {
          content: markdownToHtml(content),
          mimeType: 'text/html',
          isBuffer: false
        };
      case 'docx':
        // Generate proper Word document as binary buffer
        const wordBuffer = await generateWordDocument(content, documentName);
        return {
          content: wordBuffer,
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          isBuffer: true
        };
      case 'pdf':
        // Generate proper PDF as binary buffer
        const pdfBuffer = await generatePDFDocument(content);
        return {
          content: pdfBuffer,
          mimeType: 'application/pdf',
          isBuffer: true
        };
      case 'txt':
      default:
        return {
          content: createPlainText(content),
          mimeType: 'text/plain',
          isBuffer: false
        };
    }
  } catch (error) {
    console.error(`Error generating ${format} document:`, error);
    throw error;
  }
}