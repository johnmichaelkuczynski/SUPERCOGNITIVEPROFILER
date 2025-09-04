import * as fs from 'fs';
import * as path from 'path';

export interface ProcessedFile {
  filename: string;
  content: string;
  wordCount: number;
}

export class FileProcessorService {
  async processFile(filePath: string, originalName: string): Promise<ProcessedFile> {
    const ext = path.extname(originalName).toLowerCase();
    let content: string;

    try {
      switch (ext) {
        case '.txt':
          content = await this.processTxtFile(filePath);
          break;
        case '.pdf':
          content = await this.processPdfFile(filePath);
          break;
        case '.doc':
        case '.docx':
          content = await this.processWordFile(filePath);
          break;
        default:
          throw new Error(`Unsupported file type: ${ext}`);
      }

      const wordCount = this.countWords(content);
      
      return {
        filename: originalName,
        content,
        wordCount,
      };
    } finally {
      // Clean up temporary file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }

  private async processTxtFile(filePath: string): Promise<string> {
    return fs.readFileSync(filePath, 'utf-8');
  }

  private async processPdfFile(filePath: string): Promise<string> {
    try {
      // Use pdf.js-extract which is already installed and works better
      const { PDFExtract } = await import('pdf.js-extract');
      const pdfExtract = new PDFExtract();
      
      return new Promise((resolve, reject) => {
        pdfExtract.extract(filePath, {}, (err: any, data: any) => {
          if (err) {
            console.error('PDF extraction failed:', err);
            reject(new Error('PDF processing failed. Please ensure the file is a valid PDF.'));
            return;
          }
          
          // Extract text from all pages
          let extractedText = '';
          if (data && data.pages) {
            data.pages.forEach((page: any) => {
              if (page.content) {
                page.content.forEach((item: any) => {
                  if (item.str) {
                    extractedText += item.str + ' ';
                  }
                });
              }
              extractedText += '\n';
            });
          }
          
          resolve(extractedText.trim() || '');
        });
      });
    } catch (error) {
      console.error('PDF processing failed:', error);
      throw new Error('PDF processing failed. Please ensure the file is a valid PDF.');
    }
  }

  private async processWordFile(filePath: string): Promise<string> {
    try {
      // Try to use mammoth if available
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } catch (error) {
      console.error('Word document processing failed:', error);
      throw new Error('Word document processing failed. Please ensure the file is a valid Word document.');
    }
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  async validateFile(file: Express.Multer.File): Promise<void> {
    const allowedTypes = ['.txt', '.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (!allowedTypes.includes(ext)) {
      throw new Error(`File type ${ext} is not supported. Please upload a TXT, PDF, DOC, or DOCX file.`);
    }

    // Check file size (limit to 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      throw new Error('File size exceeds 50MB limit.');
    }
  }
}

export const fileProcessorService = new FileProcessorService();