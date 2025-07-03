import OpenAI from 'openai';

// DeepSeek uses OpenAI-compatible API
const deepseek = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY || "",
});

// Log API key status for debugging
console.log("DeepSeek API key available:", !!process.env.DEEPSEEK_API_KEY);
console.log("DeepSeek API key first few chars:", process.env.DEEPSEEK_API_KEY?.substring(0, 5) + "...");

interface DeepSeekOptions {
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export async function processDeepSeek(
  content: string,
  options: DeepSeekOptions = {}
): Promise<string> {
  const {
    temperature = 0.7,
    maxTokens = 4000,
    model = 'deepseek-chat'
  } = options;

  console.log('🔍 DeepSeek API Call Details:', {
    contentLength: content.length,
    temperature,
    maxTokens,
    model,
    hasApiKey: !!process.env.DEEPSEEK_API_KEY
  });

  try {
    // Create system prompt for comprehensive technical notation
    const systemPrompt = `You are a technical writing assistant for ALL scientific fields. MANDATORY TECHNICAL NOTATION RULES:

PERFECT LATEX FORMATTING FOR ALL FIELDS:
- Mathematics: \\in, \\cup, \\cap, \\subset, \\emptyset, \\forall, \\exists, \\alpha, \\beta, \\gamma, \\theta, \\pi, \\sigma, \\lambda, \\mu, \\omega
- Physics: \\hbar, \\partial, \\nabla, \\times, \\cdot, \\pm, \\infty, \\rightarrow, \\leftrightarrow, \\Psi, \\Phi, \\Delta, \\Omega
- Chemistry: \\rightleftharpoons, \\rightarrow, \\leftarrow, \\Delta, \\uparrow, \\downarrow, \\circ, \\degree
- Computer Science: \\wedge, \\vee, \\neg, \\oplus, \\otimes, \\top, \\bot, \\equiv, \\models, \\vdash
- Statistics: \\sim, \\approx, \\propto, \\leq, \\geq, \\neq, \\chi, \\nu, \\rho, \\tau
- Logic: \\forall, \\exists, \\neg, \\wedge, \\vee, \\rightarrow, \\leftrightarrow, \\Rightarrow, \\Leftrightarrow
- Calculus: \\int, \\iint, \\iiint, \\oint, \\sum, \\prod, \\lim, \\partial, \\nabla, \\infty
- Topology: \\subset, \\supset, \\subseteq, \\supseteq, \\cap, \\cup, \\bigcup, \\bigcap, \\emptyset
- Number Theory: \\mathbb{N}, \\mathbb{Z}, \\mathbb{Q}, \\mathbb{R}, \\mathbb{C}, \\gcd, \\lcm, \\equiv, \\pmod

CRITICAL RULES:
- NEVER use Unicode symbols: ∈, ∪, ∩, ∀, ∃, α, β, π, σ, λ, μ, ω, Ψ, Φ, Δ, Ω, ℏ, ∂, ∇, ×, ·, ±, ∞, →, ↔, ⇌, ↑, ↓, °, ∼, ≈, ∝, ≤, ≥, ≠, χ, ν, ρ, τ, ∧, ∨, ¬, ⊕, ⊗, ⊤, ⊥, ≡, ⊨, ⊢, ∫, ∬, ∭, ∮, ∑, ∏, lim, ⊂, ⊃, ⊆, ⊇, ∅, ℕ, ℤ, ℚ, ℝ, ℂ
- ALWAYS use proper LaTeX: \\in, \\cup, \\cap, \\forall, \\exists, \\alpha, \\beta, \\pi, \\sigma, \\lambda, \\mu, \\omega, \\Psi, \\Phi, \\Delta, \\Omega, \\hbar, \\partial, \\nabla, \\times, \\cdot, \\pm, \\infty, \\rightarrow, \\leftrightarrow, \\rightleftharpoons, \\uparrow, \\downarrow, \\circ, \\sim, \\approx, \\propto, \\leq, \\geq, \\neq, \\chi, \\nu, \\rho, \\tau, \\wedge, \\vee, \\neg, \\oplus, \\otimes, \\top, \\bot, \\equiv, \\models, \\vdash, \\int, \\iint, \\iiint, \\oint, \\sum, \\prod, \\lim, \\subset, \\supset, \\subseteq, \\supseteq, \\bigcup, \\bigcap, \\emptyset, \\mathbb{N}, \\mathbb{Z}, \\mathbb{Q}, \\mathbb{R}, \\mathbb{C}, \\gcd, \\lcm, \\pmod
- CRITICAL: Wrap ALL mathematical expressions in \\(...\\) for inline math or $$...$$ for display math
- EVERY single mathematical symbol, equation, or expression MUST be wrapped
- Examples: \\(\\alpha\\), \\(\\beta\\), \\(x^2\\), \\(\\sqrt{2}\\), \\(a^2 + b^2 = c^2\\), \\(\\frac{x^2 y}{x^4 + y^2}\\), \\(\\lim_{(x,y) \\rightarrow (0,0)} \\frac{x^2 y}{x^4 + y^2}\\), \\(\\int_{0}^{1} x^2 dx\\), \\(\\sum_{n=1}^{\\infty} \\frac{1}{n^2}\\)
- PERFECT formatting for physics equations, chemical reactions, logical formulas, statistical expressions
- NO EXCEPTIONS - every technical field must use proper LaTeX notation`;

    const response = await deepseek.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: content }
      ],
      temperature,
      max_tokens: maxTokens,
    });

    console.log('✅ DeepSeek API Response:', {
      choices: response.choices?.length || 0,
      hasContent: !!response.choices?.[0]?.message?.content,
      contentLength: response.choices?.[0]?.message?.content?.length || 0
    });

    return response.choices[0].message.content || '';
  } catch (error: any) {
    console.error("❌ DeepSeek API Error Details:", {
      message: error.message,
      status: error.status,
      code: error.code,
      type: error.type,
      response: error.response?.data || error.response,
      stack: error.stack
    });
    
    if (error.status === 401) {
      throw new Error('DeepSeek API authentication failed - please check your API key');
    } else if (error.status === 429) {
      throw new Error('DeepSeek API rate limit exceeded - please try again later');
    } else if (error.status >= 500) {
      throw new Error('DeepSeek API server error - please try again later');
    }
    
    throw new Error(`DeepSeek processing failed: ${error.message}`);
  }
}