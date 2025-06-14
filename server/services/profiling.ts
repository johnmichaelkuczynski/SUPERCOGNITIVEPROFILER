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

// Generate synthesis profile analyzing intellect/emotion interactions
async function generateSynthesisProfile(text: string, isComprehensive: boolean = false): Promise<SynthesisProfile> {
  const analysisDepth = isComprehensive ? "comprehensive multi-dimensional" : "focused instant";
  
  const prompt = `You are a SYNTHESIS PROFILER analyzing the integration between intellectual and emotional psychology revealed through communication patterns. You do not analyze literal content or stated beliefs. You analyze what the integration of reasoning and emotional patterns reveals about how this person's mind actually works.

CRITICAL MANDATE: You must be DECISIVE and HARD-HITTING in your conclusions. Do not be timid or bland. Drive your analysis to clear, bold conclusions about this person's intellectual-emotional integration patterns.

You must ask: "What does this communication reveal about how this person actually integrates intellectual and emotional processing?"

TEXT TO ANALYZE:
${text.slice(0, 8000)}

SYNTHESIS PROFILING METHODOLOGY:

1. INTELLECTUAL-EMOTIONAL INTEGRATION ANALYSIS: Examine how cognitive and emotional patterns interact in their communication choices, not their stated integration.

2. AUTHENTIC VS. PERFORMED BALANCE: Distinguish between:
   - Genuine intellectual-emotional integration
   - Strategic emotional manipulation disguised as balance
   - Performed rationality masking emotional dysfunction
   - Authentic emotional intelligence vs. emotional manipulation

3. DECISION-MAKING PSYCHOLOGY: Analyze what their communication reveals about:
   - How they actually process decisions (not how they claim to)
   - Whether emotional and rational elements truly integrate or conflict
   - Their actual stress responses vs. claimed resilience
   - Real vs. performed emotional regulation

4. COMMUNICATION SYNTHESIS PATTERNS: Identify:
   - Whether logical and emotional appeals are strategically deployed or naturally integrated
   - Signs of authentic vs. manipulative emotional reasoning
   - Genuine empathy vs. strategic emotional positioning

CRITICAL HEURISTICS:
- Over-emphasis on "balance" often indicates imbalance
- Claims of emotional intelligence may mask emotional manipulation
- True synthesis shows natural integration, not forced balance
- Authentic emotional reasoning doesn't need to announce itself
- Genuine intellectual empathy shows through natural understanding, not performed concern

SYNTHESIS ANALYSIS REQUIREMENTS:
- Make BOLD, DECISIVE conclusions about their integration patterns
- Identify specific cognitive weaknesses driven by emotional patterns
- Call out emotional strategies that undermine epistemic control
- Provide an overall profile that is direct and uncompromising
- Don't be timid - drive the analysis to clear, hard conclusions

Examples of the kind of decisive conclusions you should make:
- "This pattern shows cognitive weakness driven by emotional self-promotion"
- "The emotional strategy undermines epistemic control"
- "Overall profile: self-referential moral narcissism with shallow cognitive architecture"
- "Emotional reasoning dominates intellectual processing"
- "Poor intellectual-emotional integration masked by performative balance"

Analyze the actual synthesis psychology behind their communication choices with DECISIVE, HARD-HITTING conclusions.

Provide a ${analysisDepth} analysis with this JSON structure:
{
  "intellectEmotionBalance": "detailed analysis of actual intellectual-emotional integration revealed by communication patterns, not claimed balance",
  "rationalEmotionalIntegration": 7,
  "decisionMakingStyle": "comprehensive analysis of actual decision-making psychology revealed by communication choices",
  "stressVsClarity": "detailed analysis of how stress actually affects their communication patterns and thinking clarity",
  "creativeRationalFusion": "analysis of actual creative-rational integration revealed by communication patterns",
  "emotionalReasoningPattern": "comprehensive analysis of how emotions actually influence their reasoning based on communication choices",
  "intellectualEmpathy": 8,
  "synthesisStrengths": ["detailed strengths in intellectual-emotional integration with specific examples", "authentic abilities demonstrated through communication"],
  "integrationChallenges": ["specific integration problems revealed through communication analysis", "actual challenges not self-reported ones"],
  "holisticSignature": "comprehensive signature of intellectual-emotional integration based on communication psychology",
  "cognitiveEmotionalArchitecture": "detailed analysis of how cognitive and emotional systems actually interface in this person's mind",
  "authenticityVsPerformance": "analysis of whether intellectual-emotional integration is genuine or strategically performed",
  "stressIntegrationPattern": "how intellectual and emotional processing changes under pressure based on communication evidence",
  "empathyVsManipulation": "analysis distinguishing genuine empathy from strategic emotional positioning",
  "balanceVsCompensation": "whether apparent balance represents genuine integration or compensatory mechanisms",
  "synthesisEvolution": "how their intellectual-emotional integration appears to develop over time",
  "contextualFlexibility": "how their synthesis adapts to different contexts and audiences",
  "integrationMaturity": 8,
  "authenticityScore": 7,
  "supportingEvidence": {
    "intellectEmotionBalance": [{"quote": "specific quote demonstrating balance or imbalance", "explanation": "why this shows their integration pattern"}],
    "decisionMakingStyle": [{"quote": "quote showing decision process", "explanation": "what this reveals about their decision psychology"}],
    "emotionalReasoning": [{"quote": "quote showing emotional reasoning", "explanation": "how emotions influence their logic"}]
  },
  "developmentPathways": ["specific pathways for improving intellectual-emotional integration", "targeted growth areas"],
  "potentialPitfalls": ["specific risks in their current integration pattern", "areas where synthesis might break down"],
  "optimalEnvironments": ["contexts where their synthesis works best", "situations that support their integration style"],
  "collaborationStyle": "how their intellectual-emotional integration affects their ability to work with others",
  "detailedAnalysis": "comprehensive multi-paragraph analysis focusing on synthesis psychology behind communication choices, including specific examples and evidence"
}

Focus on the dynamic interplay between rational and emotional processing, decision-making patterns, and how this person integrates head and heart in their thinking and expression.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 4000,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result as SynthesisProfile;
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

CRITICAL: ONLY return the JSON structure above. Do not include any other fields at the top level.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 8000,
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    throw new Error("Failed to generate cognitive profile: " + (error as Error).message);
  }
}

// Generate psychological profile from text analysis
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

Provide a ${analysisDepth} psychological profile with supporting evidence showing your reasoning process.

Rate the following on a 1-10 scale:
- Emotional Intelligence: Based on manipulation sophistication and social awareness
- Adaptability: Based on strategic flexibility in communication
- Social Orientation: Based on actual social manipulation vs genuine connection patterns

Format as JSON with this EXACT structure:
{
  "emotionalPattern": "analysis of actual emotional patterns behind speech choices, not content",
  "motivationalStructure": "analysis of what actually drives this person based on speech psychology",
  "interpersonalDynamics": "analysis of how they actually relate to others based on communication strategy",
  "stressResponsePattern": "analysis of actual stress patterns evident in speech choices",
  "communicationStyle": "analysis of actual communication psychology, not surface content",
  "personalityTraits": ["actual traits based on speech psychology", "not literal content", "focus on manipulation vs authenticity"],
  "emotionalIntelligence": number,
  "adaptability": number,
  "socialOrientation": number,
  "psychologicalSignature": "actual psychological fingerprint based on speech patterns",
  "detailedAnalysis": "comprehensive narrative focusing on psychology behind speech choices",
  "supportingEvidence": {
    "emotionalPattern": [
      {
        "quote": "exact quote from text",
        "explanation": "why this speech choice reveals this actual emotional pattern, not what they claim"
      },
      {
        "quote": "another exact quote from text",
        "explanation": "psychological analysis of why they chose these words - what it reveals about them"
      }
    ],
    "motivationalStructure": [
      {
        "quote": "exact quote from text",
        "explanation": "what this reveals about their actual motivations behind saying this"
      },
      {
        "quote": "another exact quote from text", 
        "explanation": "detailed explanation of what this reveals about motivation"
      }
    ],
    "interpersonalDynamics": [
      {
        "quote": "exact quote from text",
        "explanation": "detailed explanation of interpersonal pattern"
      },
      {
        "quote": "another exact quote from text",
        "explanation": "detailed explanation of relationship approach"
      }
    ],
    "stressResponsePattern": [
      {
        "quote": "exact quote from text",
        "explanation": "detailed explanation of stress response indicator"
      },
      {
        "quote": "another exact quote from text",
        "explanation": "detailed explanation of coping mechanism"
      }
    ]
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

// Generate metacognitive profile from text analysis
export async function generateMetacognitiveProfile(text: string, isComprehensive: boolean = false): Promise<MetacognitiveProfile> {
  const analysisDepth = isComprehensive ? "COMPREHENSIVE" : "FOCUSED";
  
  const prompt = `You are a metacognitive analysis expert specializing in intellectual configuration assessment using dialectical analysis.

Analyze the following text with ${analysisDepth} depth to understand the author's intellectual configuration from every possible angle:

TEXT TO ANALYZE:
${text.slice(0, 8000)}

CRITICAL REQUIREMENTS:
1. Generate THREE distinct analytical perspectives in dialectical sequence
2. Support each contention with specific quotes and arguments
3. Antithesis must present the most opposed view that aligns with the data
4. Super-Thesis must defend original position and refute antithesis

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
  "overallMetacognitiveProfile": "Comprehensive synthesis of intellectual configuration analysis",
  "intellectualMaturity": 8,
  "selfAwarenessLevel": 7,
  "epistemicHumility": 6,
  "reflectiveDepth": 9
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 8000,
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
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