import React, { useEffect, useRef } from 'react';
import { MathJaxContext, MathJax } from 'better-react-mathjax';

interface MathContentProps {
  content: string;
  className?: string;
}

// MathJax configuration optimized for mathematical notation
const mathJaxConfig = {
  loader: { load: ['[tex]/ams', '[tex]/mathtools'] },
  tex: {
    inlineMath: [['$', '$'], ['\\(', '\\)']],
    displayMath: [['$$', '$$'], ['\\[', '\\]']],
    processEscapes: true,
    processEnvironments: true,
    packages: { '[+]': ['ams', 'mathtools'] },
    tags: 'none',
    macros: {
      "\\R": "\\mathbb{R}",
      "\\N": "\\mathbb{N}",
      "\\Z": "\\mathbb{Z}",
      "\\Q": "\\mathbb{Q}",
      "\\C": "\\mathbb{C}",
      "\\implies": "\\Rightarrow",
      "\\iff": "\\Leftrightarrow",
      "\\neg": "\\lnot",
      "\\vee": "\\lor",
      "\\wedge": "\\land",
      "\\leftrightarrow": "\\leftrightarrow",
      "\\rightarrow": "\\rightarrow"
    }
  },
  svg: {
    fontCache: 'global',
    displayAlign: 'center'
  },
  startup: {
    typeset: true
  }
};

export default function MathContent({ content, className = "" }: MathContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  // Pre-process content to ensure proper LaTeX formatting
  const processedContent = content
    // Ensure proper spacing around display math
    .replace(/\$\$([^$]+)\$\$/g, '\n\n$$$$1$$\n\n')
    // Ensure proper spacing around inline math
    .replace(/\$([^$]+)\$/g, ' $$$1$$ ')
    // Fix common LaTeX symbol issues
    .replace(/\\leftrightarrow/g, '\\leftrightarrow')
    .replace(/\\rightarrow/g, '\\rightarrow')
    .replace(/\\neg/g, '\\neg')
    .replace(/\\vee/g, '\\vee')
    .replace(/\\wedge/g, '\\wedge')
    .replace(/\\lor/g, '\\lor')
    .replace(/\\land/g, '\\land');

  useEffect(() => {
    // Force MathJax re-render when content changes
    if ((window as any).MathJax && contentRef.current) {
      setTimeout(() => {
        (window as any).MathJax.typesetPromise?.([contentRef.current]);
      }, 100);
    }
  }, [processedContent]);

  return (
    <MathJaxContext config={mathJaxConfig}>
      <div ref={contentRef} className={className}>
        <MathJax>
          <div dangerouslySetInnerHTML={{ __html: processedContent.replace(/\n/g, '<br/>') }} />
        </MathJax>
      </div>
    </MathJaxContext>
  );
}