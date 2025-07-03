// Mathematical content renderer utility
// Fixes double-escaping and ensures proper LaTeX rendering

export function fixDoubleEscapedMath(content: string): string {
  // CRITICAL: Only fix genuinely double-escaped content, preserve proper LaTeX
  let fixed = content;
  
  // Only fix actual quadruple-escaped delimiters (rare edge case)
  fixed = fixed.replace(/\\\\\\\\\(/g, '\\(');
  fixed = fixed.replace(/\\\\\\\\\)/g, '\\)');
  fixed = fixed.replace(/\\\\\\\\\[/g, '\\[');
  fixed = fixed.replace(/\\\\\\\\\]/g, '\\]');
  
  // Fix legitimately double-escaped commands only
  fixed = fixed.replace(/\\\\\\\\alpha/g, '\\alpha');
  fixed = fixed.replace(/\\\\\\\\beta/g, '\\beta');
  fixed = fixed.replace(/\\\\\\\\gamma/g, '\\gamma');
  fixed = fixed.replace(/\\\\\\\\epsilon/g, '\\epsilon');
  fixed = fixed.replace(/\\\\\\\\sigma/g, '\\sigma');
  fixed = fixed.replace(/\\\\\\\\in/g, '\\in');
  fixed = fixed.replace(/\\\\\\\\cup/g, '\\cup');
  fixed = fixed.replace(/\\\\\\\\cap/g, '\\cap');
  fixed = fixed.replace(/\\\\\\\\forall/g, '\\forall');
  fixed = fixed.replace(/\\\\\\\\exists/g, '\\exists');
  
  return fixed;
}

export function renderMathContent(element: HTMLElement): void {
  if (!element || typeof window === 'undefined') return;
  
  // Use the global KaTeX renderer with proper configuration
  if (window.renderMathInElement && typeof window.renderMathInElement === 'function') {
    try {
      window.renderMathInElement(element, {
        delimiters: [
          {left: '\\(', right: '\\)', display: false},
          {left: '\\[', right: '\\]', display: true},
          {left: '$$', right: '$$', display: true}
        ],
        throwOnError: false,
        strict: false,
        ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
        ignoredClasses: ['currency', 'money', 'price']
      });
      console.log('✅ KaTeX rendered successfully for technical notation');
    } catch (error) {
      console.error('❌ KaTeX rendering failed:', error);
    }
  } else {
    console.warn('⚠️ KaTeX renderMathInElement not available');
  }
}

export function processContentForMathRendering(content: string): string {
  // CRITICAL FIX: Don't destroy LaTeX delimiters! Only fix actual double-escaping
  let processed = content;
  
  // Only fix legitimate double-escaped math commands, NOT delimiters
  processed = processed
    .replace(/\\\\alpha/g, '\\alpha')
    .replace(/\\\\beta/g, '\\beta')
    .replace(/\\\\gamma/g, '\\gamma')
    .replace(/\\\\delta/g, '\\delta')
    .replace(/\\\\epsilon/g, '\\epsilon')
    .replace(/\\\\sigma/g, '\\sigma')
    .replace(/\\\\theta/g, '\\theta')
    .replace(/\\\\phi/g, '\\phi')
    .replace(/\\\\psi/g, '\\psi')
    .replace(/\\\\in/g, '\\in')
    .replace(/\\\\cup/g, '\\cup')
    .replace(/\\\\cap/g, '\\cap')
    .replace(/\\\\forall/g, '\\forall')
    .replace(/\\\\exists/g, '\\exists')
    .replace(/\\\\emptyset/g, '\\emptyset')
    .replace(/\\\\neg/g, '\\neg')
    .replace(/\\\\wedge/g, '\\wedge')
    .replace(/\\\\vee/g, '\\vee');
  
  // DO NOT REMOVE LaTeX DELIMITERS - preserve \( \) and \[ \] exactly as they are
  
  // Ensure proper paragraph structure for HTML rendering
  processed = processed
    .replace(/\n\n+/g, '</p><p>')
    .replace(/^(?!<p>)/, '<p>')
    .replace(/(?!<\/p>)$/, '</p>')
    // Fix empty paragraphs
    .replace(/<p><\/p>/g, '')
    // Preserve line breaks within paragraphs
    .replace(/\n/g, '<br>');
  
  return processed;
}