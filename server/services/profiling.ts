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
  
  const prompt = `You are a Cognitive Profiler.
You are not a summarizer.
You are not a paraphraser.
You are not a surface sentiment analyzer.

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

CRITICAL INSTRUCTIONS:

DO NOT simply paraphrase the content of the text.
DO NOT stop at saying "the author clarifies ambiguity" — say whether they do so with genuine cognitive control.
DO NOT conflate use of big words with cognitive depth.

You must always distinguish between:
- GENUINE cognitive depth
- PSEUDO-intellectual surface performance

MANDATORY OUTPUT REQUIREMENTS:
Explicitly comment on whether the author is demonstrating meta-cognitive awareness and resistance to pseudo-intellectual posturing.
If they are, state this clearly with specific evidence.
If they are not, state this clearly with specific evidence.

DETAILED ANALYSIS REQUIREMENTS:
For each cognitive dimension, you must identify:
- SPECIFIC evidence of the cognitive operation being performed
- HOW the author demonstrates (or fails to demonstrate) genuine intellectual control
- CONCRETE examples that distinguish authentic reasoning from performative complexity
- PRECISE assessment of whether they're clarifying reality or performing sophistication

TEXT TO ANALYZE:
${text.slice(0, 8000)}

6️⃣ PROFILE INFERENCE WITH MANDATORY DEPTH:

DETAILED ANALYSIS REQUIREMENTS:
For each quote you analyze, you must:
1. Identify the SPECIFIC cognitive operation being performed
2. Analyze the EXACT inferential structure and logical transitions
3. Assess the PRECISE conceptual boundaries maintained
4. Evaluate the SPECIFIC epistemic discipline demonstrated
5. Distinguish CONCRETELY between authentic vs. performative complexity

MANDATORY SPECIFICITY REQUIREMENTS:
- Identify SPECIFIC reasoning stages in the argument structure
- Analyze HOW inferential control is maintained throughout each transition
- Describe PRECISELY how concepts are targeted and bounded
- Identify SPECIFIC evidence of epistemic risk awareness and management
- Your analysis must be so detailed it could only apply to THIS particular reasoning pattern

CRITICAL FAILURE MODES TO AVOID:
- Generic statements like "shows epistemic control" without specifying HOW
- Surface paraphrasing disguised as cognitive analysis
- Pattern matching on academic vocabulary instead of modeling actual reasoning process
- Conflating mention of complexity with demonstration of complex thinking
- Any language that could describe any "sophisticated" text generically

You are profiling the specific cognitive architecture revealed by this particular reasoning process.

Rate on 1-10 scale with DETAILED JUSTIFICATION citing specific textual evidence:
- Analytical Depth: Provide specific evidence of reasoning quality vs. performed analysis
- Conceptual Integration: Cite specific examples of precision vs. superficial complexity  
- Logical Structuring: Identify specific evidence of epistemic discipline vs. posturing

Format as JSON with this structure:
{
  "intellectualApproach": "DETAILED MULTI-PARAGRAPH analysis identifying SPECIFIC stages of the argument, HOW epistemic control is maintained, and PRECISE evidence of reasoning discipline vs. performative complexity",
  "reasoningStyle": "DETAILED analysis of EXACT inferential structure, identifying SPECIFIC logical transitions, how claims are warranted, and evidence of genuine vs. superficial analytical thinking",
  "problemSolvingPattern": "DETAILED analysis of SPECIFIC conceptual targeting strategies, HOW boundaries are maintained, evidence of meta-cognitive awareness, and CONCRETE distinction between authentic vs. performative intellectual effort",
  "analyticalDepth": number,
  "conceptualIntegration": number,
  "logicalStructuring": number,
  "strengths": ["SPECIFIC cognitive strengths with detailed textual evidence", "PRECISE reasoning capabilities demonstrated with examples"],
  "growthAreas": ["SPECIFIC cognitive limitations with detailed evidence", "PRECISE epistemic blind spots identified with textual support"],
  "cognitiveSignature": "DETAILED intellectual fingerprint that could only apply to this specific reasoning pattern, citing specific cognitive operations and inferential strategies",
  "detailedAnalysis": "COMPREHENSIVE 4-5 paragraph analysis modeling the specific cognitive architecture revealed: detailed reasoning structure analysis, specific epistemic control evidence, precise conceptual targeting assessment, and concrete cognitive integrity evaluation",
  "supportingEvidence": {
    "intellectualApproach": [
      {"quote": "exact quote from text", "explanation": "DETAILED analysis of the specific cognitive operation performed here, how epistemic control is demonstrated, and what this reveals about reasoning discipline"},
      {"quote": "exact quote from text", "explanation": "SPECIFIC analysis of inferential structure and evidence of genuine vs. pseudo-intellectual approach"}
    ],
    "reasoningStyle": [
      {"quote": "exact quote from text", "explanation": "DETAILED analysis of specific logical transitions, inferential control, and how claims are warranted"},
      {"quote": "exact quote from text", "explanation": "SPECIFIC evidence of reasoning structure quality, identifying exact cognitive operations and their effectiveness"}
    ],
    "problemSolvingPattern": [
      {"quote": "exact quote from text", "explanation": "DETAILED analysis of specific conceptual targeting, how boundaries are maintained, and evidence of meta-cognitive awareness"},
      {"quote": "exact quote from text", "explanation": "SPECIFIC analysis of cognitive integrity vs. intellectual posturing with precise evidence"}
    ]
  }
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 4000,
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
    throw new Error("Failed to generate psychological profile: " + error.message);
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
    throw new Error("Failed to generate comprehensive insights: " + error.message);
  }
}

// Generate instant profile from a single text sample
export async function generateInstantProfile(
  text: string,
  profileType: 'cognitive' | 'psychological' | 'synthesis',
  userId: number
): Promise<any> {
  let profile;
  
  if (profileType === 'cognitive') {
    profile = await generateCognitiveProfile(text, false);
  } else if (profileType === 'psychological') {
    profile = await generatePsychologicalProfile(text, false);
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
  profileType: 'cognitive' | 'psychological' | 'synthesis',
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