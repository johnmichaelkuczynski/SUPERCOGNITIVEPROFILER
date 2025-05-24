/**
 * Document chunking utilities that split documents into meaningful sections
 * for more targeted analysis
 */

/**
 * Split text into logical chunks based on headings, paragraphs, or fixed size
 * @param text The full text to split into chunks
 * @param options Configuration options
 * @returns Array of chunks with titles and content
 */
export function splitIntoChunks(
  text: string, 
  options = { maxChunkSize: 5000, minChunkSize: 500 }
): Array<{title: string, content: string}> {
  console.log(`Splitting ${text.length} characters into chunks`);
  
  // Try to identify headings (markdown style or numbered sections)
  const headingRegex = /(?:^|\n)(?:#{1,3}\s+|(?:\d+\.)+\s+|[A-Z][A-Z\s]+:)(.+?)(?=\n|$)/g;
  const headingMatches = Array.from(text.matchAll(headingRegex));
  
  // If we found enough headings, use them to create meaningful chunks
  if (headingMatches.length >= 3) {
    console.log(`Found ${headingMatches.length} headings for chunking`);
    return createChunksFromHeadings(text, headingMatches);
  }
  
  // Otherwise, try section boundaries with line breaks
  const sectionBreakRegex = /\n{3,}/g;
  const sections = text.split(sectionBreakRegex);
  
  if (sections.length >= 3) {
    console.log(`Found ${sections.length} natural sections for chunking`);
    return createChunksFromSections(sections);
  }
  
  // Last resort: fixed-size chunking
  console.log('Using fixed-size chunking');
  return createFixedSizeChunks(text, options.maxChunkSize);
}

/**
 * Create chunks based on identified headings
 */
function createChunksFromHeadings(
  text: string, 
  headingMatches: RegExpMatchArray[]
): Array<{title: string, content: string}> {
  const chunks = [];
  const positions = headingMatches.map(match => match.index);
  positions.push(text.length); // Add end position
  
  for (let i = 0; i < headingMatches.length; i++) {
    const startPos = headingMatches[i].index;
    const endPos = i < headingMatches.length - 1 ? headingMatches[i + 1].index : text.length;
    const chunkContent = text.substring(startPos, endPos).trim();
    const title = headingMatches[i][1].trim();
    
    chunks.push({
      title: title || `Section ${i + 1}`,
      content: chunkContent
    });
  }
  
  return chunks;
}

/**
 * Create chunks from natural document sections
 */
function createChunksFromSections(
  sections: string[]
): Array<{title: string, content: string}> {
  return sections.map((section, index) => {
    // Try to extract title from first line or generate a default one
    const lines = section.trim().split('\n');
    const firstLine = lines[0];
    const title = firstLine && firstLine.length < 100 ? 
      firstLine : `Section ${index + 1}`;
    
    return {
      title,
      content: section
    };
  });
}

/**
 * Create fixed-size chunks when no natural boundaries are found
 */
function createFixedSizeChunks(
  text: string, 
  maxSize: number
): Array<{title: string, content: string}> {
  const chunks = [];
  const words = text.split(/\s+/);
  const totalChunks = Math.ceil(words.length / maxSize);
  
  for (let i = 0; i < totalChunks; i++) {
    const start = i * maxSize;
    const end = Math.min(start + maxSize, words.length);
    const chunkWords = words.slice(start, end);
    const chunkText = chunkWords.join(' ');
    
    // Extract potential title from first sentence or use default
    const firstSentenceMatch = chunkText.match(/^.+?[.!?](?:\s|$)/);
    const title = firstSentenceMatch && firstSentenceMatch[0].length < 100 ?
      firstSentenceMatch[0].trim() : `Section ${i + 1}`;
    
    chunks.push({
      title,
      content: chunkText
    });
  }
  
  return chunks;
}

/**
 * Generate sample summaries for chunks for display
 * This function creates simple summaries when OpenAI is unavailable
 */
export function generateSimpleSummaries(
  chunks: Array<{title: string, content: string}>
): Array<{title: string, content: string, summary: string}> {
  return chunks.map(chunk => {
    // Create basic summary by taking first sentence
    const firstSentence = chunk.content
      .trim()
      .split(/[.!?](?:\s|$)/)[0]
      .substring(0, 150);
    
    const wordCount = chunk.content.split(/\s+/).length;
    
    return {
      ...chunk,
      summary: `${chunk.title} (${wordCount} words) - ${firstSentence}...`
    };
  });
}