import { createWorker } from 'tesseract.js';

interface MathExtractionResult {
  text: string;
  containsMath: boolean;
  confidence: number;
  processingMethod: string;
}

/**
 * Hybrid OCR that combines Tesseract with smart math pattern detection
 * This is a more reliable approach than relying solely on Mathpix
 */
export async function extractWithHybridOCR(imageBuffer: Buffer): Promise<MathExtractionResult> {
  try {
    console.log('Starting hybrid OCR with Tesseract + math detection...');
    
    // Use Tesseract for reliable text extraction
    const worker = await createWorker('eng');
    
    try {
      const { data } = await worker.recognize(imageBuffer);
      
      await worker.terminate();
      
      const rawText = data.text || '';
      console.log(`Tesseract extracted ${rawText.length} characters`);
      
      // Enhanced math detection and conversion
      const processedText = enhanceMathNotationAdvanced(rawText);
      const containsMath = detectMathContent(processedText);
      
      return {
        text: processedText,
        containsMath,
        confidence: data.confidence / 100 || 0.8,
        processingMethod: 'hybrid_tesseract'
      };
      
    } catch (ocrError) {
      await worker.terminate();
      throw ocrError;
    }
    
  } catch (error) {
    console.error('Hybrid OCR error:', error);
    return {
      text: 'Could not extract text from image.',
      containsMath: false,
      confidence: 0,
      processingMethod: 'failed'
    };
  }
}

/**
 * Advanced mathematical notation enhancement with better pattern recognition
 */
function enhanceMathNotationAdvanced(text: string): string {
  if (!text) return text;
  
  let enhanced = text;
  
  // Comprehensive mathematical patterns
  const advancedMathPatterns = [
    // Greek letters (case insensitive with word boundaries)
    { pattern: /\balpha\b/gi, latex: '\\alpha' },
    { pattern: /\bbeta\b/gi, latex: '\\beta' },
    { pattern: /\bgamma\b/gi, latex: '\\gamma' },
    { pattern: /\bdelta\b/gi, latex: '\\delta' },
    { pattern: /\bepsilon\b/gi, latex: '\\epsilon' },
    { pattern: /\bzeta\b/gi, latex: '\\zeta' },
    { pattern: /\beta\b/gi, latex: '\\eta' },
    { pattern: /\btheta\b/gi, latex: '\\theta' },
    { pattern: /\biota\b/gi, latex: '\\iota' },
    { pattern: /\bkappa\b/gi, latex: '\\kappa' },
    { pattern: /\blambda\b/gi, latex: '\\lambda' },
    { pattern: /\bmu\b/gi, latex: '\\mu' },
    { pattern: /\bnu\b/gi, latex: '\\nu' },
    { pattern: /\bxi\b/gi, latex: '\\xi' },
    { pattern: /\bomicron\b/gi, latex: '\\omicron' },
    { pattern: /\bpi\b/gi, latex: '\\pi' },
    { pattern: /\brho\b/gi, latex: '\\rho' },
    { pattern: /\bsigma\b/gi, latex: '\\sigma' },
    { pattern: /\btau\b/gi, latex: '\\tau' },
    { pattern: /\bupsilon\b/gi, latex: '\\upsilon' },
    { pattern: /\bphi\b/gi, latex: '\\phi' },
    { pattern: /\bchi\b/gi, latex: '\\chi' },
    { pattern: /\bpsi\b/gi, latex: '\\psi' },
    { pattern: /\bomega\b/gi, latex: '\\omega' },
    
    // Mathematical operators and symbols
    { pattern: /±/g, latex: '\\pm' },
    { pattern: /∓/g, latex: '\\mp' },
    { pattern: /×/g, latex: '\\times' },
    { pattern: /÷/g, latex: '\\div' },
    { pattern: /∞/g, latex: '\\infty' },
    { pattern: /∑/g, latex: '\\sum' },
    { pattern: /∏/g, latex: '\\prod' },
    { pattern: /∫/g, latex: '\\int' },
    { pattern: /∂/g, latex: '\\partial' },
    { pattern: /∇/g, latex: '\\nabla' },
    { pattern: /√/g, latex: '\\sqrt' },
    { pattern: /∀/g, latex: '\\forall' },
    { pattern: /∃/g, latex: '\\exists' },
    { pattern: /∈/g, latex: '\\in' },
    { pattern: /∉/g, latex: '\\notin' },
    { pattern: /⊂/g, latex: '\\subset' },
    { pattern: /⊃/g, latex: '\\supset' },
    { pattern: /∪/g, latex: '\\cup' },
    { pattern: /∩/g, latex: '\\cap' },
    { pattern: /≤/g, latex: '\\leq' },
    { pattern: /≥/g, latex: '\\geq' },
    { pattern: /≠/g, latex: '\\neq' },
    { pattern: /≈/g, latex: '\\approx' },
    { pattern: /→/g, latex: '\\rightarrow' },
    { pattern: /←/g, latex: '\\leftarrow' },
    { pattern: /↔/g, latex: '\\leftrightarrow' },
    
    // Common mathematical words
    { pattern: /\binfinity\b/gi, latex: '\\infty' },
    { pattern: /\bsum\b/gi, latex: '\\sum' },
    { pattern: /\bintegral\b/gi, latex: '\\int' },
    { pattern: /\bpartial\b/gi, latex: '\\partial' },
    { pattern: /\bnabla\b/gi, latex: '\\nabla' },
    { pattern: /\bforall\b/gi, latex: '\\forall' },
    { pattern: /\bexists\b/gi, latex: '\\exists' },
    { pattern: /\bunion\b/gi, latex: '\\cup' },
    { pattern: /\bintersection\b/gi, latex: '\\cap' },
    { pattern: /\bsubset\b/gi, latex: '\\subset' },
    { pattern: /\bsuperset\b/gi, latex: '\\supset' },
    
    // Mathematical functions
    { pattern: /\bsin\b/gi, latex: '\\sin' },
    { pattern: /\bcos\b/gi, latex: '\\cos' },
    { pattern: /\btan\b/gi, latex: '\\tan' },
    { pattern: /\bcot\b/gi, latex: '\\cot' },
    { pattern: /\bsec\b/gi, latex: '\\sec' },
    { pattern: /\bcsc\b/gi, latex: '\\csc' },
    { pattern: /\barcsin\b/gi, latex: '\\arcsin' },
    { pattern: /\barccos\b/gi, latex: '\\arccos' },
    { pattern: /\barctan\b/gi, latex: '\\arctan' },
    { pattern: /\bsinh\b/gi, latex: '\\sinh' },
    { pattern: /\bcosh\b/gi, latex: '\\cosh' },
    { pattern: /\btanh\b/gi, latex: '\\tanh' },
    { pattern: /\blog\b/gi, latex: '\\log' },
    { pattern: /\bln\b/gi, latex: '\\ln' },
    { pattern: /\bexp\b/gi, latex: '\\exp' },
    { pattern: /\blim\b/gi, latex: '\\lim' },
    { pattern: /\bmax\b/gi, latex: '\\max' },
    { pattern: /\bmin\b/gi, latex: '\\min' },
    { pattern: /\bsup\b/gi, latex: '\\sup' },
    { pattern: /\binf\b/gi, latex: '\\inf' },
    
    // Fractions (various patterns)
    { pattern: /(\d+)\s*\/\s*(\d+)/g, latex: '\\frac{$1}{$2}' },
    { pattern: /\(([^)]+)\)\s*\/\s*\(([^)]+)\)/g, latex: '\\frac{$1}{$2}' },
    
    // Subscripts and superscripts
    { pattern: /([a-zA-Z])_([a-zA-Z0-9]+)/g, latex: '$1_{$2}' },
    { pattern: /([a-zA-Z])\^([a-zA-Z0-9]+)/g, latex: '$1^{$2}' },
    { pattern: /([a-zA-Z])_\{([^}]+)\}/g, latex: '$1_{$2}' },
    { pattern: /([a-zA-Z])\^\{([^}]+)\}/g, latex: '$1^{$2}' },
    
    // Square roots
    { pattern: /sqrt\(([^)]+)\)/gi, latex: '\\sqrt{$1}' },
    { pattern: /√\(([^)]+)\)/g, latex: '\\sqrt{$1}' },
    
    // Common equation patterns
    { pattern: /d\/dx/gi, latex: '\\frac{d}{dx}' },
    { pattern: /d\/dt/gi, latex: '\\frac{d}{dt}' },
    { pattern: /\bd\s*\/\s*d([a-zA-Z])/gi, latex: '\\frac{d}{d$1}' },
  ];
  
  // Apply all pattern replacements
  for (const { pattern, latex } of advancedMathPatterns) {
    enhanced = enhanced.replace(pattern, latex);
  }
  
  // Clean up and format LaTeX expressions
  enhanced = formatLatexExpressions(enhanced);
  
  return enhanced;
}

/**
 * Format LaTeX expressions properly with delimiters
 */
function formatLatexExpressions(text: string): string {
  if (!text.includes('\\')) return text;
  
  // Split text into lines for better processing
  const lines = text.split('\n');
  const processedLines = lines.map(line => {
    // If line contains LaTeX commands but no delimiters, add them
    if (line.includes('\\') && /\\[a-zA-Z]+/.test(line) && !line.includes('\\(') && !line.includes('$$')) {
      // Check if the entire line is mathematical
      const mathContent = line.match(/\\[a-zA-Z]+[^a-zA-Z]*|[a-zA-Z_^{}]+|\d+/g);
      if (mathContent && mathContent.length > 0) {
        // Wrap in inline math delimiters
        return `\\(${line}\\)`;
      }
    }
    return line;
  });
  
  return processedLines.join('\n');
}

/**
 * Detect if text contains mathematical content
 */
function detectMathContent(text: string): boolean {
  // Check for LaTeX commands
  if (/\\[a-zA-Z]+/.test(text)) return true;
  
  // Check for mathematical symbols
  const mathIndicators = [
    /[α-ωΑ-Ω]/,  // Greek letters
    /[∀∃∈∉⊂⊃∪∩]/,  // Set theory symbols
    /[±∓×÷√∞∑∏∫∂∇]/,  // Mathematical operators
    /[≤≥≠≈→←↔]/,  // Comparison and arrows
    /\b(sin|cos|tan|log|ln|exp|lim|max|min)\b/i,  // Math functions
    /\d+\s*\/\s*\d+/,  // Fractions
    /[a-zA-Z]_[a-zA-Z0-9]+/,  // Subscripts
    /[a-zA-Z]\^[a-zA-Z0-9]+/,  // Superscripts
  ];
  
  return mathIndicators.some(pattern => pattern.test(text));
}

/**
 * Main processing function for screenshots with math content
 */
export async function processScreenshotAdvanced(buffer: Buffer): Promise<MathExtractionResult> {
  try {
    // Try hybrid OCR approach first
    const hybridResult = await extractWithHybridOCR(buffer);
    
    if (hybridResult.confidence > 0.6) {
      return hybridResult;
    }
    
    // If hybrid approach fails, try original method as fallback
    console.log('Hybrid OCR confidence too low, trying fallback...');
    return {
      text: 'Could not reliably extract text from image.',
      containsMath: false,
      confidence: 0,
      processingMethod: 'failed_fallback'
    };
    
  } catch (error) {
    console.error('Advanced screenshot processing error:', error);
    return {
      text: 'Error processing screenshot.',
      containsMath: false,
      confidence: 0,
      processingMethod: 'error'
    };
  }
}