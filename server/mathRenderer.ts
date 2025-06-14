// Comprehensive LaTeX to Unicode Mathematical Notation Converter

export function renderMathematicalNotation(content: string): string {
  console.log('Math renderer input:', content.substring(0, 200) + '...');
  let processed = content;
  
  // Process display math environments first $$...$$
  processed = processed.replace(/\$\$([^$]+)\$\$/g, (match, mathContent) => {
    return processLaTeXMath(mathContent.trim());
  });
  
  // Process inline math $...$
  processed = processed.replace(/\$([^$]+)\$/g, (match, mathContent) => {
    return processLaTeXMath(mathContent.trim());
  });
  
  // Process \[...\] display math
  processed = processed.replace(/\\\[([^\]]+)\\\]/g, (match, mathContent) => {
    return processLaTeXMath(mathContent.trim());
  });
  
  // Process \(...\) inline math
  processed = processed.replace(/\\\(([^)]+)\\\)/g, (match, mathContent) => {
    return processLaTeXMath(mathContent.trim());
  });
  
  return processed;
}

function processLaTeXMath(latex: string): string {
  let processed = latex;
  
  // Handle matrices with proper Unicode brackets
  processed = processed.replace(/\\begin\{pmatrix\}([\s\S]*?)\\end\{pmatrix\}/g, (match, content) => {
    const rows = content.split('\\\\').map((row: string) => {
      const cells = row.split('&').map((cell: string) => processLaTeXMath(cell.trim()));
      return cells.join('  ');
    });
    return `⎛ ${rows.join(' ⎞\n⎜ ')} ⎠`;
  });
  
  processed = processed.replace(/\\begin\{bmatrix\}([\s\S]*?)\\end\{bmatrix\}/g, (match, content) => {
    const rows = content.split('\\\\').map((row: string) => {
      const cells = row.split('&').map((cell: string) => processLaTeXMath(cell.trim()));
      return cells.join('  ');
    });
    return `⎡ ${rows.join(' ⎤\n⎢ ')} ⎦`;
  });
  
  processed = processed.replace(/\\begin\{vmatrix\}([\s\S]*?)\\end\{vmatrix\}/g, (match, content) => {
    const rows = content.split('\\\\').map((row: string) => {
      const cells = row.split('&').map((cell: string) => processLaTeXMath(cell.trim()));
      return cells.join('  ');
    });
    return `| ${rows.join(' |\n| ')} |`;
  });
  
  // Handle fractions with proper Unicode representation
  processed = processed.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, (match, num, den) => {
    const processedNum = processLaTeXMath(num);
    const processedDen = processLaTeXMath(den);
    
    // Use Unicode fractions for simple cases
    const unicodeFractions: Record<string, string> = {
      '1/2': '½', '1/3': '⅓', '2/3': '⅔', '1/4': '¼', '3/4': '¾',
      '1/5': '⅕', '2/5': '⅖', '3/5': '⅗', '4/5': '⅘', '1/6': '⅙',
      '5/6': '⅚', '1/7': '⅐', '1/8': '⅛', '3/8': '⅜', '5/8': '⅝',
      '7/8': '⅞', '1/9': '⅑', '1/10': '⅒'
    };
    
    const key = `${processedNum}/${processedDen}`;
    if (unicodeFractions[key]) {
      return unicodeFractions[key];
    }
    
    // For complex fractions, use parenthetical notation
    return `(${processedNum})/(${processedDen})`;
  });
  
  // Handle square roots
  processed = processed.replace(/\\sqrt\{([^}]+)\}/g, (match, content) => {
    const processedContent = processLaTeXMath(content);
    return `√(${processedContent})`;
  });
  
  processed = processed.replace(/\\sqrt\[([^\]]+)\]\{([^}]+)\}/g, (match, root, content) => {
    const processedRoot = processLaTeXMath(root);
    const processedContent = processLaTeXMath(content);
    return `${processedRoot}√(${processedContent})`;
  });
  
  // Handle superscripts and subscripts
  processed = processed.replace(/\^(\{[^}]+\}|[^{\s])/g, (match, exp) => {
    const content = exp.startsWith('{') ? exp.slice(1, -1) : exp;
    const processedContent = processLaTeXMath(content);
    return convertToSuperscript(processedContent);
  });
  
  processed = processed.replace(/_(\{[^}]+\}|[^{\s])/g, (match, sub) => {
    const content = sub.startsWith('{') ? sub.slice(1, -1) : sub;
    const processedContent = processLaTeXMath(content);
    return convertToSubscript(processedContent);
  });
  
  // Handle mathematical functions and operators
  const functionMap: Record<string, string> = {
    '\\sin': 'sin', '\\cos': 'cos', '\\tan': 'tan',
    '\\sec': 'sec', '\\csc': 'csc', '\\cot': 'cot',
    '\\sinh': 'sinh', '\\cosh': 'cosh', '\\tanh': 'tanh',
    '\\log': 'log', '\\ln': 'ln', '\\exp': 'exp',
    '\\det': 'det', '\\tr': 'tr', '\\rank': 'rank',
    '\\dim': 'dim', '\\ker': 'ker', '\\im': 'im',
    '\\gcd': 'gcd', '\\lcm': 'lcm', '\\max': 'max', '\\min': 'min',
    '\\sup': 'sup', '\\inf': 'inf', '\\lim': 'lim'
  };
  
  Object.entries(functionMap).forEach(([latex, func]) => {
    processed = processed.split(latex).join(func);
  });
  
  // Handle integral symbols
  const integralMap: Record<string, string> = {
    '\\int': '∫', '\\iint': '∬', '\\iiint': '∭', '\\oint': '∮',
    '\\oiint': '∯', '\\oiiint': '∰'
  };
  
  Object.entries(integralMap).forEach(([latex, symbol]) => {
    processed = processed.split(latex).join(symbol);
  });
  
  // Handle summation and product symbols
  processed = processed.split('\\sum').join('∑');
  processed = processed.split('\\prod').join('∏');
  processed = processed.split('\\coprod').join('∐');
  
  // Handle comprehensive mathematical symbols
  const symbolMap: Record<string, string> = {
    // Greek letters (lowercase)
    '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ', '\\delta': 'δ',
    '\\epsilon': 'ε', '\\varepsilon': 'ε', '\\zeta': 'ζ', '\\eta': 'η',
    '\\theta': 'θ', '\\vartheta': 'ϑ', '\\iota': 'ι', '\\kappa': 'κ',
    '\\lambda': 'λ', '\\mu': 'μ', '\\nu': 'ν', '\\xi': 'ξ',
    '\\omicron': 'ο', '\\pi': 'π', '\\varpi': 'ϖ', '\\rho': 'ρ',
    '\\varrho': 'ϱ', '\\sigma': 'σ', '\\varsigma': 'ς', '\\tau': 'τ',
    '\\upsilon': 'υ', '\\phi': 'φ', '\\varphi': 'φ', '\\chi': 'χ',
    '\\psi': 'ψ', '\\omega': 'ω',
    
    // Greek letters (uppercase)
    '\\Gamma': 'Γ', '\\Delta': 'Δ', '\\Theta': 'Θ', '\\Lambda': 'Λ',
    '\\Xi': 'Ξ', '\\Pi': 'Π', '\\Sigma': 'Σ', '\\Upsilon': 'Υ',
    '\\Phi': 'Φ', '\\Chi': 'Χ', '\\Psi': 'Ψ', '\\Omega': 'Ω',
    
    // Number sets (blackboard bold)
    '\\mathbb{N}': 'ℕ', '\\mathbb{Z}': 'ℤ', '\\mathbb{Q}': 'ℚ',
    '\\mathbb{R}': 'ℝ', '\\mathbb{C}': 'ℂ', '\\mathbb{H}': 'ℍ',
    '\\mathbb{P}': 'ℙ', '\\mathbb{F}': 'F', '\\mathbb{A}': 'A',
    
    // Logic symbols
    '\\neg': '¬', '\\lnot': '¬', '\\land': '∧', '\\wedge': '∧',
    '\\lor': '∨', '\\vee': '∨', '\\rightarrow': '→', '\\to': '→',
    '\\leftarrow': '←', '\\leftrightarrow': '↔', '\\iff': '↔',
    '\\Rightarrow': '⇒', '\\implies': '⇒', '\\Leftarrow': '⇐',
    '\\Leftrightarrow': '⇔', '\\forall': '∀', '\\exists': '∃',
    '\\nexists': '∄', '\\therefore': '∴', '\\because': '∵',
    
    // Set theory
    '\\in': '∈', '\\notin': '∉', '\\subset': '⊂', '\\supset': '⊃',
    '\\subseteq': '⊆', '\\supseteq': '⊇', '\\cup': '∪', '\\cap': '∩',
    '\\emptyset': '∅', '\\varnothing': '∅', '\\setminus': '∖',
    
    // Relations and operators
    '\\leq': '≤', '\\le': '≤', '\\geq': '≥', '\\ge': '≥',
    '\\neq': '≠', '\\ne': '≠', '\\equiv': '≡', '\\approx': '≈',
    '\\sim': '∼', '\\simeq': '≃', '\\cong': '≅', '\\propto': '∝',
    '\\times': '×', '\\cdot': '·', '\\div': '÷', '\\pm': '±', '\\mp': '∓',
    
    // Arrows
    '\\mapsto': '↦', '\\longmapsto': '⟼', '\\hookleftarrow': '↩',
    '\\hookrightarrow': '↪', '\\uparrow': '↑', '\\downarrow': '↓',
    '\\updownarrow': '↕', '\\Uparrow': '⇑', '\\Downarrow': '⇓',
    
    // Miscellaneous
    '\\infty': '∞', '\\partial': '∂', '\\nabla': '∇', '\\aleph': 'ℵ',
    '\\hbar': 'ℏ', '\\ell': 'ℓ', '\\wp': '℘', '\\Re': 'ℜ', '\\Im': 'ℑ',
    '\\angle': '∠', '\\triangle': '△', '\\square': '□', '\\diamond': '◊',
    '\\star': '⋆', '\\dagger': '†', '\\ddagger': '‡',
    '\\dots': '…', '\\ldots': '…', '\\cdots': '⋯', '\\vdots': '⋮', '\\ddots': '⋱'
  };
  
  // Apply symbol replacements
  Object.entries(symbolMap).forEach(([latex, symbol]) => {
    processed = processed.split(latex).join(symbol);
  });
  
  // Handle text-based mathematical notation (for when AI generates words instead of LaTeX)
  const textToSymbolMap: Record<string, string> = {
    // Logic symbols
    'wedge': '∧',
    'vee': '∨', 
    'land': '∧',
    'lor': '∨',
    'neg': '¬',
    'lnot': '¬',
    'rightarrow': '→',
    'leftarrow': '←',
    'leftrightarrow': '↔',
    'Rightarrow': '⇒',
    'Leftarrow': '⇐',
    'Leftrightarrow': '⇔',
    'implies': '⇒',
    'iff': '↔',
    'forall': '∀',
    'exists': '∃',
    'nexists': '∄',
    'therefore': '∴',
    'because': '∵',
    
    // Set theory
    'in': '∈',
    'notin': '∉',
    'subset': '⊂',
    'supset': '⊃',
    'subseteq': '⊆',
    'supseteq': '⊇',
    'cup': '∪',
    'cap': '∩',
    'emptyset': '∅',
    'varnothing': '∅',
    'setminus': '∖',
    
    // Relations
    'leq': '≤',
    'geq': '≥',
    'neq': '≠',
    'equiv': '≡',
    'approx': '≈',
    'sim': '∼',
    'simeq': '≃',
    'cong': '≅',
    'propto': '∝',
    
    // Operations
    'times': '×',
    'cdot': '·',
    'div': '÷',
    'pm': '±',
    'mp': '∓',
    
    // Greek letters
    'alpha': 'α', 'beta': 'β', 'gamma': 'γ', 'delta': 'δ',
    'epsilon': 'ε', 'zeta': 'ζ', 'eta': 'η', 'theta': 'θ',
    'iota': 'ι', 'kappa': 'κ', 'lambda': 'λ', 'mu': 'μ',
    'nu': 'ν', 'xi': 'ξ', 'pi': 'π', 'rho': 'ρ',
    'sigma': 'σ', 'tau': 'τ', 'upsilon': 'υ', 'phi': 'φ',
    'chi': 'χ', 'psi': 'ψ', 'omega': 'ω',
    'Gamma': 'Γ', 'Delta': 'Δ', 'Theta': 'Θ', 'Lambda': 'Λ',
    'Xi': 'Ξ', 'Pi': 'Π', 'Sigma': 'Σ', 'Upsilon': 'Υ',
    'Phi': 'Φ', 'Chi': 'Χ', 'Psi': 'Ψ', 'Omega': 'Ω',
    
    // Mathematical constants and symbols
    'infty': '∞',
    'partial': '∂',
    'nabla': '∇',
    'sum': '∑',
    'prod': '∏',
    'int': '∫',
    'iint': '∬',
    'iiint': '∭',
    'oint': '∮',
    'angle': '∠',
    'triangle': '△',
    'square': '□',
    'diamond': '◊',
    'star': '⋆',
    'dagger': '†',
    'ddagger': '‡',
    'dots': '…',
    'ldots': '…',
    'cdots': '⋯',
    'vdots': '⋮',
    'ddots': '⋱'
  };
  
  // Apply text-to-symbol conversions with word boundaries
  Object.entries(textToSymbolMap).forEach(([text, symbol]) => {
    const regex = new RegExp(`\\b${text}\\b`, 'g');
    processed = processed.replace(regex, symbol);
  });
  
  // Clean up remaining LaTeX artifacts
  processed = processed.replace(/\{([^}]*)\}/g, '$1');
  processed = processed.replace(/\\left\(/g, '(').replace(/\\right\)/g, ')');
  processed = processed.replace(/\\left\[/g, '[').replace(/\\right\]/g, ']');
  processed = processed.replace(/\\left\|/g, '|').replace(/\\right\|/g, '|');
  processed = processed.replace(/\\;/g, ' ').replace(/\\,/g, ' ').replace(/\\!/g, '');
  
  return processed;
}

function convertToSuperscript(text: string): string {
  const superscriptMap: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵',
    '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '+': '⁺', '-': '⁻',
    '=': '⁼', '(': '⁽', ')': '⁾', 'n': 'ⁿ', 'i': 'ⁱ'
  };
  
  return text.split('').map(char => superscriptMap[char] || char).join('');
}

function convertToSubscript(text: string): string {
  const subscriptMap: Record<string, string> = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅',
    '6': '₆', '7': '₇', '8': '₈', '9': '₉', '+': '₊', '-': '₋',
    '=': '₌', '(': '₍', ')': '₎', 'a': 'ₐ', 'e': 'ₑ', 'h': 'ₕ',
    'i': 'ᵢ', 'j': 'ⱼ', 'k': 'ₖ', 'l': 'ₗ', 'm': 'ₘ', 'n': 'ₙ',
    'o': 'ₒ', 'p': 'ₚ', 'r': 'ᵣ', 's': 'ₛ', 't': 'ₜ', 'u': 'ᵤ',
    'v': 'ᵥ', 'x': 'ₓ'
  };
  
  return text.split('').map(char => subscriptMap[char] || char).join('');
}