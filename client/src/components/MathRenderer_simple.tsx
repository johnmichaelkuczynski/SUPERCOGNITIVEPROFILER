import React from 'react';
import { MathJax } from 'better-react-mathjax';
import MathGraph from './MathGraph';

interface MathRendererProps {
  content: string;
  className?: string;
}

// Process text and wrap mathematical expressions for proper MathJax rendering
function formatMathExpressions(text: string): string {
  let formatted = text;

  // Convert Unicode superscripts to LaTeX notation
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

  // Convert integral symbol
  formatted = formatted.replace(/∫/g, '\\int');
  
  // Convert π symbol
  formatted = formatted.replace(/π/g, '\\pi');

  // Wrap function definitions: f(x) = expression
  formatted = formatted.replace(/([a-zA-Z])\s*\(\s*([a-zA-Z])\s*\)\s*=\s*([^\n]+)/g, '\\[$1($2) = $3\\]');
  
  // Wrap standalone equations: y = expression
  formatted = formatted.replace(/^([a-zA-Z])\s*=\s*([^\n]+)$/gm, '\\[$1 = $2\\]');
  
  // Wrap expressions with LaTeX notation (containing ^ or \)
  formatted = formatted.replace(/([^\$\\\n]*[\^\\][^\$\\\n]*)/g, '\\($1\\)');
  
  // Wrap fractions: number/number
  formatted = formatted.replace(/(\d+)\/(\d+)/g, '\\(\\frac{$1}{$2}\\)');
  
  // Wrap mathematical functions
  formatted = formatted.replace(/(arctan|ln|Ei|sin|cos|tan)\s*\([^)]+\)/g, '\\($1\\)');

  return formatted;
}

// Extract zeros and function information from text
function extractMathInfo(text: string) {
  const zeros = [];
  const zeroMatches = text.match(/x\s*=\s*(-?\d+)/g);
  if (zeroMatches) {
    zeros.push(...zeroMatches.map(match => parseInt(match.replace(/x\s*=\s*/, ''))));
  }
  
  const functionMatch = text.match(/f\([^)]+\)\s*=\s*([^.\n]+)/);
  const functionExpression = functionMatch ? functionMatch[1].trim() : '';
  
  const hasGraph = text.toLowerCase().includes('graph') || text.toLowerCase().includes('zero') || zeros.length > 0;
  
  return { zeros, functionExpression, hasGraph };
}

export default function MathRenderer({ content, className = '' }: MathRendererProps) {
  const formattedContent = formatMathExpressions(content);
  const { zeros, functionExpression, hasGraph } = extractMathInfo(content);
  
  return (
    <div className={`math-renderer ${className}`}>
      <MathJax hideUntilTypeset="first">
        <div className="whitespace-pre-wrap leading-relaxed">
          {formattedContent}
        </div>
      </MathJax>
      
      {hasGraph && (functionExpression || zeros.length > 0) && (
        <div className="mt-4">
          <MathGraph 
            functionExpression={functionExpression}
            zeros={zeros}
            className="shadow-sm"
          />
        </div>
      )}
    </div>
  );
}