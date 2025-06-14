import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface KaTeXRendererProps {
  content: string;
  displayMode?: boolean;
  className?: string;
}

const KaTeXRenderer: React.FC<KaTeXRendererProps> = ({ 
  content, 
  displayMode = false, 
  className = "" 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    try {
      // Process the content to render LaTeX expressions
      const processedContent = processLaTeXContent(content);
      containerRef.current.innerHTML = processedContent;
    } catch (error) {
      console.error('KaTeX rendering error:', error);
      // Fallback to plain text if rendering fails
      containerRef.current.textContent = content;
    }
  }, [content, displayMode]);

  return <div ref={containerRef} className={className} />;
};

function processLaTeXContent(content: string): string {
  // Replace inline math (between $ $)
  content = content.replace(/\$([^$]+)\$/g, (match, math) => {
    try {
      return katex.renderToString(math, { displayMode: false });
    } catch (error) {
      console.warn('Failed to render inline math:', math, error);
      return match;
    }
  });

  // Replace display math (between $$ $$)
  content = content.replace(/\$\$([^$]+)\$\$/g, (match, math) => {
    try {
      return katex.renderToString(math, { displayMode: true });
    } catch (error) {
      console.warn('Failed to render display math:', math, error);
      return match;
    }
  });

  // Replace common LaTeX commands that appear as plain text
  const mathCommands: Record<string, string> = {
    '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ', '\\delta': 'δ',
    '\\epsilon': 'ε', '\\zeta': 'ζ', '\\eta': 'η', '\\theta': 'θ',
    '\\iota': 'ι', '\\kappa': 'κ', '\\lambda': 'λ', '\\mu': 'μ',
    '\\nu': 'ν', '\\xi': 'ξ', '\\pi': 'π', '\\rho': 'ρ',
    '\\sigma': 'σ', '\\tau': 'τ', '\\upsilon': 'υ', '\\phi': 'φ',
    '\\chi': 'χ', '\\psi': 'ψ', '\\omega': 'ω',
    '\\Gamma': 'Γ', '\\Delta': 'Δ', '\\Theta': 'Θ', '\\Lambda': 'Λ',
    '\\Xi': 'Ξ', '\\Pi': 'Π', '\\Sigma': 'Σ', '\\Upsilon': 'Υ',
    '\\Phi': 'Φ', '\\Chi': 'Χ', '\\Psi': 'Ψ', '\\Omega': 'Ω',
    '\\rightarrow': '→', '\\leftarrow': '←', '\\leftrightarrow': '↔',
    '\\Rightarrow': '⇒', '\\Leftarrow': '⇐', '\\Leftrightarrow': '⇔',
    '\\neg': '¬', '\\lnot': '¬', '\\wedge': '∧', '\\vee': '∨',
    '\\forall': '∀', '\\exists': '∃', '\\nexists': '∄',
    '\\in': '∈', '\\notin': '∉', '\\subset': '⊂', '\\supset': '⊃',
    '\\subseteq': '⊆', '\\supseteq': '⊇', '\\cup': '∪', '\\cap': '∩',
    '\\emptyset': '∅', '\\varnothing': '∅',
    '\\leq': '≤', '\\geq': '≥', '\\neq': '≠', '\\equiv': '≡',
    '\\approx': '≈', '\\sim': '∼', '\\simeq': '≃', '\\cong': '≅',
    '\\times': '×', '\\cdot': '·', '\\div': '÷', '\\pm': '±', '\\mp': '∓',
    '\\sum': '∑', '\\prod': '∏', '\\int': '∫', '\\iint': '∬', 
    '\\iiint': '∭', '\\oint': '∮', '\\infty': '∞', '\\partial': '∂',
    '\\nabla': '∇', '\\angle': '∠', '\\triangle': '△'
  };

  // Convert LaTeX commands to Unicode symbols
  Object.entries(mathCommands).forEach(([latex, symbol]) => {
    const regex = new RegExp(latex.replace(/\\/g, '\\\\'), 'g');
    content = content.replace(regex, symbol);
  });

  // Handle fractions like \frac{a}{b}
  content = content.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, (match, num, den) => {
    try {
      return katex.renderToString(`\\frac{${num}}{${den}}`, { displayMode: false });
    } catch (error) {
      return `${num}/${den}`;
    }
  });

  // Handle limits like \lim_{x \to a}
  content = content.replace(/\\lim_\{([^}]+)\}/g, (match, limit) => {
    try {
      return katex.renderToString(`\\lim_{${limit}}`, { displayMode: false });
    } catch (error) {
      return `lim[${limit}]`;
    }
  });

  return content;
}

export default KaTeXRenderer;