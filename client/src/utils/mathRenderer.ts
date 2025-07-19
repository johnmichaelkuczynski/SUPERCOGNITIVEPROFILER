// Clean KaTeX math renderer - following user's exact specifications

export function renderMathContent(element: HTMLElement): void {
  if (!element || typeof window === 'undefined') return;
  
  if (window.renderMathInElement && typeof window.renderMathInElement === 'function') {
    try {
      window.renderMathInElement(element, {
        delimiters: [
          {left: "$$", right: "$$", display: true},
          {left: "\\[", right: "\\]", display: true},
          {left: "\\(", right: "\\)", display: false}
        ],
        throwOnError: false,
        errorColor: '#cc0000',
        macros: {
          "\\f": "#1f(#2)"
        }
      });
      console.log('✅ KaTeX math rendered with proper delimiters');
    } catch (error) {
      console.error('❌ KaTeX rendering failed:', error);
    }
  } else {
    console.warn('❌ KaTeX renderMathInElement not available');
  }
}

export function processContentForMathRendering(content: string): string {
  let processed = content;
  
  // First pass: Convert unwrapped LaTeX expressions to properly delimited ones
  // This is a fallback for when AI models don't generate proper delimiters
  
  // Convert complex display equations (fractions, integrals, limits with complex expressions)
  // Use $$ for display math for complex multi-line expressions
  processed = processed.replace(/\bfrac\{([^}]*(?:\{[^}]*\}[^}]*)*)\}\{([^}]*(?:\{[^}]*\}[^}]*)*)\}/g, (match, numerator, denominator) => {
    // Use display math for complex fractions
    if (numerator.length > 10 || denominator.length > 10 || numerator.includes('^') || denominator.includes('^')) {
      return `$$\\frac{${numerator}}{${denominator}}$$`;
    }
    return `\\(\\frac{${numerator}}{${denominator}}\\)`;
  });
  
  // Convert complex limits to display math
  processed = processed.replace(/\blim_\{([^}]*(?:\{[^}]*\}[^}]*)*)\}\s*([^\\s][^.!?]*)/g, (match, subscript, expression) => {
    if (subscript.length > 8 || expression.length > 20) {
      return `$$\\lim_{${subscript}} ${expression}$$`;
    }
    return `\\(\\lim_{${subscript}} ${expression}\\)`;
  });
  
  // Convert complex integrals to display math  
  processed = processed.replace(/\bint_\{([^}]*)\}\^\{([^}]*)\}\s*([^\\s][^.!?]*)/g, (match, lower, upper, expression) => {
    if (expression.length > 15 || lower.length > 5 || upper.length > 5) {
      return `$$\\int_{${lower}}^{${upper}} ${expression}$$`;
    }
    return `\\(\\int_{${lower}}^{${upper}} ${expression}\\)`;
  });
  
  // Convert summations
  processed = processed.replace(/\bsum_\{([^}]*)\}\^\{([^}]*)\}/g, (match, lower, upper) => {
    if (lower.length > 5 || upper.length > 5) {
      return `$$\\sum_{${lower}}^{${upper}}$$`;
    }
    return `\\(\\sum_{${lower}}^{${upper}}\\)`;
  });
  
  // Simple math expressions stay inline
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
  processed = processed.replace(/\s*<=\s*/g, ' \\(\\leq\\) ');
  processed = processed.replace(/\s*>=\s*/g, ' \\(\\geq\\) ');
  processed = processed.replace(/\s*!=\s*/g, ' \\(\\neq\\) ');
  processed = processed.replace(/\binfinity\b/g, '\\(\\infty\\)');
  
  // Handle vectors and gradients
  processed = processed.replace(/\\nabla\s*([a-zA-Z]+)/g, '\\(\\nabla $1\\)');
  processed = processed.replace(/\bnabla\s*([a-zA-Z]+)/g, '\\(\\nabla $1\\)');
  
  // Convert to HTML paragraphs
  return processed
    .replace(/\n\n+/g, '</p><p>')
    .replace(/^(?!<p>)/, '<p>')
    .replace(/(?!<\/p>)$/, '</p>')
    .replace(/<p><\/p>/g, '')
    .replace(/\n/g, '<br>');
}