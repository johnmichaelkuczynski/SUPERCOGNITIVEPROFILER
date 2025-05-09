import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const modelIconMap = {
  'claude': 'ri-ai-generate',
  'gpt4': 'ri-openai-fill',
  'perplexity': 'ri-bubble-chart-fill'
};

export const modelColorMap = {
  'claude': 'bg-primary-100 text-primary-800',
  'gpt4': 'bg-green-100 text-green-800',
  'perplexity': 'bg-accent-100 text-accent-800'
};

export type LLMModel = 'claude' | 'gpt4' | 'perplexity';

export type OutputFormat = 'txt' | 'pdf' | 'docx';

export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function getMimeTypeFromExtension(extension: string): string {
  const extensionMap: Record<string, string> = {
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    doc: 'application/msword',
    txt: 'text/plain',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
  };
  
  return extensionMap[extension.toLowerCase()] || 'application/octet-stream';
}

export function getExtensionFromFileName(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || '';
}

export function isImageFile(fileName: string): boolean {
  const extension = getExtensionFromFileName(fileName);
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension);
}

export function isDocumentFile(fileName: string): boolean {
  const extension = getExtensionFromFileName(fileName);
  return ['pdf', 'docx', 'doc', 'txt', 'rtf'].includes(extension);
}
