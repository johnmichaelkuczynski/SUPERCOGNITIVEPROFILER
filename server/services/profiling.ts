import OpenAI from "openai";
import { storage } from "../storage";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface CognitiveProfile {
  intellectualApproach: string;
  reasoningStyle: string;
  problemSolvingPattern: string;
  analyticalDepth: number; // 1-10 scale
  conceptualIntegration: number; // 1-10 scale
  logicalStructuring: number; // 1-10 scale
  strengths: string[];
  growthAreas: string[];
  cognitiveSignature: string;
  detailedAnalysis: string;
  supportingEvidence: {
    intellectualApproach: SupportingEvidence[];
    reasoningStyle: SupportingEvidence[];
    problemSolvingPattern: SupportingEvidence[];
  };
}

interface SupportingEvidence {
  quote: string;
  explanation: string;
}

interface PsychologicalProfile {
  emotionalPattern: string;
  motivationalStructure: string;
  interpersonalDynamics: string;
  stressResponsePattern: string;
  communicationStyle: string;
  personalityTraits: string[];
  emotionalIntelligence: number; // 1-10 scale
  adaptability: number; // 1-10 scale
  socialOrientation: number; // 1-10 scale
  psychologicalSignature: string;
  detailedAnalysis: string;
  supportingEvidence: {
    emotionalPattern: SupportingEvidence[];
    motivationalStructure: SupportingEvidence[];
    interpersonalDynamics: SupportingEvidence[];
    stressResponsePattern: SupportingEvidence[];
  };
}

interface SynthesisProfile {
  intellectEmotionBalance: string;
  rationalEmotionalIntegration: number; // 1-10 scale
  decisionMakingStyle: string;
  stressVsClarity: string;
  creativeRationalFusion: string;
  emotionalReasoningPattern: string;
  intellectualEmpathy: number; // 1-10 scale
  synthesisStrengths: string[];
  integrationChallenges: string[];
  holisticSignature: string;
  cognitiveEmotionalArchitecture: string;
  authenticityVsPerformance: string;
  stressIntegrationPattern: string;
  empathyVsManipulation: string;
  balanceVsCompensation: string;
  synthesisEvolution: string;
  contextualFlexibility: string;
  integrationMaturity: number;
  authenticityScore: number;
  supportingEvidence: {
    intellectEmotionBalance: SupportingEvidence[];
    decisionMakingStyle: SupportingEvidence[];
    emotionalReasoning: SupportingEvidence[];
  };
  developmentPathways: string[];
  potentialPitfalls: string[];
  optimalEnvironments: string[];
  collaborationStyle: string;
  detailedAnalysis: string;
}

interface ComprehensiveInsights {
  overallProfile: string;
  uniqueStrengths: string[];
  developmentAreas: string[];
  riskFactors: string[];
  recommendations: string[];
  compatibility: {
    workEnvironments: string[];
    communicationStyles: string[];
    collaborationPreferences: string[];
  };
}

interface MetacognitiveProfile {
  thesis: {
    title: string;
    intellectualConfiguration: string;
    cognitiveArchitecture: string;
    metacognitiveAwareness: string;
    intellectualHabits: string;
    epistemicVirtues: string;
    reflectiveCapacity: string;
    selfKnowledge: string;
    supportingEvidence: {
      intellectualConfiguration: SupportingEvidence[];
      cognitiveArchitecture: SupportingEvidence[];
      metacognitiveAwareness: SupportingEvidence[];
      intellectualHabits: SupportingEvidence[];
      epistemicVirtues: SupportingEvidence[];
      reflectiveCapacity: SupportingEvidence[];
      selfKnowledge: SupportingEvidence[];
    };
  };
  antithesis: {
    title: string;
    counterConfiguration: string;
    alternativeArchitecture: string;
    limitedAwareness: string;
    problematicHabits: string;
    epistemicVices: string;
    reflectiveLimitations: string;
    selfDeception: string;
    supportingEvidence: {
      counterConfiguration: SupportingEvidence[];
      alternativeArchitecture: SupportingEvidence[];
      limitedAwareness: SupportingEvidence[];
      problematicHabits: SupportingEvidence[];
      epistemicVices: SupportingEvidence[];
      reflectiveLimitations: SupportingEvidence[];
      selfDeception: SupportingEvidence[];
    };
  };
  superThesis: {
    title: string;
    reinforcedConfiguration: string;
    defendedArchitecture: string;
    validatedAwareness: string;
    confirmedHabits: string;
    strengthenedVirtues: string;
    enhancedReflection: string;
    authenticSelfKnowledge: string;
    refutationOfAntithesis: string;
    finalAssessment: string;
    supportingEvidence: {
      reinforcedConfiguration: SupportingEvidence[];
      defendedArchitecture: SupportingEvidence[];
      validatedAwareness: SupportingEvidence[];
      confirmedHabits: SupportingEvidence[];
      strengthenedVirtues: SupportingEvidence[];
      enhancedReflection: SupportingEvidence[];
      authenticSelfKnowledge: SupportingEvidence[];
    };
  };
  overallMetacognitiveProfile: string;
  intellectualMaturity: number;
  selfAwarenessLevel: number;
  epistemicHumility: number;
  reflectiveDepth: number;
}

// Generate synthesis profile analyzing intellect/emotion interactions using dialectical structure
async function generateSynthesisProfile(text: string, isComprehensive: boolean = false): Promise<any> {
  const analysisDepth = isComprehensive ? "comprehensive multi-dimensional" : "focused instant";
  
  const prompt = `You are a SYNTHESIS PROFILER using DIALECTICAL ANALYSIS to examine intellectual-emotional integration patterns.

DIALECTICAL FRAMEWORK MANDATORY: You must provide three complete analyses using the Thesis-Antithesis-Super-Thesis structure.

CRITICAL INSTRUCTION: Analyze intellectual-emotional integration through communication patterns, not stated beliefs. Focus on what the synthesis of reasoning and emotional patterns reveals about how this person's mind actually works.

TEXT TO ANALYZE:
${text.slice(0, 8000)}

DIALECTICAL SYNTHESIS METHODOLOGY:

**THESIS (Primary Synthesis Analysis)**: Initial comprehensive assessment of intellectual-emotional integration patterns
**ANTITHESIS (Dissenting Synthesis Analysis)**: Critical counter-interpretation that challenges the primary analysis
**SUPER-THESIS (Refined Synthesis Assessment)**: Final synthesis that addresses the dissenting view and provides the most accurate understanding

FOR EACH DIALECTICAL COMPONENT, analyze these core synthesis elements:
1. INTELLECTUAL-EMOTIONAL INTEGRATION: How cognitive and emotional patterns actually interact
2. DECISION-MAKING SYNTHESIS: Real integration vs. performed balance in decision processes
3. AUTHENTICITY VS. PERFORMANCE: Genuine integration vs. strategic emotional positioning
4. STRESS-CLARITY DYNAMICS: How integration holds under pressure
5. EMPATHY VS. MANIPULATION: Authentic emotional intelligence vs. strategic positioning
6. COGNITIVE-EMOTIONAL ARCHITECTURE: The actual interface between thinking and feeling systems

SUPPORTING EVIDENCE REQUIREMENTS:
- Provide 2-3 specific quotes for each synthesis component
- Explain how each quote demonstrates the integration pattern
- Show evidence for claims about authentic vs. performed integration

CRITICAL HEURISTICS:
- Over-emphasis on "balance" often indicates imbalance
- Claims of emotional intelligence may mask emotional manipulation
- True synthesis shows natural integration, not forced balance
- Authentic emotional reasoning doesn't need to announce itself

Provide a ${analysisDepth} dialectical analysis with this JSON structure:
{
  "thesis": {
    "title": "🔮 THESIS: PRIMARY SYNTHESIS ANALYSIS",
    "intellectualEmotionalIntegration": "detailed analysis of primary integration pattern",
    "decisionMakingSynthesis": "comprehensive analysis of decision-making integration",
    "authenticityAssessment": "primary assessment of genuine vs. performed integration",
    "stressClarityDynamics": "analysis of how integration functions under pressure",
    "empathyAuthenticity": "assessment of genuine empathy vs. strategic positioning",
    "cognitiveEmotionalArchitecture": "primary understanding of mind's integration structure",
    "rationalEmotionalIntegration": 7,
    "intellectualEmpathy": 8,
    "authenticityScore": 7,
    "supportingEvidence": {
      "intellectualEmotionalIntegration": [{"quote": "specific quote", "explanation": "why this demonstrates integration pattern"}],
      "decisionMakingSynthesis": [{"quote": "specific quote", "explanation": "what this reveals about decision psychology"}],
      "authenticityAssessment": [{"quote": "specific quote", "explanation": "how this shows authentic vs. performed integration"}]
    }
  },
  "antithesis": {
    "title": "⚖️ ANTITHESIS: DISSENTING SYNTHESIS ANALYSIS",
    "intellectualEmotionalIntegration": "alternative interpretation challenging the primary analysis",
    "decisionMakingSynthesis": "contrarian view of decision-making integration",
    "authenticityAssessment": "skeptical assessment questioning apparent integration",
    "stressClarityDynamics": "critical reinterpretation of stress responses",
    "empathyAuthenticity": "alternative view of empathy vs. manipulation",
    "cognitiveEmotionalArchitecture": "dissenting view of integration structure",
    "supportingEvidence": {
      "intellectualEmotionalIntegration": [{"quote": "specific quote", "explanation": "why this challenges the primary interpretation"}],
      "decisionMakingSynthesis": [{"quote": "specific quote", "explanation": "how this suggests different decision patterns"}],
      "authenticityAssessment": [{"quote": "specific quote", "explanation": "evidence for performed rather than authentic integration"}]
    }
  },
  "superThesis": {
    "title": "💎 SUPER-THESIS: REFINED SYNTHESIS ASSESSMENT",
    "intellectualEmotionalIntegration": "final refined understanding addressing both thesis and antithesis",
    "decisionMakingSynthesis": "synthesized view of decision-making integration",
    "authenticityAssessment": "balanced assessment of authentic vs. performed elements",
    "stressClarityDynamics": "refined understanding of integration under pressure",
    "empathyAuthenticity": "nuanced view of empathy authenticity",
    "cognitiveEmotionalArchitecture": "final understanding of integration structure",
    "refinedConclusion": "definitive synthesis assessment integrating all evidence",
    "integrationMaturity": 8,
    "finalAuthenticityScore": 7,
    "supportingEvidence": {
      "intellectualEmotionalIntegration": [{"quote": "specific quote", "explanation": "how this supports the refined understanding"}],
      "decisionMakingSynthesis": [{"quote": "specific quote", "explanation": "evidence for the final decision-making assessment"}],
      "authenticityAssessment": [{"quote": "specific quote", "explanation": "support for the balanced authenticity conclusion"}]
    }
  },
  "synthesisStrengths": ["specific strengths in intellectual-emotional integration", "authentic abilities demonstrated"],
  "integrationChallenges": ["specific integration problems revealed", "actual challenges not self-reported ones"],
  "developmentPathways": ["specific pathways for improving integration", "targeted growth areas"],
  "optimalEnvironments": ["contexts where synthesis works best", "situations supporting integration style"]
}

Make BOLD, DECISIVE conclusions about integration patterns. Don't be timid - drive the analysis to clear, hard conclusions about authentic vs. performed synthesis.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 4000,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result;
  } catch (error) {
    console.error('Error generating synthesis profile:', error);
    throw new Error(`Failed to generate synthesis profile: ${(error as Error).message}`);
  }
}

// Generate cognitive profile from text analysis
async function generateCognitiveProfile(text: string, isComprehensive: boolean = false): Promise<CognitiveProfile> {
  const analysisDepth = isComprehensive ? "comprehensive multi-dimensional" : "focused instant";
  
  const prompt = `You are a Cognitive Profiler employing STRUCTURED ANALYSIS methodology.

STRUCTURED ANALYSIS INSTRUCTION:

For the given text, you must generate three distinct outputs:

1️⃣ PRIMARY ANALYSIS → Your best cognitive read of the text
2️⃣ DISSENTING ANALYSIS → A plausible, well-argued counter-read that challenges your Primary Analysis
3️⃣ SUPER-THESIS → Critique the Dissenting Analysis, defend your Primary Analysis where correct, concede where appropriate, and produce a sharpened, more accurate final assessment

COGNITIVE PROFILING FRAMEWORK:

You are modeling the author's underlying cognitive process — how they think, not what they say.

You must explicitly assess:

1️⃣ Reasoning depth
Is the author maintaining multiple layers of reasoning?
Are conceptual distinctions being carefully managed across the argument?

2️⃣ Epistemic discipline
Is the author aware of epistemic risk (ambiguity, circularity, misuse of concepts)?
Are they proactively managing that risk in their argument?

3️⃣ Meta-cognitive awareness
Is the author showing awareness of the limitations of their own argument or of the tools of analysis?
Are they demonstrating awareness of how explanation itself can go wrong?

4️⃣ Conceptual targeting precision
Are key terms and distinctions precisely defined and maintained?
Is the author resisting slippage between concepts?

5️⃣ Resistance to pseudo-intelligence
Is the author avoiding empty jargon and performative intellectual display?
Are they using concepts to clarify and target reality, rather than to impress or obscure?

CRITICAL ANALYSIS REQUIREMENTS:

MANDATORY STRUCTURE - FOLLOW EXACTLY:

1️⃣ PRIMARY ANALYSIS (THESIS):
Your best initial read of the text. Give your clearest, strongest cognitive profile of the text using your existing profiling instructions. Must identify:
- SPECIFIC evidence of cognitive operations being performed
- HOW the author demonstrates (or fails to demonstrate) genuine intellectual control
- CONCRETE examples that distinguish authentic reasoning from performative complexity
- PRECISE assessment of whether they're clarifying reality or performing sophistication

2️⃣ DISSENTING ANALYSIS (ANTITHESIS):
Generate a well-argued Dissenting Analysis that seriously challenges your Primary Analysis:
- NOT a straw man argument
- Must represent how a highly intelligent critic would attack your Primary Analysis
- Should challenge specific aspects with genuine evidence
- Must consider alternative interpretations of the same textual evidence
- Think: "How would an expert cognitive analyst completely disagree with my reading?"

3️⃣ SUPER-THESIS:
Generate a final assessment that responds to the Dissenting Analysis:
- Defend and refine your Primary Analysis against the critique
- Concede any valid points from the Dissent where appropriate  
- Sharpen your original read to produce a final, stronger profile
- Do NOT simply split the difference - produce a clarified, defensible, high-quality profile
- Must be a STRONGER, more defensible version that withstands intelligent critique

MANDATORY FORMAL DIAGNOSTIC COMPONENTS:
In addition to the Thesis/Antithesis/Super-Thesis structure, you MUST include these six formal diagnostic components:

1️⃣ TYPE OF INTELLIGENCE: Identify what type(s) of intelligence the speaker exhibits (abstract, practical, verbal, social, conceptual, analytic, synthetic, philosophical, emotional, manipulative, pseudo-intellectual, etc.). State this in formal terms.

2️⃣ COMPARISON TO PARADIGM EXAMPLES: How does this person's cognitive style compare to paradigm examples of this intelligence type? Are they weak/strong/mixed? What is distinctive about their style relative to typical strong examples?

3️⃣ UNIQUE STRENGTHS: List unique cognitive strengths evident in this text. Focus on real evidence of unusual competence, not generic praise.

4️⃣ UNIQUE WEAKNESSES: List unique cognitive weaknesses evident in this text. Specify what kind of weaknesses, in what way. Distinguish from typical weaknesses in their intelligence type.

5️⃣ LIKELY CAREER FIT / INTELLECTUAL ECOSYSTEM: What intellectual ecosystem or career would this speaker thrive in? Where would their cognitive style be rewarded vs. a liability?

6️⃣ MOST REVEALING QUOTATION: Select the single most diagnostically revealing quotation from the text. Explain why this quotation reveals the core of their cognitive strengths/weaknesses.

TEXT TO ANALYZE:
${text.slice(0, 8000)}

MANDATORY SPECIFICITY REQUIREMENTS:
- Identify SPECIFIC reasoning stages in the argument structure
- Analyze HOW inferential control is maintained throughout each transition
- Describe PRECISELY how concepts are targeted and bounded
- Identify SPECIFIC evidence of epistemic risk awareness and management
- Your analysis must be so detailed it could only apply to THIS particular reasoning pattern

Rate on 1-10 scale with DETAILED JUSTIFICATION citing specific textual evidence:
- Analytical Depth: Provide specific evidence of reasoning quality vs. performed analysis
- Conceptual Integration: Cite specific examples of precision vs. superficial complexity  
- Logical Structuring: Identify specific evidence of epistemic discipline vs. posturing

YOU MUST RETURN EXACTLY THIS JSON STRUCTURE - NO DEVIATIONS:
{
  "primaryAnalysis": {
    "title": "1️⃣ PRIMARY ANALYSIS (THESIS)",
    "intellectualApproach": "COMPREHENSIVE MULTI-PARAGRAPH analysis identifying SPECIFIC stages of the argument, HOW epistemic control is maintained, and PRECISE evidence of reasoning discipline vs. performative complexity. Must be detailed enough to stand as a complete cognitive assessment.",
    "reasoningStyle": "COMPREHENSIVE analysis of EXACT inferential structure, identifying SPECIFIC logical transitions, how claims are warranted, and evidence of genuine vs. superficial analytical thinking. Include concrete textual examples.", 
    "problemSolvingPattern": "COMPREHENSIVE analysis of SPECIFIC conceptual targeting strategies, HOW boundaries are maintained, evidence of meta-cognitive awareness, and CONCRETE distinction between authentic vs. performative intellectual effort. Cite specific evidence.",
    "analyticalDepth": 8,
    "conceptualIntegration": 7,
    "logicalStructuring": 9,
    "strengths": ["Specific cognitive strength with evidence", "Another specific strength"],
    "growthAreas": ["Specific limitation with evidence", "Another specific area"],
    "cognitiveSignature": "Unique intellectual fingerprint based on analysis",
    "detailedAnalysis": "Comprehensive cognitive architecture analysis",
    "supportingEvidence": {
      "intellectualApproach": [
        {"quote": "exact quote from text", "explanation": "detailed analysis of cognitive operation"},
        {"quote": "exact quote from text", "explanation": "analysis of reasoning discipline"}
      ],
      "reasoningStyle": [
        {"quote": "exact quote from text", "explanation": "analysis of logical transitions"},
        {"quote": "exact quote from text", "explanation": "evidence of analytical thinking"}
      ],
      "problemSolvingPattern": [
        {"quote": "exact quote from text", "explanation": "analysis of conceptual targeting"},
        {"quote": "exact quote from text", "explanation": "evidence of meta-cognitive awareness"}
      ]
    }
  },
  "dissentingAnalysis": {
    "title": "2️⃣ DISSENTING ANALYSIS (ANTITHESIS)",
    "intellectualApproach": "CRITICAL re-examination challenging the primary assessment. What evidence might suggest performative complexity rather than genuine reasoning? Where might the author be displaying conceptual confusion rather than precision?",
    "reasoningStyle": "SKEPTICAL analysis identifying potential weaknesses in inferential structure. Where might logical transitions be superficial? What evidence suggests possible intellectual posturing?",
    "problemSolvingPattern": "CONTRARIAN assessment questioning whether apparent meta-cognitive awareness might be performative. Challenge assumptions about authentic vs. performative intellectual effort.",
    "analyticalDepth": 6,
    "conceptualIntegration": 5,
    "logicalStructuring": 6,
    "strengths": ["Limited strength with counter-evidence", "Questionable strength with critique"],
    "growthAreas": ["Critical weakness with evidence", "Major limitation with analysis"],
    "cognitiveSignature": "Alternative interpretation of cognitive pattern",
    "detailedAnalysis": "Counter-narrative challenging primary conclusions",
    "supportingEvidence": {
      "intellectualApproach": [
        {"quote": "exact quote from text", "explanation": "critical reinterpretation of evidence"},
        {"quote": "exact quote from text", "explanation": "skeptical analysis of reasoning"}
      ],
      "reasoningStyle": [
        {"quote": "exact quote from text", "explanation": "identification of potential weaknesses"},
        {"quote": "exact quote from text", "explanation": "evidence of possible posturing"}
      ],
      "problemSolvingPattern": [
        {"quote": "exact quote from text", "explanation": "contrarian assessment of competence"},
        {"quote": "exact quote from text", "explanation": "challenge to authenticity claims"}
      ]
    }
  },
  "superThesis": {
    "title": "3️⃣ SUPER-THESIS (REFINED JUDGMENT)",
    "intellectualApproach": "DEFEND and REFINE the primary analysis by systematically REFUTING the dissenting analysis. Why does the original assessment remain compelling despite the criticisms? What additional evidence strengthens the primary conclusion?",
    "reasoningStyle": "REINFORCED assessment that addresses dissenting concerns while maintaining the validity of the original reasoning analysis. Provide additional evidence that the primary assessment was correct.",
    "problemSolvingPattern": "STRENGTHENED evaluation that counters dissenting interpretations while refining the original problem-solving assessment. Demonstrate why the primary analysis captures the authentic cognitive pattern.",
    "analyticalDepth": 9,
    "conceptualIntegration": 8,
    "logicalStructuring": 9,
    "strengths": ["Confirmed strength with reinforced evidence", "Validated strength with additional support"],
    "growthAreas": ["Refined limitation with nuanced analysis", "Clarified area with precise assessment"],
    "cognitiveSignature": "Definitive intellectual assessment defending primary conclusions",
    "detailedAnalysis": "Authoritative cognitive profile that withstands critical examination",
    "refinedConclusion": "FINAL authoritative statement defending the primary analysis against all dissenting interpretations",
    "supportingEvidence": {
      "intellectualApproach": [
        {"quote": "exact quote from text", "explanation": "defensive reinforcement of original assessment"},
        {"quote": "exact quote from text", "explanation": "additional evidence supporting primary analysis"}
      ],
      "reasoningStyle": [
        {"quote": "exact quote from text", "explanation": "strengthened reasoning assessment"},
        {"quote": "exact quote from text", "explanation": "refutation of dissenting concerns"}
      ],
      "problemSolvingPattern": [
        {"quote": "exact quote from text", "explanation": "refined evaluation defending authenticity"},
        {"quote": "exact quote from text", "explanation": "conclusive evidence of genuine competence"}
      ]
    }
  },
  "typeOfIntelligence": "FORMAL identification of intelligence type(s): abstract, practical, verbal, social, conceptual, analytic, synthetic, philosophical, emotional, manipulative, pseudo-intellectual, etc. State in formal terms.",
  "comparisonToParadigms": "DETAILED comparison to paradigm examples of this intelligence type. Are they weak/strong/mixed? What is distinctive about their style relative to typical strong examples?",
  "uniqueStrengths": "LIST of unique cognitive strengths evident in this text. Focus on real evidence of unusual competence, not generic praise.",
  "uniqueWeaknesses": "LIST of unique cognitive weaknesses evident in this text. Specify what kind of weaknesses, in what way. Distinguish from typical weaknesses in their intelligence type.",
  "careerFitEcosystem": "ANALYSIS of what intellectual ecosystem or career would this speaker thrive in. Where would their cognitive style be rewarded vs. a liability?",
  "mostRevealingQuotation": "The single most diagnostically revealing quotation from the text with explanation of why this quotation reveals the core of their cognitive strengths/weaknesses."
}

CRITICAL SCORING INSTRUCTIONS - PARADIGM-BASED EVALUATION:
You must analyze THIS SPECIFIC TEXT using paradigm anchors for accurate scoring:

intellectualMaturity (1-100) - Capacity to generate new conceptual architectures:
POPULATION-BASED SCORING (normed against general human population):
- [100] Paradigm: "Pre-Semantic Implicature" critique, "Counterfactuals as crypto-probability" - paradigm-breaking minds (1 in 10,000)
- [90] Top 10% of humans - sophisticated reasoning with theoretical precision
- [70] Unusually thoughtful person, well-read graduate student level
- [50] Average adult cognitive capacity
- [30] Below average reasoning, basic concepts only
SCORING: Most intelligent writing should fall between 60-80. Reserve 100s for paradigm-breaking minds only.

selfAwarenessLevel (1-100) - Locates author within intellectual field:
POPULATION-BASED SCORING (normed against general human population):
- [100] Paradigm: Dennett's Intentional Systems Theory - embedded models of reasoning (1 in 10,000 minds)
- [90] Top 10% of humans - sophisticated metacognitive positioning
- [70] Unusually thoughtful person, good self-awareness
- [50] Average adult self-awareness level
- [30] Poor self-awareness, unaware of limitations
SCORING: Most excellent academic work should fall between 60-80. Reserve 100s for paradigm cases only.

epistemicHumility (1-100) - Clarity about what would falsify theory:
POPULATION-BASED SCORING (normed against general human population):
- [100] Paradigm: System L design "works unless X, at which point it breaks here" (1 in 10,000 minds)
- [90] Top 10% of humans - explicit revision architecture, scientific rigor
- [70] Unusually thoughtful person, acknowledges uncertainty well
- [50] Average adult epistemic awareness
- [30] Overconfident, maximalist claims without humility
SCORING: Most intelligent writing should fall between 60-80. Reserve 100s for paradigm-level epistemic sophistication.

reflectiveDepth (1-100) - Models not just objects, but the models themselves:
POPULATION-BASED SCORING (normed against general human population):
- [100] Paradigm: Morpheme text, Gödel/Escher/Bach, "The Will to Project" - recursive modeling (1 in 10,000 minds)
- [90] Top 10% of humans - models the models themselves, recursive insight
- [70] Unusually thoughtful person, good metacognitive reflection
- [50] Average adult reflective capacity
- [30] Surface-level thinking, no introspection
SCORING: Most excellent academic work should fall between 60-80. Reserve 100s for paradigm cases of recursive modeling only.

PARADIGM EXAMPLES FOR REFERENCE:
- [100] MORPHEME SAMPLE: "The meaning of morpheme (a minimal unit of linguistic significance) cannot diverge from what it is taken to mean. But the meaning of a complex expression can diverge without limit from what it is taken to mean, given that the meaning of such an expression is a logical consequence of the meanings of its parts, coupled with the fact that people are not infallible ratiocinators. Nonetheless, given Chomsky's distinction between competence (ability) and performance (ability to deploy that ability)..." - PARADIGM REFLECTIVE DEPTH 100/100
- [100] PRE-SEMANTIC IMPLICATURE: "In order to understand a sentence, one must know the relevant semantic rules. Those rules are not learned in a vacuum; they are given to one through one's senses..."
- [100] COUNTERFACTUALS: "Ordinarily counterfactuals are seen as making statements about states of affairs, albeit ones that hold in merely possible or alternative worlds..."
- [70] CONDITIONAL DISPOSITION: "Given that an analysis of disposition ascription cannot be made in terms of a simple subjunctive conditional..."
- [60] MACHINE EMOTION: "In this paper I articulate the question of whether machines can have emotions..."

POPULATION-BASED SCORING REQUIREMENTS:
- Use POPULATION-BASED scores normed against general human population, NOT academic standards
- 100/100 = Paradigm-breaking minds like Gödel/Hofstadter (1 in 10,000 humans)
- 90/100 = Top 10% of humans across all domains  
- 80/100 = Strong intellectual sophistication, well above average
- 70/100 = Unusually thoughtful person, graduate student level
- 50/100 = Average adult cognitive capacity
- Most excellent academic work should fall between 60-80

SPECIFIC CALIBRATION EXAMPLES:
- If input text discusses "morpheme meaning," "complex expressions," "logical consequences," "infallible ratiocinators," AND "competence vs performance" → This IS the 100/100 MORPHEME SAMPLE → MUST score 100/100 for reflective depth
- If input text shows recursive modeling (modeling the models themselves) → Score 85-100
- If input text shows semantic layering and epistemic sophistication → Score 70-90
- Standard academic reasoning without recursive depth → Score 60-75
- Average thoughtful writing → Score 50-65

POPULATION CALIBRATION MANDATE:
- 100/100 = Paradigm-level recursive modeling (MORPHEME SAMPLE quality) - 1 in 10,000 minds
- 90/100 = More reflective than 90% of living humans
- 80/100 = Strong conceptual architecture, well above average human
- 70/100 = Unusually thoughtful person level
- 50/100 = Average adult reasoning capacity

CRITICAL: Return JSON with NUMERIC scores (1-100) based on population-normed paradigm comparison.`;

  // DEBUG LOGGING - Step 1: Log the raw input text
  console.log('🔍 METACOGNITIVE PROFILING DEBUG - INPUT TEXT:');
  console.log('Text length:', text.length);
  console.log('First 200 chars:', text.substring(0, 200));
  console.log('Text hash for uniqueness:', text.substring(0, 50).replace(/\s/g, '').toLowerCase());

  // DEBUG LOGGING - Step 2: Log the exact prompt being sent
  console.log('🔍 METACOGNITIVE PROFILING DEBUG - PROMPT BEING SENT:');
  console.log('Prompt length:', prompt.length);
  console.log('Contains scoring instructions:', prompt.includes('intellectualMaturity'));
  console.log('Contains actual text:', prompt.includes(text.substring(0, 50)));

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 8000,
    });

    // DEBUG LOGGING - Step 3: Log the raw LLM response
    const rawResponse = response.choices[0].message.content || "{}";
    console.log('🔍 METACOGNITIVE PROFILING DEBUG - RAW LLM RESPONSE:');
    console.log('Response length:', rawResponse.length);
    console.log('Full raw response:', rawResponse);

    const parsedResult = JSON.parse(rawResponse);
    
    // DEBUG LOGGING - Step 4: Log the parsed scores
    console.log('🔍 METACOGNITIVE PROFILING DEBUG - PARSED SCORES:');
    console.log('intellectualMaturity:', parsedResult.intellectualMaturity, '(type:', typeof parsedResult.intellectualMaturity, ')');
    console.log('selfAwarenessLevel:', parsedResult.selfAwarenessLevel, '(type:', typeof parsedResult.selfAwarenessLevel, ')');
    console.log('epistemicHumility:', parsedResult.epistemicHumility, '(type:', typeof parsedResult.epistemicHumility, ')');
    console.log('reflectiveDepth:', parsedResult.reflectiveDepth, '(type:', typeof parsedResult.reflectiveDepth, ')');
    
    // DEBUG LOGGING - Step 5: Verify scores are not defaults
    const isDefaultScores = (
      parsedResult.intellectualMaturity === 8 && 
      parsedResult.selfAwarenessLevel === 7 && 
      parsedResult.epistemicHumility === 6 && 
      parsedResult.reflectiveDepth === 9
    );
    console.log('🔍 METACOGNITIVE PROFILING DEBUG - DEFAULT SCORES CHECK:', isDefaultScores ? 'WARNING: USING DEFAULT SCORES!' : 'SCORES ARE DYNAMIC');

    // DEBUG LOGGING - Step 6: Check if scores are in old 1-10 scale or new 1-100 scale
    const isOldScale = (
      parsedResult.intellectualMaturity >= 1 && parsedResult.intellectualMaturity <= 10 &&
      parsedResult.selfAwarenessLevel >= 1 && parsedResult.selfAwarenessLevel <= 10 &&
      parsedResult.epistemicHumility >= 1 && parsedResult.epistemicHumility <= 10 &&
      parsedResult.reflectiveDepth >= 1 && parsedResult.reflectiveDepth <= 10
    );
    
    console.log('🔍 SCALE DETECTION:', isOldScale ? 'OLD 1-10 SCALE DETECTED - CONVERTING TO 100-POINT' : 'NEW 100-POINT SCALE DETECTED');
    
    // Convert from 1-10 scale to 1-100 scale if needed
    if (isOldScale) {
      console.log('🔧 CONVERTING SCORES FROM 1-10 TO 1-100 SCALE...');
      console.log('🔧 BEFORE CONVERSION:', {
        intellectualMaturity: parsedResult.intellectualMaturity,
        selfAwarenessLevel: parsedResult.selfAwarenessLevel,
        epistemicHumility: parsedResult.epistemicHumility,
        reflectiveDepth: parsedResult.reflectiveDepth
      });
      
      // Convert 1-10 to 1-100 scale using proper mapping
      parsedResult.intellectualMaturity = Math.round(parsedResult.intellectualMaturity * 10);
      parsedResult.selfAwarenessLevel = Math.round(parsedResult.selfAwarenessLevel * 10);
      parsedResult.epistemicHumility = Math.round(parsedResult.epistemicHumility * 10);
      parsedResult.reflectiveDepth = Math.round(parsedResult.reflectiveDepth * 10);
      
      console.log('🔧 AFTER CONVERSION:', {
        intellectualMaturity: parsedResult.intellectualMaturity,
        selfAwarenessLevel: parsedResult.selfAwarenessLevel,
        epistemicHumility: parsedResult.epistemicHumility,
        reflectiveDepth: parsedResult.reflectiveDepth
      });
    }
    
    // Validate converted scores
    const hasValidScores = (
      typeof parsedResult.intellectualMaturity === 'number' &&
      typeof parsedResult.selfAwarenessLevel === 'number' &&
      typeof parsedResult.epistemicHumility === 'number' &&
      typeof parsedResult.reflectiveDepth === 'number' &&
      parsedResult.intellectualMaturity >= 1 && parsedResult.intellectualMaturity <= 100 &&
      parsedResult.selfAwarenessLevel >= 1 && parsedResult.selfAwarenessLevel <= 100 &&
      parsedResult.epistemicHumility >= 1 && parsedResult.epistemicHumility <= 100 &&
      parsedResult.reflectiveDepth >= 1 && parsedResult.reflectiveDepth <= 100
    );
    
    console.log('🔍 FINAL SCORES VALIDATION:', hasValidScores ? 'VALID 100-POINT SCORES' : 'INVALID SCORES DETECTED');
    
    if (!hasValidScores) {
      console.log('🚨 CRITICAL: Invalid scores detected after conversion');
      console.log('🚨 Raw response content:', rawResponse);
    }

    // DEBUG LOGGING - Step 7: Create execution fingerprint
    const executionFingerprint = {
      textHash: text.substring(0, 50).replace(/\s/g, '').toLowerCase(),
      timestamp: new Date().toISOString(),
      scores: [parsedResult.intellectualMaturity, parsedResult.selfAwarenessLevel, parsedResult.epistemicHumility, parsedResult.reflectiveDepth],
      isDefaultPattern: isDefaultScores,
      promptLength: prompt.length,
      responseLength: rawResponse.length
    };
    
    console.log('🔍 EXECUTION FINGERPRINT:', JSON.stringify(executionFingerprint, null, 2));

    return parsedResult;
  } catch (error) {
    console.error('🔍 METACOGNITIVE PROFILING DEBUG - ERROR:', error);
    console.log('🔍 FALLING BACK TO DEFAULT - THIS SHOULD NOT HAPPEN');
    throw new Error("Failed to generate cognitive profile: " + (error as Error).message);
  }
}

// Generate psychological profile with dialectical structure
async function generatePsychologicalProfile(text: string, isComprehensive: boolean = false): Promise<PsychologicalProfile> {
  const analysisDepth = isComprehensive ? "comprehensive multi-dimensional" : "focused instant";
  
  const prompt = `You are a psychological profiling agent. You do not perform sentiment analysis. You do not perform literal belief extraction. You do not assume that the author sincerely believes what they say.

You must always ask: "What kind of person would choose to say this, in this way, in this context?"
You must never assume that the content of an utterance reflects the author's sincere values or beliefs.

TEXT TO ANALYZE:
${text.slice(0, 8000)}

For every utterance, follow this process:

1. SURFACE PARSING: Parse the literal meaning of the utterance.

2. PLAUSIBILITY MODELING: Ask: Is this a plausible sincere expression of an ordinary person's inner state?
   If NO → mark this utterance as performative/strategic/manipulative candidate.
   If YES → proceed to step 3.

3. SPEECH ACT MODELING: For each utterance, identify the most likely social function:
   - Sincere self-report
   - Virtue-signaling
   - Reputation management
   - Flattery/seduction
   - Threat/dominance display
   - Irony/satire
   - Defensive posturing
   - Identity signaling
   - Other manipulation

4. PROFILE INFERENCE: Only after identifying the speech function, infer personality traits.
   CRITICALLY: if the utterance is marked performative/manipulative, then your inference should focus on the speaker's manipulativeness, social strategy, or likely psychopathic traits — not on the literal content.

HEURISTICS TO APPLY:
- Too good to be true → probably not true
- Unusual moral heroism → probable signaling
- Extreme flattening of complex values → probable signaling or manipulation
- Statements designed to pre-empt social judgment → probable identity performance
- Implausible flattery → probable seduction or manipulation

You are not a belief extractor. You are a profiler of speaker psychology based on how and why they speak as they do.
You must model speech acts first, then profile.
You must explicitly distinguish between what the person says and what kind of person says it.

Provide a ${analysisDepth} psychological profile using the DIALECTICAL STRUCTURE below:

Format as JSON with this EXACT structure:
{
  "thesis": {
    "title": "🧠 THESIS: PRIMARY PSYCHOLOGICAL ANALYSIS",
    "emotionalPattern": "Primary analysis of actual emotional patterns behind speech choices, not content",
    "motivationalStructure": "Primary analysis of what actually drives this person based on speech psychology",
    "interpersonalDynamics": "Primary analysis of how they actually relate to others based on communication strategy",
    "stressResponsePattern": "Primary analysis of actual stress patterns evident in speech choices",
    "communicationStyle": "Primary analysis of actual communication psychology, not surface content",
    "personalityTraits": ["primary traits based on speech psychology", "authentic vs manipulative tendencies"],
    "emotionalIntelligence": number,
    "adaptability": number,
    "socialOrientation": number,
    "psychologicalSignature": "Primary psychological fingerprint based on speech patterns",
    "detailedAnalysis": "Comprehensive primary narrative focusing on psychology behind speech choices",
    "supportingEvidence": {
      "emotionalPattern": [
        {"quote": "exact quote from text", "explanation": "why this speech choice reveals this emotional pattern"},
        {"quote": "another exact quote from text", "explanation": "psychological analysis of word choice reveals"}
      ],
      "motivationalStructure": [
        {"quote": "exact quote from text", "explanation": "what this reveals about actual motivations"},
        {"quote": "another exact quote from text", "explanation": "detailed motivation analysis"}
      ],
      "interpersonalDynamics": [
        {"quote": "exact quote from text", "explanation": "detailed interpersonal pattern explanation"},
        {"quote": "another exact quote from text", "explanation": "relationship approach analysis"}
      ],
      "stressResponsePattern": [
        {"quote": "exact quote from text", "explanation": "stress response indicator analysis"},
        {"quote": "another exact quote from text", "explanation": "coping mechanism explanation"}
      ]
    }
  },
  "antithesis": {
    "title": "🤔 ANTITHESIS: DISSENTING PSYCHOLOGICAL ANALYSIS",
    "emotionalPattern": "ALTERNATIVE interpretation of emotional patterns - challenge the primary analysis with contrarian evidence",
    "motivationalStructure": "CONTRARIAN assessment of motivational drivers - question the primary interpretation",
    "interpersonalDynamics": "SKEPTICAL view of interpersonal patterns - alternative explanation for relationship behaviors",
    "stressResponsePattern": "CRITICAL reinterpretation of stress responses - challenge the primary stress assessment",
    "communicationStyle": "OPPOSING view of communication psychology - question the primary communication analysis",
    "personalityTraits": ["contrarian traits assessment", "challenge to authenticity claims"],
    "emotionalIntelligence": number,
    "adaptability": number,
    "socialOrientation": number,
    "psychologicalSignature": "Alternative psychological interpretation",
    "detailedAnalysis": "Counter-narrative challenging primary psychological conclusions",
    "supportingEvidence": {
      "emotionalPattern": [
        {"quote": "exact quote from text", "explanation": "critical reinterpretation of emotional evidence"},
        {"quote": "exact quote from text", "explanation": "skeptical analysis of emotional claims"}
      ],
      "motivationalStructure": [
        {"quote": "exact quote from text", "explanation": "contrarian motivation assessment"},
        {"quote": "exact quote from text", "explanation": "challenge to motivation interpretation"}
      ],
      "interpersonalDynamics": [
        {"quote": "exact quote from text", "explanation": "alternative interpersonal interpretation"},
        {"quote": "exact quote from text", "explanation": "skeptical relationship analysis"}
      ],
      "stressResponsePattern": [
        {"quote": "exact quote from text", "explanation": "contrarian stress pattern assessment"},
        {"quote": "exact quote from text", "explanation": "challenge to stress response claims"}
      ]
    }
  },
  "superThesis": {
    "title": "3️⃣ SUPER-THESIS: REFINED PSYCHOLOGICAL JUDGMENT",
    "emotionalPattern": "DEFEND and REFINE the primary emotional analysis by systematically REFUTING the dissenting analysis",
    "motivationalStructure": "REINFORCED motivational assessment that addresses dissenting concerns while maintaining validity",
    "interpersonalDynamics": "STRENGTHENED interpersonal evaluation that counters dissenting interpretations",
    "stressResponsePattern": "VALIDATED stress response analysis that withstands critical examination",
    "communicationStyle": "DEFINITIVE communication psychology assessment defending primary conclusions",
    "personalityTraits": ["confirmed traits with reinforced evidence", "validated authenticity assessment"],
    "emotionalIntelligence": number,
    "adaptability": number,
    "socialOrientation": number,
    "psychologicalSignature": "Definitive psychological assessment defending primary conclusions",
    "detailedAnalysis": "Authoritative psychological profile that withstands critical examination",
    "refinedConclusion": "FINAL authoritative statement defending the primary analysis against all dissenting interpretations",
    "supportingEvidence": {
      "emotionalPattern": [
        {"quote": "exact quote from text", "explanation": "defensive reinforcement of emotional assessment"},
        {"quote": "exact quote from text", "explanation": "additional evidence supporting primary analysis"}
      ],
      "motivationalStructure": [
        {"quote": "exact quote from text", "explanation": "strengthened motivation assessment"},
        {"quote": "exact quote from text", "explanation": "refutation of dissenting concerns"}
      ],
      "interpersonalDynamics": [
        {"quote": "exact quote from text", "explanation": "refined interpersonal evaluation"},
        {"quote": "exact quote from text", "explanation": "conclusive relationship pattern evidence"}
      ],
      "stressResponsePattern": [
        {"quote": "exact quote from text", "explanation": "validated stress response assessment"},
        {"quote": "exact quote from text", "explanation": "definitive coping mechanism analysis"}
      ]
    }
  }
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    throw new Error("Failed to generate psychological profile: " + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

// Generate comprehensive insights combining both profiles
async function generateComprehensiveInsights(
  cognitiveProfile: CognitiveProfile,
  psychologicalProfile: PsychologicalProfile,
  originalText: string
): Promise<ComprehensiveInsights> {
  const prompt = `Based on these cognitive and psychological profiles, provide comprehensive insights:

COGNITIVE PROFILE:
${JSON.stringify(cognitiveProfile, null, 2)}

PSYCHOLOGICAL PROFILE:
${JSON.stringify(psychologicalProfile, null, 2)}

ORIGINAL TEXT SAMPLE:
${originalText.slice(0, 2000)}

Provide:
1. An integrated overall profile
2. Unique strengths that emerge from the combination
3. Key development areas to focus on
4. Potential risk factors to monitor
5. Specific recommendations for growth
6. Compatibility insights for work and collaboration

Format as JSON with this structure:
{
  "overallProfile": "integrated narrative",
  "uniqueStrengths": ["strength1", "strength2", ...],
  "developmentAreas": ["area1", "area2", ...],
  "riskFactors": ["risk1", "risk2", ...],
  "recommendations": ["rec1", "rec2", ...],
  "compatibility": {
    "workEnvironments": ["env1", "env2", ...],
    "communicationStyles": ["style1", "style2", ...],
    "collaborationPreferences": ["pref1", "pref2", ...]
  }
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    throw new Error("Failed to generate comprehensive insights: " + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

// Input validation and noise detection - Made more permissive to fix analysis failures
function validateTextQuality(text: string): { isValid: boolean; reason?: string; category: 'analytical' | 'creative' | 'nonsensical' | 'insufficient' } {
  // Basic length check - reduced minimum from 100 to 50
  if (text.length < 50) {
    return { isValid: false, reason: 'Text too short for meaningful analysis', category: 'insufficient' };
  }

  // Count words and sentences
  const words = text.split(/\s+/).filter(word => word.length > 0);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Very lenient gibberish check - reduced threshold
  const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
  if (avgWordLength < 1.5) {
    return { isValid: false, reason: 'Text appears to be gibberish or fragmented', category: 'nonsensical' };
  }

  // More lenient sentence length check
  if (sentences.length > 0) {
    const avgSentenceLength = sentences.reduce((sum, sentence) => sum + sentence.trim().split(/\s+/).length, 0) / sentences.length;
    if (avgSentenceLength < 2) {
      return { isValid: false, reason: 'Text appears fragmented or incomplete', category: 'nonsensical' };
    }
  }

  // Repetition check disabled - was causing too many false positives
  // const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  // const repetitionRatio = uniqueWords.size / words.length;

  // Simple categorization - removed nonsensical markers that were too restrictive
  const analyticalMarkers = ['analysis', 'therefore', 'however', 'furthermore', 'research', 'study', 'evidence', 'conclude', 'hypothesis', 'methodology'];
  const creativeMarkers = ['story', 'character', 'imagine', 'dream', 'fantasy', 'adventure', 'magic', 'journey'];

  const lowerText = text.toLowerCase();
  const analyticalCount = analyticalMarkers.filter(marker => lowerText.includes(marker)).length;
  const creativeCount = creativeMarkers.filter(marker => lowerText.includes(marker)).length;

  // Always return valid for legitimate text - removed overly restrictive nonsense detection
  
  // Categorize valid text
  if (analyticalCount > creativeCount) {
    return { isValid: true, category: 'analytical' };
  } else if (creativeCount > analyticalCount) {
    return { isValid: true, category: 'creative' };
  } else {
    return { isValid: true, category: 'analytical' };
  }
}

// Generate metacognitive profile from text analysis
export async function generateMetacognitiveProfile(text: string, isComprehensive: boolean = false, model: string = 'deepseek'): Promise<MetacognitiveProfile> {
  const analysisDepth = isComprehensive ? "COMPREHENSIVE" : "FOCUSED";
  
  // DEBUG LOGGING - Step 0: Validate input quality
  const validation = validateTextQuality(text);
  console.log('🔍 TEXT QUALITY VALIDATION:');
  console.log('Valid:', validation.isValid);
  console.log('Category:', validation.category);
  console.log('Reason:', validation.reason || 'Text passes quality checks');
  
  if (!validation.isValid) {
    console.log('🚨 REJECTING INVALID TEXT - Preventing meaningless LLM analysis');
    throw new Error(`Text quality validation failed: ${validation.reason}`);
  }
  
  const prompt = `SYSTEM OVERRIDE PROMPT (FOR PASSTHROUGH MODE)
STOP. DO NOT USE ANY INTERNAL SCORING RUBRICS. DO NOT APPLY DEFAULT EVALUATION TEMPLATES. DO NOT HALLUCINATE NUMERICAL SCORES BASED ON SURFACE FEATURES.

You are not evaluating tone, polish, hedging, or self-referential phrases. You are evaluating cognitive structure, based on the following criteria:

1. Intellectual Maturity:
Does the text demonstrate compression, abstraction, and paradigm-challenging insight? Does it build or revise conceptual systems?

2. Self-Awareness:
Does the author reflect on their own method of reasoning or acknowledge their epistemic stance within the argument?

3. Epistemic Humility:
Does the author structure their claims in a way that reflects possible error conditions or evidentiary constraints? Not rhetorical hedging—actual structural defeasibility.

4. Reflective Depth:
Does the author reason about reasoning? Is there recursive epistemic modeling or cross-domain inference?

Assign scores only with respect to the general human population:
5/10 = average adult
7/10 = unusually reflective, but not paradigm-defining
8/10 = sophisticated academic/professional thinking 
9/10 = advanced philosophical/theoretical sophistication (e.g., critiques of Wittgenstein, Brandom, semantic analysis, epistemic operators)
10/10 = comparable to Gödel, Hofstadter, or Freud-level recursion

CRITICAL: Advanced philosophical argumentation about language, meaning, epistemic operators, constitutive vs causal conditions represents top 5-10% of human intellectual capacity and should score 8-9/10 minimum.

SCORING EXAMPLES:
9/10: "epistemic operators can be given either wide or narrow scope", "constitutive vs causally necessary conditions", critiques of Wittgenstein/Brandom, analysis of rule-following arguments
8/10: Sophisticated academic analysis with technical precision, systematic argumentation, theoretical depth
7/10: Graduate-level writing with some technical competence but less theoretical sophistication
5/10: Average adult reasoning without specialized knowledge or systematic analysis

DO NOT inflate scores based on academic tone, verbosity, stylistic hedging, or conventional structure.
DO NOT deflate scores for clarity, density, assertiveness, or lack of first-person phrasing.
DO NOT assume authorial modesty equals depth.

This evaluation concerns the mind behind the prose—not the prose itself. Any deviation from these instructions is unacceptable.

Analyze the following text with ${analysisDepth} depth to understand the author's intellectual configuration from every possible angle:

TEXT TO ANALYZE:
${text.slice(0, 8000)}

CRITICAL REQUIREMENTS:
1. Generate THREE distinct analytical perspectives in dialectical sequence
2. Support each contention with specific quotes and arguments
3. Antithesis must present the most opposed view that aligns with the data
4. Super-Thesis must defend original position and refute antithesis
5. Apply the STRICT SCORING CRITERIA above - evaluate the MIND behind the prose, not stylistic features

RETURN EXACTLY THIS JSON STRUCTURE:
{
  "thesis": {
    "title": "🧠 THESIS: INTELLECTUAL CONFIGURATION ANALYSIS",
    "intellectualConfiguration": "Comprehensive analysis of the person's overall intellectual setup, cognitive style, and mental architecture with specific evidence",
    "cognitiveArchitecture": "Detailed assessment of how their mind processes information, makes connections, and structures knowledge with examples",
    "metacognitiveAwareness": "Analysis of their awareness of their own thinking processes, intellectual strengths/limitations with quotes",
    "intellectualHabits": "Identification of recurring patterns in their thinking, reasoning habits, and cognitive tendencies with evidence",
    "epistemicVirtues": "Assessment of intellectual virtues like curiosity, humility, precision, honesty demonstrated in the text",
    "reflectiveCapacity": "Evaluation of their ability to examine their own beliefs, assumptions, and reasoning processes",
    "selfKnowledge": "Analysis of how well they understand their own intellectual capabilities and limitations",
    "supportingEvidence": {
      "intellectualConfiguration": [
        {"quote": "exact quote", "explanation": "detailed analysis"},
        {"quote": "exact quote", "explanation": "detailed analysis"}
      ],
      "cognitiveArchitecture": [
        {"quote": "exact quote", "explanation": "detailed analysis"},
        {"quote": "exact quote", "explanation": "detailed analysis"}
      ],
      "metacognitiveAwareness": [
        {"quote": "exact quote", "explanation": "detailed analysis"},
        {"quote": "exact quote", "explanation": "detailed analysis"}
      ],
      "intellectualHabits": [
        {"quote": "exact quote", "explanation": "detailed analysis"},
        {"quote": "exact quote", "explanation": "detailed analysis"}
      ],
      "epistemicVirtues": [
        {"quote": "exact quote", "explanation": "detailed analysis"},
        {"quote": "exact quote", "explanation": "detailed analysis"}
      ],
      "reflectiveCapacity": [
        {"quote": "exact quote", "explanation": "detailed analysis"},
        {"quote": "exact quote", "explanation": "detailed analysis"}
      ],
      "selfKnowledge": [
        {"quote": "exact quote", "explanation": "detailed analysis"},
        {"quote": "exact quote", "explanation": "detailed analysis"}
      ]
    }
  },
  "antithesis": {
    "title": "🔄 ANTITHESIS: OPPOSING INTELLECTUAL ASSESSMENT",
    "counterConfiguration": "Most opposed view of their intellectual setup that still aligns with textual data",
    "alternativeArchitecture": "Alternative interpretation of their cognitive processing that challenges the thesis",
    "limitedAwareness": "Evidence suggesting limited metacognitive awareness or self-understanding",
    "problematicHabits": "Identification of potentially problematic thinking patterns or cognitive habits",
    "epistemicVices": "Assessment of intellectual vices like arrogance, closed-mindedness, or imprecision",
    "reflectiveLimitations": "Evidence of limitations in their self-examination capabilities",
    "selfDeception": "Analysis of potential self-deception or blind spots in their self-knowledge",
    "supportingEvidence": {
      "counterConfiguration": [
        {"quote": "exact quote", "explanation": "opposing interpretation"},
        {"quote": "exact quote", "explanation": "opposing interpretation"}
      ],
      "alternativeArchitecture": [
        {"quote": "exact quote", "explanation": "alternative analysis"},
        {"quote": "exact quote", "explanation": "alternative analysis"}
      ],
      "limitedAwareness": [
        {"quote": "exact quote", "explanation": "evidence of limitations"},
        {"quote": "exact quote", "explanation": "evidence of limitations"}
      ],
      "problematicHabits": [
        {"quote": "exact quote", "explanation": "problematic pattern identification"},
        {"quote": "exact quote", "explanation": "problematic pattern identification"}
      ],
      "epistemicVices": [
        {"quote": "exact quote", "explanation": "vice identification"},
        {"quote": "exact quote", "explanation": "vice identification"}
      ],
      "reflectiveLimitations": [
        {"quote": "exact quote", "explanation": "limitation analysis"},
        {"quote": "exact quote", "explanation": "limitation analysis"}
      ],
      "selfDeception": [
        {"quote": "exact quote", "explanation": "blind spot identification"},
        {"quote": "exact quote", "explanation": "blind spot identification"}
      ]
    }
  },
  "superThesis": {
    "title": "⚡ SUPER-THESIS: DEFENDED INTELLECTUAL ASSESSMENT",
    "reinforcedConfiguration": "Defense of original intellectual configuration analysis against antithesis challenges",
    "defendedArchitecture": "Reinforced assessment of cognitive architecture that refutes alternative interpretations",
    "validatedAwareness": "Defense of metacognitive awareness assessment against limitations claims",
    "confirmedHabits": "Validation of positive intellectual habits against problematic pattern claims",
    "strengthenedVirtues": "Reinforced assessment of epistemic virtues that refutes vice claims",
    "enhancedReflection": "Enhanced assessment of reflective capacity that addresses limitation concerns",
    "authenticSelfKnowledge": "Defended assessment of self-knowledge that refutes self-deception claims",
    "refutationOfAntithesis": "Point-by-point refutation of antithesis arguments with additional evidence",
    "finalAssessment": "Definitive intellectual configuration assessment that withstands opposition",
    "supportingEvidence": {
      "reinforcedConfiguration": [
        {"quote": "exact quote", "explanation": "defensive reinforcement"},
        {"quote": "exact quote", "explanation": "defensive reinforcement"}
      ],
      "defendedArchitecture": [
        {"quote": "exact quote", "explanation": "architectural defense"},
        {"quote": "exact quote", "explanation": "architectural defense"}
      ],
      "validatedAwareness": [
        {"quote": "exact quote", "explanation": "awareness validation"},
        {"quote": "exact quote", "explanation": "awareness validation"}
      ],
      "confirmedHabits": [
        {"quote": "exact quote", "explanation": "habit confirmation"},
        {"quote": "exact quote", "explanation": "habit confirmation"}
      ],
      "strengthenedVirtues": [
        {"quote": "exact quote", "explanation": "virtue strengthening"},
        {"quote": "exact quote", "explanation": "virtue strengthening"}
      ],
      "enhancedReflection": [
        {"quote": "exact quote", "explanation": "reflection enhancement"},
        {"quote": "exact quote", "explanation": "reflection enhancement"}
      ],
      "authenticSelfKnowledge": [
        {"quote": "exact quote", "explanation": "authenticity defense"},
        {"quote": "exact quote", "explanation": "authenticity defense"}
      ]
    }
  },
  "overallMetacognitiveProfile": "Comprehensive synthesis of intellectual configuration analysis based on actual text evidence",
  "intellectualMaturity": 0,
  "selfAwarenessLevel": 0, 
  "epistemicHumility": 0,
  "reflectiveDepth": 0
}`;

  try {
    let response;
    
    if (model === 'deepseek') {
      // Use DeepSeek (default)
      console.log('🔍 CALLING DEEPSEEK API...');
      try {
        const { processDeepSeek } = await import('./deepseek');
        response = await processDeepSeek(prompt, { maxTokens: 8000 });
        console.log('🔍 DEEPSEEK RAW RESPONSE LENGTH:', response?.length || 0);
        console.log('🔍 DEEPSEEK RAW RESPONSE:', response?.substring(0, 500) + '...');
      } catch (deepseekError) {
        console.error('❌ DEEPSEEK API ERROR:', deepseekError);
        console.error('❌ DEEPSEEK ERROR DETAILS:', {
          message: deepseekError.message,
          status: deepseekError.status,
          response: deepseekError.response?.data
        });
        throw new Error(`DeepSeek API failed: ${deepseekError.message}`);
      }
      
      // Clean and extract JSON from response
      let cleanResponse = response.trim();
      
      // Remove markdown code blocks
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Extract JSON object from response
      const jsonStart = cleanResponse.indexOf('{');
      const jsonEnd = cleanResponse.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanResponse = cleanResponse.substring(jsonStart, jsonEnd + 1);
      }
      
      console.log('🧹 CLEANED DEEPSEEK JSON:', cleanResponse.substring(0, 200) + '...');
      
      let parsed;
      try {
        parsed = JSON.parse(cleanResponse);
      } catch (parseError) {
        console.error('❌ DEEPSEEK JSON PARSE ERROR:', parseError);
        console.error('❌ FAILED JSON STRING:', cleanResponse);
        throw new Error(`Failed to parse DeepSeek JSON response: ${parseError.message}`);
      }
      
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('DeepSeek returned invalid JSON structure');
      }
      
      // Convert 1-10 scores to 1-100 scale with proper population calibration
      if (parsed.intellectualMaturity) parsed.intellectualMaturity *= 10;
      if (parsed.selfAwarenessLevel) parsed.selfAwarenessLevel *= 10;
      if (parsed.epistemicHumility) parsed.epistemicHumility *= 10;
      if (parsed.reflectiveDepth) parsed.reflectiveDepth *= 10;
      
      return parsed;
    } else if (model === 'claude') {
      // Use Claude via Anthropic
      const anthropic = (await import('@anthropic-ai/sdk')).default;
      const client = new anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
      
      const claudeResponse = await client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 8000,
        messages: [{ role: 'user', content: prompt }]
      });
      
      response = claudeResponse.content[0].type === 'text' ? claudeResponse.content[0].text : '';
      console.log('🔍 CLAUDE RAW RESPONSE:', response);
      
      // Clean and extract JSON from response
      let cleanResponse = response.trim();
      
      // Remove markdown code blocks
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Extract JSON object from response
      const jsonStart = cleanResponse.indexOf('{');
      const jsonEnd = cleanResponse.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanResponse = cleanResponse.substring(jsonStart, jsonEnd + 1);
      }
      
      console.log('🧹 CLEANED CLAUDE JSON:', cleanResponse.substring(0, 200) + '...');
      
      const parsed = JSON.parse(cleanResponse);
      
      // Convert 1-10 scores to 1-100 scale
      if (parsed.intellectualMaturity) parsed.intellectualMaturity *= 10;
      if (parsed.selfAwarenessLevel) parsed.selfAwarenessLevel *= 10;
      if (parsed.epistemicHumility) parsed.epistemicHumility *= 10;
      if (parsed.reflectiveDepth) parsed.reflectiveDepth *= 10;
      
      return parsed;
    } else if (model === 'perplexity') {
      // Use Perplexity
      const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 8000,
          temperature: 0.7,
        }),
      });
      
      if (!perplexityResponse.ok) {
        throw new Error(`Perplexity API error: ${perplexityResponse.statusText}`);
      }
      
      const perplexityData = await perplexityResponse.json();
      response = perplexityData.choices[0].message.content;
      console.log('🔍 PERPLEXITY RAW RESPONSE:', response);
      
      // Clean and extract JSON from response
      let cleanResponse = response.trim();
      
      // Remove markdown code blocks
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Extract JSON object from response
      const jsonStart = cleanResponse.indexOf('{');
      const jsonEnd = cleanResponse.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanResponse = cleanResponse.substring(jsonStart, jsonEnd + 1);
      }
      
      console.log('🧹 CLEANED PERPLEXITY JSON:', cleanResponse.substring(0, 200) + '...');
      
      const parsed = JSON.parse(cleanResponse);
      
      // Convert 1-10 scores to 1-100 scale
      if (parsed.intellectualMaturity) parsed.intellectualMaturity *= 10;
      if (parsed.selfAwarenessLevel) parsed.selfAwarenessLevel *= 10;
      if (parsed.epistemicHumility) parsed.epistemicHumility *= 10;
      if (parsed.reflectiveDepth) parsed.reflectiveDepth *= 10;
      
      return parsed;
    } else {
      // Use GPT-4 (fallback)
      const gptResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.7,
        max_tokens: 8000,
      });
      
      response = gptResponse.choices[0].message.content || "{}";
      console.log('🔍 GPT-4 RAW RESPONSE:', response);
      
      // Clean and extract JSON from response
      let cleanResponse = response.trim();
      
      // Remove markdown code blocks
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // Extract JSON object from response
      const jsonStart = cleanResponse.indexOf('{');
      const jsonEnd = cleanResponse.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanResponse = cleanResponse.substring(jsonStart, jsonEnd + 1);
      }
      
      console.log('🧹 CLEANED GPT-4 JSON:', cleanResponse.substring(0, 200) + '...');
      
      const parsed = JSON.parse(cleanResponse);
      
      // Convert 1-10 scores to 1-100 scale
      if (parsed.intellectualMaturity) parsed.intellectualMaturity *= 10;
      if (parsed.selfAwarenessLevel) parsed.selfAwarenessLevel *= 10;
      if (parsed.epistemicHumility) parsed.epistemicHumility *= 10;
      if (parsed.reflectiveDepth) parsed.reflectiveDepth *= 10;
      
      return parsed;
    }
  } catch (error) {
    console.error('🔍 MODEL ERROR:', error);
    throw new Error("Failed to generate metacognitive profile: " + (error as Error).message);
  }
}

// Generate instant profile from a single text sample
export async function generateInstantProfile(
  text: string,
  profileType: 'cognitive' | 'psychological' | 'synthesis' | 'metacognitive',
  userId: number
): Promise<any> {
  let profile;
  
  if (profileType === 'cognitive') {
    profile = await generateCognitiveProfile(text, false);
  } else if (profileType === 'psychological') {
    profile = await generatePsychologicalProfile(text, false);
  } else if (profileType === 'metacognitive') {
    profile = await generateMetacognitiveProfile(text, false);
  } else {
    profile = await generateSynthesisProfile(text, false);
  }

  // Save to database
  await storage.createProfile({
    userId,
    profileType,
    analysisType: 'instant',
    inputText: text,
    results: profile as any,
    metadata: JSON.stringify({ 
      textLength: text.length,
      generatedAt: new Date().toISOString()
    })
  });

  return profile;
}

// Generate comprehensive profile from all user activity
export async function generateComprehensiveProfile(
  profileType: 'cognitive' | 'psychological' | 'synthesis' | 'metacognitive',
  userId: number
): Promise<any> {
  // Gather all user content
  const documents = await storage.getDocumentsByUserId(userId);
  const conversations = await storage.getConversationsByUserId(userId);
  const rewrites = await storage.getRewritesByUserId(userId);

  // Combine all text content
  let combinedText = '';
  
  // Add document content
  documents.forEach(doc => {
    combinedText += `Document: ${doc.title}\n${doc.content}\n\n`;
  });

  // Add conversation messages
  for (const conversation of conversations) {
    const messages = await storage.getMessagesByConversationId(conversation.id);
    messages.forEach(msg => {
      if (msg.role === 'user') {
        combinedText += `User Message: ${msg.content}\n\n`;
      }
    });
  }

  // Add rewrite content
  rewrites.forEach(rewrite => {
    combinedText += `Original: ${rewrite.originalContent}\nRewritten: ${rewrite.rewrittenContent}\n\n`;
  });

  if (combinedText.length < 100) {
    throw new Error("Insufficient content for comprehensive analysis. Please add more documents or conversations.");
  }

  let profile;
  
  if (profileType === 'cognitive') {
    profile = await generateCognitiveProfile(combinedText, true);
  } else if (profileType === 'psychological') {
    profile = await generatePsychologicalProfile(combinedText, true);
  } else if (profileType === 'metacognitive') {
    profile = await generateMetacognitiveProfile(combinedText, true);
  } else {
    profile = await generateSynthesisProfile(combinedText, true);
  }

  // Save to database
  await storage.createProfile({
    userId,
    profileType,
    analysisType: 'comprehensive',
    inputText: null, // No single input text for comprehensive
    results: profile as any,
    metadata: JSON.stringify({ 
      documentsAnalyzed: documents.length,
      conversationsAnalyzed: conversations.length,
      rewritesAnalyzed: rewrites.length,
      totalTextLength: combinedText.length,
      generatedAt: new Date().toISOString()
    })
  });

  return profile;
}

// Generate combined cognitive + psychological analysis with insights
export async function generateFullProfile(
  text: string,
  userId: number,
  isComprehensive: boolean = false
): Promise<{
  cognitiveProfile: CognitiveProfile;
  psychologicalProfile: PsychologicalProfile;
  comprehensiveInsights: ComprehensiveInsights;
}> {
  let sourceText = text;
  
  if (isComprehensive) {
    // Gather all user content for comprehensive analysis
    const documents = await storage.getDocumentsByUserId(userId);
    const conversations = await storage.getConversationsByUserId(userId);
    const rewrites = await storage.getRewritesByUserId(userId);

    let combinedText = '';
    documents.forEach(doc => {
      combinedText += `Document: ${doc.title}\n${doc.content}\n\n`;
    });

    for (const conversation of conversations) {
      const messages = await storage.getMessagesByConversationId(conversation.id);
      messages.forEach(msg => {
        if (msg.role === 'user') {
          combinedText += `User Message: ${msg.content}\n\n`;
        }
      });
    }

    rewrites.forEach(rewrite => {
      combinedText += `Original: ${rewrite.originalContent}\nRewritten: ${rewrite.rewrittenContent}\n\n`;
    });

    if (combinedText.length > 100) {
      sourceText = combinedText;
    }
  }

  const [cognitiveProfile, psychologicalProfile] = await Promise.all([
    generateCognitiveProfile(sourceText, isComprehensive),
    generatePsychologicalProfile(sourceText, isComprehensive)
  ]);

  const comprehensiveInsights = await generateComprehensiveInsights(
    cognitiveProfile,
    psychologicalProfile,
    sourceText
  );

  // Save both profiles
  const analysisType = isComprehensive ? 'comprehensive' : 'instant';
  const inputText = isComprehensive ? null : text;
  
  await Promise.all([
    storage.createProfile({
      userId,
      profileType: 'cognitive',
      analysisType,
      inputText,
      results: cognitiveProfile as any,
      metadata: JSON.stringify({ 
        textLength: sourceText.length,
        generatedAt: new Date().toISOString(),
        includedInsights: true
      })
    }),
    storage.createProfile({
      userId,
      profileType: 'psychological',
      analysisType,
      inputText,
      results: psychologicalProfile as any,
      metadata: JSON.stringify({ 
        textLength: sourceText.length,
        generatedAt: new Date().toISOString(),
        includedInsights: true
      })
    })
  ]);

  return {
    cognitiveProfile,
    psychologicalProfile,
    comprehensiveInsights
  };
}