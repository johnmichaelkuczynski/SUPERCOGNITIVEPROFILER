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
- 90-100: Top 10% of humans, paradigm-breaking minds (Kant, Wittgenstein level)
- 80-89: Sophisticated academic/professional level (advanced graduate work)
- 70-79: Above-average intellectual capacity (solid undergraduate/professional)
- 50-69: Average adult capacity

ESSENTIAL INSTRUCTIONS:
- NO FILTERING - give your authentic assessment
- Sophisticated philosophical writing = 85+ scores
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
    "intellectualConfiguration": "Detailed analysis of intellectual sophistication",
    "supportingEvidence": [
      {"quote": "specific quote", "explanation": "evidence for sophistication"}
    ]
  },
  "antithesis": {
    "title": "ANTITHESIS: DISSENTING ANALYSIS", 
    "counterConfiguration": "Alternative assessment challenging primary",
    "supportingEvidence": [
      {"quote": "specific quote", "explanation": "evidence for alternative view"}
    ]
  },
  "superThesis": {
    "title": "SUPER-THESIS: REINFORCED ANALYSIS",
    "reinforcedConfiguration": "Final assessment defending primary analysis",
    "supportingEvidence": [
      {"quote": "specific quote", "explanation": "reinforcing evidence"}
    ]
  },
  "overallProfile": "Overall assessment of intellectual sophistication and capacity",
  "reasoning": "Explanation of scoring rationale focusing on AIF and sophistication level"
}`;

  try {
    console.log('🔥 CALLING DeepSeek with REVISED INTELLIGENCE METRICS prompt');
    const rawResponse = await processDeepSeek(revisedPrompt, { temperature: 0.2 });
    
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