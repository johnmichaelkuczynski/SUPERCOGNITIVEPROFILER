// HTML Export Service for Perfect Mathematical Notation
export function generateMathHTML(results: any[], documentName: string): string {
  let htmlContent = '';
  
  results.forEach((result, index) => {
    const content = result.rewrittenContent || '';
    
    // Process mathematical notation for HTML display
    const processedContent = processMathForHTML(content);
    
    htmlContent += `
      <div class="section">
        <h2>Section ${index + 1}: ${result.originalChunk.title || `Part ${index + 1}`}</h2>
        <div class="content">${processedContent}</div>
      </div>
    `;
  });
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${documentName} - Mathematical Document</title>
    <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
    <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
    <script>
        window.MathJax = {
            tex: {
                inlineMath: [['$', '$']],
                displayMath: [['$$', '$$']],
                processEscapes: true,
                processEnvironments: true
            },
            options: {
                skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre']
            }
        };
    </script>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            line-height: 1.6;
            max-width: 8.5in;
            margin: 0 auto;
            padding: 1in;
            color: #333;
            background: white;
        }
        
        .section {
            margin-bottom: 2em;
            page-break-inside: avoid;
        }
        
        .section h2 {
            color: #2c3e50;
            border-bottom: 2px solid #3498db;
            padding-bottom: 0.5em;
            margin-bottom: 1em;
            font-size: 1.4em;
        }
        
        .content {
            text-align: justify;
            font-size: 12pt;
            line-height: 1.8;
        }
        
        .content p {
            margin-bottom: 1em;
        }
        
        /* Mathematical expression styling */
        .MathJax {
            font-size: 1.1em !important;
        }
        
        mjx-container[jax="CHTML"] {
            line-height: 1.2;
        }
        
        /* Print optimization */
        @media print {
            body {
                margin: 0;
                padding: 0.5in;
                font-size: 11pt;
            }
            
            .section {
                margin-bottom: 1.5em;
            }
            
            .section h2 {
                font-size: 1.2em;
                color: black;
                border-bottom: 1px solid black;
            }
            
            .no-print {
                display: none;
            }
        }
        
        /* Print button styling */
        .print-controls {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #3498db;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            z-index: 1000;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        }
        
        .print-controls:hover {
            background: #2980b9;
        }
        
        .instructions {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 5px;
            padding: 15px;
            margin-bottom: 20px;
            font-size: 14px;
        }
        
        .instructions h3 {
            margin-top: 0;
            color: #495057;
        }
    </style>
</head>
<body>
    <div class="print-controls no-print" onclick="window.print()">
        🖨️ Print to PDF
    </div>
    
    <div class="instructions no-print">
        <h3>📄 Perfect Mathematical PDF Export</h3>
        <p><strong>Instructions:</strong></p>
        <ol>
            <li>Click the <strong>"Print to PDF"</strong> button above (or use Ctrl+P / Cmd+P)</li>
            <li>In the print dialog, select <strong>"Save as PDF"</strong> as the destination</li>
            <li>Choose <strong>"More settings"</strong> and ensure margins are set to "Minimum"</li>
            <li>Click <strong>"Save"</strong> to download your perfectly formatted mathematical document</li>
        </ol>
        <p><em>✨ All mathematical notation will render perfectly in the final PDF!</em></p>
    </div>
    
    <h1>${documentName}</h1>
    
    ${htmlContent}
    
    <script>
        // Ensure MathJax is fully loaded before allowing print
        document.addEventListener('DOMContentLoaded', function() {
            if (window.MathJax) {
                MathJax.startup.promise.then(() => {
                    console.log('MathJax fully loaded - document ready for printing');
                    document.body.classList.add('mathjax-ready');
                });
            }
        });
        
        // Optimize print handling
        window.addEventListener('beforeprint', function() {
            if (window.MathJax) {
                MathJax.typesetPromise().then(() => {
                    console.log('MathJax rendering complete for print');
                });
            }
        });
    </script>
</body>
</html>`;
}

function processMathForHTML(text: string): string {
  let processed = text;
  
  // Convert paragraphs to proper HTML
  processed = processed.replace(/\n\n/g, '</p><p>');
  processed = `<p>${processed}</p>`;
  
  // Direct string replacements for all mathematical Unicode symbols
  // Logic symbols
  processed = processed.replace(/¬/g, '$\\neg$');
  processed = processed.replace(/∧/g, '$\\wedge$');
  processed = processed.replace(/∨/g, '$\\vee$');
  processed = processed.replace(/→/g, '$\\rightarrow$');
  processed = processed.replace(/↔/g, '$\\leftrightarrow$');
  
  // Quantifiers
  processed = processed.replace(/∀/g, '$\\forall$');
  processed = processed.replace(/∃/g, '$\\exists$');
  
  // Set theory
  processed = processed.replace(/∈/g, '$\\in$');
  processed = processed.replace(/∉/g, '$\\notin$');
  processed = processed.replace(/⊂/g, '$\\subset$');
  processed = processed.replace(/⊃/g, '$\\supset$');
  processed = processed.replace(/⊆/g, '$\\subseteq$');
  processed = processed.replace(/⊇/g, '$\\supseteq$');
  processed = processed.replace(/∪/g, '$\\cup$');
  processed = processed.replace(/∩/g, '$\\cap$');
  processed = processed.replace(/∅/g, '$\\emptyset$');
  
  // Relations and operators
  processed = processed.replace(/≤/g, '$\\leq$');
  processed = processed.replace(/≥/g, '$\\geq$');
  processed = processed.replace(/≠/g, '$\\neq$');
  processed = processed.replace(/≈/g, '$\\approx$');
  processed = processed.replace(/≡/g, '$\\equiv$');
  processed = processed.replace(/∝/g, '$\\propto$');
  processed = processed.replace(/∞/g, '$\\infty$');
  
  // Greek letters
  processed = processed.replace(/α/g, '$\\alpha$');
  processed = processed.replace(/β/g, '$\\beta$');
  processed = processed.replace(/γ/g, '$\\gamma$');
  processed = processed.replace(/δ/g, '$\\delta$');
  processed = processed.replace(/ε/g, '$\\epsilon$');
  processed = processed.replace(/ζ/g, '$\\zeta$');
  processed = processed.replace(/η/g, '$\\eta$');
  processed = processed.replace(/θ/g, '$\\theta$');
  processed = processed.replace(/ι/g, '$\\iota$');
  processed = processed.replace(/κ/g, '$\\kappa$');
  processed = processed.replace(/λ/g, '$\\lambda$');
  processed = processed.replace(/μ/g, '$\\mu$');
  processed = processed.replace(/ν/g, '$\\nu$');
  processed = processed.replace(/ξ/g, '$\\xi$');
  processed = processed.replace(/π/g, '$\\pi$');
  processed = processed.replace(/ρ/g, '$\\rho$');
  processed = processed.replace(/σ/g, '$\\sigma$');
  processed = processed.replace(/τ/g, '$\\tau$');
  processed = processed.replace(/υ/g, '$\\upsilon$');
  processed = processed.replace(/φ/g, '$\\phi$');
  processed = processed.replace(/χ/g, '$\\chi$');
  processed = processed.replace(/ψ/g, '$\\psi$');
  processed = processed.replace(/ω/g, '$\\omega$');
  
  // Mathematical symbols
  processed = processed.replace(/±/g, '$\\pm$');
  processed = processed.replace(/∓/g, '$\\mp$');
  processed = processed.replace(/×/g, '$\\times$');
  processed = processed.replace(/÷/g, '$\\div$');
  processed = processed.replace(/∫/g, '$\\int$');
  processed = processed.replace(/∮/g, '$\\oint$');
  processed = processed.replace(/∑/g, '$\\sum$');
  processed = processed.replace(/∏/g, '$\\prod$');
  processed = processed.replace(/∂/g, '$\\partial$');
  processed = processed.replace(/∇/g, '$\\nabla$');
  
  // Handle specific patterns
  
  // Complex number notation
  processed = processed.replace(/i\^2\s*=\s*-1/g, '$i^2 = -1$');
  processed = processed.replace(/z\s*=\s*a\s*\+\s*bi/g, '$z = a + bi$');
  
  // Matrix patterns like (a b; c d)
  processed = processed.replace(/\(\s*([a-z])\s+([a-z])\s*;\s*([a-z])\s+([a-z])\s*\)/g, 
    '$$\\begin{pmatrix} $1 & $2 \\\\ $3 & $4 \\end{pmatrix}$$');
  
  // Fractions
  processed = processed.replace(/([0-9]+)\/([0-9]+)/g, '$\\frac{$1}{$2}$');
  
  // Square roots with parentheses
  processed = processed.replace(/√\(([^)]+)\)/g, '$\\sqrt{$1}$');
  
  // Superscripts - handle after specific expressions
  processed = processed.replace(/(?<!\$[^$]*)\b([a-zA-Z])\^([0-9]+)(?![^$]*\$)/g, '$$1^{$2}$');
  
  return processed;
}