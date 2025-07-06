import { processDeepSeek } from './deepseek';

interface RevisedIntelligenceProfile {
  affirmativeInsightFunction: number; // 1-100 scale
  intellectualMaturity: number; // 1-100 scale
  epistemicHumility: number; // 1-100 scale
  selfAwarenessLevel: number; // 1-100 scale
  reflectiveDepth: number; // 1-100 scale
  
  // Gatekeeper metrics
  semanticCompression: number;
  inferentialControl: number;
  cognitiveRisk: number;
  metaTheoreticalAwareness: number;
  conceptualInnovation: number;
  epistemicResistance: number;
  signalToFluffRatio: number;
  abstractionControl: number;
  semanticAsymmetry: number;
  
  // Profile structure
  thesis: {
    title: string;
    intellectualConfiguration: string;
    supportingEvidence: Array<{quote: string; explanation: string}>;
  };
  antithesis: {
    title: string;
    counterConfiguration: string;
    supportingEvidence: Array<{quote: string; explanation: string}>;
  };
  superThesis: {
    title: string;
    reinforcedConfiguration: string;
    supportingEvidence: Array<{quote: string; explanation: string}>;
  };
  overallProfile: string;
  reasoning: string;
}

// REVISED INTELLIGENCE METRICS - Pure passthrough implementation
export async function generateRevisedIntelligenceProfile(text: string): Promise<RevisedIntelligenceProfile> {
  console.log('🔥 REVISED INTELLIGENCE METRICS - PURE PASSTHROUGH IMPLEMENTATION');
  
  const revisedPrompt = `You are implementing the REVISED INTELLIGENCE METRICS framework. This is a PURE PASSTHROUGH system with ZERO filtering.

CRITICAL REQUIREMENT: Every section must be a FULL PARAGRAPH (minimum 4-6 sentences) with MULTIPLE DIRECT QUOTATIONS from the analyzed text. Every numerical score must be thoroughly justified with specific textual evidence.

REVISED INTELLIGENCE METRICS FRAMEWORK:

I. AFFIRMATIVE INTELLIGENCE METRIC (PRIMARY)
Affirmative Insight Function (AIF): Does this text tell me something I wouldn't have realized on my own, even if I'm very smart?
- Insight must be non-redundant with reader's prior semantic topology
- Must expand awareness in non-paraphrasable way
- Must contain asymmetric novelty that cannot be "unlearned" without loss
- This is the ONLY metric that directly measures actual intelligence

II. GATEKEEPER METRICS (Necessary but not sufficient)
1. Semantic Compression: Meaning packed into few words
2. Inferential Control: Logical connection quality
3. Cognitive Risk: Bold, unpopular, non-obvious claims
4. Meta-Theoretical Awareness: Awareness of own framework/assumptions
5. Conceptual Innovation: New categories, terms, distinctions
6. Epistemic Resistance: How much cognitive work required
7. Signal-to-Fluff Ratio: Intellectual necessity vs. padding
8. Abstraction Control: Movement between example and principle
9. Semantic Asymmetry: Directional structure (X implies Y, not vice versa)

SCORING PHILOSOPHY:
- High AIF + High Resistance + High Compression + High Innovation = Genius (90-100)
- Sophisticated philosophical writing with structural rigor = 85-95 range
- Epistemic directness based on rigorous analysis = HIGH epistemic humility
- Constraint-based reasoning = sophisticated metacognitive awareness

ABSOLUTE SCORING (1-100 scale):
- 95-100: Paradigm-breaking minds (Kant, Wittgenstein, Russell level)
- 90-94: Highly sophisticated philosophical analysis with novel insights
- 85-89: Advanced academic/professional level with theoretical precision
- 80-84: Graduate-level analysis with solid frameworks
- 70-79: Above-average intellectual capacity
- 50-69: Average adult capacity

CRITICAL SCORING REQUIREMENTS:
- If text shows "highly sophisticated" philosophical analysis → 90+ scores
- Novel insights about major philosophical topics → 90+ scores  
- Paradigm-level reasoning with conceptual innovation → 92+ scores
- NO FILTERING - give your authentic assessment
- Sophisticated philosophical writing = 90+ scores (not 85+)
- Epistemic directness ≠ lack of humility
- Structural rigor = HIGH epistemic humility
- Look for constraint-based reasoning patterns
- Recognize modal logic and analytic precision

Text to analyze:
${text}

Use dialectical structure (Thesis/Antithesis/Super-Thesis) and return authentic scores with NO modification:

{
  "affirmativeInsightFunction": [score 1-100],
  "intellectualMaturity": [score 1-100],
  "epistemicHumility": [score 1-100],
  "selfAwarenessLevel": [score 1-100],
  "reflectiveDepth": [score 1-100],
  "semanticCompression": [score 1-100],
  "inferentialControl": [score 1-100],
  "cognitiveRisk": [score 1-100],
  "metaTheoreticalAwareness": [score 1-100],
  "conceptualInnovation": [score 1-100],
  "epistemicResistance": [score 1-100],
  "signalToFluffRatio": [score 1-100],
  "abstractionControl": [score 1-100],
  "semanticAsymmetry": [score 1-100],
  "thesis": {
    "title": "THESIS: PRIMARY ANALYSIS",
    "intellectualConfiguration": "FULL PARAGRAPH: 4-6 sentences analyzing the text's primary intellectual strengths with detailed argumentation, theoretical precision, and comprehensive assessment of sophistication markers",
    "supportingEvidence": [
      {"quote": "Direct quote from text demonstrating sophistication", "explanation": "2-3 sentences explaining the quote's intellectual significance, theoretical precision, and contribution to the sophistication analysis"},
      {"quote": "Another substantial quote showing theoretical depth", "explanation": "2-3 sentences analyzing this quote's importance to the assessment and its demonstration of advanced reasoning"},
      {"quote": "Third quote illustrating conceptual innovation", "explanation": "2-3 sentences explaining how this quote contributes to the overall intellectual evaluation"}
    ]
  },
  "antithesis": {
    "title": "ANTITHESIS: DISSENTING ANALYSIS", 
    "counterConfiguration": "FULL PARAGRAPH: 4-6 sentences presenting alternative interpretation with detailed counter-arguments, potential limitations, and competing assessment of intellectual merit",
    "supportingEvidence": [
      {"quote": "Quote that might support alternative interpretation", "explanation": "2-3 sentences explaining how this quote could support a different assessment of the text's sophistication"},
      {"quote": "Another quote for counter-perspective", "explanation": "2-3 sentences analyzing this quote's potential to challenge the primary assessment"},
      {"quote": "Third quote for dissenting view", "explanation": "2-3 sentences explaining how this quote might support the counter-interpretation"}
    ]
  },
  "superThesis": {
    "title": "SUPER-THESIS: REINFORCED ANALYSIS",
    "reinforcedConfiguration": "FULL PARAGRAPH: 4-6 sentences synthesizing the analysis while addressing counter-arguments, defending the primary assessment, and providing final determination of intellectual sophistication",
    "supportingEvidence": [
      {"quote": "Quote reinforcing primary analysis", "explanation": "2-3 sentences explaining how this quote reinforces the primary assessment despite counter-arguments"},
      {"quote": "Another reinforcing quote", "explanation": "2-3 sentences analyzing how this quote supports the final determination"},
      {"quote": "Final supporting quote", "explanation": "2-3 sentences explaining how this quote confirms the overall intellectual evaluation"}
    ]
  },
  "overallProfile": "2-3 sentences providing comprehensive assessment of intellectual sophistication, theoretical capacity, and cognitive characteristics",
  "reasoning": "FULL PARAGRAPH: 6-8 sentences providing detailed justification for each numerical score, referencing specific textual evidence, explaining the scoring rationale thoroughly, and connecting scores to specific examples from the text"
}`;

  try {
    console.log('🔥 CALLING DeepSeek with COMPREHENSIVE ANALYSIS prompt');
    const rawResponse = await processDeepSeek(revisedPrompt, { temperature: 0.2, maxTokens: 6000 });
    
    console.log('🔥 RAW DEEPSEEK RESPONSE LENGTH:', rawResponse.length);
    console.log('🔥 RAW RESPONSE PREVIEW:', rawResponse.substring(0, 500));
    
    // Extract JSON from response with better parsing
    let jsonString = '';
    let braceCount = 0;
    let startIndex = rawResponse.indexOf('{');
    
    if (startIndex === -1) {
      throw new Error('No valid JSON found in DeepSeek response');
    }
    
    // Find the complete JSON object by counting braces
    for (let i = startIndex; i < rawResponse.length; i++) {
      const char = rawResponse[i];
      jsonString += char;
      
      if (char === '{') {
        braceCount++;
      } else if (char === '}') {
        braceCount--;
        if (braceCount === 0) {
          break;
        }
      }
    }
    
    console.log('🔥 EXTRACTED JSON STRING:', jsonString);
    const parsedResult = JSON.parse(jsonString);
    
    console.log('🔥 PARSED SCORES (NO FILTERING):');
    console.log('AIF:', parsedResult.affirmativeInsightFunction);
    console.log('Intellectual Maturity:', parsedResult.intellectualMaturity);
    console.log('Epistemic Humility:', parsedResult.epistemicHumility);
    console.log('Self-Awareness:', parsedResult.selfAwarenessLevel);
    console.log('Reflective Depth:', parsedResult.reflectiveDepth);
    
    // PURE PASSTHROUGH - NO FILTERING OR MODIFICATION
    return parsedResult;
    
  } catch (error) {
    console.error('🔥 REVISED INTELLIGENCE METRICS ERROR:', error);
    throw new Error(`Failed to generate revised intelligence profile: ${error}`);
  }
}