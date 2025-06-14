import React from 'react';

interface MathRendererProps {
  content: string;
  className?: string;
}

// LaTeX to Unicode symbol mapping
const latexToUnicode: Record<string, string> = {
  // Logic symbols
  '\\neg': '¬',
  '\\lnot': '¬',
  '\\land': '∧',
  '\\wedge': '∧',
  '\\lor': '∨',
  '\\vee': '∨',
  '\\rightarrow': '→',
  '\\to': '→',
  '\\leftarrow': '←',
  '\\leftrightarrow': '↔',
  '\\iff': '↔',
  '\\Rightarrow': '⇒',
  '\\Leftarrow': '⇐',
  '\\Leftrightarrow': '⇔',
  '\\implies': '⇒',
  
  // Math symbols
  '\\sum': '∑',
  '\\prod': '∏',
  '\\int': '∫',
  '\\infty': '∞',
  '\\partial': '∂',
  '\\nabla': '∇',
  '\\Delta': 'Δ',
  '\\delta': 'δ',
  '\\alpha': 'α',
  '\\beta': 'β',
  '\\gamma': 'γ',
  '\\Gamma': 'Γ',
  '\\theta': 'θ',
  '\\Theta': 'Θ',
  '\\lambda': 'λ',
  '\\Lambda': 'Λ',
  '\\mu': 'μ',
  '\\pi': 'π',
  '\\Pi': 'Π',
  '\\sigma': 'σ',
  '\\Sigma': 'Σ',
  '\\phi': 'φ',
  '\\Phi': 'Φ',
  '\\psi': 'ψ',
  '\\Psi': 'Ψ',
  '\\omega': 'ω',
  '\\Omega': 'Ω',
  
  // Relations
  '\\leq': '≤',
  '\\geq': '≥',
  '\\neq': '≠',
  '\\approx': '≈',
  '\\equiv': '≡',
  '\\subset': '⊂',
  '\\supset': '⊃',
  '\\subseteq': '⊆',
  '\\supseteq': '⊇',
  '\\in': '∈',
  '\\notin': '∉',
  '\\cup': '∪',
  '\\cap': '∩',
  '\\emptyset': '∅',
  '\\exists': '∃',
  '\\forall': '∀',
  '\\therefore': '∴',
  '\\because': '∵',
  
  // Number sets
  '\\mathbb{R}': 'ℝ',
  '\\mathbb{N}': 'ℕ',
  '\\mathbb{Z}': 'ℤ',
  '\\mathbb{Q}': 'ℚ',
  '\\mathbb{C}': 'ℂ',
  '\\R': 'ℝ',
  '\\N': 'ℕ',
  '\\Z': 'ℤ',
  '\\Q': 'ℚ',
  '\\C': 'ℂ',
  
  // Operations
  '\\times': '×',
  '\\div': '÷',
  '\\pm': '±',
  '\\mp': '∓',
  '\\cdot': '⋅',
  '\\bullet': '•',
  '\\circ': '∘',
  '\\oplus': '⊕',
  '\\ominus': '⊖',
  '\\otimes': '⊗',
  '\\oslash': '⊘'
};

function renderMathContent(content: string): string {
  let processed = content;
  
  // Handle display math blocks $$...$$
  processed = processed.replace(/\$\$([^$]+)\$\$/g, (match, latex) => {
    let rendered = latex;
    // Apply symbol replacements
    Object.entries(latexToUnicode).forEach(([latexSymbol, unicode]) => {
      rendered = rendered.replace(new RegExp(latexSymbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), unicode);
    });
    
    // Handle fractions \frac{a}{b}
    rendered = rendered.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1/$2');
    
    // Handle subscripts and superscripts (basic)
    rendered = rendered.replace(/\{([^}]+)\}/g, '$1');
    rendered = rendered.replace(/_([a-zA-Z0-9]+)/g, '₍$1₎');
    rendered = rendered.replace(/\^([a-zA-Z0-9]+)/g, '⁽$1⁾');
    
    return `<div class="math-display" style="text-align: center; margin: 1em 0; font-size: 1.2em; font-weight: 500;">${rendered}</div>`;
  });
  
  // Handle inline math $...$
  processed = processed.replace(/\$([^$]+)\$/g, (match, latex) => {
    let rendered = latex;
    // Apply symbol replacements
    Object.entries(latexToUnicode).forEach(([latexSymbol, unicode]) => {
      rendered = rendered.replace(new RegExp(latexSymbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), unicode);
    });
    
    // Handle fractions \frac{a}{b}
    rendered = rendered.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1/$2');
    
    // Handle subscripts and superscripts (basic)
    rendered = rendered.replace(/\{([^}]+)\}/g, '$1');
    rendered = rendered.replace(/_([a-zA-Z0-9]+)/g, '₍$1₎');
    rendered = rendered.replace(/\^([a-zA-Z0-9]+)/g, '⁽$1⁾');
    
    return `<span class="math-inline" style="font-weight: 500;">${rendered}</span>`;
  });
  
  // Handle \\(...\\) inline math
  processed = processed.replace(/\\\(([^)]+)\\\)/g, (match, latex) => {
    let rendered = latex;
    Object.entries(latexToUnicode).forEach(([latexSymbol, unicode]) => {
      rendered = rendered.replace(new RegExp(latexSymbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), unicode);
    });
    rendered = rendered.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1/$2');
    rendered = rendered.replace(/\{([^}]+)\}/g, '$1');
    return `<span class="math-inline" style="font-weight: 500;">${rendered}</span>`;
  });
  
  // Handle \\[...\\] display math
  processed = processed.replace(/\\\[([^\]]+)\\\]/g, (match, latex) => {
    let rendered = latex;
    Object.entries(latexToUnicode).forEach(([latexSymbol, unicode]) => {
      rendered = rendered.replace(new RegExp(latexSymbol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), unicode);
    });
    rendered = rendered.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1/$2');
    rendered = rendered.replace(/\{([^}]+)\}/g, '$1');
    return `<div class="math-display" style="text-align: center; margin: 1em 0; font-size: 1.2em; font-weight: 500;">${rendered}</div>`;
  });

  // CRITICAL FIX: Handle raw LaTeX symbols in text (not wrapped in math delimiters)
  // This is needed for documents that contain raw LaTeX like your mathematical logic text
  Object.entries(latexToUnicode).forEach(([latexSymbol, unicode]) => {
    // Simple string replacement for LaTeX commands
    processed = processed.split(latexSymbol).join(unicode);
  });
  
  // Convert line breaks to HTML
  processed = processed.replace(/\n/g, '<br/>');
  
  // Handle markdown-style formatting
  processed = processed.replace(/^# (.+)$/gm, '<h1 style="font-size: 2.5em; font-weight: bold; margin: 1em 0 0.5em 0; border-bottom: 2px solid #ddd; padding-bottom: 0.3em;">$1</h1>');
  processed = processed.replace(/^## (.+)$/gm, '<h2 style="font-size: 2em; font-weight: bold; margin: 0.8em 0 0.4em 0;">$1</h2>');
  processed = processed.replace(/^### (.+)$/gm, '<h3 style="font-size: 1.5em; font-weight: bold; margin: 0.6em 0 0.3em 0;">$1</h3>');
  
  // Handle paragraphs
  const lines = processed.split('<br/>');
  const paragraphs: string[] = [];
  let currentParagraph: string[] = [];
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed === '') {
      if (currentParagraph.length > 0) {
        paragraphs.push(currentParagraph.join(' '));
        currentParagraph = [];
      }
    } else {
      currentParagraph.push(trimmed);
    }
  });
  
  if (currentParagraph.length > 0) {
    paragraphs.push(currentParagraph.join(' '));
  }
  
  return paragraphs.map(p => {
    if (p.startsWith('<h') || p.startsWith('<div class="math-display"')) {
      return p;
    }
    return `<p style="margin: 1em 0; line-height: 1.6; font-size: 1.1em;">${p}</p>`;
  }).join('');
}

export default function MathRenderer({ content, className = "" }: MathRendererProps) {
  const processedContent = renderMathContent(content);
  
  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: processedContent }}
      style={{ 
        fontFamily: 'Georgia, "Times New Roman", serif',
        lineHeight: '1.6',
        color: '#333'
      }}
    />
  );
}