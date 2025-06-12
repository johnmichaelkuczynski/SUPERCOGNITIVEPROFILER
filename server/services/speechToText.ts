import { Readable } from 'stream';
import OpenAI from 'openai';

export class SpeechToTextService {
  private azureOpenAI: OpenAI;
  private endpoint: string;
  private apiKey: string;

  constructor() {
    this.endpoint = process.env.AZURE_OPENAI_ENDPOINT || '';
    this.apiKey = process.env.AZURE_OPENAI_KEY || '';
    
    if (!this.endpoint || !this.apiKey) {
      console.warn('AZURE_OPENAI_ENDPOINT or AZURE_OPENAI_KEY not found - Speech-to-text features will be disabled');
    }

    this.azureOpenAI = new OpenAI({
      apiKey: this.apiKey,
      baseURL: `${this.endpoint}/openai/deployments/whisper`,
      defaultQuery: { 'api-version': '2024-02-01' },
      defaultHeaders: {
        'api-key': this.apiKey,
      },
    });
  }

  async transcribeAudio(audioBuffer: Buffer, options: {
    language?: string;
    punctuate?: boolean;
    format_text?: boolean;
    speaker_labels?: boolean;
  } = {}): Promise<string> {
    try {
      if (!this.endpoint || !this.apiKey) {
        throw new Error('Azure OpenAI credentials not configured');
      }

      // Convert buffer to File-like object for Azure OpenAI
      const audioFile = new File([audioBuffer], 'audio.webm', { type: 'audio/webm' });
      
      const transcription = await this.azureOpenAI.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: options.language || 'en',
        response_format: 'text',
        temperature: 0.0,
      });

      return transcription || '';
    } catch (error) {
      console.error('Azure OpenAI speech-to-text error:', error);
      throw new Error(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async transcribeRealtime(audioStream: Readable): Promise<string> {
    // Real-time transcription not implemented yet
    throw new Error('Real-time transcription not yet implemented');
  }
}

export const speechToTextService = new SpeechToTextService();