import { createWorker, Worker } from 'tesseract.js';

export class TesseractOCRService {
  private worker: Worker | null = null;

  async initializeWorker(): Promise<void> {
    if (this.worker) {
      return;
    }

    console.log('[tesseract] Initializing OCR worker...');
    this.worker = await createWorker('eng');
    console.log('[tesseract] OCR worker ready');
  }

  async extractText(imageBuffer: Buffer): Promise<string> {
    try {
      await this.initializeWorker();
      
      if (!this.worker) {
        throw new Error('OCR worker not initialized');
      }

      console.log('[tesseract] Starting text recognition...');
      
      const { data: { text } } = await this.worker.recognize(imageBuffer);
      
      if (!text || !text.trim()) {
        throw new Error('No text detected in image');
      }

      console.log(`[tesseract] Successfully extracted ${text.length} characters`);
      return text.trim();

    } catch (error) {
      console.error('[tesseract] OCR failed:', error);
      throw new Error(`Text extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      console.log('[tesseract] OCR worker terminated');
    }
  }
}

export const tesseractService = new TesseractOCRService();