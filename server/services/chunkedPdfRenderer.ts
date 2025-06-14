// Chunked PDF Rendering Service with Validation and Backup
import { validateAndSanitizeMath } from './latexValidator';

export interface ChunkValidationResult {
  chunkIndex: number;
  originalContent: string;
  processedContent: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  renderAttempts: number;
  success: boolean;
}

export interface ChunkedPdfOptions {
  wordsPerChunk: number;
  maxRetries: number;
  validateMath: boolean;
  strictMode: boolean;
  logProgress: boolean;
}

export class ChunkedPdfRenderer {
  private static readonly DEFAULT_OPTIONS: ChunkedPdfOptions = {
    wordsPerChunk: 300,
    maxRetries: 3,
    validateMath: true,
    strictMode: false,
    logProgress: true
  };

  /**
   * Split content into manageable chunks for PDF rendering
   */
  static splitIntoChunks(content: string, wordsPerChunk: number = 300): string[] {
    // Clean and normalize content
    const cleanContent = content
      .replace(/\s+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    const words = cleanContent.split(/\s+/);
    const chunks: string[] = [];
    
    for (let i = 0; i < words.length; i += wordsPerChunk) {
      const chunkWords = words.slice(i, i + wordsPerChunk);
      let chunk = chunkWords.join(' ');
      
      // Ensure mathematical expressions aren't split across chunks
      chunk = this.preserveMathExpressions(chunk, i > 0 ? words.slice(Math.max(0, i - 20), i).join(' ') : '');
      
      chunks.push(chunk);
    }
    
    return chunks;
  }

  /**
   * Process a single chunk with validation and error handling
   */
  static async processChunk(
    chunk: string, 
    chunkIndex: number, 
    options: Partial<ChunkedPdfOptions> = {}
  ): Promise<ChunkValidationResult> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    
    const result: ChunkValidationResult = {
      chunkIndex,
      originalContent: chunk,
      processedContent: chunk,
      isValid: true,
      errors: [],
      warnings: [],
      renderAttempts: 0,
      success: false
    };

    // Attempt processing with retries
    for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
      result.renderAttempts = attempt;
      
      try {
        if (opts.logProgress) {
          console.log(`Processing chunk ${chunkIndex + 1}, attempt ${attempt}/${opts.maxRetries}`);
        }

        // Step 1: Mathematical validation if enabled
        if (opts.validateMath) {
          const mathValidation = validateAndSanitizeMath(result.processedContent, {
            strictMode: opts.strictMode,
            logErrors: opts.logProgress
          });

          if (!mathValidation.isValid) {
            result.errors.push(...mathValidation.errors.map(e => e.message));
            result.warnings.push(...mathValidation.warnings);
            result.processedContent = mathValidation.content;
            result.isValid = false;

            if (opts.logProgress) {
              console.log(`Chunk ${chunkIndex + 1}: Math validation failed, using sanitized version`);
            }
          }
        }

        // Step 2: Content sanitization for PDF rendering
        result.processedContent = this.sanitizeForPdf(result.processedContent);

        // Step 3: Validate the sanitized content can be rendered
        const renderValidation = this.validateForRendering(result.processedContent);
        
        if (!renderValidation.canRender) {
          throw new Error(`Render validation failed: ${renderValidation.reason}`);
        }

        // If we reach here, the chunk is ready
        result.success = true;
        
        if (opts.logProgress) {
          console.log(`Chunk ${chunkIndex + 1}: Successfully processed (${result.processedContent.length} chars)`);
        }
        
        break;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Attempt ${attempt}: ${errorMessage}`);
        
        if (opts.logProgress) {
          console.log(`Chunk ${chunkIndex + 1}, attempt ${attempt} failed: ${errorMessage}`);
        }

        // On failure, try progressively more aggressive sanitization
        if (attempt < opts.maxRetries) {
          result.processedContent = this.fallbackSanitization(result.processedContent, attempt);
        }
      }
    }

    // Final fallback: if all attempts failed, use minimal safe content
    if (!result.success) {
      result.processedContent = this.createSafeContent(chunk, chunkIndex);
      result.errors.push('All attempts failed, using safe fallback content');
      result.warnings.push('Original mathematical notation may be lost');
      
      if (opts.logProgress) {
        console.log(`Chunk ${chunkIndex + 1}: Using safe fallback content`);
      }
    }

    return result;
  }

  /**
   * Process all chunks with progress tracking
   */
  static async processAllChunks(
    content: string,
    options: Partial<ChunkedPdfOptions> = {}
  ): Promise<{
    chunks: ChunkValidationResult[];
    processedContent: string;
    totalErrors: number;
    totalWarnings: number;
    successRate: number;
  }> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const contentChunks = this.splitIntoChunks(content, opts.wordsPerChunk);
    
    if (opts.logProgress) {
      console.log(`Starting chunked processing: ${contentChunks.length} chunks of ~${opts.wordsPerChunk} words each`);
    }

    const results: ChunkValidationResult[] = [];
    let totalErrors = 0;
    let totalWarnings = 0;
    let successfulChunks = 0;

    // Process chunks sequentially to maintain order and allow progress tracking
    for (let i = 0; i < contentChunks.length; i++) {
      const result = await this.processChunk(contentChunks[i], i, options);
      results.push(result);
      
      totalErrors += result.errors.length;
      totalWarnings += result.warnings.length;
      
      if (result.success) {
        successfulChunks++;
      }

      // Progress reporting
      if (opts.logProgress) {
        const progress = ((i + 1) / contentChunks.length * 100).toFixed(1);
        console.log(`Progress: ${progress}% (${i + 1}/${contentChunks.length} chunks processed)`);
      }
    }

    const processedContent = results.map(r => r.processedContent).join('\n\n');
    const successRate = (successfulChunks / contentChunks.length) * 100;

    if (opts.logProgress) {
      console.log(`Chunked processing complete: ${successRate.toFixed(1)}% success rate`);
      console.log(`Total: ${totalErrors} errors, ${totalWarnings} warnings`);
    }

    return {
      chunks: results,
      processedContent,
      totalErrors,
      totalWarnings,
      successRate
    };
  }

  /**
   * Preserve mathematical expressions when splitting chunks
   */
  private static preserveMathExpressions(chunk: string, previousContext: string): string {
    // If chunk starts with what looks like the end of a math expression, try to include beginning
    if (chunk.match(/^[^$]*\$/) && previousContext.includes('$')) {
      const lastDollar = previousContext.lastIndexOf('$');
      if (lastDollar !== -1) {
        const mathStart = previousContext.substring(lastDollar);
        chunk = mathStart + chunk;
      }
    }

    // If chunk ends with what looks like the start of a math expression, truncate safely
    const dollarsInChunk = (chunk.match(/\$/g) || []).length;
    if (dollarsInChunk % 2 !== 0) {
      // Odd number of dollars means incomplete math expression
      const lastDollar = chunk.lastIndexOf('$');
      chunk = chunk.substring(0, lastDollar);
    }

    return chunk;
  }

  /**
   * Sanitize content specifically for PDF rendering
   */
  private static sanitizeForPdf(content: string): string {
    return content
      // Remove problematic Unicode characters that can break PDF rendering
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      // Remove null or undefined content
      .replace(/undefined|null/g, '')
      // Trim excessive whitespace
      .trim();
  }

  /**
   * Validate content can be safely rendered
   */
  private static validateForRendering(content: string): { canRender: boolean; reason?: string } {
    // Check for content length
    if (content.length === 0) {
      return { canRender: false, reason: 'Empty content' };
    }

    // Check for control characters that break PDF
    if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(content)) {
      return { canRender: false, reason: 'Contains control characters' };
    }

    // Check for unbalanced delimiters
    const dollarCount = (content.match(/\$/g) || []).length;
    if (dollarCount % 2 !== 0) {
      return { canRender: false, reason: 'Unbalanced math delimiters' };
    }

    return { canRender: true };
  }

  /**
   * Progressive fallback sanitization based on attempt number
   */
  private static fallbackSanitization(content: string, attemptNumber: number): string {
    switch (attemptNumber) {
      case 1:
        // Remove all math delimiters and keep only content
        return content.replace(/\$+/g, '');
      
      case 2:
        // Keep only letters, numbers, basic punctuation, and spaces
        return content.replace(/[^a-zA-Z0-9\s.,;:!?()-]/g, ' ').replace(/\s+/g, ' ');
      
      default:
        // Most aggressive: only alphanumeric and basic punctuation
        return content.replace(/[^a-zA-Z0-9\s.,]/g, ' ').replace(/\s+/g, ' ').trim();
    }
  }

  /**
   * Create safe content when all else fails
   */
  private static createSafeContent(originalChunk: string, chunkIndex: number): string {
    const wordCount = originalChunk.split(/\s+/).length;
    return `[Content section ${chunkIndex + 1}: ${wordCount} words - Mathematical notation removed for PDF compatibility]`;
  }

  /**
   * Generate HTML for PDF rendering with chunked content
   */
  static generateChunkedHtml(
    processedChunks: ChunkValidationResult[],
    documentName: string,
    options: { includeDiagnostics?: boolean } = {}
  ): string {
    const contentSections = processedChunks.map((chunk, index) => {
      const diagnostics = options.includeDiagnostics && (!chunk.success || chunk.errors.length > 0) ? 
        `<!-- Chunk ${index + 1}: ${chunk.renderAttempts} attempts, ${chunk.errors.length} errors, ${chunk.warnings.length} warnings -->` : '';
      
      return `${diagnostics}<div class="chunk" data-chunk="${index}">${chunk.processedContent}</div>`;
    }).join('\n\n');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${documentName} - Chunked PDF</title>
    <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
    <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
    <script>
        window.MathJax = {
            tex: {
                inlineMath: [['$', '$']],
                displayMath: [['$$', '$$']],
                processEscapes: true,
                processEnvironments: true
            },
            options: {
                skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre']
            },
            startup: {
                ready() {
                    console.log('MathJax starting up for chunked rendering...');
                    MathJax.startup.defaultReady();
                }
            }
        };
    </script>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            line-height: 1.6;
            max-width: 8.5in;
            margin: 0 auto;
            padding: 1in;
            color: #333;
            background: white;
        }
        
        .chunk {
            margin-bottom: 1em;
            page-break-inside: avoid;
        }
        
        @media print {
            body {
                margin: 0;
                padding: 0.5in;
                font-size: 11pt;
            }
            
            .chunk {
                margin-bottom: 0.8em;
            }
        }
    </style>
</head>
<body>
    <h1>${documentName}</h1>
    ${contentSections}
    
    <script>
        // Enhanced error handling for chunked rendering
        document.addEventListener('DOMContentLoaded', function() {
            if (window.MathJax) {
                MathJax.startup.promise.then(() => {
                    console.log('MathJax fully loaded for all chunks');
                    window.mathJaxReady = true;
                }).catch((err) => {
                    console.error('MathJax failed to load:', err);
                    window.mathJaxReady = false;
                });
            }
        });

        // Validate each chunk rendered correctly
        window.addEventListener('beforeprint', function() {
            const chunks = document.querySelectorAll('.chunk');
            console.log(\`Preparing to print \${chunks.length} chunks\`);
            
            if (window.MathJax) {
                MathJax.typesetPromise().then(() => {
                    console.log('All chunks ready for printing');
                }).catch((err) => {
                    console.error('Error preparing chunks for print:', err);
                });
            }
        });
    </script>
</body>
</html>`;
  }
}

// Export utility function for easy integration
export async function renderDocumentInChunks(
  content: string,
  documentName: string,
  options: Partial<ChunkedPdfOptions> = {}
): Promise<{
  html: string;
  validation: {
    chunks: ChunkValidationResult[];
    successRate: number;
    totalErrors: number;
    totalWarnings: number;
  };
}> {
  const result = await ChunkedPdfRenderer.processAllChunks(content, options);
  const html = ChunkedPdfRenderer.generateChunkedHtml(result.chunks, documentName, {
    includeDiagnostics: true
  });

  return {
    html,
    validation: {
      chunks: result.chunks,
      successRate: result.successRate,
      totalErrors: result.totalErrors,
      totalWarnings: result.totalWarnings
    }
  };
}