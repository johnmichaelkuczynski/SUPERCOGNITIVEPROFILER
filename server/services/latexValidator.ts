// LaTeX Validation and Error Handling Service
export interface LaTeXValidationResult {
  isValid: boolean;
  originalText: string;
  processedText: string;
  errors: LaTeXError[];
  warnings: string[];
  hasUnsafeContent: boolean;
}

export interface LaTeXError {
  type: 'syntax' | 'missing_arg' | 'invalid_command' | 'unclosed_brace' | 'malformed_subscript' | 'malformed_superscript';
  message: string;
  position: number;
  context: string;
  suggestion?: string;
}

export class LaTeXValidator {
  
  // Common LaTeX syntax patterns that cause MathJax failures
  private static readonly DANGEROUS_PATTERNS = [
    // Missing subscript/superscript arguments
    { pattern: /\^(?![{0-9a-zA-Z])/g, type: 'malformed_superscript' as const, message: 'Missing superscript argument after ^' },
    { pattern: /_(?![{0-9a-zA-Z])/g, type: 'malformed_subscript' as const, message: 'Missing subscript argument after _' },
    
    // Unclosed braces
    { pattern: /\{[^}]*$/g, type: 'unclosed_brace' as const, message: 'Unclosed opening brace {' },
    { pattern: /^[^{]*\}/g, type: 'unclosed_brace' as const, message: 'Closing brace } without opening brace' },
    
    // Invalid command patterns
    { pattern: /\\[a-zA-Z]+[0-9]/g, type: 'invalid_command' as const, message: 'Invalid LaTeX command with number directly attached' },
    { pattern: /\\(?![a-zA-Z])/g, type: 'syntax' as const, message: 'Invalid backslash usage' },
    
    // Malformed function calls
    { pattern: /\\[a-zA-Z]+\([^)]*$/g, type: 'syntax' as const, message: 'Unclosed parentheses in function call' },
  ];

  // Safe LaTeX commands that are allowed
  private static readonly SAFE_COMMANDS = new Set([
    'alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta', 'iota', 'kappa',
    'lambda', 'mu', 'nu', 'xi', 'pi', 'rho', 'sigma', 'tau', 'upsilon', 'phi', 'chi', 'psi', 'omega',
    'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Iota', 'Kappa',
    'Lambda', 'Mu', 'Nu', 'Xi', 'Pi', 'Rho', 'Sigma', 'Tau', 'Upsilon', 'Phi', 'Chi', 'Psi', 'Omega',
    'neg', 'wedge', 'vee', 'rightarrow', 'leftarrow', 'leftrightarrow', 'forall', 'exists',
    'in', 'notin', 'subset', 'supset', 'subseteq', 'supseteq', 'cup', 'cap', 'emptyset',
    'leq', 'geq', 'neq', 'approx', 'equiv', 'propto', 'infty', 'pm', 'mp', 'times', 'div',
    'int', 'oint', 'sum', 'prod', 'partial', 'nabla', 'sqrt', 'frac', 'begin', 'end',
    'pmatrix', 'bmatrix', 'vmatrix', 'left', 'right', 'langle', 'rangle'
  ]);

  /**
   * Validate and sanitize LaTeX content
   */
  static validateLatex(content: string): LaTeXValidationResult {
    const result: LaTeXValidationResult = {
      isValid: true,
      originalText: content,
      processedText: content,
      errors: [],
      warnings: [],
      hasUnsafeContent: false
    };

    // Step 1: Check for dangerous patterns
    for (const pattern of this.DANGEROUS_PATTERNS) {
      const matches = Array.from(content.matchAll(pattern.pattern));
      for (const match of matches) {
        const error: LaTeXError = {
          type: pattern.type,
          message: pattern.message,
          position: match.index || 0,
          context: this.getContext(content, match.index || 0),
          suggestion: this.getSuggestion(pattern.type, match[0])
        };
        result.errors.push(error);
        result.isValid = false;
      }
    }

    // Step 2: Validate LaTeX commands
    const commandMatches = Array.from(content.matchAll(/\\([a-zA-Z]+)/g));
    for (const match of commandMatches) {
      const command = match[1];
      if (!this.SAFE_COMMANDS.has(command)) {
        result.warnings.push(`Unknown LaTeX command: \\${command}`);
      }
    }

    // Step 3: Check brace balance
    const braceBalance = this.checkBraceBalance(content);
    if (!braceBalance.isBalanced) {
      result.errors.push({
        type: 'unclosed_brace',
        message: `Unbalanced braces: ${braceBalance.message}`,
        position: braceBalance.position,
        context: this.getContext(content, braceBalance.position)
      });
      result.isValid = false;
    }

    // Step 4: Sanitize if errors found
    if (!result.isValid) {
      result.processedText = this.sanitizeLatex(content, result.errors);
    }

    return result;
  }

  /**
   * Sanitize LaTeX content by fixing common errors
   */
  private static sanitizeLatex(content: string, errors: LaTeXError[]): string {
    let sanitized = content;

    // Fix missing subscript/superscript arguments
    sanitized = sanitized.replace(/\^(?![{0-9a-zA-Z])/g, '^{}');
    sanitized = sanitized.replace(/_(?![{0-9a-zA-Z])/g, '_{}');

    // Fix commands with numbers directly attached (e.g., \phi1 -> \phi_1)
    sanitized = sanitized.replace(/\\([a-zA-Z]+)([0-9]+)/g, '\\$1_{$2}');

    // Remove isolated backslashes
    sanitized = sanitized.replace(/\\(?![a-zA-Z{}_^])/g, '');

    // Fix simple brace imbalances by removing unclosed braces
    sanitized = this.fixBraceImbalance(sanitized);

    return sanitized;
  }

  /**
   * Check if braces are balanced
   */
  private static checkBraceBalance(content: string): { isBalanced: boolean; message: string; position: number } {
    let braceCount = 0;
    let position = 0;

    for (let i = 0; i < content.length; i++) {
      if (content[i] === '{') {
        braceCount++;
      } else if (content[i] === '}') {
        braceCount--;
        if (braceCount < 0) {
          return {
            isBalanced: false,
            message: 'Closing brace without opening brace',
            position: i
          };
        }
      }
    }

    if (braceCount > 0) {
      return {
        isBalanced: false,
        message: `${braceCount} unclosed opening brace(s)`,
        position: content.lastIndexOf('{')
      };
    }

    return { isBalanced: true, message: '', position: 0 };
  }

  /**
   * Fix brace imbalances
   */
  private static fixBraceImbalance(content: string): string {
    let fixed = content;
    let braceCount = 0;

    // First pass: close unclosed braces
    for (let i = 0; i < fixed.length; i++) {
      if (fixed[i] === '{') {
        braceCount++;
      } else if (fixed[i] === '}') {
        braceCount--;
      }
    }

    // Add missing closing braces
    if (braceCount > 0) {
      fixed += '}'.repeat(braceCount);
    }

    // Second pass: remove extra closing braces
    braceCount = 0;
    let result = '';
    for (let i = 0; i < fixed.length; i++) {
      if (fixed[i] === '{') {
        braceCount++;
        result += fixed[i];
      } else if (fixed[i] === '}') {
        if (braceCount > 0) {
          braceCount--;
          result += fixed[i];
        }
        // Skip extra closing braces
      } else {
        result += fixed[i];
      }
    }

    return result;
  }

  /**
   * Get context around an error position
   */
  private static getContext(content: string, position: number, radius: number = 20): string {
    const start = Math.max(0, position - radius);
    const end = Math.min(content.length, position + radius);
    const before = content.substring(start, position);
    const after = content.substring(position, end);
    return `...${before}[ERROR HERE]${after}...`;
  }

  /**
   * Get suggestion for fixing an error
   */
  private static getSuggestion(errorType: LaTeXError['type'], errorText: string): string {
    switch (errorType) {
      case 'malformed_superscript':
        return 'Add argument: ^ → ^{} or ^{text}';
      case 'malformed_subscript':
        return 'Add argument: _ → _{} or _{text}';
      case 'invalid_command':
        if (errorText.match(/\\[a-zA-Z]+[0-9]/)) {
          return `Change ${errorText} to ${errorText.replace(/([a-zA-Z]+)([0-9]+)/, '$1_{$2}')}`;
        }
        return 'Use valid LaTeX command syntax';
      case 'unclosed_brace':
        return 'Add missing closing brace }';
      default:
        return 'Check LaTeX syntax';
    }
  }

  /**
   * Validate a complete document with multiple mathematical expressions
   */
  static validateDocument(content: string): {
    isValid: boolean;
    processedContent: string;
    totalErrors: number;
    totalWarnings: number;
    chunkResults: Array<{ chunk: string; result: LaTeXValidationResult }>;
  } {
    // Split content into chunks that might contain math
    const mathChunks = this.extractMathChunks(content);
    const chunkResults: Array<{ chunk: string; result: LaTeXValidationResult }> = [];
    let processedContent = content;
    let totalErrors = 0;
    let totalWarnings = 0;
    let isValid = true;

    for (const chunk of mathChunks) {
      const result = this.validateLatex(chunk.content);
      chunkResults.push({ chunk: chunk.content, result });
      
      totalErrors += result.errors.length;
      totalWarnings += result.warnings.length;
      
      if (!result.isValid) {
        isValid = false;
        // Replace problematic chunk with sanitized version
        processedContent = processedContent.replace(chunk.content, result.processedText);
      }
    }

    return {
      isValid,
      processedContent,
      totalErrors,
      totalWarnings,
      chunkResults
    };
  }

  /**
   * Extract mathematical chunks from content
   */
  private static extractMathChunks(content: string): Array<{ content: string; start: number; end: number }> {
    const chunks: Array<{ content: string; start: number; end: number }> = [];
    
    // Find inline math: $...$
    const inlineMathRegex = /\$([^$]+)\$/g;
    let match;
    while ((match = inlineMathRegex.exec(content)) !== null) {
      chunks.push({
        content: match[1],
        start: match.index,
        end: match.index + match[0].length
      });
    }
    
    // Find display math: $$...$$
    const displayMathRegex = /\$\$([^$]+)\$\$/g;
    while ((match = displayMathRegex.exec(content)) !== null) {
      chunks.push({
        content: match[1],
        start: match.index,
        end: match.index + match[0].length
      });
    }
    
    // Find LaTeX commands outside of $ delimiters
    const latexCommandRegex = /\\[a-zA-Z]+/g;
    while ((match = latexCommandRegex.exec(content)) !== null) {
      // Check if this command is inside a math delimiter
      const inMathDelimiter = chunks.some(chunk => 
        match.index >= chunk.start && match.index <= chunk.end
      );
      
      if (!inMathDelimiter) {
        chunks.push({
          content: match[0],
          start: match.index,
          end: match.index + match[0].length
        });
      }
    }
    
    return chunks;
  }
}

/**
 * Middleware function to validate content before MathJax processing
 */
export function validateAndSanitizeMath(content: string, options: {
  skipValidation?: boolean;
  strictMode?: boolean;
  logErrors?: boolean;
} = {}): {
  content: string;
  isValid: boolean;
  errors: LaTeXError[];
  warnings: string[];
} {
  if (options.skipValidation) {
    return {
      content,
      isValid: true,
      errors: [],
      warnings: []
    };
  }

  const validation = LaTeXValidator.validateDocument(content);
  
  if (options.logErrors && (!validation.isValid || validation.totalWarnings > 0)) {
    console.log('LaTeX Validation Results:', {
      isValid: validation.isValid,
      totalErrors: validation.totalErrors,
      totalWarnings: validation.totalWarnings,
      chunkResults: validation.chunkResults.filter(cr => !cr.result.isValid || cr.result.warnings.length > 0)
    });
  }

  if (options.strictMode && !validation.isValid) {
    throw new Error(`LaTeX validation failed: ${validation.totalErrors} errors found`);
  }

  return {
    content: validation.processedContent,
    isValid: validation.isValid,
    errors: validation.chunkResults.flatMap(cr => cr.result.errors),
    warnings: validation.chunkResults.flatMap(cr => cr.result.warnings)
  };
}