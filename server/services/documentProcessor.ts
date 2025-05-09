import { createWorker } from 'tesseract.js';
import { PdfReader } from 'pdfreader';
import mammoth from 'mammoth';

// Process and extract text from uploaded files
export async function processDocument(file: Express.Multer.File): Promise<string> {
  try {
    const fileType = file.originalname.split('.').pop()?.toLowerCase();
    
    if (!fileType) {
      throw new Error("Could not determine file type");
    }
    
    switch (fileType) {
      case 'pdf':
        return extractTextFromPDF(file.buffer);
      case 'docx':
        return extractTextFromDOCX(file.buffer);
      case 'txt':
        return extractTextFromTXT(file.buffer);
      case 'jpg':
      case 'jpeg':
      case 'png':
        return extractTextFromImage(file.buffer);
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }
  } catch (error) {
    console.error("Document processing error:", error);
    throw new Error(`Failed to process document: ${(error as Error).message}`);
  }
}

// Extract text from any file type
export async function extractText(file: Express.Multer.File): Promise<string> {
  return processDocument(file);
}

// Extract text from PDF using pdfreader
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new PdfReader();
    const textByPage: { [key: number]: string[] } = {};
    
    reader.parseBuffer(buffer, (err, item) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (!item) {
        // End of file, concatenate all text
        const text = Object.keys(textByPage)
          .sort((a, b) => parseInt(a) - parseInt(b))
          .map(pageNum => textByPage[parseInt(pageNum)].join(' '))
          .join('\n\n');
          
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
