import { Readable } from 'stream';

interface AssemblyAIResponse {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'error';
  text?: string;
  error?: string;
}

export class SpeechToTextService {
  private apiKey: string;
  private baseURL = 'https://api.assemblyai.com/v2';

  constructor() {
    this.apiKey = process.env.ASSEMBLYAI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('ASSEMBLYAI_API_KEY not found - Speech-to-text features will be disabled');
    }
  }

  async transcribeAudio(audioBuffer: Buffer, options: {
    language?: string;
    punctuate?: boolean;
    format_text?: boolean;
    speaker_labels?: boolean;
  } = {}): Promise<string> {
    try {
      // Upload audio file first
      const uploadUrl = await this.uploadAudio(audioBuffer);
      
      // Request transcription
      const transcriptionId = await this.requestTranscription(uploadUrl, options);
      
      // Poll for completion
      const result = await this.pollForCompletion(transcriptionId);
      
      return result.text || '';
    } catch (error) {
      console.error('Speech-to-text error:', error);
      throw new Error(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async uploadAudio(audioBuffer: Buffer): Promise<string> {
    const response = await fetch(`${this.baseURL}/upload`, {
      method: 'POST',
      headers: {
        'authorization': this.apiKey,
        'content-type': 'application/octet-stream',
      },
      body: audioBuffer,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.upload_url;
  }

  private async requestTranscription(audioUrl: string, options: any): Promise<string> {
    const response = await fetch(`${this.baseURL}/transcript`, {
      method: 'POST',
      headers: {
        'authorization': this.apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: audioUrl,
        language_code: options.language || 'en',
        punctuate: options.punctuate !== false,
        format_text: options.format_text !== false,
        speaker_labels: options.speaker_labels || false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Transcription request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.id;
  }

  private async pollForCompletion(transcriptionId: string, maxAttempts = 60): Promise<AssemblyAIResponse> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const response = await fetch(`${this.baseURL}/transcript/${transcriptionId}`, {
        headers: {
          'authorization': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Polling failed: ${response.statusText}`);
      }

      const data: AssemblyAIResponse = await response.json();

      if (data.status === 'completed') {
        return data;
      } else if (data.status === 'error') {
        throw new Error(`Transcription failed: ${data.error}`);
      }

      // Wait 2 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new Error('Transcription timed out');
  }

  async transcribeRealtime(audioStream: Readable): Promise<string> {
    // For real-time transcription, we'll use AssemblyAI's WebSocket API
    // This is more complex and would require WebSocket implementation
    // For now, we'll focus on file-based transcription
    throw new Error('Real-time transcription not yet implemented');
  }
}

export const speechToTextService = new SpeechToTextService();