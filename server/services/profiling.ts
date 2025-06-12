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
  
  const prompt = `Analyze this writing sample for the synthesis between intellectual and emotional dimensions. Provide a ${analysisDepth} analysis of how reason and emotion interact in this person's thinking.

Writing Sample:
"${text}"

Analyze and provide a JSON response with this structure:
{
  "intellectEmotionBalance": "How the person balances rational thinking with emotional awareness",
  "rationalEmotionalIntegration": 7,
  "decisionMakingStyle": "How they integrate logic and feelings in decisions",
  "stressVsClarity": "How emotional stress affects intellectual clarity",
  "creativeRationalFusion": "How they blend creative/intuitive and analytical thinking",
  "emotionalReasoningPattern": "Pattern of how emotions inform or interfere with reasoning",
  "intellectualEmpathy": 8,
  "synthesisStrengths": ["strength1", "strength2", "strength3"],
  "integrationChallenges": ["challenge1", "challenge2"],
  "holisticSignature": "Overall signature of their mind-heart integration",
  "detailedAnalysis": "Deep analysis of intellect/emotion synthesis patterns"
}

Focus on the dynamic interplay between rational and emotional processing, decision-making patterns, and how this person integrates head and heart in their thinking and expression.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1500,
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
  
  const prompt = `Analyze this writing sample for cognitive and intellectual patterns. Provide a ${analysisDepth} analysis with extensive supporting evidence.

TEXT TO ANALYZE:
${text.slice(0, 8000)}

CRITICAL REQUIREMENTS:
1. For EACH cognitive finding, provide at least 2-3 direct quotes from the text as evidence
2. For EACH quote, provide a detailed explanation of how it demonstrates the cognitive pattern
3. Make the analysis substantial and comprehensive, equivalent in depth to a psychological analysis
4. Focus on deep intellectual insights backed by textual evidence
5. The analysis should be as detailed and substantive as psychological profiling

Analyze in depth:
1. Intellectual Approach: How they approach complex ideas and concepts
2. Reasoning Style: Their pattern of logical thinking and argumentation
3. Problem-Solving Pattern: How they tackle challenges and obstacles
4. Analytical Depth: The sophistication of their analytical thinking
5. Conceptual Integration: How they connect disparate ideas and concepts
6. Logical Structuring: How they organize and present their thoughts
7. Cognitive Strengths: Areas of intellectual excellence
8. Growth Areas: Potential areas for cognitive development
9. Cognitive Signature: Unique intellectual fingerprint

Rate the following on a 1-10 scale with specific textual evidence:
- Analytical Depth: How deeply does this person analyze concepts?
- Conceptual Integration: How well do they connect different ideas?
- Logical Structuring: How systematically do they organize thoughts?

Provide comprehensive supporting evidence with direct quotes and detailed explanations.

Format as JSON with this structure:
{
  "intellectualApproach": "detailed 3-4 paragraph description with specific examples",
  "reasoningStyle": "detailed description of reasoning patterns with examples",
  "problemSolvingPattern": "comprehensive analysis of problem-solving approach",
  "analyticalDepth": number,
  "conceptualIntegration": number,
  "logicalStructuring": number,
  "strengths": ["detailed strength 1", "detailed strength 2", "detailed strength 3"],
  "growthAreas": ["specific area 1", "specific area 2"],
  "cognitiveSignature": "unique defining intellectual characteristic",
  "detailedAnalysis": "comprehensive multi-paragraph narrative analysis of cognitive patterns",
  "supportingEvidence": {
    "intellectualApproach": [
      {"quote": "exact quote from text", "explanation": "detailed explanation of how this demonstrates the pattern"},
      {"quote": "exact quote from text", "explanation": "detailed explanation of how this demonstrates the pattern"}
    ],
    "reasoningStyle": [
      {"quote": "exact quote from text", "explanation": "detailed explanation"},
      {"quote": "exact quote from text", "explanation": "detailed explanation"}
    ],
    "problemSolvingPattern": [
      {"quote": "exact quote from text", "explanation": "detailed explanation"},
      {"quote": "exact quote from text", "explanation": "detailed explanation"}
    ]
  }
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2500,
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    throw new Error("Failed to generate cognitive profile: " + (error as Error).message);
  }
}

// Generate psychological profile from text analysis
async function generatePsychologicalProfile(text: string, isComprehensive: boolean = false): Promise<PsychologicalProfile> {
  const analysisDepth = isComprehensive ? "comprehensive multi-dimensional" : "focused instant";
  
  const prompt = `Analyze this writing sample for psychological and emotional patterns. Provide a ${analysisDepth} analysis with supporting evidence.

TEXT TO ANALYZE:
${text.slice(0, 8000)}

CRITICAL REQUIREMENTS:
1. For EACH psychological finding, provide at least 2-3 direct quotes from the text
2. For EACH quote, provide a detailed explanation of how it supports the analysis
3. Make the analysis substantial and detailed, not lean or superficial
4. Focus on deep psychological insights backed by textual evidence

Analyze:
1. Emotional patterns and motivational structure
2. Interpersonal dynamics and communication style  
3. Stress response patterns and adaptability
4. Personality traits and social orientation
5. Emotional intelligence indicators

Rate the following on a 1-10 scale:
- Emotional Intelligence: How well do they understand and manage emotions?
- Adaptability: How well do they handle change and uncertainty?
- Social Orientation: How much do they focus on relationships vs individual achievement?

Format as JSON with this EXACT structure:
{
  "emotionalPattern": "detailed comprehensive description with specific insights",
  "motivationalStructure": "what drives them - detailed analysis",
  "interpersonalDynamics": "how they relate to others - comprehensive view",
  "stressResponsePattern": "how they handle stress - detailed pattern",
  "communicationStyle": "their communication approach - thorough analysis",
  "personalityTraits": ["trait1", "trait2", "trait3", "trait4", "trait5"],
  "emotionalIntelligence": number,
  "adaptability": number,
  "socialOrientation": number,
  "psychologicalSignature": "unique defining characteristic",
  "detailedAnalysis": "comprehensive narrative analysis",
  "supportingEvidence": {
    "emotionalPattern": [
      {
        "quote": "exact quote from text",
        "explanation": "detailed explanation of how this quote demonstrates the emotional pattern"
      },
      {
        "quote": "another exact quote from text",
        "explanation": "detailed explanation of psychological significance"
      }
    ],
    "motivationalStructure": [
      {
        "quote": "exact quote from text",
        "explanation": "detailed explanation of motivational insight"
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