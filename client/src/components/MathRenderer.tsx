import React from 'react';

interface MathRendererProps {
  content: string;
  className?: string;
}

function renderMathContent(content: string): string {
  let processed = content;
  
  // COMPREHENSIVE LATEX MATH RENDERING SYSTEM
  
  // Handle display math environments $$...$$
  processed = processed.replace(/\$\$([^$]+)\$\$/g, (match, latex) => {
    const rendered = renderLatexExpression(latex.trim());
    return `<div class="math-display" style="text-align: center; margin: 1.5em 0; font-size: 1.4em; font-family: 'Times New Roman', serif; font-style: italic;">${rendered}</div>`;
  });
  
  // Handle inline math $...$
  processed = processed.replace(/\$([^$]+)\$/g, (match, latex) => {
    const rendered = renderLatexExpression(latex.trim());
    return `<span class="math-inline" style="font-family: 'Times New Roman', serif; font-style: italic; font-size: 1.1em;">${rendered}</span>`;
  });
  
  // Handle LaTeX display math \[...\]
  processed = processed.replace(/\\\[([^\]]+)\\\]/g, (match, latex) => {
    const rendered = renderLatexExpression(latex.trim());
    return `<div class="math-display" style="text-align: center; margin: 1.5em 0; font-size: 1.4em; font-family: 'Times New Roman', serif; font-style: italic;">${rendered}</div>`;
  });
  
  // Handle LaTeX inline math \(...\)
  processed = processed.replace(/\\\(([^)]+)\\\)/g, (match, latex) => {
    const rendered = renderLatexExpression(latex.trim());
    return `<span class="math-inline" style="font-family: 'Times New Roman', serif; font-style: italic; font-size: 1.1em;">${rendered}</span>`;
  });
  
  // Remove all markdown formatting
  processed = processed.replace(/^#{1,6}\s*/gm, '');
  processed = processed.replace(/\*\*(.*?)\*\*/g, '$1');
  processed = processed.replace(/\*(.*?)\*/g, '$1');
  processed = processed.replace(/^[-*+]\s/gm, '');
  processed = processed.replace(/^\d+\.\s/gm, '');
  
  return processed;
}

function renderLatexExpression(latex: string): string {
  let rendered = latex;
  
  // Handle matrices with proper formatting
  rendered = rendered.replace(/\\begin\{pmatrix\}([\s\S]*?)\\end\{pmatrix\}/g, (match, content) => {
    const rows = content.split('\\\\').map((row: string) => {
      const cells = row.split('&').map((cell: string) => cell.trim());
      return cells.join(' ');
    });
    return `⎛${rows.join('⎞⎜').replace(/⎞⎜/g, ' ⎞<br>⎜ ')}⎠`;
  });
  
  rendered = rendered.replace(/\\begin\{bmatrix\}([\s\S]*?)\\end\{bmatrix\}/g, (match, content) => {
    const rows = content.split('\\\\').map((row: string) => {
      const cells = row.split('&').map((cell: string) => cell.trim());
      return cells.join(' ');
    });
    return `⎡${rows.join('⎤⎢').replace(/⎤⎢/g, ' ⎤<br>⎢ ')}⎦`;
  });
  
  rendered = rendered.replace(/\\begin\{matrix\}([\s\S]*?)\\end\{matrix\}/g, (match, content) => {
    const rows = content.split('\\\\').map((row: string) => {
      const cells = row.split('&').map((cell: string) => cell.trim());
      return cells.join(' ');
    });
    return rows.join('<br>');
  });
  
  // Handle fractions with proper mathematical formatting
  rendered = rendered.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, (match, num, den) => {
    // For simple single-character numerators and denominators, use Unicode fractions
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
    
    // For complex fractions, use proper fraction formatting
    const processedNum = renderLatexExpression(num);
    const processedDen = renderLatexExpression(den);
    return `<span class="fraction" style="display: inline-block; text-align: center; vertical-align: middle;">
      <span style="display: block; border-bottom: 1px solid currentColor; padding: 0 0.2em;">${processedNum}</span>
      <span style="display: block; padding: 0 0.2em;">${processedDen}</span>
    </span>`;
  });
  
  // Handle superscripts and subscripts with proper positioning
  rendered = rendered.replace(/\^(\{[^}]+\}|[^{\s])/g, (match, sup) => {
    const content = sup.startsWith('{') ? sup.slice(1, -1) : sup;
    const processed = renderLatexExpression(content);
    return `<sup style="font-size: 0.7em; vertical-align: super;">${processed}</sup>`;
  });
  
  rendered = rendered.replace(/_(\{[^}]+\}|[^{\s])/g, (match, sub) => {
    const content = sub.startsWith('{') ? sub.slice(1, -1) : sub;
    const processed = renderLatexExpression(content);
    return `<sub style="font-size: 0.7em; vertical-align: sub;">${processed}</sub>`;
  });
  
  // Handle integrals with proper sizing
  rendered = rendered.replace(/\\int/g, '<span style="font-size: 1.8em;">∫</span>');
  rendered = rendered.replace(/\\iint/g, '<span style="font-size: 1.8em;">∬</span>');
  rendered = rendered.replace(/\\iiint/g, '<span style="font-size: 1.8em;">∭</span>');
  rendered = rendered.replace(/\\oint/g, '<span style="font-size: 1.8em;">∮</span>');
  
  // Handle summations and products with proper sizing
  rendered = rendered.replace(/\\sum/g, '<span style="font-size: 1.8em;">∑</span>');
  rendered = rendered.replace(/\\prod/g, '<span style="font-size: 1.8em;">∏</span>');
  
  // Handle mathematical operators and symbols
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
    
    // Calculus and analysis
    '\\partial': '∂', '\\nabla': '∇', '\\infty': '∞', '\\aleph': 'ℵ',
    '\\lim': 'lim', '\\sup': 'sup', '\\inf': 'inf', '\\max': 'max', '\\min': 'min',
    
    // Logic quantifiers
    '\\forall': '∀', '\\exists': '∃', '\\nexists': '∄',
    '\\therefore': '∴', '\\because': '∵',
    
    // Arrows and relations
    '\\mapsto': '↦', '\\longmapsto': '⟼', '\\hookleftarrow': '↩',
    '\\hookrightarrow': '↪', '\\uparrow': '↑', '\\downarrow': '↓',
    '\\updownarrow': '↕', '\\Uparrow': '⇑', '\\Downarrow': '⇓',
    
    // Miscellaneous
    '\\dots': '…', '\\ldots': '…', '\\cdots': '⋯', '\\vdots': '⋮',
    '\\ddots': '⋱', '\\angle': '∠', '\\triangle': '△', '\\square': '□',
    '\\diamond': '◊', '\\star': '⋆', '\\dagger': '†', '\\ddagger': '‡'
  };
  
  // Apply symbol replacements
  Object.entries(symbolMap).forEach(([latex, symbol]) => {
    rendered = rendered.split(latex).join(symbol);
  });
  
  // Handle function names with proper formatting
  const functionNames = ['sin', 'cos', 'tan', 'sec', 'csc', 'cot', 
                        'sinh', 'cosh', 'tanh', 'log', 'ln', 'exp',
                        'det', 'tr', 'rank', 'dim', 'ker', 'im'];
  functionNames.forEach(func => {
    const regex = new RegExp(`\\\\${func}\\b`, 'g');
    rendered = rendered.replace(regex, `<span style="font-style: normal;">${func}</span>`);
  });
  
  // Clean up remaining LaTeX artifacts
  rendered = rendered.replace(/\{([^}]*)\}/g, '$1');
  rendered = rendered.replace(/\\left\(/g, '(').replace(/\\right\)/g, ')');
  rendered = rendered.replace(/\\left\[/g, '[').replace(/\\right\]/g, ']');
  rendered = rendered.replace(/\\left\|/g, '|').replace(/\\right\|/g, '|');
  rendered = rendered.replace(/\\;/g, ' ').replace(/\\,/g, ' ').replace(/\\!/g, '');
  
  return rendered;
}

export default function MathRenderer({ content, className = "" }: MathRendererProps) {
  const processedContent = renderMathContent(content);
  
  return (
    <div 
      className={`math-content ${className}`}
      dangerouslySetInnerHTML={{ __html: processedContent }}
      style={{ 
        fontFamily: 'system-ui, -apple-system, sans-serif',
        lineHeight: '1.6'
      }}
    />
  );
}