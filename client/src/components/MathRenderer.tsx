import React from 'react';

interface MathRendererProps {
  content: string;
  className?: string;
}

function renderMathContent(content: string): string {
  let processed = content;
  
  // DIRECT SYMBOL REPLACEMENTS - NO LATEX PROCESSING
  const symbolMap: Record<string, string> = {
    // Basic logic symbols
    '\\neg': '¬', '\\lnot': '¬',
    '\\land': '∧', '\\wedge': '∧', 
    '\\lor': '∨', '\\vee': '∨',
    '\\rightarrow': '→', '\\to': '→',
    '\\leftarrow': '←',
    '\\leftrightarrow': '↔', '\\iff': '↔',
    '\\Rightarrow': '⇒', '\\implies': '⇒',
    '\\Leftarrow': '⇐',
    '\\Leftrightarrow': '⇔',
    
    // Mathematical symbols
    '\\times': '×', '\\cdot': '⋅',
    '\\div': '÷', '\\pm': '±',
    '\\leq': '≤', '\\geq': '≥',
    '\\neq': '≠', '\\approx': '≈',
    '\\equiv': '≡',
    
    // Set theory
    '\\in': '∈', '\\notin': '∉',
    '\\subset': '⊂', '\\supset': '⊃',
    '\\subseteq': '⊆', '\\supseteq': '⊇',
    '\\cup': '∪', '\\cap': '∩',
    '\\emptyset': '∅',
    
    // Greek letters
    '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ', '\\delta': 'δ',
    '\\epsilon': 'ε', '\\zeta': 'ζ', '\\eta': 'η', '\\theta': 'θ',
    '\\iota': 'ι', '\\kappa': 'κ', '\\lambda': 'λ', '\\mu': 'μ',
    '\\nu': 'ν', '\\xi': 'ξ', '\\omicron': 'ο', '\\pi': 'π',
    '\\rho': 'ρ', '\\sigma': 'σ', '\\tau': 'τ', '\\upsilon': 'υ',
    '\\phi': 'φ', '\\chi': 'χ', '\\psi': 'ψ', '\\omega': 'ω',
    
    // Capital Greek
    '\\Gamma': 'Γ', '\\Delta': 'Δ', '\\Theta': 'Θ', '\\Lambda': 'Λ',
    '\\Xi': 'Ξ', '\\Pi': 'Π', '\\Sigma': 'Σ', '\\Upsilon': 'Υ',
    '\\Phi': 'Φ', '\\Chi': 'Χ', '\\Psi': 'Ψ', '\\Omega': 'Ω',
    
    // Number sets
    '\\mathbb{N}': 'ℕ', '\\mathbb{Z}': 'ℤ', '\\mathbb{Q}': 'ℚ',
    '\\mathbb{R}': 'ℝ', '\\mathbb{C}': 'ℂ',
    
    // Calculus
    '\\sum': '∑', '\\prod': '∏', '\\int': '∫',
    '\\partial': '∂', '\\nabla': '∇', '\\infty': '∞',
    
    // Logic
    '\\forall': '∀', '\\exists': '∃',
    '\\therefore': '∴', '\\because': '∵'
  };
  
  // Handle common fractions FIRST (before other symbol replacements)
  const fractionReplacements: Record<string, string> = {
    '\\frac{1}{2}': '½', '\\frac{1}{3}': '⅓', '\\frac{2}{3}': '⅔',
    '\\frac{1}{4}': '¼', '\\frac{3}{4}': '¾', '\\frac{1}{5}': '⅕',
    '\\frac{2}{5}': '⅖', '\\frac{3}{5}': '⅗', '\\frac{4}{5}': '⅘',
    '\\frac{1}{6}': '⅙', '\\frac{5}{6}': '⅚', '\\frac{1}{8}': '⅛',
    '\\frac{3}{8}': '⅜', '\\frac{5}{8}': '⅝', '\\frac{7}{8}': '⅞'
  };
  
  Object.entries(fractionReplacements).forEach(([latex, symbol]) => {
    processed = processed.split(latex).join(symbol);
  });
  
  // Handle remaining fractions
  processed = processed.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1/$2');
  
  // Apply other symbol replacements
  Object.entries(symbolMap).forEach(([latex, symbol]) => {
    processed = processed.split(latex).join(symbol);
  });
  
  // Remove all math delimiters
  processed = processed.replace(/\$\$?([^$]*)\$\$?/g, '$1');
  processed = processed.replace(/\\\[([^\]]*)\\\]/g, '$1');
  processed = processed.replace(/\\\(([^)]*)\\\)/g, '$1');
  
  // Clean up remaining LaTeX artifacts
  processed = processed.replace(/\{([^}]*)\}/g, '$1');
  processed = processed.replace(/\\left\(/g, '(');
  processed = processed.replace(/\\right\)/g, ')');
  processed = processed.replace(/\\left\[/g, '[');
  processed = processed.replace(/\\right\]/g, ']');
  
  // Remove all markdown formatting aggressively
  processed = processed.replace(/^#{1,6}\s*/gm, '');
  processed = processed.replace(/\*\*(.*?)\*\*/g, '$1');
  processed = processed.replace(/\*(.*?)\*/g, '$1');
  processed = processed.replace(/^[-*+]\s/gm, '');
  processed = processed.replace(/^\d+\.\s/gm, '');
  
  return processed;
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