// Clean KaTeX math renderer - following user's exact specifications

export function renderMathContent(element: HTMLElement): void {
  if (!element || typeof window === 'undefined') return;
  
  if (window.renderMathInElement && typeof window.renderMathInElement === 'function') {
    try {
      window.renderMathInElement(element, {
        delimiters: [
          {left: "$$", right: "$$", display: true},
          {left: "\\(", right: "\\)", display: false}
        ],
        throwOnError: false
      });
      console.log('✅ KaTeX math rendered');
    } catch (error) {
      console.error('❌ KaTeX rendering failed:', error);
    }
  }
}

export function processContentForMathRendering(content: string): string {
  let processed = content;
  
  // Convert unwrapped LaTeX expressions to properly delimited ones
  // This is a fallback for when AI models don't generate proper delimiters
  
  // Convert fractions: frac{...}{...} -> \(\frac{...}{...}\)
  processed = processed.replace(/\bfrac\{([^}]*)\}\{([^}]*)\}/g, '\\(\\frac{$1}{$2}\\)');
  
  // Convert limits: lim_{...} -> \(\lim_{...}\)
  processed = processed.replace(/\blim_\{([^}]*)\}/g, '\\(\\lim_{$1}\\)');
  processed = processed.replace(/\blim\s+to\s+([^}\s]+)/g, '\\(\\lim \\to $1\\)');
  
  // Convert specific patterns from the user's screenshots
  processed = processed.replace(/lim_\{?\(([^}]*)\)\}?/g, '\\(\\lim_{($1)}\\)');
  processed = processed.replace(/frac\{?\{([^}]*)\}\}?\{?\{([^}]*)\}\}?/g, '\\(\\frac{$1}{$2}\\)');
  
  // Convert "to" in mathematical contexts
  processed = processed.replace(/(\w+)\s+to\s+(\w+)/g, '$1 \\(\\to\\) $2');
  
  // Convert integrals: int_{...}^{...} or int -> \(\int_{...}^{...}\) or \(\int\)
  processed = processed.replace(/\bint_\{([^}]*)\}\^\{([^}]*)\}/g, '\\(\\int_{$1}^{$2}\\)');
  processed = processed.replace(/\bint\b/g, '\\(\\int\\)');
  
  // Convert summations: sum_{...}^{...} -> \(\sum_{...}^{...}\)
  processed = processed.replace(/\bsum_\{([^}]*)\}\^\{([^}]*)\}/g, '\\(\\sum_{$1}^{$2}\\)');
  
  // Convert square roots: sqrt{...} -> \(\sqrt{...}\)
  processed = processed.replace(/\bsqrt\{([^}]*)\}/g, '\\(\\sqrt{$1}\\)');
  
  // Convert simple variables with superscripts/subscripts: x^2, x_1, etc.
  processed = processed.replace(/\b([a-zA-Z])\^(\d+|\{[^}]*\})/g, '\\($1^$2\\)');
  processed = processed.replace(/\b([a-zA-Z])_(\d+|\{[^}]*\})/g, '\\($1_$2\\)');
  
  // Convert Greek letters: alpha, beta, gamma, etc.
  const greekLetters = ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta', 'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi', 'omicron', 'pi', 'rho', 'sigma', 'tau', 'upsilon', 'phi', 'chi', 'psi', 'omega'];
  greekLetters.forEach(letter => {
    const regex = new RegExp(`\\b${letter}\\b`, 'g');
    processed = processed.replace(regex, `\\(\\${letter}\\)`);
  });
  
  // Convert common operators: -> becomes \rightarrow, <= becomes \leq, etc.
  processed = processed.replace(/\s+->\s+/g, ' \\(\\rightarrow\\) ');
  processed = processed.replace(/\s+to\s+/g, ' \\(\\to\\) ');
  processed = processed.replace(/\s*<=\s*/g, ' \\(\\leq\\) ');
  processed = processed.replace(/\s*>=\s*/g, ' \\(\\geq\\) ');
  processed = processed.replace(/\s*!=\s*/g, ' \\(\\neq\\) ');
  processed = processed.replace(/\binfinity\b/g, '\\(\\infty\\)');
  
  // Convert to HTML paragraphs
  return processed
    .replace(/\n\n+/g, '</p><p>')
    .replace(/^(?!<p>)/, '<p>')
    .replace(/(?!<\/p>)$/, '</p>')
    .replace(/<p><\/p>/g, '')
    .replace(/\n/g, '<br>');
}