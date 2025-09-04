import { TextChunk } from "@shared/schema";
import { randomUUID } from "crypto";

export class TextChunkerService {
  private readonly CHUNK_SIZE = 500;
  private readonly OVERLAP_SIZE = 50;

  chunkText(text: string): TextChunk[] {
    const words = text.trim().split(/\s+/);
    const totalWords = words.length;
    
    if (totalWords <= this.CHUNK_SIZE) {
      return [{
        id: randomUUID(),
        content: text,
        startWord: 1,
        endWord: totalWords,
      }];
    }

    const chunks: TextChunk[] = [];
    let currentStart = 0;

    while (currentStart < totalWords) {
      const currentEnd = Math.min(currentStart + this.CHUNK_SIZE, totalWords);
      const chunkWords = words.slice(currentStart, currentEnd);
      const chunkContent = chunkWords.join(' ');

      chunks.push({
        id: randomUUID(),
        content: chunkContent,
        startWord: currentStart + 1,
        endWord: currentEnd,
      });

      currentStart = currentEnd - this.OVERLAP_SIZE;
      
      if (totalWords - currentStart < this.CHUNK_SIZE / 2) {
        break;
      }
    }

    return chunks;
  }

  reconstructFromChunks(chunks: TextChunk[], selectedChunkIds: string[]): string {
    const selectedChunks = chunks
      .filter(chunk => selectedChunkIds.includes(chunk.id))
      .sort((a, b) => a.startWord - b.startWord);

    if (selectedChunks.length === 0) {
      return '';
    }

    let reconstructedText = selectedChunks[0].content;
    
    for (let i = 1; i < selectedChunks.length; i++) {
      const currentChunk = selectedChunks[i];
      const previousChunk = selectedChunks[i - 1];
      
      if (currentChunk.startWord <= previousChunk.endWord + this.OVERLAP_SIZE) {
        const overlapWords = previousChunk.endWord - currentChunk.startWord + 1;
        if (overlapWords > 0) {
          const currentWords = currentChunk.content.split(/\s+/);
          const nonOverlappingWords = currentWords.slice(overlapWords);
          reconstructedText += ' ' + nonOverlappingWords.join(' ');
        } else {
          reconstructedText += ' ' + currentChunk.content;
        }
      } else {
        reconstructedText += '\n\n[...]\n\n' + currentChunk.content;
      }
    }

    return reconstructedText;
  }

  getChunkPreview(content: string, maxLength: number = 150): string {
    if (content.length <= maxLength) {
      return content;
    }
    return content.substring(0, maxLength) + '...';
  }
}

export const textChunkerService = new TextChunkerService();