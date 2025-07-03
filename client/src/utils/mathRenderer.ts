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
  // Convert paragraph breaks to HTML - NO other processing
  return content
    .replace(/\n\n+/g, '</p><p>')
    .replace(/^(?!<p>)/, '<p>')
    .replace(/(?!<\/p>)$/, '</p>')
    .replace(/<p><\/p>/g, '')
    .replace(/\n/g, '<br>');
}