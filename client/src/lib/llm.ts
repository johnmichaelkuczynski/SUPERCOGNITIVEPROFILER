import { LLMModel, OutputFormat } from "./utils";

export interface LLMPrompt {
  content: string;
  model: LLMModel;
  temperature?: number;
  stream: boolean;
  files?: File[];
  chunkSize?: string;
  maxTokens?: number;
}

export interface LLMResponse {
  content: string;
  model: LLMModel;
  timestamp: Date;
  wordCount: number;
}

export interface LLMError {
  message: string;
  code?: string;
  status?: number;
}

export interface AnalyticsData {
  writingStyle: {
    formality: number;
    complexity: number;
  };
  topics: Array<{
    name: string;
    percentage: number;
    color: string;
  }>;
  sentiment: {
    overall: number;
    label: string;
    trend: 'up' | 'down' | 'neutral';
  };
  insights: Array<{
    text: string;
    trend: 'up' | 'down' | 'neutral';
  }>;
}

export interface Document {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  model: LLMModel;
  date: Date | string;
  wordCount?: number;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  content?: string;
}

export async function sendPrompt(prompt: LLMPrompt): Promise<Response> {
  const formData = new FormData();
  formData.append('content', prompt.content);
  formData.append('model', prompt.model);
  formData.append('stream', prompt.stream.toString());
  
  if (prompt.temperature !== undefined) {
    formData.append('temperature', prompt.temperature.toString());
  }
  
  if (prompt.chunkSize) {
    formData.append('chunkSize', prompt.chunkSize);
  }
  
  if (prompt.maxTokens) {
    formData.append('maxTokens', prompt.maxTokens.toString());
  }
  
  if (prompt.files && prompt.files.length > 0) {
    prompt.files.forEach(file => {
      formData.append('files', file);
    });
  }
  
  return fetch('/api/llm/prompt', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });
}

export async function getAnalytics(timeframe: string): Promise<AnalyticsData> {
  const response = await fetch(`/api/analytics?timeframe=${timeframe}`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch analytics');
  }
  
  return response.json();
}

export async function getDocuments(): Promise<Document[]> {
  const response = await fetch('/api/documents', {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch documents');
  }
  
  return response.json();
}

export async function downloadOutput(content: string, format: OutputFormat, filename: string = 'output'): Promise<void> {
  const response = await fetch('/api/llm/download', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content,
      format,
      filename,
    }),
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to generate download');
  }
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.${format}`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export async function processFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('/api/documents/process', {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to process file');
  }
  
  const data = await response.json();
  return data.content;
}
