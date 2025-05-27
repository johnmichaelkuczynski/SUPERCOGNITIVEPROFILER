import fetch from 'node-fetch';

interface TexifyResult {
  text: string;
  containsMath: boolean;
  confidence: number;
  processingMethod: string;
}

/**
 * Extract mathematical notation using Texify API - designed specifically for math OCR
 * This is much more reliable than Mathpix for mathematical content
 */
export async function extractWithTexify(imageBuffer: Buffer): Promise<TexifyResult> {
  try {
    console.log('Starting Texify math OCR...');
    
    // Convert image to base64
    const base64Image = imageBuffer.toString('base64');
    const mimeType = detectImageMimeType(imageBuffer);
    
    // Texify API endpoint for math OCR
    const response = await fetch('https://api.texify.ai/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: `data:${mimeType};base64,${base64Image}`,
        format: 'latex'
      })
    });

    if (!response.ok) {
      throw new Error(`Texify API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Texify response received:', result);

    // Texify returns pure LaTeX which is exactly what we want
    const extractedLatex = result.prediction || result.latex || result.text || '';
    
    // Clean and format the LaTeX
    const cleanedLatex = cleanLatexOutput(extractedLatex);
    const containsMath = detectMathInLatex(cleanedLatex);
    
    return {
      text: cleanedLatex,
      containsMath,
      confidence: result.confidence || 0.9, // Texify is generally high confidence
      processingMethod: 'texify'
    };

  } catch (error) {
    console.error('Texify OCR error:', error);
    
    // Fallback to hybrid approach if Texify fails
    console.log('Texify failed, falling back to hybrid OCR...');
    return await fallbackToHybridOCR(imageBuffer);
  }
}

/**
 * Clean and format LaTeX output from Texify
 */
function cleanLatexOutput(latex: string): string {
  if (!latex) return '';
  
  let cleaned = latex.trim();
  
  // Remove any wrapping that might interfere
  cleaned = cleaned.replace(/^\$\$(.*)\$\$$/, '$1');
  cleaned = cleaned.replace(/^\$(.*)\$$/, '$1');
  
  // Ensure proper LaTeX formatting
  if (cleaned.includes('\\') && !cleaned.includes('\\(') && !cleaned.includes('$$')) {
    // Wrap in display math if it contains LaTeX commands
    if (cleaned.includes('\\frac') || cleaned.includes('\\sum') || cleaned.includes('\\int')) {
      cleaned = `$$${cleaned}$$`;
    } else {
      cleaned = `\\(${cleaned}\\)`;
    }
  }
  
  return cleaned;
}

/**
 * Detect if LaTeX contains mathematical content
 */
function detectMathInLatex(latex: string): boolean {
  const mathIndicators = [
    /\\[a-zA-Z]+/,  // Any LaTeX command
    /\{[^}]*\}/,    // Braces (common in math)
    /\^/,           // Superscripts
    /_/,            // Subscripts
    /\\frac/,       // Fractions
    /\\sum/,        // Summation
    /\\int/,        // Integration
    /\\alpha|\\beta|\\gamma/,  // Greek letters
  ];
  
  return mathIndicators.some(pattern => pattern.test(latex));
}

/**
 * Fallback to hybrid OCR if Texify fails
 */
async function fallbackToHybridOCR(imageBuffer: Buffer): Promise<TexifyResult> {
  try {
    const { extractWithHybridOCR } = await import('./hybridOCR');
    const result = await extractWithHybridOCR(imageBuffer);
    
    return {
      text: result.text,
      containsMath: result.containsMath,
      confidence: result.confidence,
      processingMethod: 'hybrid_fallback'
    };
  } catch (error) {
    console.error('Fallback OCR also failed:', error);
    return {
      text: 'Could not extract mathematical content from image.',
      containsMath: false,
      confidence: 0,
      processingMethod: 'failed'
    };
  }
}

/**
 * Detect image MIME type from buffer
 */
function detectImageMimeType(buffer: Buffer): string {
  if (buffer.length >= 4) {
    // PNG signature
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      return 'image/png';
    }
    
    // JPEG signature
    if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
      return 'image/jpeg';
    }
    
    // GIF signature
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
      return 'image/gif';
    }
    
    // WebP signature
    if (buffer.length >= 12 && 
        buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
        buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
      return 'image/webp';
    }
  }
  
  return 'image/png';
}

/**
 * Main processing function for mathematical screenshots
 */
export async function processScreenshotWithTexify(buffer: Buffer): Promise<TexifyResult> {
  try {
    // Use Texify for mathematical content extraction
    return await extractWithTexify(buffer);
  } catch (error) {
    console.error('Screenshot processing with Texify failed:', error);
    return await fallbackToHybridOCR(buffer);
  }
}