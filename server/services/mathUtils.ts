// Mathematical notation utility for converting LaTeX to Unicode
export function renderMathematicalNotation(text: string): string {
  let processed = text;
  
  // STEP 1: EXACT PATTERN FIXES from logs - target literal strings
  // Fix \{α\} → α (exact pattern from logs)
  processed = processed.split('\\{α\\}').join('α');
  processed = processed.split('\\{β\\}').join('β');
  processed = processed.split('\\{γ\\}').join('γ');
  processed = processed.split('\\{δ\\}').join('δ');
  processed = processed.split('\\{ε\\}').join('ε');
  processed = processed.split('\\{φ\\}').join('φ');
  processed = processed.split('\\{ψ\\}').join('ψ');
  processed = processed.split('\\{ω\\}').join('ω');
  processed = processed.split('\\{λ\\}').join('λ');
  processed = processed.split('\\{μ\\}').join('μ');
  processed = processed.split('\\{σ\\}').join('σ');
  processed = processed.split('\\{π\\}').join('π');
  processed = processed.split('\\{θ\\}').join('θ');
  
  // Fix partial patterns too
  processed = processed.split('\\{α}').join('α');
  processed = processed.split('{α\\}').join('α');
  processed = processed.split('{α}').join('α');
  
  // Fix patterns that appear as \α\ (from logs)
  processed = processed.split('\\α\\').join('α');
  processed = processed.split('\\β\\').join('β');
  processed = processed.split('\\γ\\').join('γ');
  processed = processed.split('\\δ\\').join('δ');
  processed = processed.split('\\ε\\').join('ε');
  processed = processed.split('\\φ\\').join('φ');
  processed = processed.split('\\ψ\\').join('ψ');
  processed = processed.split('\\ω\\').join('ω');
  processed = processed.split('\\λ\\').join('λ');
  processed = processed.split('\\μ\\').join('μ');
  processed = processed.split('\\σ\\').join('σ');
  processed = processed.split('\\π\\').join('π');
  processed = processed.split('\\θ\\').join('θ');
  
  // STEP 2: Direct string replacements for problematic LaTeX commands
  const directReplacements = [
    ['\\oplus', '⊕'],
    ['\\ominus', '⊖'], 
    ['\\otimes', '⊗'],
    ['\\odot', '⊙'],
    ['\\cup', '∪'],
    ['\\cap', '∩'],
    ['\\subset', '⊂'],
    ['\\supset', '⊃'],
    ['\\subseteq', '⊆'],
    ['\\supseteq', '⊇'],
    ['\\in', '∈'],
    ['\\notin', '∉'],
    ['\\emptyset', '∅'],
    ['\\neg', '¬'],
    ['\\wedge', '∧'],
    ['\\vee', '∨'],
    ['\\rightarrow', '→'],
    ['\\leftarrow', '←'],
    ['\\leftrightarrow', '↔'],
    ['\\forall', '∀'],
    ['\\exists', '∃'],
    ['\\leq', '≤'],
    ['\\geq', '≥'],
    ['\\neq', '≠'],
    ['\\approx', '≈'],
    ['\\equiv', '≡'],
    ['\\infty', '∞'],
    ['\\sum', '∑'],
    ['\\prod', '∏'],
    ['\\int', '∫'],
    ['\\partial', '∂'],
    ['\\pm', '±'],
    ['\\times', '×'],
    ['\\cdot', '⋅'],
    ['\\alpha', 'α'],
    ['\\beta', 'β'],
    ['\\gamma', 'γ'],
    ['\\delta', 'δ'],
    ['\\epsilon', 'ε'],
    ['\\phi', 'φ'],
    ['\\psi', 'ψ'],
    ['\\omega', 'ω'],
    ['\\lambda', 'λ'],
    ['\\mu', 'μ'],
    ['\\sigma', 'σ'],
    ['\\pi', 'π'],
    ['\\theta', 'θ'],
    ['\\xi', 'ξ'],
    ['\\rho', 'ρ'],
    ['\\tau', 'τ'],
    ['\\chi', 'χ'],
    ['\\eta', 'η'],
    ['\\iota', 'ι'],
    ['\\kappa', 'κ'],
    ['\\nu', 'ν'],
    ['\\zeta', 'ζ'],
    ['\\Gamma', 'Γ'],
    ['\\Delta', 'Δ'],
    ['\\Theta', 'Θ'],
    ['\\Lambda', 'Λ'],
    ['\\Xi', 'Ξ'],
    ['\\Pi', 'Π'],
    ['\\Sigma', 'Σ'],
    ['\\Phi', 'Φ'],
    ['\\Psi', 'Ψ'],
    ['\\Omega', 'Ω']
  ];
  
  // Apply direct replacements using split/join for reliability
  for (const [latex, unicode] of directReplacements) {
    processed = processed.split(latex).join(unicode);
  }
  
  // CRITICAL FIX: Handle malformed superscripts and subscripts BEFORE processing valid ones
  // Fix invalid patterns like A_ or B^ that don't have arguments
  processed = processed.replace(/([A-Za-z0-9])_(\s|$|[^{a-zA-Z0-9])/g, '$1$2');
  processed = processed.replace(/([A-Za-z0-9])\^(\s|$|[^{a-zA-Z0-9])/g, '$1$2');
  
  // Fix incomplete patterns at end of expressions
  processed = processed.replace(/([A-Za-z0-9])_$/g, '$1');
  processed = processed.replace(/([A-Za-z0-9])\^$/g, '$1');
  
  // Fix patterns like A_ ∪ B_ or A^ ∩ B^
  processed = processed.replace(/([A-Za-z0-9])_(\s*[∪∩∧∨→←↔⊂⊃⊆⊇∈∉])/g, '$1$2');
  processed = processed.replace(/([A-Za-z0-9])\^(\s*[∪∩∧∨→←↔⊂⊃⊆⊇∈∉])/g, '$1$2');

  // Mathematical symbols map for LaTeX to Unicode conversion
  const symbolMap: Record<string, string> = {
    // Basic logic
    '\\neg': '¬', '\\lnot': '¬', '\\land': '∧', '\\wedge': '∧', 
    '\\lor': '∨', '\\vee': '∨', '\\rightarrow': '→', '\\to': '→',
    '\\leftarrow': '←', '\\leftrightarrow': '↔', '\\iff': '↔',
    '\\Rightarrow': '⇒', '\\implies': '⇒', '\\Leftarrow': '⇐', '\\Leftrightarrow': '⇔',
    
    // Mathematical operators
    '\\times': '×', '\\cdot': '·', '\\div': '÷', '\\pm': '±', '\\mp': '∓',
    '\\leq': '≤', '\\geq': '≥', '\\neq': '≠', '\\approx': '≈', '\\equiv': '≡',
    '\\sim': '∼', '\\simeq': '≃', '\\cong': '≅', '\\propto': '∝',
    
    // Set theory
    '\\in': '∈', '\\notin': '∉', '\\subset': '⊂', '\\supset': '⊃',
    '\\subseteq': '⊆', '\\supseteq': '⊇', '\\cup': '∪', '\\cap': '∩',
    '\\emptyset': '∅', '\\varnothing': '∅', '\\setminus': '∖',
    '\\oplus': '⊕', '\\ominus': '⊖', '\\otimes': '⊗', '\\odot': '⊙',
    
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
    '\\mathbb{P}': 'ℙ', '\\mathbb{F}': 'F',
    
    // Logic quantifiers
    '\\forall': '∀', '\\exists': '∃', '\\nexists': '∄',
    '\\therefore': '∴', '\\because': '∵',
    
    // Calculus and analysis
    '\\partial': '∂', '\\nabla': '∇', '\\infty': '∞', '\\aleph': 'ℵ',
    '\\int': '∫', '\\iint': '∬', '\\iiint': '∭', '\\oint': '∮',
    '\\sum': '∑', '\\prod': '∏',
    
    // Arrows and relations
    '\\mapsto': '↦', '\\longmapsto': '⟼', '\\hookleftarrow': '↩',
    '\\hookrightarrow': '↪', '\\uparrow': '↑', '\\downarrow': '↓',
    '\\updownarrow': '↕', '\\Uparrow': '⇑', '\\Downarrow': '⇓',
    
    // Miscellaneous
    '\\dots': '…', '\\ldots': '…', '\\cdots': '⋯', '\\vdots': '⋮',
    '\\ddots': '⋱', '\\angle': '∠', '\\triangle': '△', '\\square': '□',
    '\\diamond': '◊', '\\star': '⋆', '\\dagger': '†', '\\ddagger': '‡'
  };
  
  // COMPREHENSIVE LATEX CLEANUP - Handle braces FIRST before symbol conversion
  
  // Step 1: Handle ALL brace patterns - these are the main issue
  processed = processed.replace(/\\{([^}]+)\\}/g, '$1');  // \{content\} → content
  processed = processed.replace(/\\{([^}]+)}/g, '$1');    // \{content} → content  
  processed = processed.replace(/{([^}]+)\\}/g, '$1');    // {content\} → content
  processed = processed.replace(/\\{/g, '{').replace(/\\}/g, '}'); // Clean remaining escaped braces
  
  // Step 2: Apply symbol replacements AFTER cleaning braces
  Object.entries(symbolMap).forEach(([latex, symbol]) => {
    const regex = new RegExp(latex.replace(/\\/g, '\\\\'), 'g');
    processed = processed.replace(regex, symbol);
  });
  
  // Step 3: Clean up any remaining simple braces around single characters
  processed = processed.replace(/{([αβγδεζηθικλμνξοπρστυφχψωΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩabcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0-9])}/g, '$1');
  
  // Step 4: Remove any stray backslashes before Greek letters or symbols
  processed = processed.replace(/\\([αβγδεζηθικλμνξοπρστυφχψωΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ⊕⊖⊗⊙∈∉⊂⊃⊆⊇∪∩∅∀∃¬∧∨→←↔≤≥≠≈∞∑∏∫])/g, '$1');
  
  // Handle fractions with Unicode fractions where possible
  processed = processed.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, (match, num, den) => {
    const simpleChars = /^[0-9]$/;
    if (simpleChars.test(num) && simpleChars.test(den)) {
      const fractionMap: Record<string, string> = {
        '1/2': '½', '1/3': '⅓', '2/3': '⅔', '1/4': '¼', '3/4': '¾',
        '1/5': '⅕', '2/5': '⅖', '3/5': '⅗', '4/5': '⅘', '1/6': '⅙',
        '5/6': '⅚', '1/7': '⅐', '1/8': '⅛', '3/8': '⅜', '5/8': '⅝',
        '7/8': '⅞', '1/9': '⅑', '1/10': '⅒'
      };
      const key = `${num}/${den}`;
      if (fractionMap[key]) return fractionMap[key];
    }
    return `${num}/${den}`;
  });
  
  // Handle superscripts and subscripts
  processed = processed.replace(/\^(\{[^}]+\}|[a-zA-Z0-9])/g, (match, sup) => {
    const content = sup.startsWith('{') ? sup.slice(1, -1) : sup;
    return `^${content}`;
  });
  
  processed = processed.replace(/_(\{[^}]+\}|[a-zA-Z0-9])/g, (match, sub) => {
    const content = sub.startsWith('{') ? sub.slice(1, -1) : sub;
    return `_${content}`;
  });
  
  // Clean up remaining LaTeX artifacts
  processed = processed.replace(/\{([^}]*)\}/g, '$1');
  processed = processed.replace(/\\left\(/g, '(').replace(/\\right\)/g, ')');
  processed = processed.replace(/\\left\[/g, '[').replace(/\\right\]/g, ']');
  processed = processed.replace(/\\left\|/g, '|').replace(/\\right\|/g, '|');
  processed = processed.replace(/\\;/g, ' ').replace(/\\,/g, ' ').replace(/\\!/g, '');
  
  return processed;
}