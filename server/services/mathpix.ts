interface MathpixResponse {
  text?: string;
  latex?: string;
  confidence?: number;
  error?: string;
}

export async function extractMathWithMathpix(imageBuffer: Buffer): Promise<string> {
  const appId = process.env.MATHPIX_APP_ID;
  const appKey = process.env.MATHPIX_APP_KEY;
  
  if (!appId || !appKey) {
    throw new Error('Mathpix API credentials not configured');
  }
  
  try {
    console.log(`[mathpix] Processing image with Mathpix OCR...`);
    
    // Convert buffer to base64
    const base64Image = imageBuffer.toString('base64');
    
    const response = await fetch('https://api.mathpix.com/v3/text', {
      method: 'POST',
      headers: {
        'app_id': appId,
        'app_key': appKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        src: `data:image/jpeg;base64,${base64Image}`,
        formats: ['text', 'latex_styled'],
        data_options: {
          include_asciimath: true,
          include_latex: true
        }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[mathpix] API error: ${response.status} - ${errorText}`);
      throw new Error(`Mathpix API error: ${response.status}`);
    }
    
    const result: MathpixResponse = await response.json();
    console.log(`[mathpix] OCR completed with confidence: ${result.confidence || 'unknown'}`);
    
    if (result.error) {
      throw new Error(`Mathpix error: ${result.error}`);
    }
    
    // Combine text and LaTeX for comprehensive mathematical content
    let extractedText = '';
    
    if (result.text) {
      extractedText += result.text;
    }
    
    if (result.latex && result.latex !== result.text) {
      extractedText += '\n\n--- LaTeX Representation ---\n';
      extractedText += result.latex;
    }
    
    if (!extractedText.trim()) {
      throw new Error('No text extracted from image');
    }
    
    console.log(`[mathpix] Successfully extracted ${extractedText.length} characters`);
    return extractedText.trim();
    
  } catch (error) {
    console.error('[mathpix] Error processing image:', error);
    throw new Error(`Mathpix OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function isMathematicalContent(text: string): Promise<boolean> {
  // Check for mathematical symbols and patterns
  const mathPatterns = [
    /\$.*\$/,  // LaTeX math delimiters
    /\\[a-zA-Z]+/,  // LaTeX commands
    /[∑∏∫∂∞≠≤≥±×÷√π θ α β γ δ]/,  // Mathematical symbols
    /\b(sin|cos|tan|log|ln|exp|lim|max|min|sum|integral)\b/i,  // Math functions
    /\d+[\+\-\×\÷]\d+/,  // Basic arithmetic
    /\b\d+[\^\*]\d+\b/,  // Exponents
    /\([^)]*[xyz][^)]*\)/,  // Variables in parentheses
    /\b[fgh]\([xyz]\)/,  // Function notation
  ];
  
  return mathPatterns.some(pattern => pattern.test(text));
}