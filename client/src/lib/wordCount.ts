// Utility functions for word counting
export function getWordCount(text: string): number {
  if (!text || text.trim().length === 0) return 0;
  
  // Split by whitespace and filter out empty strings
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

export function getCharacterCount(text: string): number {
  return text.length;
}

export function formatWordCount(count: number): string {
  return `${count} word${count !== 1 ? 's' : ''}`;
}

export function formatCharacterCount(count: number): string {
  return `${count} character${count !== 1 ? 's' : ''}`;
}