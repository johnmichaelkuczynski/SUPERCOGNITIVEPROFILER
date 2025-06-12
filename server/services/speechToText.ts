import { Readable } from 'stream';
import OpenAI from 'openai';

export class SpeechToTextService {
  private azureOpenAI: OpenAI;
  private endpoint: string;
  private apiKey: string;
  private deploymentName: string;

  constructor() {
    this.endpoint = process.env.AZURE_OPENAI_ENDPOINT || '';
    this.apiKey = process.env.AZURE_OPENAI_KEY || '';
    // Try common deployment names for Whisper
    this.deploymentName = process.env.AZURE_WHISPER_DEPLOYMENT || 'whisper-1';
    
    if (!this.endpoint || !this.apiKey) {
      console.warn('AZURE_OPENAI_ENDPOINT or AZURE_OPENAI_KEY not found - Speech-to-text features will be disabled');
    }

    this.azureOpenAI = new OpenAI({
      apiKey: this.apiKey,
      baseURL: `${this.endpoint}/openai/deployments/${this.deploymentName}`,
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
    if (!this.endpoint || !this.apiKey) {
      throw new Error('Azure OpenAI credentials not configured');
    }

    // Try multiple common deployment names
    const deploymentNames = [
      this.deploymentName,
      'whisper-1',
      'whisper',
      'whisper-deployment',
      'speech-to-text'
    ];

    let lastError: Error | null = null;

    for (const deploymentName of deploymentNames) {
      try {
        console.log(`Trying Azure Whisper deployment: ${deploymentName}`);
        
        const azureClient = new OpenAI({
          apiKey: this.apiKey,
          baseURL: `${this.endpoint}/openai/deployments/${deploymentName}`,
          defaultQuery: { 'api-version': '2024-02-01' },
          defaultHeaders: {
            'api-key': this.apiKey,
          },
        });

        // Convert buffer to File-like object for Azure OpenAI
        const audioFile = new File([audioBuffer], 'audio.webm', { type: 'audio/webm' });
        
        const transcription = await azureClient.audio.transcriptions.create({
          file: audioFile,
          model: 'whisper-1',
          language: options.language || 'en',
          response_format: 'text',
          temperature: 0.0,
        });

        console.log(`Successfully transcribed with deployment: ${deploymentName}`);
        return transcription || '';

      } catch (error) {
        console.log(`Failed with deployment ${deploymentName}:`, error instanceof Error ? error.message : 'Unknown error');
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        // If it's not a deployment not found error, don't try other deployments
        if (error instanceof Error && !error.message.includes('deployment') && !error.message.includes('404')) {
          break;
        }
      }
    }

    // If all deployments failed, provide helpful error message
    console.error('All Azure Whisper deployments failed. Last error:', lastError);
    throw new Error(`Speech-to-text failed. Please check that you have a Whisper deployment in your Azure OpenAI resource. Available deployment names to try: ${deploymentNames.join(', ')}. Last error: ${lastError?.message || 'Unknown error'}`);
  }

  async transcribeRealtime(audioStream: Readable): Promise<string> {
    // Real-time transcription not implemented yet
    throw new Error('Real-time transcription not yet implemented');
  }
}

export const speechToTextService = new SpeechToTextService();