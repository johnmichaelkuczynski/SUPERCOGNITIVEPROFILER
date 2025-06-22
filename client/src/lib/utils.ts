import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const modelIconMap = {
  'claude': 'ri-ai-generate',
  'gpt4': 'ri-openai-fill',
  'perplexity': 'ri-bubble-chart-fill',
  'deepseek': 'ri-brain-fill'
};

export const modelColorMap = {
  'claude': 'bg-primary-100 text-primary-800',
  'gpt4': 'bg-green-100 text-green-800',
  'perplexity': 'bg-accent-100 text-accent-800',
  'deepseek': 'bg-blue-100 text-blue-800'
};

export type LLMModel = 'claude' | 'gpt4' | 'perplexity' | 'deepseek';

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

// Word counting utility for frontend
export function countWords(text: string): number {
  if (!text || typeof text !== 'string') return 0;
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

// Automatically remove meta-text patterns from content
export function cleanMetaText(text: string): string {
  if (!text || typeof text !== 'string') return text;
  
  return text
    // Remove continuation notices
    .replace(/\[continued in next part due to length[^\]]*\]/gi, '')
    .replace(/\[continued in next page[^\]]*\]/gi, '')
    .replace(/\[continued on next page[^\]]*\]/gi, '')
    .replace(/\[continues in next section[^\]]*\]/gi, '')
    .replace(/\[content continues[^\]]*\]/gi, '')
    .replace(/\[to be continued[^\]]*\]/gi, '')
    // Remove truncation notices
    .replace(/\[text truncated[^\]]*\]/gi, '')
    .replace(/\[content truncated[^\]]*\]/gi, '')
    .replace(/\[document truncated[^\]]*\]/gi, '')
    // Remove generic meta-text in brackets
    .replace(/\[Note:[^\]]*\]/gi, '')
    .replace(/\[Editor's note:[^\]]*\]/gi, '')
    .replace(/\[Author's note:[^\]]*\]/gi, '')
    // Remove ellipsis patterns that indicate continuation
    .replace(/\.\.\.\s*\[continued[^\]]*\]/gi, '')
    .replace(/\.\.\.\s*$/m, '')
    // Clean up extra whitespace left by removals
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .replace(/^\s+/gm, '')
    .trim();
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
