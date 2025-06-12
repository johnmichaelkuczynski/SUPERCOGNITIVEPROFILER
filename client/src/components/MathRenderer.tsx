import React from 'react';
import 'katex/dist/katex.min.css';
import katex from 'katex';

interface MathRendererProps {
  content: string;
  className?: string;
}

export function MathRenderer({ content, className = '' }: MathRendererProps) {
  const renderMath = (text: string) => {
    // Handle display math ($$...$$)
    text = text.replace(/\$\$([^$]+)\$\$/g, (match, math) => {
      try {
        return katex.renderToString(math, { displayMode: true });
      } catch (error) {
        console.warn('KaTeX display math error:', error);
        return match;
      }
    });

    // Handle inline math ($...$)
    text = text.replace(/\$([^$]+)\$/g, (match, math) => {
      try {
        return katex.renderToString(math, { displayMode: false });
      } catch (error) {
        console.warn('KaTeX inline math error:', error);
        return match;
      }
    });

    // Handle LaTeX display environments
    text = text.replace(/\\begin\{(array|matrix|pmatrix|bmatrix|vmatrix|Vmatrix)\}([\s\S]*?)\\end\{\1\}/g, (match, env, content) => {
      try {
        return katex.renderToString(`\\begin{${env}}${content}\\end{${env}}`, { displayMode: true });
      } catch (error) {
        console.warn('KaTeX environment error:', error);
        return match;
      }
    });

    // Handle \[ \] display math
    text = text.replace(/\\\[([\s\S]*?)\\\]/g, (match, math) => {
      try {
        return katex.renderToString(math, { displayMode: true });
      } catch (error) {
        console.warn('KaTeX bracket math error:', error);
        return match;
      }
    });

    // Handle \( \) inline math
    text = text.replace(/\\\(([\s\S]*?)\\\)/g, (match, math) => {
      try {
        return katex.renderToString(math, { displayMode: false });
      } catch (error) {
        console.warn('KaTeX paren math error:', error);
        return match;
      }
    });

    return text;
  };

  const renderedContent = renderMath(content);

  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: renderedContent }}
    />
  );
}

export default MathRenderer;