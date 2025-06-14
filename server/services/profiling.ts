import OpenAI from "openai";
import { storage } from "../storage";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface SupportingEvidence {
  quote: string;
  explanation: string;
}

interface CognitiveProfile {
  intellectualApproach: string;
  reasoningStyle: string;
  problemSolvingPattern: string;
  analyticalDepth: number;
  conceptualIntegration: number;
  logicalStructuring: number;
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

interface PsychologicalProfile {
  emotionalPattern: string;
  motivationalStructure: string;
  interpersonalDynamics: string;
  stressResponsePattern: string;
  communicationStyle: string;
  personalityTraits: string[];
  emotionalIntelligence: number;
  adaptability: number;
  socialOrientation: number;
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
  rationalEmotionalIntegration: number;
  decisionMakingStyle: string;
  stressVsClarity: string;
  creativeRationalFusion: string;
  emotionalReasoningPattern: string;
  intellectualEmpathy: number;
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

// Generate psychological profile from text analysis
async function generatePsychologicalProfile(text: string, isComprehensive: boolean = false): Promise<PsychologicalProfile> {
  const prompt = `You are a psychological profiling agent. You analyze communication patterns to understand the psychology behind how people express themselves.

🚨 ABSOLUTE EVIDENCE REQUIREMENT 🚨
EVERY SINGLE CLAIM YOU MAKE MUST BE SUPPORTED BY:
1. DIRECT QUOTATIONS from the text 
2. DETAILED ARGUMENTS explaining how the quote supports your conclusion
3. CLEAR REASONING chains connecting evidence to psychological patterns

NO UNSUPPORTED STATEMENTS ALLOWED. Every psychological assessment must cite specific text and explain the connection.

TEXT TO ANALYZE:
${text}

ANALYSIS REQUIREMENTS:
- Write detailed, sophisticated psychological analysis 
- Integrate quotations naturally into your analysis
- Explain WHY each quote reveals the psychological pattern you identify
- Build comprehensive arguments connecting language choices to psychological insights
- Focus on what communication patterns reveal about the person's actual psychology

For each field, provide rich analysis that weaves together multiple pieces of evidence with detailed psychological reasoning.

EVIDENCE INTEGRATION FORMAT:
- Use quotations as evidence within flowing analytical prose
- Example: "The speaker's tendency toward systematic thinking emerges in phrases like '[exact quote]', which reveals their preference for structured approaches because [detailed psychological reasoning about why this language choice indicates this pattern]."
- Build comprehensive arguments that cite multiple pieces of evidence
- Connect individual observations to broader psychological patterns

Rate emotional intelligence, adaptability, and social orientation on 1-10 scales based on sophisticated communication analysis.

Return as JSON with this structure:
{
  "emotionalPattern": "Sophisticated analysis of emotional patterns with integrated quotations and detailed reasoning",
  "motivationalStructure": "Deep analysis of motivational drivers with specific textual evidence and psychological arguments", 
  "interpersonalDynamics": "Comprehensive analysis of relationship patterns with quotes and detailed reasoning",
  "stressResponsePattern": "Detailed analysis of stress patterns with specific evidence and psychological explanation",
  "communicationStyle": "Rich analysis of communication psychology with integrated quotes and reasoning",
  "personalityTraits": ["Evidence-based trait 1", "Evidence-based trait 2", "Evidence-based trait 3"],
  "emotionalIntelligence": number,
  "adaptability": number, 
  "socialOrientation": number,
  "psychologicalSignature": "Comprehensive psychological fingerprint with integrated evidence and reasoning",
  "detailedAnalysis": "Extensive narrative analysis weaving together all evidence with sophisticated psychological insights",
  "supportingEvidence": {
    "emotionalPattern": [
      {"quote": "exact quote", "explanation": "detailed psychological analysis of why this quote reveals this emotional pattern"},
      {"quote": "exact quote", "explanation": "detailed psychological analysis of why this quote reveals this emotional pattern"},
      {"quote": "exact quote", "explanation": "detailed psychological analysis of why this quote reveals this emotional pattern"}
    ],
    "motivationalStructure": [
      {"quote": "exact quote", "explanation": "detailed analysis of motivational psychology revealed by this quote"},
      {"quote": "exact quote", "explanation": "detailed analysis of motivational psychology revealed by this quote"},
      {"quote": "exact quote", "explanation": "detailed analysis of motivational psychology revealed by this quote"}
    ],
    "interpersonalDynamics": [
      {"quote": "exact quote", "explanation": "detailed analysis of interpersonal patterns revealed by this quote"},
      {"quote": "exact quote", "explanation": "detailed analysis of interpersonal patterns revealed by this quote"},
      {"quote": "exact quote", "explanation": "detailed analysis of interpersonal patterns revealed by this quote"}
    ],
    "stressResponsePattern": [
      {"quote": "exact quote", "explanation": "detailed analysis of stress response patterns revealed by this quote"},
      {"quote": "exact quote", "explanation": "detailed analysis of stress response patterns revealed by this quote"},
      {"quote": "exact quote", "explanation": "detailed analysis of stress response patterns revealed by this quote"}
    ]
  }
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    throw new Error("Failed to generate psychological profile: " + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

// Generate synthesis profile analyzing intellect/emotion interactions
async function generateSynthesisProfile(text: string, isComprehensive: boolean = false): Promise<SynthesisProfile> {
  const prompt = `You are a SYNTHESIS PROFILER analyzing the integration between intellectual and emotional psychology revealed through communication patterns.

🚨 ABSOLUTE EVIDENCE REQUIREMENT 🚨
EVERY SINGLE CLAIM YOU MAKE MUST BE SUPPORTED BY:
1. DIRECT QUOTATIONS from the text 
2. DETAILED ARGUMENTS explaining how the quote supports your conclusion
3. CLEAR REASONING chains connecting evidence to synthesis patterns

NO UNSUPPORTED STATEMENTS ALLOWED. Every synthesis assessment must cite specific text and explain the connection.

TEXT TO ANALYZE:
${text}

ANALYSIS REQUIREMENTS:
- Write detailed, sophisticated synthesis analysis 
- Integrate quotations naturally into your analysis
- Explain WHY each quote reveals the integration pattern you identify
- Build comprehensive arguments connecting language choices to intellectual-emotional synthesis
- Focus on how cognitive and emotional elements actually integrate in their communication

For each field, provide rich analysis that weaves together multiple pieces of evidence with detailed reasoning about intellectual-emotional integration.

EVIDENCE INTEGRATION FORMAT:
- Use quotations as evidence within flowing analytical prose
- Example: "The speaker's intellectual-emotional balance emerges in phrases like '[exact quote]', which reveals their approach to integrating rational and emotional elements because [detailed reasoning about why this language choice indicates this integration pattern]."
- Build comprehensive arguments that cite multiple pieces of evidence
- Connect individual observations to broader synthesis patterns

Rate rational-emotional integration, intellectual empathy, integration maturity, and authenticity on 1-10 scales.

Return as JSON with this structure:
{
  "intellectEmotionBalance": "Sophisticated analysis of intellectual-emotional balance with integrated quotations and detailed reasoning",
  "rationalEmotionalIntegration": number,
  "decisionMakingStyle": "Deep analysis of decision-making psychology with specific textual evidence and reasoning", 
  "stressVsClarity": "Comprehensive analysis of stress impact on clarity with quotes and detailed reasoning",
  "creativeRationalFusion": "Detailed analysis of creative-rational integration with specific evidence",
  "emotionalReasoningPattern": "Rich analysis of emotional reasoning with integrated quotes and reasoning",
  "intellectualEmpathy": number,
  "synthesisStrengths": ["Evidence-based strength 1", "Evidence-based strength 2", "Evidence-based strength 3"],
  "integrationChallenges": ["Evidence-based challenge 1", "Evidence-based challenge 2"],
  "holisticSignature": "Comprehensive synthesis signature with integrated evidence and reasoning",
  "cognitiveEmotionalArchitecture": "Detailed analysis of cognitive-emotional architecture",
  "authenticityVsPerformance": "Analysis of authenticity vs performance with evidence",
  "stressIntegrationPattern": "Analysis of stress integration patterns",
  "empathyVsManipulation": "Analysis of empathy vs manipulation patterns",
  "balanceVsCompensation": "Analysis of balance vs compensation patterns",
  "synthesisEvolution": "Analysis of synthesis evolution patterns",
  "contextualFlexibility": "Analysis of contextual flexibility",
  "integrationMaturity": number,
  "authenticityScore": number,
  "supportingEvidence": {
    "intellectEmotionBalance": [
      {"quote": "exact quote", "explanation": "detailed analysis of integration pattern revealed by this quote"},
      {"quote": "exact quote", "explanation": "detailed analysis of integration pattern revealed by this quote"},
      {"quote": "exact quote", "explanation": "detailed analysis of integration pattern revealed by this quote"}
    ],
    "decisionMakingStyle": [
      {"quote": "exact quote", "explanation": "detailed analysis of decision-making psychology revealed by this quote"},
      {"quote": "exact quote", "explanation": "detailed analysis of decision-making psychology revealed by this quote"},
      {"quote": "exact quote", "explanation": "detailed analysis of decision-making psychology revealed by this quote"}
    ],
    "emotionalReasoning": [
      {"quote": "exact quote", "explanation": "detailed analysis of emotional reasoning patterns revealed by this quote"},
      {"quote": "exact quote", "explanation": "detailed analysis of emotional reasoning patterns revealed by this quote"},
      {"quote": "exact quote", "explanation": "detailed analysis of emotional reasoning patterns revealed by this quote"}
    ]
  },
  "developmentPathways": ["Evidence-based pathway 1", "Evidence-based pathway 2"],
  "potentialPitfalls": ["Evidence-based pitfall 1", "Evidence-based pitfall 2"],
  "optimalEnvironments": ["Evidence-based environment 1", "Evidence-based environment 2"],
  "collaborationStyle": "Evidence-based collaboration analysis",
  "detailedAnalysis": "Extensive narrative analysis weaving together all evidence with sophisticated synthesis insights"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    throw new Error("Failed to generate synthesis profile: " + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

// Generate metacognitive profile from text analysis
export async function generateMetacognitiveProfile(text: string, isComprehensive: boolean = false): Promise<MetacognitiveProfile> {
  const prompt = `You are a METACOGNITIVE PROFILER analyzing intellectual configuration using dialectical methodology.

🚨 ABSOLUTE EVIDENCE REQUIREMENT 🚨
EVERY SINGLE CLAIM YOU MAKE MUST BE SUPPORTED BY:
1. DIRECT QUOTATIONS from the text 
2. DETAILED ARGUMENTS explaining how the quote supports your conclusion
3. CLEAR REASONING chains connecting evidence to intellectual patterns

NO UNSUPPORTED STATEMENTS ALLOWED. Every metacognitive assessment must cite specific text and explain the connection.

TEXT TO ANALYZE:
${text}

ANALYSIS REQUIREMENTS:
- Write detailed, sophisticated metacognitive analysis using dialectical methodology
- Integrate quotations naturally into your analysis for THESIS, ANTITHESIS, and SUPER-THESIS
- Explain WHY each quote reveals the intellectual pattern you identify
- Build comprehensive arguments connecting language choices to metacognitive insights
- Focus on intellectual configuration, cognitive architecture, and self-awareness

For each dialectical section, provide rich analysis that weaves together multiple pieces of evidence with detailed reasoning about intellectual patterns.

EVIDENCE INTEGRATION FORMAT:
- Use quotations as evidence within flowing analytical prose
- Example: "The speaker's intellectual configuration emerges in phrases like '[exact quote]', which reveals their cognitive architecture because [detailed reasoning about why this language choice indicates this intellectual pattern]."
- Build comprehensive arguments that cite multiple pieces of evidence
- Connect individual observations to broader metacognitive patterns

Use dialectical structure: THESIS → ANTITHESIS → SUPER-THESIS for comprehensive intellectual analysis.

Return as JSON with dialectical structure including thesis, antithesis, and superThesis sections with detailed evidence.`;

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
    throw new Error("Failed to generate metacognitive profile: " + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

// Generate instant profile from a single text sample
export async function generateInstantProfile(
  text: string,
  profileType: 'psychological' | 'synthesis' | 'metacognitive',
  userId: number
): Promise<any> {
  let profile;
  
  if (profileType === 'psychological') {
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
    metadata: JSON.stringify({ timestamp: new Date().toISOString() })
  });

  return profile;
}

export { generatePsychologicalProfile, generateSynthesisProfile };