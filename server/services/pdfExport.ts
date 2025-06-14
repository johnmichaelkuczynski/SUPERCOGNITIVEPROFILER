import PDFDocument from 'pdfkit';

// Standalone PDF generation service for mathematical notation export
export class PDFExportService {
  
  // Create PDF buffer from content with mathematical notation
  async createPDFFromContent(content: string): Promise<Buffer> {
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Process mathematical notation
      const processedContent = this.processMathNotation(content);
      
      // Add content to PDF with proper formatting
      doc.fontSize(12);
      doc.text(processedContent, {
        width: 500,
        align: 'left'
      });

      doc.end();
    });
  }

  // Convert LaTeX/math notation to Unicode symbols
  private processMathNotation(text: string): string {
    const mathSymbols: { [key: string]: string } = {
      // Logic symbols
      '\\forall': '∀',
      '\\exists': '∃',
      '\\land': '∧',
      '\\lor': '∨',
      '\\to': '→',
      '\\rightarrow': '→',
      '\\leftrightarrow': '↔',
      '\\neg': '¬',
      '\\lnot': '¬',
      
      // Set theory
      '\\in': '∈',
      '\\notin': '∉',
      '\\subset': '⊂',
      '\\subseteq': '⊆',
      '\\supset': '⊃',
      '\\supseteq': '⊇',
      '\\cup': '∪',
      '\\cap': '∩',
      '\\emptyset': '∅',
      '\\varnothing': '∅',
      
      // Relations
      '\\leq': '≤',
      '\\geq': '≥',
      '\\neq': '≠',
      '\\approx': '≈',
      '\\equiv': '≡',
      '\\sim': '∼',
      '\\simeq': '≃',
      
      // Greek letters
      '\\alpha': 'α',
      '\\beta': 'β',
      '\\gamma': 'γ',
      '\\delta': 'δ',
      '\\epsilon': 'ε',
      '\\zeta': 'ζ',
      '\\eta': 'η',
      '\\theta': 'θ',
      '\\lambda': 'λ',
      '\\mu': 'μ',
      '\\nu': 'ν',
      '\\xi': 'ξ',
      '\\pi': 'π',
      '\\rho': 'ρ',
      '\\sigma': 'σ',
      '\\tau': 'τ',
      '\\phi': 'φ',
      '\\chi': 'χ',
      '\\psi': 'ψ',
      '\\omega': 'ω',
      
      // Calculus
      '\\int': '∫',
      '\\sum': '∑',
      '\\prod': '∏',
      '\\infty': '∞',
      '\\partial': '∂',
      '\\nabla': '∇',
      
      // Others
      '\\pm': '±',
      '\\mp': '∓',
      '\\times': '×',
      '\\div': '÷',
      '\\cdot': '·',
      '\\sqrt': '√',
      '\\propto': '∝',
      '\\therefore': '∴',
      '\\because': '∵'
    };

    let processed = text;
    
    // Replace LaTeX commands with Unicode symbols
    for (const [latex, unicode] of Object.entries(mathSymbols)) {
      const regex = new RegExp(latex.replace(/\\/g, '\\\\'), 'g');
      processed = processed.replace(regex, unicode);
    }
    
    // Handle subscripts and superscripts
    processed = this.convertSubscriptsSuperscripts(processed);
    
    // Clean up any remaining LaTeX artifacts
    processed = processed.replace(/\$([^$]+)\$/g, '$1'); // Remove $ delimiters
    processed = processed.replace(/\\([a-zA-Z]+)/g, '$1'); // Remove remaining backslashes
    
    return processed;
  }

  // Convert subscripts and superscripts to Unicode
  private convertSubscriptsSuperscripts(text: string): string {
    const subscripts: { [key: string]: string } = {
      '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
      '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
      'a': 'ₐ', 'e': 'ₑ', 'i': 'ᵢ', 'o': 'ₒ', 'u': 'ᵤ',
      'x': 'ₓ', 'n': 'ₙ'
    };

    const superscripts: { [key: string]: string } = {
      '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
      '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
      'a': 'ᵃ', 'b': 'ᵇ', 'c': 'ᶜ', 'd': 'ᵈ', 'e': 'ᵉ',
      'f': 'ᶠ', 'g': 'ᵍ', 'h': 'ʰ', 'i': 'ⁱ', 'j': 'ʲ',
      'k': 'ᵏ', 'l': 'ˡ', 'm': 'ᵐ', 'n': 'ⁿ', 'o': 'ᵒ',
      'p': 'ᵖ', 'r': 'ʳ', 's': 'ˢ', 't': 'ᵗ', 'u': 'ᵘ',
      'v': 'ᵛ', 'w': 'ʷ', 'x': 'ˣ', 'y': 'ʸ', 'z': 'ᶻ',
      '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾'
    };

    // Convert subscripts _{...}
    text = text.replace(/_\{([^}]+)\}/g, (_, content) => {
      return content.split('').map((char: string) => subscripts[char] || char).join('');
    });

    // Convert superscripts ^{...}
    text = text.replace(/\^\{([^}]+)\}/g, (_, content) => {
      return content.split('').map((char: string) => superscripts[char] || char).join('');
    });

    // Convert simple subscripts _x
    text = text.replace(/_([a-zA-Z0-9])/g, (_, char) => subscripts[char] || char);

    // Convert simple superscripts ^x
    text = text.replace(/\^([a-zA-Z0-9])/g, (_, char) => superscripts[char] || char);

    return text;
  }

  // Generate downloadable PDF
  async generatePDF(content: string, filename: string = 'document'): Promise<Buffer> {
    return await this.createPDFFromContent(content);
  }
}

export const pdfExportService = new PDFExportService();