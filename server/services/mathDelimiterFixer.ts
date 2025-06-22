// Advanced Math Delimiter and Currency Protection Service
// Implements intelligent LaTeX math delimiter detection with robust currency protection

export function sanitizeMathAndCurrency(text: string): string {
  console.log('🔧 Starting advanced math delimiter and currency sanitization');
  
  // Step 1: Protect all currency patterns (more comprehensive)
  const currencyPatterns = [
    /\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\b/g,  // $1,000.00, $25.50, $1000
    /\$(\d+\.?\d*)\s*(?:USD|dollars?|bucks?)\b/gi, // $25 USD, $100 dollars
    /(?:USD|dollars?)\s*\$(\d+\.?\d*)\b/gi,  // USD $25, dollars $100
    /\$(\d+)\s*(?:million|billion|thousand|k)\b/gi // $5 million, $10k
  ];
  
  const currencyReplacements: string[] = [];
  let placeholderIndex = 0;
  
  currencyPatterns.forEach(pattern => {
    text = text.replace(pattern, (match) => {
      const placeholder = `CURRENCY_PLACEHOLDER_${placeholderIndex}`;
      currencyReplacements.push(match);
      placeholderIndex++;
      return placeholder;
    });
  });
  
  console.log(`🔧 Protected ${currencyReplacements.length} currency expressions`);
  
  // Step 2: Convert ALL Unicode technical symbols to proper LaTeX
  const unicodeToLatex: { [key: string]: string } = {
    // Set theory and logic
    '∈': '\\in', '∉': '\\notin', '∪': '\\cup', '∩': '\\cap', '⊆': '\\subseteq', '⊇': '\\supseteq',
    '⊂': '\\subset', '⊃': '\\supset', '∅': '\\emptyset', '∀': '\\forall', '∃': '\\exists',
    '¬': '\\neg', '∧': '\\wedge', '∨': '\\vee', '⊕': '\\oplus', '⊗': '\\otimes',
    
    // Greek alphabet - lowercase
    'α': '\\alpha', 'β': '\\beta', 'γ': '\\gamma', 'δ': '\\delta', 'ε': '\\epsilon', 'ζ': '\\zeta',
    'η': '\\eta', 'θ': '\\theta', 'ι': '\\iota', 'κ': '\\kappa', 'λ': '\\lambda', 'μ': '\\mu',
    'ν': '\\nu', 'ξ': '\\xi', 'π': '\\pi', 'ρ': '\\rho', 'σ': '\\sigma',
    'τ': '\\tau', 'υ': '\\upsilon', 'φ': '\\phi', 'χ': '\\chi', 'ψ': '\\psi', 'ω': '\\omega',
    
    // Greek alphabet - uppercase
    'Γ': '\\Gamma', 'Δ': '\\Delta', 'Θ': '\\Theta', 'Λ': '\\Lambda', 'Ξ': '\\Xi', 'Π': '\\Pi', 
    'Σ': '\\Sigma', 'Υ': '\\Upsilon', 'Φ': '\\Phi', 'Ψ': '\\Psi', 'Ω': '\\Omega',
    
    // Arrows
    '→': '\\rightarrow', '←': '\\leftarrow', '↔': '\\leftrightarrow', '↑': '\\uparrow', '↓': '\\downarrow',
    '⇒': '\\Rightarrow', '⇐': '\\Leftarrow', '⇔': '\\Leftrightarrow', '⇑': '\\Uparrow', '⇓': '\\Downarrow',
    '↗': '\\nearrow', '↘': '\\searrow', '↙': '\\swarrow', '↖': '\\nwarrow',
    '⟵': '\\longleftarrow', '⟶': '\\longrightarrow', '⟷': '\\longleftrightarrow',
    '⟸': '\\Longleftarrow', '⟹': '\\Longrightarrow', '⟺': '\\Longleftrightarrow',
    '↦': '\\mapsto', '⇀': '\\rightharpoonup', '↼': '\\leftharpoonup',
    
    // Comparison operators
    '≤': '\\leq', '≥': '\\geq', '≠': '\\neq', '≡': '\\equiv', '≢': '\\not\\equiv', '≈': '\\approx',
    '≅': '\\cong', '∼': '\\sim', '≃': '\\simeq', '≪': '\\ll', '≫': '\\gg', '≺': '\\prec',
    '≻': '\\succ', '⪯': '\\preceq', '⪰': '\\succeq', '∝': '\\propto', '≲': '\\lesssim', '≳': '\\gtrsim',
    
    // Mathematical operators
    '±': '\\pm', '∓': '\\mp', '×': '\\times', '÷': '\\div', '∗': '\\ast', '◦': '\\circ',
    '∙': '\\bullet', '⋅': '\\cdot', '⊙': '\\odot', '⊘': '\\oslash',
    '√': '\\sqrt', '∛': '\\sqrt[3]', '∜': '\\sqrt[4]', '∞': '\\infty',
    
    // Calculus and analysis
    '∂': '\\partial', '∇': '\\nabla', '∫': '\\int', '∬': '\\iint', '∭': '\\iiint', '∮': '\\oint',
    '∯': '\\oiint', '∰': '\\oiiint', '∑': '\\sum', '∏': '\\prod', '∐': '\\coprod', 
    '⋃': '\\bigcup', '⋂': '\\bigcap', '⋁': '\\bigvee', '⋀': '\\bigwedge', '⨁': '\\bigoplus', '⨂': '\\bigotimes',
    
    // Complex numbers and fields
    'ℂ': '\\mathbb{C}', 'ℝ': '\\mathbb{R}', 'ℚ': '\\mathbb{Q}', 'ℤ': '\\mathbb{Z}', 'ℕ': '\\mathbb{N}',
    'ℍ': '\\mathbb{H}', '𝔽': '\\mathbb{F}', '𝔸': '\\mathbb{A}', 'ℙ': '\\mathbb{P}', '𝕂': '\\mathbb{K}',
    
    // Topology and geometry
    '∘': '\\circ', '∴': '\\therefore', '∵': '\\because', '⊥': '\\perp', '∥': '\\parallel',
    '∠': '\\angle', '∡': '\\measuredangle', '∢': '\\sphericalangle', '⊿': '\\triangle', '□': '\\square',
    '△': '\\triangle', '▲': '\\blacktriangle', '▼': '\\blacktriangledown',
    
    // Physics notation
    'ℏ': '\\hbar', '℘': '\\wp', '°': '^\\circ', '′': '\\prime', '″': '\\prime\\prime',
    '‴': '\\prime\\prime\\prime',
    
    // Chemistry notation
    '⇌': '\\rightleftharpoons', '⇋': '\\leftrightharpoons',
    
    // Computer science
    '⊤': '\\top',
    
    // Superscripts and subscripts
    '⁰': '^0', '¹': '^1', '²': '^2', '³': '^3', '⁴': '^4', '⁵': '^5', '⁶': '^6', '⁷': '^7', '⁸': '^8', '⁹': '^9',
    '⁺': '^+', '⁻': '^-', '⁼': '^=', '⁽': '^(', '⁾': '^)', 'ⁿ': '^n', 'ᵃ': '^a', 'ᵇ': '^b', 'ᶜ': '^c',
    '₀': '_0', '₁': '_1', '₂': '_2', '₃': '_3', '₄': '_4', '₅': '_5', '₆': '_6', '₇': '_7', '₈': '_8', '₉': '_9',
    '₊': '_+', '₋': '_-', '₌': '_=', '₍': '_(', '₎': '_)', 'ₐ': '_a', 'ₑ': '_e', 'ᵢ': '_i', 'ₒ': '_o', 'ᵤ': '_u',
    
    // Miscellaneous technical symbols
    '⋯': '\\cdots', '⋮': '\\vdots', '⋱': '\\ddots', '⋰': '\\iddots',
    '⌊': '\\lfloor', '⌋': '\\rfloor', '⌈': '\\lceil', '⌉': '\\rceil', 
    '⟨': '\\langle', '⟩': '\\rangle',
    '‖': '\\|', '∦': '\\nparallel', '≗': '\\circeq', '≜': '\\triangleq'
  }

  // Convert Unicode symbols to LaTeX using a more efficient approach
  const unicodeSymbols = Object.keys(unicodeToLatex);
  for (const symbol of unicodeSymbols) {
    if (text.includes(symbol)) {
      const latex = unicodeToLatex[symbol];
      const regex = new RegExp(symbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      text = text.replace(regex, ` ${latex} `);
      console.log(`🔧 Converted ${symbol} to ${latex}`);
    }
  }

  // Step 3: Identify and convert legitimate math expressions in dollar signs
  const mathIndicators = /[\^_{}\\]|\\[a-zA-Z]+|\b(?:sin|cos|tan|log|ln|exp|sqrt|sum|int|lim|alpha|beta|gamma|theta|pi|sigma|mu|lambda|delta|epsilon|omega|forall|exists|in|cup|cap|subset|emptyset)\b/;
  
  text = text.replace(/\$([^$\n]+)\$/g, (match, content) => {
    // Check if content contains mathematical indicators
    if (mathIndicators.test(content)) {
      console.log(`🔧 Converting math expression: $${content}$`);
      return `\\(${content}\\)`;
    }
    // If no math indicators, leave as regular text
    console.log(`🔧 Keeping as regular text: ${match}`);
    return match;
  });
  
  // Step 4: Wrap mathematical expressions in proper delimiters
  // Find sequences of LaTeX commands and wrap them appropriately
  text = text.replace(/(\s*\\[a-zA-Z]+(?:\s*\\[a-zA-Z]+)*\s*)/g, (match) => {
    const trimmed = match.trim();
    if (trimmed.length > 0) {
      return ` \\(${trimmed}\\) `;
    }
    return match;
  });

  // Clean up multiple spaces
  text = text.replace(/\s+/g, ' ').trim();

  // Step 5: Restore currency symbols
  currencyReplacements.forEach((currency, index) => {
    const placeholder = `CURRENCY_PLACEHOLDER_${index}`;
    text = text.replace(placeholder, currency);
  });
  
  console.log('🔧 Restored all currency symbols');
  return text;
}

export function validateMathDelimiters(text: string): {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
  analysis: {
    currencyCount: number;
    mathExpressions: number;
    ambiguousDollars: number;
  };
} {
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  // Analyze currency patterns
  const currencyPattern = /\$(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\b|\$(\d+\.?\d*)\s*(?:USD|dollars?|bucks?)\b/gi;
  const currencyMatches = text.match(currencyPattern) || [];
  
  // Analyze math expressions
  const mathIndicators = /[\^_{}\\]|\\[a-zA-Z]+|\b(?:sin|cos|tan|log|ln|exp|sqrt|sum|int|lim|alpha|beta|gamma|theta|pi|sigma|mu|lambda|delta|epsilon|omega)\b/;
  const dollarPairs = text.match(/\$([^$]+)\$/g) || [];
  
  let mathExpressions = 0;
  let ambiguousDollars = 0;
  
  dollarPairs.forEach(pair => {
    const content = pair.slice(1, -1); // Remove the $ delimiters
    if (mathIndicators.test(content)) {
      mathExpressions++;
    } else if (!/^\d+\.?\d*$/.test(content.trim())) {
      // Not a number, not clearly math - potentially ambiguous
      ambiguousDollars++;
      issues.push(`Ambiguous dollar expression: ${pair}`);
      suggestions.push(`If "${pair}" is math, add LaTeX symbols. If not, consider rewording.`);
    }
  });
  
  // Check for proper LaTeX delimiters
  const properInlineMath = text.match(/\\\\?\([^)]+\\\\?\)/g) || [];
  const properDisplayMath = text.match(/\\\\?\[[^\]]+\\\\?\]/g) || [];
  const doubleDollarMath = text.match(/\$\$[^$]+\$\$/g) || [];
  
  const analysis = {
    currencyCount: currencyMatches.length,
    mathExpressions,
    ambiguousDollars
  };
  
  console.log('Advanced math delimiter analysis:', {
    currency: analysis.currencyCount,
    mathExpressions: analysis.mathExpressions,
    ambiguous: analysis.ambiguousDollars,
    properInline: properInlineMath.length,
    properDisplay: properDisplayMath.length,
    doubleDollar: doubleDollarMath.length
  });
  
  return {
    isValid: issues.length === 0,
    issues,
    suggestions,
    analysis
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

// Comprehensive test cases for the new intelligent system
export const testCases = {
  pureCurrenty: '$25 pasta, $3.50 coffee, $1,000 rent, $5 million budget',
  pureMath: '$U^{\\text{Veblen}}$ utility function, $\\alpha + \\beta$ coefficient',
  mixedContent: '$U^{\\text{Veblen}}$ utility with $25 price and $\\theta$ parameter',
  properLaTeX: '\\[U_{Smith} = \\max \\sum...\\] and \\(x^2\\) with $50 cost',
  doubleDollar: '$$E = mc^2$$ physics and $50 fee',
  ambiguous: '$hello world$ and $25 dollars$',
  complexCurrency: '$1,250.99 USD, dollars $500, $10k budget, $2.5 billion'
};

// Advanced test function with detailed analysis
export function runTests(): void {
  console.log('🧪 Testing intelligent math delimiter and currency protection:');
  
  Object.entries(testCases).forEach(([name, input]) => {
    console.log(`\n📝 Test: ${name}`);
    console.log(`Input:  ${input}`);
    
    const validation = validateMathDelimiters(input);
    console.log(`Analysis: ${validation.analysis.currencyCount} currency, ${validation.analysis.mathExpressions} math, ${validation.analysis.ambiguousDollars} ambiguous`);
    
    const output = sanitizeMathAndCurrency(input);
    console.log(`Output: ${output}`);
    
    if (validation.issues.length > 0) {
      console.log(`Issues: ${validation.issues.join(', ')}`);
    }
  });
}