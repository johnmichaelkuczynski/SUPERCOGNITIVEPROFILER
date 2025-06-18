import React, { useEffect, useRef } from 'react';
import { MathJax } from 'better-react-mathjax';
import GraphGenerator from './GraphGenerator';

interface MathContent {
  type: 'text' | 'math' | 'graph';
  content: string;
  graphData?: any;
}

interface MathRendererProps {
  content: string;
  className?: string;
}

// Automatically format mathematical expressions in text
function autoFormatMath(text: string): string {
  let formatted = text;

  // Convert superscripts (x², x³, etc.)
  formatted = formatted.replace(/([a-zA-Z0-9)])\s*([²³⁴⁵⁶⁷⁸⁹⁰¹])/g, (match, base, sup) => {
    const superscripts: { [key: string]: string } = {
      '²': '^2', '³': '^3', '⁴': '^4', '⁵': '^5', '⁶': '^6', 
      '⁷': '^7', '⁸': '^8', '⁹': '^9', '⁰': '^0', '¹': '^1'
    };
    return `$${base}${superscripts[sup]}$`;
  });

  // Convert function notation: f(x) = expression
  formatted = formatted.replace(/([a-zA-Z])\s*\(\s*([a-zA-Z])\s*\)\s*=\s*([^.!?\n]+)/g, (match, func, variable, expr) => {
    return `$${func}(${variable}) = ${expr.trim()}$`;
  });

  // Convert standalone equations: x = expression (with numbers/operators)
  formatted = formatted.replace(/\b([a-zA-Z])\s*=\s*([^.!?\n]+)/g, (match, variable, expression) => {
    if (/[\d\+\-\*\/\^\(\)x]/.test(expression)) {
      return `$${variable} = ${expression.trim()}$`;
    }
    return match;
  });

  // Convert fractions: a/b format (numbers only)
  formatted = formatted.replace(/\b(\d+)\s*\/\s*(\d+)\b/g, '$\\frac{$1}{$2}$');

  // Convert intervals: [a, b), (a, b], [a, b], (a, b)
  formatted = formatted.replace(/[\[\(]\s*([0-9\-]+)\s*,\s*([0-9\-]+)\s*[\]\)]/g, (match) => {
    return `$${match}$`;
  });

  // Convert inequalities
  formatted = formatted.replace(/([a-zA-Z0-9\(\)]+)\s*([<>≤≥]|<=|>=)\s*([a-zA-Z0-9\(\)]+)/g, '$$$1 $2 $3$$');

  // Convert Greek letters
  const greekLetters: { [key: string]: string } = {
    'α': '\\alpha', 'β': '\\beta', 'γ': '\\gamma', 'δ': '\\delta',
    'π': '\\pi', 'θ': '\\theta', 'λ': '\\lambda', 'μ': '\\mu',
    'σ': '\\sigma', 'φ': '\\phi', 'ω': '\\omega'
  };

  Object.entries(greekLetters).forEach(([greek, latex]) => {
    formatted = formatted.replace(new RegExp(greek, 'g'), `$${latex}$`);
  });

  // Convert mathematical symbols
  formatted = formatted.replace(/±/g, '$\\pm$');
  formatted = formatted.replace(/∞/g, '$\\infty$');
  formatted = formatted.replace(/≠/g, '$\\neq$');
  formatted = formatted.replace(/≤/g, '$\\leq$');
  formatted = formatted.replace(/≥/g, '$\\geq$');
  formatted = formatted.replace(/√/g, '$\\sqrt{}$');

  // Clean up double dollar signs
  formatted = formatted.replace(/\$\$+/g, '$$');
  formatted = formatted.replace(/\$\s*\$/g, '');

  return formatted;
}

// Parse content to identify math expressions and graph requests
function parseContentWithMath(content: string): MathContent[] {
  const parts: MathContent[] = [];
  let currentIndex = 0;
  
  // First, auto-format mathematical expressions
  const autoFormatted = autoFormatMath(content);
  
  // Regex patterns for different math notations
  const patterns = [
    // LaTeX display math: \[ ... \] or $$ ... $$
    /\\\[(.*?)\\\]|\$\$(.*?)\$\$/g,
    // LaTeX inline math: \( ... \) or $ ... $
    /\\\((.*?)\\\)|\$([^$\n]+)\$/g,
    // Graph markers: [GRAPH_n] or [GRAPH:description]
    /\[GRAPH_(\d+)\]|\[GRAPH:([^\]]+)\]/g
  ];

  // Split content by math expressions
  const mathMatches: Array<{ match: RegExpMatchArray; type: 'display' | 'inline' | 'graph' }> = [];
  
  // Find all math expressions
  patterns.forEach((pattern, patternIndex) => {
    let match;
    const tempPattern = new RegExp(pattern.source, pattern.flags);
    while ((match = tempPattern.exec(autoFormatted)) !== null) {
      const type = patternIndex === 0 ? 'display' : 
                   patternIndex === 1 ? 'inline' : 'graph';
      mathMatches.push({ match, type });
    }
  });

  // Sort matches by position
  mathMatches.sort((a, b) => a.match.index! - b.match.index!);

  // Process content with math expressions
  mathMatches.forEach((mathMatch, index) => {
    const { match, type } = mathMatch;
    const start = match.index!;
    const end = start + match[0].length;

    // Add text before this match
    if (start > currentIndex) {
      const textContent = autoFormatted.substring(currentIndex, start);
      if (textContent.trim()) {
        parts.push({ type: 'text', content: textContent });
      }
    }

    // Add the math/graph content
    if (type === 'graph') {
      const graphIndex = match[1] ? parseInt(match[1]) : 0;
      const graphDesc = match[2] || `Graph ${graphIndex}`;
      parts.push({ 
        type: 'graph', 
        content: graphDesc,
        graphData: generateSampleGraphData(graphDesc, graphIndex)
      });
    } else {
      // Math expression
      const mathContent = match[1] || match[2] || match[0];
      const displayStyle = type === 'display';
      parts.push({ 
        type: 'math', 
        content: displayStyle ? `\\[${mathContent}\\]` : `\\(${mathContent}\\)`
      });
    }

    currentIndex = end;
  });

  // Add remaining text
  if (currentIndex < autoFormatted.length) {
    const remainingText = autoFormatted.substring(currentIndex);
    if (remainingText.trim()) {
      parts.push({ type: 'text', content: remainingText });
    }
  }

  // If no math was found, return the auto-formatted content as text
  if (parts.length === 0) {
    parts.push({ type: 'text', content: autoFormatted });
  }

  return parts;
}

// Generate sample graph data based on description
function generateSampleGraphData(description: string, index: number) {
  const desc = description.toLowerCase();
  
  if (desc.includes('quadratic') || desc.includes('parabola') || desc.includes('x^2')) {
    return {
      type: 'function',
      title: 'Quadratic Function',
      xLabel: 'x',
      yLabel: 'f(x)',
      data: Array.from({ length: 21 }, (_, i) => {
        const x = i - 10;
        return { x, y: x * x };
      }),
      equation: 'f(x) = x²',
      color: '#dc2626'
    };
  }
  
  if (desc.includes('cubic') || desc.includes('x^3')) {
    return {
      type: 'function',
      title: 'Cubic Function',
      xLabel: 'x',
      yLabel: 'f(x)',
      data: Array.from({ length: 21 }, (_, i) => {
        const x = (i - 10) * 0.5;
        return { x, y: x * x * x };
      }),
      equation: 'f(x) = x³',
      color: '#2563eb'
    };
  }
  
  if (desc.includes('sin') || desc.includes('sine')) {
    return {
      type: 'function',
      title: 'Sine Function',
      xLabel: 'x (radians)',
      yLabel: 'sin(x)',
      data: Array.from({ length: 100 }, (_, i) => {
        const x = (i - 50) * 0.2;
        return { x, y: Math.sin(x) };
      }),
      equation: 'f(x) = sin(x)',
      color: '#059669'
    };
  }
  
  if (desc.includes('exp') || desc.includes('exponential')) {
    return {
      type: 'function',
      title: 'Exponential Function',
      xLabel: 'x',
      yLabel: 'eˣ',
      data: Array.from({ length: 31 }, (_, i) => {
        const x = (i - 15) * 0.2;
        return { x, y: Math.exp(x) };
      }),
      equation: 'f(x) = eˣ',
      color: '#7c3aed'
    };
  }
  
  if (desc.includes('supply') && desc.includes('demand')) {
    return {
      type: 'line',
      title: 'Supply and Demand',
      xLabel: 'Quantity',
      yLabel: 'Price',
      data: [
        { x: 0, y: 1 }, { x: 5, y: 3 }, { x: 10, y: 5 }, { x: 15, y: 7 }, { x: 20, y: 9 }, // Supply
        { x: 0, y: 9 }, { x: 5, y: 7 }, { x: 10, y: 5 }, { x: 15, y: 3 }, { x: 20, y: 1 }  // Demand
      ],
      color: '#ea580c'
    };
  }
  
  if (desc.includes('inflation') || desc.includes('economic')) {
    return {
      type: 'line',
      title: 'Economic Trend',
      xLabel: 'Year',
      yLabel: 'Rate (%)',
      data: [
        { x: 2020, y: 1.2 },
        { x: 2021, y: 4.7 },
        { x: 2022, y: 8.0 },
        { x: 2023, y: 3.2 },
        { x: 2024, y: 2.8 }
      ],
      color: '#dc2626'
    };
  }
  
  // Default: simple linear function
  return {
    type: 'line',
    title: `Function Graph ${index + 1}`,
    xLabel: 'x',
    yLabel: 'y',
    data: Array.from({ length: 11 }, (_, i) => {
      const x = i - 5;
      return { x, y: x * 2 + 1 };
    }),
    equation: 'y = 2x + 1',
    color: '#6366f1'
  };
}

export default function MathRenderer({ content, className = '' }: MathRendererProps) {
  const parsedContent = parseContentWithMath(content);

  return (
    <div className={`math-renderer ${className}`}>
      {parsedContent.map((part, index) => {
        switch (part.type) {
          case 'math':
            return (
              <MathJax key={index} className="my-2">
                {part.content}
              </MathJax>
            );
          
          case 'graph':
            return part.graphData ? (
              <div key={index} className="my-4 flex justify-center">
                <GraphGenerator 
                  graphData={part.graphData}
                  className="shadow-lg"
                />
              </div>
            ) : null;
          
          case 'text':
          default:
            return (
              <div key={index} className="prose max-w-none">
                {part.content.split('\n\n').map((paragraph, pIndex) => (
                  <p key={pIndex} className="mb-4 leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
            );
        }
      })}
    </div>
  );
}