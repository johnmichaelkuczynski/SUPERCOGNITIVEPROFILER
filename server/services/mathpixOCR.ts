import fetch from 'node-fetch';

interface MathpixOCRResult {
  text: string;
  latex?: string;
  confidence: number;
  containsMath: boolean;
  error?: string;
}

interface MathpixResponse {
  text: string;
  latex_styled?: string;
  confidence?: number;
  error?: string;
  detection_map?: {
    contains_math: boolean;
    contains_table: boolean;
    contains_diagram: boolean;
    contains_chart: boolean;
  };
}

/**
 * Extract text and mathematical notation from images using Mathpix OCR
 * @param imageBuffer The image buffer to process
 * @param options OCR processing options
 * @returns Extracted text with LaTeX mathematical notation
 */
export async function extractWithMathpix(
  imageBuffer: Buffer,
  options: {
    formats?: string[];
    includeLatex?: boolean;
    includeText?: boolean;
  } = {}
): Promise<MathpixOCRResult> {
  const {
    formats = ['text', 'latex_styled'],
    includeLatex = true,
    includeText = true
  } = options;

  if (!process.env.MATHPIX_APP_ID || !process.env.MATHPIX_APP_KEY) {
    throw new Error('Mathpix credentials not configured. Please set MATHPIX_APP_ID and MATHPIX_APP_KEY environment variables.');
  }

  try {
    // Convert image buffer to base64
    const base64Image = imageBuffer.toString('base64');
    const mimeType = detectImageMimeType(imageBuffer);
    
    // Prepare request body with enhanced math detection
    const requestBody = {
      src: `data:${mimeType};base64,${base64Image}`,
      formats: formats,
      data_options: {
        include_asciimath: true,
        include_latex: includeLatex,
        include_mathml: false,
        include_svg: false,
        include_table_html: false,
        include_tsv: false
      },
      format_options: {
        text: {
          transforms: ["rm_spaces", "rm_newlines"],
          math_inline_delimiters: ["\\(", "\\)"],
          math_display_delimiters: ["\\[", "\\]"]
        },
        latex_styled: {
          transforms: ["rm_spaces"],
          math_inline_delimiters: ["\\(", "\\)"],
          math_display_delimiters: ["\\[", "\\]"]
        }
      }
    };

    console.log('Sending OCR request to Mathpix...');
    
    // Make request to Mathpix API
    const response = await fetch('https://api.mathpix.com/v3/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'app_id': process.env.MATHPIX_APP_ID,
        'app_key': process.env.MATHPIX_APP_KEY
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Mathpix API error:', response.status, errorText);
      throw new Error(`Mathpix API error: ${response.status} - ${errorText}`);
    }

    const result: MathpixResponse = await response.json();
    console.log('Mathpix response received:', {
      hasText: !!result.text,
      hasLatex: !!result.latex_styled,
      confidence: result.confidence,
      containsMath: result.detection_map?.contains_math
    });

    // Process the response
    let extractedText = '';
    let latex = '';
    
    if (includeText && result.text) {
      extractedText = result.text;
    }
    
    if (includeLatex && result.latex_styled) {
      latex = result.latex_styled;
    }

    // Process and enhance the extracted text for better math notation
    let finalText = '';
    const containsMath = result.detection_map?.contains_math || false;
    
    if (latex && extractedText) {
      // If LaTeX is available and contains math notation, prefer it
      if (latex.includes('\\') || latex.includes('$') || containsMath) {
        finalText = latex;
      } else {
        // Post-process text to identify potential math expressions
        finalText = enhanceMathNotation(extractedText);
      }
    } else if (latex) {
      finalText = latex;
    } else if (extractedText) {
      // Post-process plain text to identify and format math expressions
      finalText = enhanceMathNotation(extractedText);
    }

    return {
      text: finalText,
      latex: latex || undefined,
      confidence: result.confidence || 0,
      containsMath: result.detection_map?.contains_math || false,
      error: result.error
    };

  } catch (error) {
    console.error('Mathpix OCR error:', error);
    
    return {
      text: '',
      confidence: 0,
      containsMath: false,
      error: error instanceof Error ? error.message : 'Unknown OCR error'
    };
  }
}

/**
 * Enhance text by identifying and formatting mathematical expressions
 */
function enhanceMathNotation(text: string): string {
  if (!text) return text;
  
  let enhanced = text;
  
  // Common mathematical patterns to convert to LaTeX
  const mathPatterns = [
    // Greek letters
    { pattern: /\balpha\b/g, latex: '\\alpha' },
    { pattern: /\bbeta\b/g, latex: '\\beta' },
    { pattern: /\bgamma\b/g, latex: '\\gamma' },
    { pattern: /\bdelta\b/g, latex: '\\delta' },
    { pattern: /\bepsilon\b/g, latex: '\\epsilon' },
    { pattern: /\btheta\b/g, latex: '\\theta' },
    { pattern: /\blambda\b/g, latex: '\\lambda' },
    { pattern: /\bmu\b/g, latex: '\\mu' },
    { pattern: /\bpi\b/g, latex: '\\pi' },
    { pattern: /\bsigma\b/g, latex: '\\sigma' },
    { pattern: /\btau\b/g, latex: '\\tau' },
    { pattern: /\bphi\b/g, latex: '\\phi' },
    { pattern: /\bchi\b/g, latex: '\\chi' },
    { pattern: /\bpsi\b/g, latex: '\\psi' },
    { pattern: /\bomega\b/g, latex: '\\omega' },
    
    // Mathematical operators and symbols
    { pattern: /\+/-/g, latex: '\\pm' },
    { pattern: /\binfinity\b/g, latex: '\\infty' },
    { pattern: /\bsum\b/g, latex: '\\sum' },
    { pattern: /\bintegral\b/g, latex: '\\int' },
    { pattern: /\bpartial\b/g, latex: '\\partial' },
    { pattern: /\bnabla\b/g, latex: '\\nabla' },
    { pattern: /\bforall\b/g, latex: '\\forall' },
    { pattern: /\bexists\b/g, latex: '\\exists' },
    { pattern: /\bin\b(?=\s)/g, latex: '\\in' },
    { pattern: /\bsubset\b/g, latex: '\\subset' },
    { pattern: /\bunion\b/g, latex: '\\cup' },
    { pattern: /\bintersection\b/g, latex: '\\cap' },
    
    // Common function patterns
    { pattern: /\bsin\b/g, latex: '\\sin' },
    { pattern: /\bcos\b/g, latex: '\\cos' },
    { pattern: /\btan\b/g, latex: '\\tan' },
    { pattern: /\blog\b/g, latex: '\\log' },
    { pattern: /\bln\b/g, latex: '\\ln' },
    { pattern: /\bexp\b/g, latex: '\\exp' },
    { pattern: /\blim\b/g, latex: '\\lim' },
    
    // Fractions (simple pattern)
    { pattern: /(\d+)\/(\d+)/g, latex: '\\frac{$1}{$2}' },
    
    // Subscripts and superscripts (basic detection)
    { pattern: /([a-zA-Z])_([a-zA-Z0-9]+)/g, latex: '$1_{$2}' },
    { pattern: /([a-zA-Z])\^([a-zA-Z0-9]+)/g, latex: '$1^{$2}' },
  ];
  
  // Apply mathematical pattern replacements
  for (const { pattern, latex } of mathPatterns) {
    enhanced = enhanced.replace(pattern, latex);
  }
  
  // Wrap mathematical expressions in LaTeX delimiters if they contain LaTeX commands
  if (enhanced.includes('\\') && !enhanced.includes('\\(') && !enhanced.includes('$$')) {
    // Split text by lines and wrap lines containing math
    const lines = enhanced.split('\n');
    const processedLines = lines.map(line => {
      if (line.includes('\\') && /\\[a-zA-Z]+/.test(line)) {
        // This line contains LaTeX commands, wrap it
        return `\\(${line}\\)`;
      }
      return line;
    });
    enhanced = processedLines.join('\n');
  }
  
  return enhanced;
}

/**
 * Detect image MIME type from buffer
 */
function detectImageMimeType(buffer: Buffer): string {
  // Check magic bytes to determine image type
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
  
  // Default to PNG
  return 'image/png';
}

/**
 * Enhanced image text extraction that combines Mathpix with fallback OCR
 */
export async function extractTextFromImageEnhanced(buffer: Buffer): Promise<string> {
  try {
    // First try Mathpix for the best results, especially with math
    console.log('Attempting OCR with Mathpix...');
    const mathpixResult = await extractWithMathpix(buffer);
    
    if (mathpixResult.text && mathpixResult.confidence > 0.5) {
      console.log(`Mathpix extraction successful (confidence: ${mathpixResult.confidence})`);
      console.log(`Contains math: ${mathpixResult.containsMath}`);
      return mathpixResult.text;
    }
    
    console.log('Mathpix extraction failed or low confidence, falling back to Tesseract...');
    
    // Fallback to existing Tesseract implementation
    const Tesseract = require('tesseract.js');
    
    const { data: { text } } = await Tesseract.recognize(buffer, 'eng', {
      logger: m => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });
    
    return text || 'Could not extract text from image.';
    
  } catch (error) {
    console.error('Enhanced image extraction error:', error);
    
    // Final fallback to basic Tesseract
    try {
      const Tesseract = require('tesseract.js');
      const { data: { text } } = await Tesseract.recognize(buffer, 'eng');
      return text || 'Could not extract text from image.';
    } catch (fallbackError) {
      console.error('Fallback OCR also failed:', fallbackError);
      return 'Could not extract text from image due to OCR errors.';
    }
  }
}

/**
 * Process screenshot specifically for math and text extraction
 */
export async function processScreenshot(buffer: Buffer): Promise<{
  text: string;
  containsMath: boolean;
  confidence: number;
  processingMethod: string;
}> {
  try {
    const mathpixResult = await extractWithMathpix(buffer, {
      includeLatex: true,
      includeText: true
    });
    
    if (mathpixResult.error) {
      throw new Error(mathpixResult.error);
    }
    
    return {
      text: mathpixResult.text,
      containsMath: mathpixResult.containsMath,
      confidence: mathpixResult.confidence,
      processingMethod: 'mathpix'
    };
    
  } catch (error) {
    console.log('Mathpix failed, using fallback OCR for screenshot...');
    
    // Fallback to Tesseract
    const fallbackText = await extractTextFromImageEnhanced(buffer);
    
    return {
      text: fallbackText,
      containsMath: false,
      confidence: 0.7, // Assume reasonable confidence for Tesseract
      processingMethod: 'tesseract_fallback'
    };
  }
}