import OpenAI from "openai";
import { storage } from "../storage";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

// Generate psychological profile with ABSOLUTE evidence requirements
async function generatePsychologicalProfile(text: string, isComprehensive: boolean = false): Promise<PsychologicalProfile> {
  const prompt = `🚨 ABSOLUTE EVIDENCE MANDATE 🚨

FAILURE TO FOLLOW THESE RULES = COMPLETE FAILURE:

1. EVERY STATEMENT MUST BEGIN WITH: "Quote: '[exact text from source]'"
2. THEN ADD: "→ This demonstrates [pattern] because [reasoning]"
3. THEN ADD: "→ Therefore [conclusion]"

NO EXCEPTIONS. NO GENERAL STATEMENTS. NO SUMMARIES WITHOUT QUOTES.

If you write ANY sentence that doesn't start with "Quote: '[exact text]'", you have FAILED.

TEXT TO ANALYZE:
${text}

You must analyze psychological patterns by starting EVERY analysis with direct quotes.

MANDATORY FORMAT - COPY EXACTLY:

emotionalPattern: "Quote: '[exact quote 1]' → This demonstrates [pattern] because [reasoning] → Therefore [conclusion]. Quote: '[exact quote 2]' → This demonstrates [pattern] because [reasoning] → Therefore [conclusion]. Quote: '[exact quote 3]' → This demonstrates [pattern] because [reasoning] → Therefore [conclusion]."

motivationalStructure: "Quote: '[exact quote 1]' → This demonstrates [pattern] because [reasoning] → Therefore [conclusion]. Quote: '[exact quote 2]' → This demonstrates [pattern] because [reasoning] → Therefore [conclusion]. Quote: '[exact quote 3]' → This demonstrates [pattern] because [reasoning] → Therefore [conclusion]."

interpersonalDynamics: "Quote: '[exact quote 1]' → This demonstrates [pattern] because [reasoning] → Therefore [conclusion]. Quote: '[exact quote 2]' → This demonstrates [pattern] because [reasoning] → Therefore [conclusion]. Quote: '[exact quote 3]' → This demonstrates [pattern] because [reasoning] → Therefore [conclusion]."

stressResponsePattern: "Quote: '[exact quote 1]' → This demonstrates [pattern] because [reasoning] → Therefore [conclusion]. Quote: '[exact quote 2]' → This demonstrates [pattern] because [reasoning] → Therefore [conclusion]. Quote: '[exact quote 3]' → This demonstrates [pattern] because [reasoning] → Therefore [conclusion]."

communicationStyle: "Quote: '[exact quote 1]' → This demonstrates [pattern] because [reasoning] → Therefore [conclusion]. Quote: '[exact quote 2]' → This demonstrates [pattern] because [reasoning] → Therefore [conclusion]. Quote: '[exact quote 3]' → This demonstrates [pattern] because [reasoning] → Therefore [conclusion]."

personalityTraits: ["Quote: '[exact quote]' supports trait [X] because [reasoning]", "Quote: '[exact quote]' supports trait [Y] because [reasoning]", "Quote: '[exact quote]' supports trait [Z] because [reasoning]"]

psychologicalSignature: "Quote: '[exact quote 1]' → This demonstrates [pattern] because [reasoning] → Quote: '[exact quote 2]' → This demonstrates [pattern] because [reasoning] → Therefore overall signature: [conclusion]"

detailedAnalysis: "Quote: '[exact quote 1]' → This demonstrates [pattern] because [reasoning] → Quote: '[exact quote 2]' → This demonstrates [pattern] because [reasoning] → Quote: '[exact quote 3]' → This demonstrates [pattern] because [reasoning] → Therefore [comprehensive conclusion]"

Return JSON format with exact structure above.`;

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

// Generate synthesis profile with ABSOLUTE evidence requirements
async function generateSynthesisProfile(text: string, isComprehensive: boolean = false): Promise<SynthesisProfile> {
  const prompt = `🚨 ABSOLUTE EVIDENCE MANDATE 🚨

FAILURE TO FOLLOW THESE RULES = COMPLETE FAILURE:

1. EVERY STATEMENT MUST BEGIN WITH: "Quote: '[exact text from source]'"
2. THEN ADD: "→ This demonstrates [integration pattern] because [reasoning]"
3. THEN ADD: "→ Therefore [conclusion]"

NO EXCEPTIONS. NO GENERAL STATEMENTS. NO SUMMARIES WITHOUT QUOTES.

If you write ANY sentence that doesn't start with "Quote: '[exact text]'", you have FAILED.

TEXT TO ANALYZE:
${text}

You must analyze intellectual-emotional integration by starting EVERY analysis with direct quotes.

MANDATORY FORMAT - COPY EXACTLY:

intellectEmotionBalance: "Quote: '[exact quote 1]' → This demonstrates [integration pattern] because [reasoning] → Therefore [conclusion]. Quote: '[exact quote 2]' → This demonstrates [pattern] because [reasoning] → Therefore [conclusion]. Quote: '[exact quote 3]' → This demonstrates [pattern] because [reasoning] → Therefore [conclusion]."

decisionMakingStyle: "Quote: '[exact quote 1]' → This demonstrates [decision pattern] because [reasoning] → Therefore [conclusion]. Quote: '[exact quote 2]' → This demonstrates [pattern] because [reasoning] → Therefore [conclusion]. Quote: '[exact quote 3]' → This demonstrates [pattern] because [reasoning] → Therefore [conclusion]."

stressVsClarity: "Quote: '[exact quote 1]' → This demonstrates [stress pattern] because [reasoning] → Therefore [conclusion]. Quote: '[exact quote 2]' → This demonstrates [pattern] because [reasoning] → Therefore [conclusion]. Quote: '[exact quote 3]' → This demonstrates [pattern] because [reasoning] → Therefore [conclusion]."

emotionalReasoningPattern: "Quote: '[exact quote 1]' → This demonstrates [reasoning pattern] because [explanation] → Therefore [conclusion]. Quote: '[exact quote 2]' → This demonstrates [pattern] because [reasoning] → Therefore [conclusion]. Quote: '[exact quote 3]' → This demonstrates [pattern] because [reasoning] → Therefore [conclusion]."

Return JSON format with exact structure above.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    throw new Error("Failed to generate synthesis profile: " + (error instanceof Error).message);
  }
}

// Generate metacognitive profile with ABSOLUTE evidence requirements
export async function generateMetacognitiveProfile(text: string, isComprehensive: boolean = false): Promise<MetacognitiveProfile> {
  const prompt = `🚨 ABSOLUTE EVIDENCE MANDATE 🚨

FAILURE TO FOLLOW THESE RULES = COMPLETE FAILURE:

1. EVERY STATEMENT MUST BEGIN WITH: "Quote: '[exact text from source]'"
2. THEN ADD: "→ This demonstrates [intellectual pattern] because [reasoning]"
3. THEN ADD: "→ Therefore [conclusion]"

NO EXCEPTIONS. NO GENERAL STATEMENTS. NO SUMMARIES WITHOUT QUOTES.

If you write ANY sentence that doesn't start with "Quote: '[exact text]'", you have FAILED.

TEXT TO ANALYZE:
${text}

You must analyze intellectual configuration using dialectical methodology by starting EVERY analysis with direct quotes.

MANDATORY FORMAT FOR THESIS - COPY EXACTLY:

intellectualConfiguration: "Quote: '[exact quote 1]' → This demonstrates [intellectual pattern] because [reasoning] → Therefore [conclusion]. Quote: '[exact quote 2]' → This demonstrates [pattern] because [reasoning] → Therefore [conclusion]. Quote: '[exact quote 3]' → This demonstrates [pattern] because [reasoning] → Therefore [conclusion]."

cognitiveArchitecture: "Quote: '[exact quote 1]' → This demonstrates [cognitive pattern] because [reasoning] → Therefore [conclusion]. Quote: '[exact quote 2]' → This demonstrates [pattern] because [reasoning] → Therefore [conclusion]. Quote: '[exact quote 3]' → This demonstrates [pattern] because [reasoning] → Therefore [conclusion]."

metacognitiveAwareness: "Quote: '[exact quote 1]' → This demonstrates [awareness pattern] because [reasoning] → Therefore [conclusion]. Quote: '[exact quote 2]' → This demonstrates [pattern] because [reasoning] → Therefore [conclusion]. Quote: '[exact quote 3]' → This demonstrates [pattern] because [reasoning] → Therefore [conclusion]."

Use same format for ANTITHESIS and SUPER-THESIS sections.

Return JSON format with dialectical structure (thesis, antithesis, superThesis).`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    throw new Error("Failed to generate metacognitive profile: " + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

// Generate instant profile
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