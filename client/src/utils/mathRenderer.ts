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
  
  // Debug: Log the original content to see what we're working with
  console.log('🔍 Original content sample:', content.substring(0, 200));
  
  // Fix cases where math expressions are not properly wrapped in LaTeX delimiters
  // Convert standalone math expressions to proper LaTeX format
  processed = processed
    .replace(/\b([a-z])\^([0-9]+)\b/g, '\\($1^{$2}\\)') // x^2 -> \(x^{2}\)
    .replace(/\b([a-z])\^([a-z])\b/g, '\\($1^{$2}\\)') // x^y -> \(x^{y}\)
    .replace(/\\sqrt\{([^}]+)\}/g, '\\(\\sqrt{$1}\\)') // \sqrt{2} -> \(\sqrt{2}\)
    .replace(/([a-z])\^2 \+ ([a-z])\^2 = ([a-z])\^2/g, '\\($1^2 + $2^2 = $3^2\\)') // Pythagorean theorem
    .replace(/\\alpha\b/g, '\\(\\alpha\\)')
    .replace(/\\beta\b/g, '\\(\\beta\\)')
    .replace(/\\gamma\b/g, '\\(\\gamma\\)')
    .replace(/\\delta\b/g, '\\(\\delta\\)')
    .replace(/\\epsilon\b/g, '\\(\\epsilon\\)')
    .replace(/\\sigma\b/g, '\\(\\sigma\\)')
    .replace(/\\theta\b/g, '\\(\\theta\\)')
    .replace(/\\phi\b/g, '\\(\\phi\\)')
    .replace(/\\psi\b/g, '\\(\\psi\\)')
    .replace(/\\in\b/g, '\\(\\in\\)')
    .replace(/\\cup\b/g, '\\(\\cup\\)')
    .replace(/\\cap\b/g, '\\(\\cap\\)')
    .replace(/\\forall\b/g, '\\(\\forall\\)')
    .replace(/\\exists\b/g, '\\(\\exists\\)')
    .replace(/\\emptyset\b/g, '\\(\\emptyset\\)')
    .replace(/\\neg\b/g, '\\(\\neg\\)')
    .replace(/\\wedge\b/g, '\\(\\wedge\\)')
    .replace(/\\vee\b/g, '\\(\\vee\\)');
  
  // Ensure proper paragraph structure for HTML rendering
  processed = processed
    .replace(/\n\n+/g, '</p><p>')
    .replace(/^(?!<p>)/, '<p>')
    .replace(/(?!<\/p>)$/, '</p>')
    // Fix empty paragraphs
    .replace(/<p><\/p>/g, '')
    // Preserve line breaks within paragraphs
    .replace(/\n/g, '<br>');
  
  console.log('🔍 Processed content sample:', processed.substring(0, 200));
  
  return processed;
}