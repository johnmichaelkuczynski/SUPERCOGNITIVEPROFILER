// Math Delimiter and Currency Protection Service
// Implements strict LaTeX math delimiter enforcement with currency protection

export function sanitizeMathAndCurrency(text: string): string {
  console.log('🔧 Starting math delimiter and currency sanitization');
  
  // Step 1: Protect currency values from being treated as math
  // Pattern: $25, $3.50, $1000 etc.
  text = text.replace(/(?<!\\)\$(\d+\.?\d*\b)/g, 'CURRENCY$1');
  console.log('🔧 Protected currency values');
  
  // Step 2: Convert plaintext $...$ to proper LaTeX \(...\)
  // This fixes cases like $U^(\text{Veblen})$ → \(U^{\text{Veblen}}\)
  text = text.replace(/(?<!\\)\$([^$]+)\$/g, '\\($1\\)');
  console.log('🔧 Converted plaintext math to LaTeX delimiters');
  
  // Step 3: Restore currency symbols
  text = text.replace(/CURRENCY/g, '$');
  console.log('🔧 Restored currency symbols');
  
  return text;
}

export function validateMathDelimiters(text: string): {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  // Check for potential problematic patterns
  const problematicDollars = text.match(/(?<!\\)\$[^$\d][^$]*\$/g);
  if (problematicDollars) {
    issues.push(`Found ${problematicDollars.length} potential plaintext math expressions using $...$`);
    suggestions.push('Convert $...$ to \\(...\\) for inline math');
  }
  
  const currencyPattern = /(?<!\\)\$\d+\.?\d*\b/g;
  const currencyMatches = text.match(currencyPattern);
  if (currencyMatches) {
    console.log(`Found ${currencyMatches.length} currency values that will be protected`);
  }
  
  const properInlineMath = text.match(/\\\\?\([^)]+\\\\?\)/g);
  const properDisplayMath = text.match(/\\\\?\[[^\]]+\\\\?\]/g);
  const doubleDollarMath = text.match(/\$\$[^$]+\$\$/g);
  
  console.log('Math delimiter analysis:', {
    properInline: properInlineMath?.length || 0,
    properDisplay: properDisplayMath?.length || 0,
    doubleDollar: doubleDollarMath?.length || 0
  });
  
  return {
    isValid: issues.length === 0,
    issues,
    suggestions
  };
}

export function preprocessForMathJax(text: string): string {
  // Apply our sanitization before MathJax processing
  let processedText = sanitizeMathAndCurrency(text);
  
  // Ensure proper escaping for display math
  processedText = processedText.replace(/\\\[/g, '\\[');
  processedText = processedText.replace(/\\\]/g, '\\]');
  
  // Ensure proper escaping for inline math
  processedText = processedText.replace(/\\\(/g, '\\(');
  processedText = processedText.replace(/\\\)/g, '\\)');
  
  return processedText;
}

// Example usage patterns for testing
export const testCases = {
  currency: '$25 pasta, $3.50 coffee, $1000 rent',
  mixedMath: '$U^(\\text{Veblen})$ utility and $25 price',
  properLaTeX: '\\[U_{Smith} = \\max \\sum...\\] and \\(x^2\\)',
  doubleDollar: '$$E = mc^2$$ and $50 fee'
};

// Test function to verify the implementation
export function runTests(): void {
  console.log('🧪 Testing math delimiter and currency protection:');
  
  Object.entries(testCases).forEach(([name, input]) => {
    console.log(`\n📝 Test: ${name}`);
    console.log(`Input:  ${input}`);
    const output = sanitizeMathAndCurrency(input);
    console.log(`Output: ${output}`);
    
    const validation = validateMathDelimiters(input);
    if (validation.issues.length > 0) {
      console.log(`Issues: ${validation.issues.join(', ')}`);
    }
  });
}