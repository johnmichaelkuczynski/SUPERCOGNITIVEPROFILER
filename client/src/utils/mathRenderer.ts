// Mathematical content renderer utility
// Fixes double-escaping and ensures proper LaTeX rendering

export function fixDoubleEscapedMath(content: string): string {
  // Simple approach to fix double-escaped LaTeX
  let fixed = content;
  
  // Fix common double-escaped delimiters
  fixed = fixed.replace(/\\\\\(/g, '\\(');
  fixed = fixed.replace(/\\\\\)/g, '\\)');
  fixed = fixed.replace(/\\\\\[/g, '\\[');
  fixed = fixed.replace(/\\\\\]/g, '\\]');
  
  // Fix double-escaped common commands
  fixed = fixed.replace(/\\\\emptyset/g, '\\emptyset');
  fixed = fixed.replace(/\\\\forall/g, '\\forall');
  fixed = fixed.replace(/\\\\exists/g, '\\exists');
  fixed = fixed.replace(/\\\\in/g, '\\in');
  fixed = fixed.replace(/\\\\cup/g, '\\cup');
  fixed = fixed.replace(/\\\\cap/g, '\\cap');
  fixed = fixed.replace(/\\\\neg/g, '\\neg');
  fixed = fixed.replace(/\\\\wedge/g, '\\wedge');
  fixed = fixed.replace(/\\\\vee/g, '\\vee');
  
  // Fix Greek letters
  fixed = fixed.replace(/\\\\alpha/g, '\\alpha');
  fixed = fixed.replace(/\\\\beta/g, '\\beta');
  fixed = fixed.replace(/\\\\gamma/g, '\\gamma');
  fixed = fixed.replace(/\\\\delta/g, '\\delta');
  fixed = fixed.replace(/\\\\theta/g, '\\theta');
  
  return fixed;
}

export function renderMathInElement(element: HTMLElement): void {
  if (!element || typeof window === 'undefined') return;
  
  // Fix any double-escaped content first
  const content = element.innerHTML;
  const fixedContent = fixDoubleEscapedMath(content);
  
  if (content !== fixedContent) {
    element.innerHTML = fixedContent;
  }
  
  // Use the global KaTeX renderer
  if (window.renderMathInElement && typeof window.renderMathInElement === 'function') {
    try {
      window.renderMathInElement(element);
    } catch (error) {
      console.error('KaTeX rendering failed:', error);
    }
  }
}

export function processContentForMathRendering(content: string): string {
  // Fix double-escaping issues and prepare content for KaTeX
  let processed = fixDoubleEscapedMath(content);
  
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