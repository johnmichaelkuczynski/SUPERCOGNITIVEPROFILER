import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Download, Mail, Eye, Play, Pause, RotateCcw, X, Bomb, ArrowLeft } from 'lucide-react';
import { SpeechInput } from '@/components/ui/speech-input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import MathRenderer from './MathRenderer';

interface TextChunk {
  id: string;
  content: string;
  preview: string;
  selected: boolean;
  rewritten?: string;
  isProcessing?: boolean;
  isComplete?: boolean;
}

interface ChunkedRewriterProps {
  originalText: string;
  onRewriteComplete: (rewrittenText: string, metadata: any) => void;
  onAddToChat: (content: string, metadata: any) => void;
  chatHistory?: Array<{role: string; content: string}>;
  initialProcessingMode?: 'rewrite' | 'homework';
}

export default function ChunkedRewriter({ 
  originalText, 
  onRewriteComplete, 
  onAddToChat,
  chatHistory = [],
  initialProcessingMode = 'rewrite'
}: ChunkedRewriterProps) {
  const [chunks, setChunks] = useState<TextChunk[]>([]);
  const [instructions, setInstructions] = useState('');
  const [includeChatContext, setIncludeChatContext] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'claude' | 'gpt4' | 'perplexity'>('claude');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [previewChunk, setPreviewChunk] = useState<TextChunk | null>(null);
  const [emailAddress, setEmailAddress] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  
  // Processing mode options - use the passed initial mode
  const [processingMode, setProcessingMode] = useState<'rewrite' | 'homework'>(initialProcessingMode);
  const [rewriteMode, setRewriteMode] = useState<'rewrite' | 'add' | 'both'>('rewrite');
  const [newChunkInstructions, setNewChunkInstructions] = useState('');
  const [numberOfNewChunks, setNumberOfNewChunks] = useState(3);
  const [showResultsPopup, setShowResultsPopup] = useState(false);
  const [finalRewrittenContent, setFinalRewrittenContent] = useState('');
  const [rewriteMetadata, setRewriteMetadata] = useState<any>(null);
  const [showLiveProgress, setShowLiveProgress] = useState(false);
  const [liveProgressChunks, setLiveProgressChunks] = useState<Array<{title: string, content: string, completed: boolean}>>([]);
  
  // Re-rewrite state
  const [isRerewriting, setIsRerewriting] = useState(false);
  const [showRerewriteForm, setShowRerewriteForm] = useState(false);
  const [rerewriteInstructions, setRerewriteInstructions] = useState('');
  const [rerewriteModel, setRerewriteModel] = useState<'claude' | 'gpt4' | 'perplexity'>('claude');
  const [rewriteChunks, setRewriteChunks] = useState<Array<{id: string, content: string, selected: boolean}>>([]);
  
  const { toast } = useToast();

  // Process raw LaTeX commands in text without delimiters
  const processRawLatexCommands = (text: string): string => {
    let processed = text;
    
    // Basic logic symbols
    processed = processed.replace(/\\rightarrow/g, '→');
    processed = processed.replace(/\\leftarrow/g, '←');
    processed = processed.replace(/\\leftrightarrow/g, '↔');
    processed = processed.replace(/\\Rightarrow/g, '⇒');
    processed = processed.replace(/\\Leftarrow/g, '⇐');
    processed = processed.replace(/\\Leftrightarrow/g, '⇔');
    processed = processed.replace(/\\land/g, '∧');
    processed = processed.replace(/\\lor/g, '∨');
    processed = processed.replace(/\\wedge/g, '∧');
    processed = processed.replace(/\\vee/g, '∨');
    processed = processed.replace(/\\neg/g, '¬');
    processed = processed.replace(/\\lnot/g, '¬');
    processed = processed.replace(/\\forall/g, '∀');
    processed = processed.replace(/\\exists/g, '∃');
    
    // Set theory symbols
    processed = processed.replace(/\\in/g, '∈');
    processed = processed.replace(/\\notin/g, '∉');
    processed = processed.replace(/\\subset/g, '⊂');
    processed = processed.replace(/\\supset/g, '⊃');
    processed = processed.replace(/\\subseteq/g, '⊆');
    processed = processed.replace(/\\supseteq/g, '⊇');
    processed = processed.replace(/\\cup/g, '∪');
    processed = processed.replace(/\\cap/g, '∩');
    processed = processed.replace(/\\emptyset/g, '∅');
    
    // Greek letters
    processed = processed.replace(/\\alpha/g, 'α');
    processed = processed.replace(/\\beta/g, 'β');
    processed = processed.replace(/\\gamma/g, 'γ');
    processed = processed.replace(/\\delta/g, 'δ');
    processed = processed.replace(/\\epsilon/g, 'ε');
    processed = processed.replace(/\\zeta/g, 'ζ');
    processed = processed.replace(/\\eta/g, 'η');
    processed = processed.replace(/\\theta/g, 'θ');
    processed = processed.replace(/\\iota/g, 'ι');
    processed = processed.replace(/\\kappa/g, 'κ');
    processed = processed.replace(/\\lambda/g, 'λ');
    processed = processed.replace(/\\mu/g, 'μ');
    processed = processed.replace(/\\nu/g, 'ν');
    processed = processed.replace(/\\xi/g, 'ξ');
    processed = processed.replace(/\\pi/g, 'π');
    processed = processed.replace(/\\rho/g, 'ρ');
    processed = processed.replace(/\\sigma/g, 'σ');
    processed = processed.replace(/\\tau/g, 'τ');
    processed = processed.replace(/\\upsilon/g, 'υ');
    processed = processed.replace(/\\phi/g, 'φ');
    processed = processed.replace(/\\chi/g, 'χ');
    processed = processed.replace(/\\psi/g, 'ψ');
    processed = processed.replace(/\\omega/g, 'ω');
    
    // Capital Greek letters
    processed = processed.replace(/\\Gamma/g, 'Γ');
    processed = processed.replace(/\\Delta/g, 'Δ');
    processed = processed.replace(/\\Theta/g, 'Θ');
    processed = processed.replace(/\\Lambda/g, 'Λ');
    processed = processed.replace(/\\Xi/g, 'Ξ');
    processed = processed.replace(/\\Pi/g, 'Π');
    processed = processed.replace(/\\Sigma/g, 'Σ');
    processed = processed.replace(/\\Phi/g, 'Φ');
    processed = processed.replace(/\\Psi/g, 'Ψ');
    processed = processed.replace(/\\Omega/g, 'Ω');
    
    // Mathematical symbols
    processed = processed.replace(/\\infty/g, '∞');
    processed = processed.replace(/\\partial/g, '∂');
    processed = processed.replace(/\\nabla/g, '∇');
    processed = processed.replace(/\\pm/g, '±');
    processed = processed.replace(/\\mp/g, '∓');
    processed = processed.replace(/\\times/g, '×');
    processed = processed.replace(/\\div/g, '÷');
    processed = processed.replace(/\\cdot/g, '⋅');
    processed = processed.replace(/\\leq/g, '≤');
    processed = processed.replace(/\\geq/g, '≥');
    processed = processed.replace(/\\neq/g, '≠');
    processed = processed.replace(/\\approx/g, '≈');
    processed = processed.replace(/\\equiv/g, '≡');
    processed = processed.replace(/\\sim/g, '∼');
    processed = processed.replace(/\\propto/g, '∝');
    
    // Integrals and calculus
    processed = processed.replace(/\\int/g, '∫');
    processed = processed.replace(/\\iint/g, '∬');
    processed = processed.replace(/\\iiint/g, '∭');
    processed = processed.replace(/\\oint/g, '∮');
    processed = processed.replace(/\\sum/g, '∑');
    processed = processed.replace(/\\prod/g, '∏');
    
    // Number sets
    processed = processed.replace(/\\mathbb\{N\}/g, 'ℕ');
    processed = processed.replace(/\\mathbb\{Z\}/g, 'ℤ');
    processed = processed.replace(/\\mathbb\{Q\}/g, 'ℚ');
    processed = processed.replace(/\\mathbb\{R\}/g, 'ℝ');
    processed = processed.replace(/\\mathbb\{C\}/g, 'ℂ');
    
    return processed;
  };

  // COMPREHENSIVE mathematical notation processing for streaming content
  const processStreamingMath = (text: string): string => {
    let processed = text;
    
    // Handle display math environments $$...$$
    processed = processed.replace(/\$\$([^$]+)\$\$/g, (match, latex) => {
      const rendered = renderLatexExpression(latex.trim());
      return rendered;
    });
    
    // Handle inline math $...$
    processed = processed.replace(/\$([^$]+)\$/g, (match, latex) => {
      const rendered = renderLatexExpression(latex.trim());
      return rendered;
    });
    
    // Handle LaTeX display math \[...\]
    processed = processed.replace(/\\\[([^\]]+)\\\]/g, (match, latex) => {
      const rendered = renderLatexExpression(latex.trim());
      return rendered;
    });
    
    // Handle LaTeX inline math \(...\)
    processed = processed.replace(/\\\(([^)]+)\\\)/g, (match, latex) => {
      const rendered = renderLatexExpression(latex.trim());
      return rendered;
    });

    // CRITICAL: Also process raw LaTeX commands in text
    processed = processRawLatexCommands(processed);

    return processed;
  };

  // COMPREHENSIVE LaTeX expression renderer
  const renderLatexExpression = (latex: string): string => {
    let rendered = latex;
    
    // Handle matrices with proper Unicode brackets
    rendered = rendered.replace(/\\begin\{pmatrix\}([\s\S]*?)\\end\{pmatrix\}/g, (match, content) => {
      const rows = content.split('\\\\').map((row: string) => {
        const cells = row.split('&').map((cell: string) => renderLatexExpression(cell.trim()));
        return cells.join('  ');
      });
      return `⎛${rows.join('⎞\n⎜').replace(/⎞\n⎜/g, '⎞\n⎜')}⎠`;
    });
    
    rendered = rendered.replace(/\\begin\{bmatrix\}([\s\S]*?)\\end\{bmatrix\}/g, (match, content) => {
      const rows = content.split('\\\\').map((row: string) => {
        const cells = row.split('&').map((cell: string) => renderLatexExpression(cell.trim()));
        return cells.join('  ');
      });
      return `⎡${rows.join('⎤\n⎢').replace(/⎤\n⎢/g, '⎤\n⎢')}⎦`;
    });
    
    rendered = rendered.replace(/\\begin\{matrix\}([\s\S]*?)\\end\{matrix\}/g, (match, content) => {
      const rows = content.split('\\\\').map((row: string) => {
        const cells = row.split('&').map((cell: string) => renderLatexExpression(cell.trim()));
        return cells.join('  ');
      });
      return rows.join('\n');
    });
    
    // Handle fractions with proper Unicode fractions and visual stacking
    rendered = rendered.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, (match, num, den) => {
      const processedNum = renderLatexExpression(num);
      const processedDen = renderLatexExpression(den);
      
      // For simple single-character numerators and denominators, use Unicode fractions
      const simpleChars = /^[0-9]$/;
      if (simpleChars.test(processedNum) && simpleChars.test(processedDen)) {
        const fractionMap: Record<string, string> = {
          '1/2': '½', '1/3': '⅓', '2/3': '⅔', '1/4': '¼', '3/4': '¾',
          '1/5': '⅕', '2/5': '⅖', '3/5': '⅗', '4/5': '⅘', '1/6': '⅙',
          '5/6': '⅚', '1/7': '⅐', '1/8': '⅛', '3/8': '⅜', '5/8': '⅝',
          '7/8': '⅞', '1/9': '⅑', '1/10': '⅒'
        };
        const key = `${processedNum}/${processedDen}`;
        if (fractionMap[key]) return fractionMap[key];
      }
      
      // For complex fractions, create visual stacking
      const lineLength = Math.max(processedNum.length, processedDen.length);
      return `${processedNum}\n${'-'.repeat(lineLength)}\n${processedDen}`;
    });
    
    // CRITICAL FIX: Handle malformed superscripts and subscripts BEFORE processing valid ones
    rendered = rendered.replace(/([A-Za-z0-9])_(\s|$|[^{a-zA-Z0-9])/g, '$1$2');
    rendered = rendered.replace(/([A-Za-z0-9])\^(\s|$|[^{a-zA-Z0-9])/g, '$1$2');
    rendered = rendered.replace(/([A-Za-z0-9])_$/g, '$1');
    rendered = rendered.replace(/([A-Za-z0-9])\^$/g, '$1');
    rendered = rendered.replace(/([A-Za-z0-9])_(\s*[∪∩∧∨→←↔⊂⊃⊆⊇∈∉])/g, '$1$2');
    rendered = rendered.replace(/([A-Za-z0-9])\^(\s*[∪∩∧∨→←↔⊂⊃⊆⊇∈∉])/g, '$1$2');

    // Handle superscripts and subscripts with Unicode
    rendered = rendered.replace(/\^(\{[^}]+\}|[a-zA-Z0-9])/g, (match, sup) => {
      const content = sup.startsWith('{') ? sup.slice(1, -1) : sup;
      const processed = renderLatexExpression(content);
      
      // Use Unicode superscript characters where possible
      const superscriptMap: Record<string, string> = {
        '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵',
        '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '+': '⁺', '-': '⁻',
        '=': '⁼', '(': '⁽', ')': '⁾', 'n': 'ⁿ', 'i': 'ⁱ'
      };
      
      let result = '';
      for (const char of processed) {
        result += superscriptMap[char] || char;
      }
      return result;
    });
    
    rendered = rendered.replace(/_(\{[^}]+\}|[a-zA-Z0-9])/g, (match, sub) => {
      const content = sub.startsWith('{') ? sub.slice(1, -1) : sub;
      const processed = renderLatexExpression(content);
      
      // Use Unicode subscript characters where possible
      const subscriptMap: Record<string, string> = {
        '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅',
        '6': '₆', '7': '₇', '8': '₈', '9': '₉', '+': '₊', '-': '₋',
        '=': '₌', '(': '₍', ')': '₎', 'a': 'ₐ', 'e': 'ₑ', 'h': 'ₕ',
        'i': 'ᵢ', 'j': 'ⱼ', 'k': 'ₖ', 'l': 'ₗ', 'm': 'ₘ', 'n': 'ₙ',
        'o': 'ₒ', 'p': 'ₚ', 'r': 'ᵣ', 's': 'ₛ', 't': 'ₜ', 'u': 'ᵤ',
        'v': 'ᵥ', 'x': 'ₓ'
      };
      
      let result = '';
      for (const char of processed) {
        result += subscriptMap[char] || char;
      }
      return result;
    });
    
    // Handle integrals with proper sizing and limits
    rendered = rendered.replace(/\\int_(\{[^}]+\}|[^\\^]+)\^(\{[^}]+\}|[^\\]+)/g, (match, lower, upper) => {
      const lowerContent = lower.startsWith('{') ? lower.slice(1, -1) : lower;
      const upperContent = upper.startsWith('{') ? upper.slice(1, -1) : upper;
      const processedUpper = renderLatexExpression(upperContent);
      const processedLower = renderLatexExpression(lowerContent);
      return `∫${processedUpper}\n ${processedLower}`;
    });
    
    rendered = rendered.replace(/\\int/g, '∫');
    rendered = rendered.replace(/\\iint/g, '∬');
    rendered = rendered.replace(/\\iiint/g, '∭');
    rendered = rendered.replace(/\\oint/g, '∮');
    
    // Handle summations and products with limits
    rendered = rendered.replace(/\\sum_(\{[^}]+\}|[^\\^]+)\^(\{[^}]+\}|[^\\]+)/g, (match, lower, upper) => {
      const lowerContent = lower.startsWith('{') ? lower.slice(1, -1) : lower;
      const upperContent = upper.startsWith('{') ? upper.slice(1, -1) : upper;
      const processedUpper = renderLatexExpression(upperContent);
      const processedLower = renderLatexExpression(lowerContent);
      return `∑${processedUpper}\n ${processedLower}`;
    });
    
    rendered = rendered.replace(/\\sum/g, '∑');
    rendered = rendered.replace(/\\prod/g, '∏');

    // COMPREHENSIVE mathematical symbols map
    const symbolMap: Record<string, string> = {
      // Basic logic
      '\\neg': '¬', '\\lnot': '¬', '\\land': '∧', '\\wedge': '∧', 
      '\\lor': '∨', '\\vee': '∨', '\\rightarrow': '→', '\\to': '→',
      '\\leftarrow': '←', '\\leftrightarrow': '↔', '\\iff': '↔',
      '\\Rightarrow': '⇒', '\\implies': '⇒', '\\Leftarrow': '⇐', '\\Leftrightarrow': '⇔',
      
      // Mathematical operators
      '\\times': '×', '\\cdot': '·', '\\div': '÷', '\\pm': '±', '\\mp': '∓',
      '\\leq': '≤', '\\geq': '≥', '\\neq': '≠', '\\approx': '≈', '\\equiv': '≡',
      '\\sim': '∼', '\\simeq': '≃', '\\cong': '≅', '\\propto': '∝',
      
      // Set theory
      '\\in': '∈', '\\notin': '∉', '\\subset': '⊂', '\\supset': '⊃',
      '\\subseteq': '⊆', '\\supseteq': '⊇', '\\cup': '∪', '\\cap': '∩',
      '\\emptyset': '∅', '\\varnothing': '∅', '\\setminus': '∖',
      
      // Greek letters (lowercase)
      '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ', '\\delta': 'δ',
      '\\epsilon': 'ε', '\\varepsilon': 'ε', '\\zeta': 'ζ', '\\eta': 'η',
      '\\theta': 'θ', '\\vartheta': 'ϑ', '\\iota': 'ι', '\\kappa': 'κ',
      '\\lambda': 'λ', '\\mu': 'μ', '\\nu': 'ν', '\\xi': 'ξ',
      '\\omicron': 'ο', '\\pi': 'π', '\\varpi': 'ϖ', '\\rho': 'ρ',
      '\\varrho': 'ϱ', '\\sigma': 'σ', '\\varsigma': 'ς', '\\tau': 'τ',
      '\\upsilon': 'υ', '\\phi': 'φ', '\\varphi': 'φ', '\\chi': 'χ',
      '\\psi': 'ψ', '\\omega': 'ω',
      
      // Greek letters (uppercase)
      '\\Gamma': 'Γ', '\\Delta': 'Δ', '\\Theta': 'Θ', '\\Lambda': 'Λ',
      '\\Xi': 'Ξ', '\\Pi': 'Π', '\\Sigma': 'Σ', '\\Upsilon': 'Υ',
      '\\Phi': 'Φ', '\\Chi': 'Χ', '\\Psi': 'Ψ', '\\Omega': 'Ω',
      
      // Number sets (blackboard bold)
      '\\mathbb{N}': 'ℕ', '\\mathbb{Z}': 'ℤ', '\\mathbb{Q}': 'ℚ',
      '\\mathbb{R}': 'ℝ', '\\mathbb{C}': 'ℂ', '\\mathbb{H}': 'ℍ',
      '\\mathbb{P}': 'ℙ', '\\mathbb{F}': 'F',
      
      // Logic quantifiers
      '\\forall': '∀', '\\exists': '∃', '\\nexists': '∄',
      '\\therefore': '∴', '\\because': '∵',
      
      // Calculus and analysis
      '\\partial': '∂', '\\nabla': '∇', '\\infty': '∞', '\\aleph': 'ℵ',
      '\\lim': 'lim', '\\sup': 'sup', '\\inf': 'inf', '\\max': 'max', '\\min': 'min',
      
      // Arrows and relations
      '\\mapsto': '↦', '\\longmapsto': '⟼', '\\hookleftarrow': '↩',
      '\\hookrightarrow': '↪', '\\uparrow': '↑', '\\downarrow': '↓',
      '\\updownarrow': '↕', '\\Uparrow': '⇑', '\\Downarrow': '⇓',
      
      // Miscellaneous
      '\\dots': '…', '\\ldots': '…', '\\cdots': '⋯', '\\vdots': '⋮',
      '\\ddots': '⋱', '\\angle': '∠', '\\triangle': '△', '\\square': '□',
      '\\diamond': '◊', '\\star': '⋆', '\\dagger': '†', '\\ddagger': '‡',
      
      // Brackets and delimiters
      '\\langle': '⟨', '\\rangle': '⟩', '\\lceil': '⌈', '\\rceil': '⌉',
      '\\lfloor': '⌊', '\\rfloor': '⌋', '\\|': '‖'
    };
    
    // Apply symbol replacements
    Object.entries(symbolMap).forEach(([latex, symbol]) => {
      rendered = rendered.split(latex).join(symbol);
    });
    
    // Handle function names with proper formatting
    const functionNames = ['sin', 'cos', 'tan', 'sec', 'csc', 'cot', 
                          'sinh', 'cosh', 'tanh', 'log', 'ln', 'exp',
                          'det', 'tr', 'rank', 'dim', 'ker', 'im'];
    functionNames.forEach(func => {
      const regex = new RegExp(`\\\\${func}\\b`, 'g');
      rendered = rendered.replace(regex, func);
    });
    
    // Clean up remaining LaTeX artifacts
    rendered = rendered.replace(/\{([^}]*)\}/g, '$1');
    rendered = rendered.replace(/\\left\(/g, '(').replace(/\\right\)/g, ')');
    rendered = rendered.replace(/\\left\[/g, '[').replace(/\\right\]/g, ']');
    rendered = rendered.replace(/\\left\|/g, '|').replace(/\\right\|/g, '|');
    rendered = rendered.replace(/\\;/g, ' ').replace(/\\,/g, ' ').replace(/\\!/g, '');
    
    return rendered;
  };

  const cancelRewrite = () => {
    setIsCancelled(true);
    toast({
      title: "Cancelling Rewrite",
      description: "Stopping the rewrite process...",
    });
  };

  const nukeEverything = () => {
    // Reset absolutely everything
    setIsProcessing(false);
    setIsCancelled(false);
    setCurrentChunkIndex(0);
    setProgress(0);
    setShowLiveProgress(false);
    setShowResultsPopup(false);
    setShowRerewriteForm(false);
    setIsRerewriting(false);
    setPreviewChunk(null);
    setRerewriteInstructions('');
    setRewriteChunks([]);
    setLiveProgressChunks([]);
    setFinalRewrittenContent('');
    setRewriteMetadata(null);
    
    // Clear any cached document content to force fresh processing
    localStorage.removeItem('cachedDocumentContent');
    localStorage.removeItem('lastProcessedDocument');
    
    // Reset all chunks and force regeneration from original text
    setChunks(prev => prev.map(chunk => ({
      ...chunk,
      rewritten: undefined,
      isProcessing: false,
      isComplete: false,
      selected: false
    })));
    
    toast({
      title: "NUKED!",
      description: "Everything has been reset. Fresh start!",
      variant: "destructive"
    });
  };

  // Split text into chunks of approximately 500 words
  useEffect(() => {
    if (!originalText) return;

    const words = originalText.split(/\s+/);
    const chunkSize = 500;
    const textChunks: TextChunk[] = [];

    for (let i = 0; i < words.length; i += chunkSize) {
      const chunkWords = words.slice(i, i + chunkSize);
      const content = chunkWords.join(' ');
      const preview = content.length > 200 ? content.substring(0, 200) + '...' : content;
      
      textChunks.push({
        id: `chunk_${i / chunkSize}`,
        content,
        preview,
        selected: true, // Default to all chunks selected
      });
    }

    setChunks(textChunks);
  }, [originalText]);

  const toggleChunkSelection = (chunkId: string) => {
    setChunks(prev => prev.map(chunk => 
      chunk.id === chunkId 
        ? { ...chunk, selected: !chunk.selected }
        : chunk
    ));
  };

  const selectAllChunks = () => {
    setChunks(prev => prev.map(chunk => ({ ...chunk, selected: true })));
  };

  const deselectAllChunks = () => {
    setChunks(prev => prev.map(chunk => ({ ...chunk, selected: false })));
  };

  const startRewrite = async () => {
    // Validation based on rewrite mode
    if (rewriteMode === 'rewrite' || rewriteMode === 'both') {
      const selectedChunks = chunks.filter(chunk => chunk.selected);
      if (selectedChunks.length === 0) {
        toast({
          title: "No chunks selected",
          description: "Please select at least one chunk to rewrite.",
          variant: "destructive"
        });
        return;
      }
    }
    
    if (rewriteMode === 'add' || rewriteMode === 'both') {
      if (!newChunkInstructions.trim()) {
        toast({
          title: "Missing new chunk instructions",
          description: "Please provide instructions for the new content to be added.",
          variant: "destructive"
        });
        return;
      }
    }

    setIsProcessing(true);
    setCurrentChunkIndex(0);
    setProgress(0);

    // Reset all chunks
    setChunks(prev => prev.map(chunk => ({
      ...chunk,
      rewritten: undefined,
      isProcessing: false,
      isComplete: false
    })));

    try {
      // All modes now use chunked processing
      let chatContext = '';
      if (includeChatContext && chatHistory.length > 0) {
        chatContext = '\n\nChat Context (for reference):\n' + 
          chatHistory.slice(-10).map(msg => `${msg.role}: ${msg.content}`).join('\n');
      }

      let finalContent = '';
      let processedChunks = 0;
      let totalOperations = 0;

      // Calculate total operations for progress tracking
      if (rewriteMode === 'rewrite' || rewriteMode === 'both') {
        totalOperations += chunks.filter(chunk => chunk.selected).length;
      }
      if (rewriteMode === 'add' || rewriteMode === 'both') {
        totalOperations += numberOfNewChunks;
      }

      // Initialize live progress tracking
      setShowLiveProgress(true);
      setLiveProgressChunks(Array(totalOperations).fill(null).map((_, i) => {
        const selectedChunks = chunks.filter(chunk => chunk.selected);
        return {
          title: i < selectedChunks.length ? `Rewriting Chunk ${i + 1}` : `Generating New Chunk ${i - selectedChunks.length + 1}`,
          content: '',
          completed: false
        };
      }));

      // Step 1: Handle existing chunks
      const rewrittenChunks: string[] = [];
      
      if (rewriteMode === 'rewrite' || rewriteMode === 'both') {
        const selectedChunks = chunks.filter(chunk => chunk.selected);
        
        for (let i = 0; i < selectedChunks.length; i++) {
          // Check if cancelled
          if (isCancelled) {
            setIsProcessing(false);
            setIsCancelled(false);
            toast({
              title: "Rewrite Cancelled",
              description: "The rewrite process was stopped.",
              variant: "destructive"
            });
            return;
          }

          const chunk = selectedChunks[i];
          setCurrentChunkIndex(i);
          
          // Mark current chunk as processing
          setChunks(prev => prev.map(c => 
            c.id === chunk.id 
              ? { ...c, isProcessing: true }
              : c
          ));

          let response;
          if (processingMode === 'homework') {
            // Use homework endpoint with simple instruction
            response = await fetch('/api/homework-mode', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                instructions: `ANSWER EVERY QUESTION ON HERE\n\n${chunk.content}`,
                userPrompt: instructions || '',
                model: selectedModel,
                chatContext: includeChatContext ? chatContext : undefined,
              }),
            });
          } else {
            // Use rewrite endpoint with streaming for real-time updates
            response = await fetch('/api/rewrite-chunk', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                content: chunk.content,
                instructions: instructions || 'Improve clarity, coherence, and readability while maintaining the original meaning.',
                model: selectedModel,
                chatContext: includeChatContext ? chatContext : undefined,
                chunkIndex: i,
                totalChunks: selectedChunks.length,
                mode: rewriteMode,
                stream: true
              }),
            });
          }

          if (!response.ok) {
            throw new Error(`Failed to rewrite chunk ${i + 1}`);
          }

          let result: any = null;
          let streamingContent = '';

          if (processingMode === 'homework') {
            // Non-streaming for homework mode
            result = await response.json();
          } else {
            // Handle streaming response for rewrite mode
            const reader = response.body?.getReader();
            if (!reader) {
              throw new Error('Streaming not supported');
            }

            const decoder = new TextDecoder();

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk_data = decoder.decode(value);
              const lines = chunk_data.split('\n');

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.slice(6));
                    
                    if (data.type === 'chunk') {
                      // Real-time update: show streaming content in the output box
                      streamingContent += data.content;
                      
                      // Process mathematical notation immediately for display
                      const processedContent = processStreamingMath(streamingContent);
                      
                      // Update chunk with streaming content immediately
                      setChunks(prev => prev.map(c => 
                        c.id === chunk.id 
                          ? { 
                              ...c, 
                              rewritten: processedContent,
                              isProcessing: true // Keep processing state during streaming
                            }
                          : c
                      ));

                      // Update live progress with streaming content
                      setLiveProgressChunks(prev => prev.map((item, idx) => 
                        idx === i ? {
                          ...item,
                          content: processedContent,
                          completed: false // Still streaming
                        } : item
                      ));
                      
                    } else if (data.type === 'complete') {
                      // Final result with mathematical notation processed
                      result = { rewrittenContent: data.rewrittenContent };
                      
                      // Mark as completed in live progress
                      setLiveProgressChunks(prev => prev.map((item, idx) => 
                        idx === i ? {
                          ...item,
                          content: data.rewrittenContent,
                          completed: true
                        } : item
                      ));
                      
                    } else if (data.type === 'error') {
                      throw new Error(data.error);
                    }
                  } catch (parseError) {
                    console.warn('Failed to parse streaming data:', line);
                  }
                }
              }
            }

            if (!result) {
              throw new Error('No final result received from streaming');
            }
          }

          // Store the content immediately (homework returns 'response', rewrite returns 'rewrittenContent')
          const content = processingMode === 'homework' ? result.response : result.rewrittenContent;
          rewrittenChunks.push(content);

          // Update chunk with rewritten content
          setChunks(prev => prev.map(c => 
            c.id === chunk.id 
              ? { 
                  ...c, 
                  rewritten: content,
                  isProcessing: false,
                  isComplete: true 
                }
              : c
          ));

          // Ensure live progress shows final completed state
          setLiveProgressChunks(prev => prev.map((item, idx) => 
            idx === i ? {
              ...item,
              content: content,
              completed: true
            } : item
          ));

          processedChunks++;
          setProgress((processedChunks / totalOperations) * 100);
        }

        // Compile rewritten chunks from our immediate storage
        finalContent = rewrittenChunks.join('\n\n');
      } else if (rewriteMode === 'add') {
        // For add-only mode, keep original content unchanged
        finalContent = originalText;
      }

      // Complete final metadata and callback
      const metadata = {
        originalLength: originalText.length,
        rewrittenLength: finalContent.length,
        chunksProcessed: processedChunks,
        model: selectedModel,
        mode: processingMode,
        rewriteMode: rewriteMode,
        instructions: instructions,
        includedChatContext: includeChatContext
      };

      // Store results for popup display
      setFinalRewrittenContent(finalContent);
      setRewriteMetadata(metadata);
      setShowResultsPopup(true);

      toast({
        title: "Rewrite Complete!",
        description: `Successfully processed ${processedChunks} chunks.`,
      });

      // Complete the rewrite process
      onRewriteComplete(finalContent, metadata);

    } catch (error) {
      console.error('Rewrite error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to rewrite content",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      // Reset cancellation flag and live progress after completion
      setIsCancelled(false);
      
      // Reset chunk processing states
      setChunks(prev => prev.map(chunk => ({
        ...chunk,
        isProcessing: false
      })));
    }
  };

  const downloadPDF = async () => {
    try {
      toast({
        title: "Generating PDF...",
        description: "Creating your document download.",
      });

      const content = chunks.filter(chunk => chunk.selected && chunk.rewritten)
        .map(chunk => chunk.rewritten).join('\n\n');

      if (!content) {
        toast({
          title: "No content to export",
          description: "Please rewrite some chunks first.",
          variant: "destructive"
        });
        return;
      }

      const response = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content,
          title: 'Rewritten Document',
          metadata: {
            model: selectedModel,
            instructions: instructions,
            chunksCount: chunks.filter(chunk => chunk.selected).length
          }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `rewritten-document-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "PDF Downloaded!",
        description: "Your rewritten document has been saved.",
      });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to create PDF",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Live Progress Dialog */}
      <Dialog open={showLiveProgress} onOpenChange={setShowLiveProgress}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Processing Chunks - Live Progress</DialogTitle>
            <DialogDescription>
              Watch your content being rewritten in real-time
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {liveProgressChunks.map((chunk, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  {chunk.completed ? (
                    <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  ) : (
                    <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
                  )}
                  <h3 className="font-medium">{chunk.title}</h3>
                  {index === currentChunkIndex && !chunk.completed && (
                    <span className="text-blue-500 text-sm">(Processing...)</span>
                  )}
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded p-3 min-h-[100px] max-h-[300px] overflow-y-auto">
                  {chunk.content ? (
                    <div className="whitespace-pre-wrap font-mono text-sm">
                      {chunk.content}
                    </div>
                  ) : (
                    <span className="text-gray-400">Waiting for content...</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-between items-center">
            <Button onClick={cancelRewrite} variant="destructive" disabled={!isProcessing}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <div className="text-sm text-gray-500">
              {liveProgressChunks.filter(c => c.completed).length} of {liveProgressChunks.length} chunks completed
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Configuration Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Smart Document Rewriter
            <div className="flex space-x-2">
              <Button onClick={nukeEverything} variant="destructive" size="sm">
                <Bomb className="h-4 w-4 mr-1" />
                NUKE
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Rewrite your document with AI assistance. Select chunks to process individually for precise control.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Processing Mode Toggle */}
          <div className="space-y-2">
            <Label>Processing Mode</Label>
            <Select value={processingMode} onValueChange={(value: 'rewrite' | 'homework') => setProcessingMode(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rewrite">Rewrite Mode - Transform and improve existing text</SelectItem>
                <SelectItem value="homework">Homework Mode - Complete assignments, answer questions, follow instructions</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Instructions */}
          <div className="space-y-2">
            <Label htmlFor="instructions">
              {processingMode === 'homework' ? 'Additional Guidance (Optional)' : 'Rewrite Instructions'}
            </Label>
            <div className="flex space-x-2">
              <Textarea
                id="instructions"
                placeholder={
                  processingMode === 'homework'
                    ? "Any additional guidance for how to approach the homework..."
                    : "Describe how you want the text to be rewritten..."
                }
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={3}
                className="flex-1"
              />
              <SpeechInput
                onTranscript={(transcript) => setInstructions(prev => prev + ' ' + transcript)}
                className="mt-0"
              />
            </div>
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <Label>AI Model</Label>
            <Select value={selectedModel} onValueChange={(value: 'claude' | 'gpt4' | 'perplexity') => setSelectedModel(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="claude">Claude (Anthropic) - Best for analysis and writing</SelectItem>
                <SelectItem value="gpt4">GPT-4 (OpenAI) - Great for creative tasks</SelectItem>
                <SelectItem value="perplexity">Perplexity - Good for research-based content</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Chat Context Toggle */}
          {chatHistory.length > 0 && (
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="include-context" 
                checked={includeChatContext}
                onCheckedChange={setIncludeChatContext}
              />
              <Label htmlFor="include-context" className="text-sm">
                Include recent chat context ({chatHistory.length} messages)
              </Label>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chunk Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Document Chunks ({chunks.filter(c => c.selected).length} of {chunks.length} selected)</CardTitle>
          <CardDescription>
            Select which parts of your document to process. Each chunk is approximately 500 words.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2 mb-4">
            <Button onClick={selectAllChunks} variant="outline" size="sm">Select All</Button>
            <Button onClick={deselectAllChunks} variant="outline" size="sm">Deselect All</Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            {chunks.map((chunk, index) => (
              <div 
                key={chunk.id} 
                className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                  chunk.selected ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : 'border-gray-200'
                } ${chunk.isProcessing ? 'animate-pulse' : ''}`}
                onClick={() => toggleChunkSelection(chunk.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      checked={chunk.selected} 
                      onChange={() => toggleChunkSelection(chunk.id)}
                    />
                    <span className="font-medium">Chunk {index + 1}</span>
                    {chunk.isProcessing && <span className="text-blue-500 text-sm">(Processing...)</span>}
                    {chunk.isComplete && <span className="text-green-500 text-sm">✓ Complete</span>}
                  </div>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewChunk(chunk);
                    }}
                    variant="ghost"
                    size="sm"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  {chunk.preview}
                </p>
                {chunk.rewritten && (
                  <div className="mt-2 p-2 bg-green-50 dark:bg-green-950 rounded border-l-4 border-green-500">
                    <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">Rewritten:</p>
                    <div className="text-sm text-green-600 dark:text-green-400 max-h-32 overflow-y-auto">
                      <MathRenderer content={chunk.rewritten.substring(0, 200) + (chunk.rewritten.length > 200 ? '...' : '')} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <Button 
          onClick={startRewrite} 
          disabled={isProcessing || chunks.filter(c => c.selected).length === 0}
          className="flex-1"
        >
          {isProcessing ? (
            <>
              <Pause className="h-4 w-4 mr-2" />
              Processing... ({currentChunkIndex + 1}/{chunks.filter(c => c.selected).length})
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              {processingMode === 'homework' ? 'Complete Homework' : 'Start Rewrite'}
            </>
          )}
        </Button>
        
        {chunks.some(chunk => chunk.rewritten) && (
          <Button onClick={downloadPDF} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        )}
      </div>

      {/* Progress Bar */}
      {isProcessing && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={previewChunk !== null} onOpenChange={() => setPreviewChunk(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Chunk Preview - {previewChunk && `Chunk ${chunks.findIndex(c => c.id === previewChunk.id) + 1}`}
            </DialogTitle>
          </DialogHeader>
          {previewChunk && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Original:</h3>
                <div className="bg-gray-50 dark:bg-gray-800 rounded p-4">
                  <MathRenderer content={previewChunk.content} />
                </div>
              </div>
              {previewChunk.rewritten && (
                <div>
                  <h3 className="font-medium mb-2">Rewritten:</h3>
                  <div className="bg-green-50 dark:bg-green-950 rounded p-4">
                    <MathRenderer content={previewChunk.rewritten} />
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}