interface MathpixResponse {
  text?: string;
  latex?: string;
  confidence?: number;
  error?: string;
}

function formatMathText(rawText: string): string {
  let formatted = rawText;
  
  // Fix the exact malformed patterns from Mathpix OCR
  // Pattern: \( \backslash(472+389=\backslash \) -> \(472 + 389\)
  formatted = formatted.replace(/\\\(\s*\\backslash\(([^=]+)=\\backslash\s*\\\)/g, '\\($1\\)');
  
  // Pattern: \( \backslash(936-478=\backslash) \) -> \(936 - 478\)
  formatted = formatted.replace(/\\\(\s*\\backslash\(([^=]+)=\\backslash\)\s*\\\)/g, '\\($1\\)');
  
  // Add proper spacing around operators
  formatted = formatted.replace(/(\d+)\+(\d+)/g, '$1 + $2');
  formatted = formatted.replace(/(\d+)-(\d+)/g, '$1 - $2');
  formatted = formatted.replace(/(\d+)\*(\d+)/g, '$1 × $2');
  formatted = formatted.replace(/(\d+)\/(\d+)/g, '$1 ÷ $2');
  
  // Pattern: \\(Iqquad) -> (space)
  formatted = formatted.replace(/\\\\\(Iqquad\)/g, ' ');
  
  // Clean up other backslash artifacts
  formatted = formatted.replace(/\\\\backslash\\/g, '\\');
  formatted = formatted.replace(/\\backslash/g, '');
  formatted = formatted.replace(/\\\(\\\\\(/g, '(');
  formatted = formatted.replace(/\\\\\)\\\)/g, ')');
  
  // Clean up quad spacing commands
  formatted = formatted.replace(/\\\\quad/g, ' ');
  formatted = formatted.replace(/\\Iqquad/g, ' ');
  formatted = formatted.replace(/\\\\I/g, '');
  formatted = formatted.replace(/\\quad/g, ' ');
  
  // Fix common OCR spacing issues where text runs together
  formatted = formatted.replace(/([a-z])([A-Z])/g, '$1 $2');
  formatted = formatted.replace(/([0-9])([A-Za-z])/g, '$1 $2');
  formatted = formatted.replace(/([a-z])([0-9])/g, '$1 $2');
  
  // Add proper line breaks after mathematical expressions
  formatted = formatted.replace(/\\\]/g, '\\]\n\n');
  formatted = formatted.replace(/\\\)/g, '\\)\n\n');
  formatted = formatted.replace(/([.!?])\s*([A-Z0-9])/g, '$1\n\n$2');
  
  // Format problem numbers and sections
  formatted = formatted.replace(/(\d+)\.\s*([A-Za-z])/g, '\n\n$1. $2');
  formatted = formatted.replace(/([a-z])\s*(\d+\.\s*[A-Z])/g, '$1\n\n$2');
  
  // Add spacing around mathematical operators
  formatted = formatted.replace(/([a-zA-Z0-9])\s*=\s*([a-zA-Z0-9])/g, '$1 = $2');
  formatted = formatted.replace(/([0-9])\s*\+\s*([0-9a-zA-Z])/g, '$1 + $2');
  formatted = formatted.replace(/([0-9])\s*-\s*([0-9a-zA-Z])/g, '$1 - $2');
  formatted = formatted.replace(/([0-9])\s*\*\s*([0-9a-zA-Z])/g, '$1 × $2');
  formatted = formatted.replace(/([0-9])\s*\/\s*([0-9a-zA-Z])/g, '$1 ÷ $2');
  
  // Clean up matrix and equation formatting
  formatted = formatted.replace(/\\\[\s*/g, '\n\n\\[\n');
  formatted = formatted.replace(/\s*\\\]/g, '\n\\]\n\n');
  formatted = formatted.replace(/\\\(\s*/g, '\\(');
  formatted = formatted.replace(/\s*\\\)/g, '\\)');
  
  // Fix run-together words and improve readability
  formatted = formatted.replace(/([a-z])([A-Z][a-z])/g, '$1 $2');
  formatted = formatted.replace(/([a-z])(\d+\.)/g, '$1\n\n$2');
  formatted = formatted.replace(/([.?!])([A-Z])/g, '$1\n\n$2');
  
  // Add spacing for mathematical expressions that run together
  formatted = formatted.replace(/([a-z])([\+\-\=])/g, '$1 $2');
  formatted = formatted.replace(/([\+\-\=])([a-z])/g, '$1 $2');
  
  // Clean up excessive whitespace while preserving intentional formatting
  formatted = formatted.replace(/\n\n\n+/g, '\n\n');
  formatted = formatted.replace(/^\s+|\s+$/g, '');
  formatted = formatted.replace(/[ \t]+/g, ' ');
  
  return formatted;
}

export async function extractMathFromPDFWithMathpix(pdfBuffer: Buffer): Promise<string> {
  const fs = await import('fs');
  const path = await import('path');
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);
  
  try {
    console.log('[mathpix] Converting PDF to images using ImageMagick...');
    
    // Create temporary files with unique timestamp
    const timestamp = Date.now();
    const tempPdfPath = `/tmp/temp_${timestamp}.pdf`;
    const tempImagePattern = `/tmp/page_${timestamp}_%d.png`;
    
    // Write PDF buffer to temporary file
    fs.writeFileSync(tempPdfPath, pdfBuffer);
    
    // Use ImageMagick convert command directly
    const convertCommand = `convert -density 300 -quality 100 "${tempPdfPath}" "${tempImagePattern}"`;
    console.log('[mathpix] Running ImageMagick convert:', convertCommand);
    
    await execAsync(convertCommand);
    
    // Find all generated image files
    const tempDir = '/tmp';
    const files = fs.readdirSync(tempDir);
    const imageFiles = files
      .filter(f => f.startsWith(`page_${timestamp}_`))
      .sort()
      .map(f => path.join(tempDir, f));
    
    console.log(`[mathpix] Generated ${imageFiles.length} image files`);
    
    let combinedText = '';
    
    // Process each image with Mathpix OCR
    for (let i = 0; i < imageFiles.length; i++) {
      const imagePath = imageFiles[i];
      console.log(`[mathpix] Processing page ${i + 1} with OCR...`);
      
      try {
        const imageBuffer = fs.readFileSync(imagePath);
        const pageText = await extractMathWithMathpix(imageBuffer);
        combinedText += `\n\n--- Page ${i + 1} ---\n\n${pageText}`;
      } catch (pageError) {
        console.warn(`[mathpix] Failed to process page ${i + 1}:`, pageError);
        combinedText += `\n\n--- Page ${i + 1} (OCR failed) ---\n\n`;
      }
      
      // Clean up the image file
      try {
        fs.unlinkSync(imagePath);
      } catch (unlinkError) {
        console.warn(`[mathpix] Failed to delete temp file: ${imagePath}`);
      }
    }
    
    // Clean up the PDF file
    try {
      fs.unlinkSync(tempPdfPath);
    } catch (unlinkError) {
      console.warn(`[mathpix] Failed to delete temp PDF: ${tempPdfPath}`);
    }
    
    if (!combinedText.trim()) {
      throw new Error('No text extracted from any PDF pages');
    }
    
    console.log(`[mathpix] Successfully processed PDF: ${combinedText.length} characters total`);
    return combinedText.trim();
    
  } catch (error) {
    console.error('[mathpix] PDF processing error:', error);
    throw new Error(`PDF to Mathpix conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
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
    console.log(`[mathpix] Raw response: ${JSON.stringify(result)}`);
    console.log(`[mathpix] OCR completed with confidence: ${result.confidence || 'unknown'}`);
    
    if (result.error) {
      throw new Error(`Mathpix error: ${result.error}`);
    }
    
    // Use text field for best results
    let extractedText = result.text || result.latex || '';
    console.log(`[mathpix] Raw extracted text: ${JSON.stringify(extractedText)}`);
    
    if (!extractedText.trim()) {
      throw new Error('No text extracted from image');
    }
    
    // Apply formatting to improve readability
    const formattedText = formatMathText(extractedText.trim());
    console.log(`[mathpix] Formatted text: ${JSON.stringify(formattedText)}`);
    
    console.log(`[mathpix] Successfully extracted and formatted ${formattedText.length} characters`);
    return formattedText;
    
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