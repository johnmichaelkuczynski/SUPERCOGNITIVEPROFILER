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
  
  // DIRECT LATEX TO UNICODE REPLACEMENT - NO PROCESSING
  Object.entries(latexToUnicode).forEach(([latexSymbol, unicode]) => {
    processed = processed.split(latexSymbol).join(unicode);
  });
  
  // Handle basic fractions
  processed = processed.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1/$2');
  
  // Clean up any LaTeX artifacts
  processed = processed.replace(/\$\$?([^$]+)\$\$?/g, '$1'); // Remove $ delimiters
  processed = processed.replace(/\\\[([^\]]+)\\\]/g, '$1');   // Remove \[...\]
  processed = processed.replace(/\\\(([^)]+)\\\)/g, '$1');    // Remove \(...\)
  processed = processed.replace(/\{([^}]+)\}/g, '$1');        // Remove braces
  processed = processed.replace(/\\left\(/g, '(').replace(/\\right\)/g, ')');
  processed = processed.replace(/\\left\[/g, '[').replace(/\\right\]/g, ']');
  
  // COMPLETELY REMOVE ALL MARKDOWN FORMATTING
  processed = processed
    .replace(/^#{1,6}\s*/gm, '')              // Remove # headers
    .replace(/\*\*([^*]+)\*\*/g, '$1')       // Remove **bold**
    .replace(/\*([^*]+)\*/g, '$1')           // Remove *italic*
    .replace(/__([^_]+)__/g, '$1')           // Remove __text__
    .replace(/_([^_]+)_/g, '$1')             // Remove _text_
    .replace(/`([^`]+)`/g, '$1')             // Remove `code`
    .replace(/```[\s\S]*?```/g, '')          // Remove code blocks
    .replace(/^\s*[-*+]\s*/gm, '')           // Remove bullets
    .replace(/^\s*\d+\.\s*/gm, '')           // Remove numbers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
    .replace(/<[^>]+>/g, '')                 // Remove HTML
    .replace(/&[^;]+;/g, '');                // Remove entities
  
  // Convert line breaks to HTML
  processed = processed.replace(/\n/g, '<br/>');
  
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