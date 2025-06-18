import React from 'react';
import { MathJax } from 'better-react-mathjax';

interface MathRendererProps {
  content: string;
  className?: string;
}

// Simple function to convert Unicode superscripts to LaTeX
function formatMathExpressions(text: string): string {
  let formatted = text;

  // Convert Unicode superscripts to LaTeX
  formatted = formatted.replace(/([a-zA-Z0-9)]+)([²³⁴⁵⁶⁷⁸⁹⁰¹]+)/g, (match: string, base: string, sups: string) => {
    const superscriptMap: { [key: string]: string } = {
      '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', 
      '⁷': '7', '⁸': '8', '⁹': '9', '⁰': '0', '¹': '1'
    };
    let converted = base;
    for (const sup of sups) {
      if (superscriptMap[sup]) {
        converted += `^{${superscriptMap[sup]}}`;
      }
    }
    return converted;
  });

  // Wrap mathematical expressions in $ delimiters
  // Function definitions: f(x) = expression
  formatted = formatted.replace(/([a-zA-Z])\s*\(\s*([a-zA-Z])\s*\)\s*=\s*([^\n]+)/g, '$$$1($2) = $3$$');
  
  // Simple equations: y = expression
  formatted = formatted.replace(/^([a-zA-Z])\s*=\s*([^\n]+)$/gm, '$$1 = $2$');

  return formatted;
}

export default function MathRenderer({ content, className = '' }: MathRendererProps) {
  const formattedContent = formatMathExpressions(content);
  
  return (
    <div className={`math-renderer ${className}`}>
      <MathJax hideUntilTypeset="first">
        <div className="whitespace-pre-wrap">
          {formattedContent}
        </div>
      </MathJax>
    </div>
  );
}