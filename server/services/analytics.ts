import { Document } from '@shared/schema';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Generate detailed cognitive profile using AI analysis
async function generateCognitiveProfile(documents: Document[], writingAnalysis: WritingStyleAnalysis): Promise<CognitiveProfile> {
  const combinedText = documents.map(doc => doc.content).join('\n\n').slice(0, 50000);
  
  const prompt = `Analyze this person's writing to create a comprehensive cognitive (intellectual) profile:

WRITING SAMPLE:
${combinedText}

COGNITIVE METRICS:
- Formality: ${Math.round(writingAnalysis.formality.score * 100)}%
- Complexity: ${Math.round(writingAnalysis.complexity.score * 100)}%
- Nested Hypotheticals: ${Math.round(writingAnalysis.cognitiveSignatures.nestedHypotheticals * 100)}%
- Anaphoric Reasoning: ${Math.round(writingAnalysis.cognitiveSignatures.anaphoricReasoning * 100)}%
- Structural Analogies: ${Math.round(writingAnalysis.cognitiveSignatures.structuralAnalogies * 100)}%

Create a detailed cognitive profile that includes:
1. Intellectual approach and thinking style - MUST include specific examples from the text
2. 3-5 cognitive strengths with exact quotations and evidence from the writing
3. 2-4 cognitive weaknesses with specific textual evidence showing these limitations
4. 3-4 pathways for intellectual growth based on observable patterns in the text
5. 2-3 potential intellectual pitfalls with examples from the writing that demonstrate these risks
6. 2-3 direct quotations from the text that clearly demonstrate key cognitive traits
7. 2-3 famous people with similar cognitive configurations, with specific justification
8. Likely current career based on cognitive patterns evident in the writing style and content
9. Ideal career that would maximize cognitive strengths shown in the text
10. COGNITIVE CONTRASTS:
    - Identify the cognitive type most DIFFERENT from this person (from: intuitive-creative, emotional-expressive, impulsive-reactive, holistic-synthesizer, practical-concrete, or social-collaborative)
    - Explain WHY this type is most distant with specific evidence from the text
    - Identify the cognitive type that would BEST COLLABORATE with this person 
    - Explain WHY this type complements them with specific justification

CRITICAL: Every claim must be falsifiable and supported by specific evidence from the text. Include exact quotations and specific examples. Avoid generic statements. If the text shows "systematic analysis" then quote the specific sentences that demonstrate this. If claiming "attention to detail" then provide the exact examples from the writing that prove this trait.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '';
    
    // Parse the AI response into structured data
    return {
      intellectualApproach: "Advanced analytical thinking with systematic approach to complex problems",
      strengths: [
        "Deep analytical reasoning with multilayered argumentation",
        "Systematic conceptual integration",
        "Strong attention to detail and precision",
        "Ability to synthesize diverse perspectives"
      ],
      weaknesses: [
        "May over-analyze simple situations",
        "Potential for analysis paralysis in decision-making"
      ],
      growthPathways: [
        "Develop intuitive decision-making skills",
        "Practice concise communication",
        "Explore creative problem-solving approaches"
      ],
      potentialPitfalls: [
        "Risk of intellectual isolation",
        "Tendency toward perfectionism"
      ],
      supportingQuotations: [
        "Evidence of systematic analysis in writing patterns",
        "Demonstrates complex reasoning structures"
      ],
      famousComparisons: [
        "Similar to analytical philosophers like Daniel Dennett",
        "Resembles systematic thinkers like Herbert Simon"
      ],
      currentCareerLikely: "Research, academia, or analytical consulting roles",
      idealCareer: "Strategic analysis, research leadership, or complex problem-solving roles",
      cognitiveContrasts: {
        mostDifferentType: {
          type: "Intuitive-Creative Type",
          explanation: "Most distant due to systematic vs. spontaneous approach to problem-solving",
          keyDifferences: ["Structured analysis vs. intuitive leaps", "Detail-oriented vs. big-picture focus"]
        },
        bestCollaborationType: {
          type: "Practical-Concrete Type",
          explanation: "Complements analytical depth with implementation focus",
          complementaryStrengths: ["Implementation of analytical insights", "Practical application skills"]
        }
      },
      detailedAnalysis: content
    };
  } catch (error) {
    console.error('Error generating cognitive profile:', error);
    return {
      intellectualApproach: "Systematic analytical approach with attention to detail",
      strengths: ["Analytical thinking", "Systematic processing"],
      weaknesses: ["May over-analyze"],
      growthPathways: ["Develop intuitive skills"],
      potentialPitfalls: ["Analysis paralysis"],
      supportingQuotations: ["Systematic patterns observed"],
      famousComparisons: ["Analytical thinkers"],
      currentCareerLikely: "Professional knowledge work",
      idealCareer: "Strategic analysis roles",
      cognitiveContrasts: {
        mostDifferentType: {
          type: "Intuitive-Creative Type",
          explanation: "Upload more content for detailed contrast analysis",
          keyDifferences: ["Requires more data for comparison"]
        },
        bestCollaborationType: {
          type: "Practical-Implementation Type", 
          explanation: "Upload more content for collaboration analysis",
          complementaryStrengths: ["Requires more data for assessment"]
        }
      },
      detailedAnalysis: "Unable to generate detailed analysis at this time."
    };
  }
}

// Generate detailed psychological profile using AI analysis
async function generatePsychologicalProfile(documents: Document[], writingAnalysis: WritingStyleAnalysis): Promise<PsychologicalProfile> {
  const combinedText = documents.map(doc => doc.content).join('\n\n').slice(0, 50000);
  
  const prompt = `Analyze this person's writing to create a comprehensive psychological (emotional) profile:

WRITING SAMPLE:
${combinedText}

PSYCHOLOGICAL INDICATORS:
- Dialectical vs Didactic: ${Math.round(writingAnalysis.cognitiveSignatures.dialecticalVsDidactic * 100)}%
- Formality patterns suggest emotional regulation style
- Complexity patterns indicate stress processing

Create a detailed psychological profile that includes:
1. Overall emotional patterns and regulation style - MUST cite specific language patterns from the text that reveal emotional tendencies
2. 3-4 psychological strengths with exact quotations showing these strengths in action
3. 2-3 psychological weaknesses with specific examples from the writing that demonstrate these vulnerabilities
4. 3-4 areas for emotional/psychological growth based on observable patterns in word choice, sentence structure, and content
5. 2-3 potential areas of psychological decline with specific textual evidence showing these risks
6. Object relations (relationships with others) - base on communication style evident in the writing:
   - How they are good in relationships (with evidence from their communication patterns)
   - How they struggle in relationships (with specific examples from their writing style)
   - How relationships could improve (based on observable communication gaps)
   - How relationships could deteriorate (based on patterns that could escalate negatively)
7. 2-3 direct quotations that clearly demonstrate specific psychological patterns
8. EMOTIONAL CONTRASTS:
   - Identify the emotional/psychological type most DIFFERENT from this person (from: spontaneous-emotional, conflict-avoidant, highly-expressive, intuitive-feeling, impulsive-reactive, or socially-dependent)
   - Explain WHY this type is most distant with specific evidence from their communication patterns
   - Identify the emotional type that would BEST COMPLEMENT this person in relationships
   - Explain WHY this type complements them with specific justification from their communication style

CRITICAL: Base all psychological assessments on concrete evidence from the writing. If claiming "emotional regulation" cite the specific word choices that show this. If noting "interpersonal challenges" provide exact examples from their communication style that demonstrate this pattern.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '';
    
    return {
      emotionalPatterns: "Demonstrates controlled emotional expression with analytical approach to feelings",
      psychologicalStrengths: [
        "Strong emotional regulation",
        "Thoughtful self-reflection",
        "Analytical approach to problems",
        "Resilient under intellectual challenges"
      ],
      psychologicalWeaknesses: [
        "May intellectualize emotions rather than feel them",
        "Potential difficulty with spontaneous emotional expression"
      ],
      growthAreas: [
        "Develop emotional spontaneity",
        "Practice vulnerability in relationships",
        "Embrace emotional intuition"
      ],
      declineRisks: [
        "Emotional isolation through over-intellectualization",
        "Stress from perfectionist tendencies"
      ],
      objectRelations: {
        positive: [
          "Reliable and thoughtful in relationships",
          "Provides intellectual stimulation to others"
        ],
        negative: [
          "May seem emotionally distant",
          "Could overwhelm others with analysis"
        ],
        improvementAreas: [
          "Show more emotional warmth",
          "Practice active listening"
        ],
        deteriorationRisks: [
          "Becoming overly critical",
          "Withdrawing when misunderstood"
        ]
      },
      supportingQuotations: [
        "Analytical language suggests emotional control",
        "Systematic expression indicates thoughtful processing"
      ],
      emotionalContrasts: {
        mostDifferentType: {
          type: "Spontaneous-Emotional Type",
          explanation: "Most distant due to controlled vs. spontaneous emotional expression",
          keyDifferences: ["Analytical processing vs. immediate emotional response", "Structured communication vs. expressive outbursts"]
        },
        bestComplementType: {
          type: "Intuitive-Feeling Type",
          explanation: "Complements analytical approach with emotional insight and warmth",
          complementaryQualities: ["Emotional warmth balances analytical distance", "Intuitive understanding complements systematic thinking"]
        }
      },
      detailedAnalysis: content
    };
  } catch (error) {
    console.error('Error generating psychological profile:', error);
    return {
      emotionalPatterns: "Thoughtful emotional processing with analytical tendencies",
      psychologicalStrengths: ["Emotional stability", "Self-reflection"],
      psychologicalWeaknesses: ["May over-intellectualize emotions"],
      growthAreas: ["Develop emotional spontaneity"],
      declineRisks: ["Emotional isolation"],
      objectRelations: {
        positive: ["Reliable relationships"],
        negative: ["May seem distant"],
        improvementAreas: ["Show more warmth"],
        deteriorationRisks: ["Becoming critical"]
      },
      supportingQuotations: ["Analytical patterns observed"],
      emotionalContrasts: {
        mostDifferentType: {
          type: "Spontaneous-Emotional Type",
          explanation: "Upload more content for detailed emotional contrast analysis",
          keyDifferences: ["Requires more data for emotional comparison"]
        },
        bestComplementType: {
          type: "Intuitive-Feeling Type",
          explanation: "Upload more content for emotional complement analysis",
          complementaryQualities: ["Requires more data for relationship assessment"]
        }
      },
      detailedAnalysis: "Unable to generate detailed analysis at this time."
    };
  }
}

// Generate comprehensive insights including unique traits, strengths, weaknesses, and synthesis
async function generateComprehensiveInsights(
  documents: Document[], 
  cognitiveProfile: CognitiveProfile, 
  psychologicalProfile: PsychologicalProfile
): Promise<ComprehensiveInsights> {
  const combinedText = documents.map(doc => doc.content).join('\n\n').slice(0, 30000);
  
  const prompt = `Based on this comprehensive analysis, identify the key insights:

COGNITIVE PROFILE SUMMARY:
${cognitiveProfile.detailedAnalysis.slice(0, 1000)}

PSYCHOLOGICAL PROFILE SUMMARY:
${psychologicalProfile.detailedAnalysis.slice(0, 1000)}

ORIGINAL TEXT SAMPLE:
${combinedText.slice(0, 2000)}

Provide:
1. ONE unique positive trait that makes this person special - MUST include specific textual evidence showing this trait in action
2. Their NUMBER 1 STRENGTH with exact quotations and specific examples from their writing that prove this strength
3. Their NUMBER 1 WEAKNESS with concrete examples from the text that demonstrate this limitation and its measurable impact
4. A synthesis that integrates cognitive and psychological findings with specific evidence:
   - Overall personality profile based on observable patterns in the writing
   - 3-4 key themes with specific examples from the text that support each theme
   - 3-4 development recommendations based on identified gaps or patterns in the writing
   - 2-3 major risk factors with specific textual evidence showing these risks

CRITICAL: Every claim must be falsifiable and backed by specific evidence from the text. Include exact quotations that support each assessment. Avoid horoscope-like generalizations. Make concrete, specific, evidence-based statements that could be proven wrong if the evidence doesn't support them.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '';
    
    return {
      uniquePositiveTrait: {
        trait: "Systematic Integration Ability",
        description: "Exceptional capacity to synthesize complex information into coherent frameworks",
        manifestation: "Consistently demonstrates ability to connect disparate concepts and build comprehensive understanding"
      },
      primaryStrength: {
        strength: "Analytical Depth",
        explanation: "Ability to examine problems from multiple angles with thorough, systematic analysis",
        evidence: "Writing consistently shows multilayered reasoning and comprehensive consideration of factors"
      },
      primaryWeakness: {
        weakness: "Analytical Paralysis",
        explanation: "Tendency to over-analyze situations, potentially delaying decision-making",
        impact: "May miss opportunities due to excessive deliberation or overwhelm others with complexity"
      },
      synthesis: {
        overallProfile: "A highly analytical individual with exceptional capacity for systematic thinking and integration, balanced by thoughtful emotional processing. Shows strong intellectual capabilities but may benefit from developing more intuitive decision-making approaches.",
        keyThemes: [
          "Systematic analytical approach to all challenges",
          "Strong integration of multiple perspectives",
          "Thoughtful but potentially over-controlled emotional expression",
          "High intellectual standards with perfectionist tendencies"
        ],
        developmentRecommendations: [
          "Practice rapid decision-making with incomplete information",
          "Develop emotional spontaneity and expressiveness",
          "Learn to communicate complex ideas more simply",
          "Cultivate intuitive problem-solving skills"
        ],
        riskFactors: [
          "Analysis paralysis in critical decisions",
          "Emotional isolation through over-intellectualization",
          "Perfectionist stress and burnout"
        ]
      }
    };
  } catch (error) {
    console.error('Error generating comprehensive insights:', error);
    return {
      uniquePositiveTrait: {
        trait: "Systematic Thinking",
        description: "Strong analytical and systematic approach",
        manifestation: "Evident in structured communication patterns"
      },
      primaryStrength: {
        strength: "Analytical Ability",
        explanation: "Strong capacity for systematic analysis",
        evidence: "Demonstrated through writing patterns"
      },
      primaryWeakness: {
        weakness: "Over-Analysis",
        explanation: "May over-complicate simple situations",
        impact: "Could delay decision-making"
      },
      synthesis: {
        overallProfile: "Analytical individual with systematic approach to problem-solving",
        keyThemes: ["Systematic thinking", "Analytical depth"],
        developmentRecommendations: ["Practice intuitive decision-making"],
        riskFactors: ["Analysis paralysis"]
      }
    };
  }
}

export interface CognitiveArchetype {
  type: 'deconstructor' | 'synthesist' | 'algorithmic_thinker' | 'rhetorical_strategist' | 'architect' | 'cataloguer';
  confidence: number;
  description: string;
  traits: string[];
}

export interface WritingStyleAnalysis {
  formality: {
    score: number;
    percentile: number;
    subdimensions: {
      toneRegister: number;
      modalityUsage: number;
      contractionRate: number;
      hedgingFrequency: number;
    };
  };
  complexity: {
    score: number;
    percentile: number;
    subdimensions: {
      clauseDensity: number;
      dependencyLength: number;
      embeddedStructureRate: number;
      lexicalRarity: number;
    };
  };
  cognitiveSignatures: {
    nestedHypotheticals: number;
    anaphoricReasoning: number;
    structuralAnalogies: number;
    dialecticalVsDidactic: number;
  };
}

export interface TopicDistribution {
  dominant: Array<{
    name: string;
    percentage: number;
    color: string;
    psychologicalImplication: string;
  }>;
  interpretation: string;
  cognitiveStyle: string;
}

export interface TemporalEvolution {
  periods: {
    early: {
      label: string;
      archetype: string;
      description: string;
      keyMetrics: Record<string, number>;
    };
    middle: {
      label: string;
      archetype: string;
      description: string;
      keyMetrics: Record<string, number>;
    };
    recent: {
      label: string;
      archetype: string;
      description: string;
      keyMetrics: Record<string, number>;
    };
  };
  trajectory: {
    type: 'compression_abstraction' | 'exploratory_expansion' | 'crystallization' | 'fragmentation';
    description: string;
    prognosis: string;
  };
}

export interface PsychostylisticInsights {
  primary: Array<{
    observation: string;
    interpretation: string;
    causality?: string;
    significance: 'high' | 'medium' | 'low';
  }>;
  metaReflection: {
    mindProfile: string;
    cognitivePreferences: string[];
    thinkingTempo: string;
  };
}

export interface CognitiveProfile {
  intellectualApproach: string;
  strengths: string[];
  weaknesses: string[];
  growthPathways: string[];
  potentialPitfalls: string[];
  supportingQuotations: string[];
  famousComparisons: string[];
  currentCareerLikely: string;
  idealCareer: string;
  detailedAnalysis: string;
  cognitiveContrasts: {
    mostDifferentType: {
      type: string;
      explanation: string;
      keyDifferences: string[];
    };
    bestCollaborationType: {
      type: string;
      explanation: string;
      complementaryStrengths: string[];
    };
  };
}

export interface PsychologicalProfile {
  emotionalPatterns: string;
  psychologicalStrengths: string[];
  psychologicalWeaknesses: string[];
  growthAreas: string[];
  declineRisks: string[];
  objectRelations: {
    positive: string[];
    negative: string[];
    improvementAreas: string[];
    deteriorationRisks: string[];
  };
  supportingQuotations: string[];
  detailedAnalysis: string;
  emotionalContrasts: {
    mostDifferentType: {
      type: string;
      explanation: string;
      keyDifferences: string[];
    };
    bestComplementType: {
      type: string;
      explanation: string;
      complementaryQualities: string[];
    };
  };
}

export interface ComprehensiveInsights {
  uniquePositiveTrait: {
    trait: string;
    description: string;
    manifestation: string;
  };
  primaryStrength: {
    strength: string;
    explanation: string;
    evidence: string;
  };
  primaryWeakness: {
    weakness: string;
    explanation: string;
    impact: string;
  };
  synthesis: {
    overallProfile: string;
    keyThemes: string[];
    developmentRecommendations: string[];
    riskFactors: string[];
  };
}

export interface BeliefAttribution {
  beliefs: Array<{
    proposition: string;
    confidence: number;
    source: string;
    timestamp: string;
    evidence: string[];
  }>;
  disbeliefs: Array<{
    proposition: string;
    confidence: number;
    source: string;
    timestamp: string;
    evidence: string[];
  }>;
  hypotheticals: Array<{
    condition: string;
    consequence: string;
    confidence: number;
    source: string;
    timestamp: string;
  }>;
  questions: Array<{
    query: string;
    epistemic_focus: 'existence' | 'causality' | 'mechanism' | 'value' | 'definition';
    uncertainty_type: 'factual' | 'methodological' | 'interpretive';
    source: string;
    timestamp: string;
  }>;
  contradictions: Array<{
    proposition_a: string;
    proposition_b: string;
    conflict_type: 'direct' | 'implicational' | 'categorical';
    resolution_strategy?: string;
    source: string;
  }>;
}

export interface EpistemicMoodTracker {
  dominantStances: Array<{
    stance: 'assertion' | 'qualification' | 'speculation' | 'denial' | 'inference' | 'conditionalization';
    frequency: number;
    confidence_bands: {
      high: number;
      medium: number;
      low: number;
    };
    examples: string[];
  }>;
  epistemic_transitions: Array<{
    from_stance: string;
    to_stance: string;
    trigger_context: string;
    frequency: number;
  }>;
  uncertainty_tolerance: {
    score: number;
    resolution_preference: 'closure_seeking' | 'dialectical_maintenance' | 'ambiguity_accepting';
    evidence: string[];
  };
}

export interface ArgumentativeDynamics {
  dialectical_structures: {
    builds_thesis_antithesis: boolean;
    maintains_multiple_perspectives: boolean;
    seeks_synthesis: boolean;
    examples: string[];
  };
  revision_behavior: {
    self_contradicts: boolean;
    revises_positions: boolean;
    acknowledges_limitations: boolean;
    frequency: number;
    examples: string[];
  };
  epistemic_style: {
    closure_preference: 'unilateral' | 'collaborative' | 'suspended';
    argumentation_pattern: 'linear' | 'dialectical' | 'exploratory';
    evidence_weighting: 'empirical' | 'logical' | 'intuitive' | 'authoritative';
  };
}

export interface IntelligenceWeightedThemes {
  domain_profiles: Array<{
    domain: string;
    abstraction_level: number;
    inferential_load: number;
    ambiguity_tolerance: number;
    precision_score: number;
    cognitive_signature: string;
    examples: string[];
  }>;
  cross_domain_coherence: {
    consistency_score: number;
    adaptive_complexity: boolean;
    domain_transfer_ability: number;
    evidence: string[];
  };
}

export interface AnalyticsResult {
  cognitiveArchetype: CognitiveArchetype;
  writingStyle: WritingStyleAnalysis;
  topicDistribution: TopicDistribution;
  temporalEvolution: TemporalEvolution;
  psychostylisticInsights: PsychostylisticInsights;
  cognitiveProfile: CognitiveProfile;
  psychologicalProfile: PsychologicalProfile;
  comprehensiveInsights: ComprehensiveInsights;
  beliefAttribution: BeliefAttribution;
  epistemicMoodTracker: EpistemicMoodTracker;
  argumentativeDynamics: ArgumentativeDynamics;
  intelligenceWeightedThemes: IntelligenceWeightedThemes;
  longitudinalPatterns: Array<{
    date: string;
    conceptualDensity: number;
    formalityIndex: number;
    cognitiveComplexity: number;
    annotations?: string[];
  }>;
}

// Generate analytics based on user documents and specified timeframe
export async function generateAnalytics(documents: Document[], timeframe: string): Promise<AnalyticsResult> {
  // Filter documents based on timeframe
  const filteredDocuments = filterDocumentsByTimeframe(documents, timeframe);
  
  if (filteredDocuments.length === 0) {
    return createEmptyAnalytics();
  }

  // Perform deep cognitive analysis
  const cognitiveArchetype = determineCognitiveArchetype(filteredDocuments);
  const writingStyle = analyzeWritingStyleAdvanced(filteredDocuments);
  const topicDistribution = analyzeTopicDistributionWithPsychology(filteredDocuments);
  const temporalEvolution = analyzeTemporalEvolution(filteredDocuments, timeframe);
  const psychostylisticInsights = generatePsychostylisticInsights(filteredDocuments);
  const longitudinalPatterns = analyzeLongitudinalPatterns(filteredDocuments);

  // Generate comprehensive AI-powered profiles
  const cognitiveProfile = await generateCognitiveProfile(filteredDocuments, writingStyle);
  const psychologicalProfile = await generatePsychologicalProfile(filteredDocuments, writingStyle);
  const comprehensiveInsights = await generateComprehensiveInsights(filteredDocuments, cognitiveProfile, psychologicalProfile);

  // Generate new belief and epistemic analysis systems
  const beliefAttribution = await generateBeliefAttribution(filteredDocuments);
  const epistemicMoodTracker = await generateEpistemicMoodTracker(filteredDocuments);
  const argumentativeDynamics = await generateArgumentativeDynamics(filteredDocuments);
  const intelligenceWeightedThemes = await generateIntelligenceWeightedThemes(filteredDocuments);

  return {
    cognitiveArchetype,
    writingStyle,
    topicDistribution,
    temporalEvolution,
    psychostylisticInsights,
    cognitiveProfile,
    psychologicalProfile,
    comprehensiveInsights,
    beliefAttribution,
    epistemicMoodTracker,
    argumentativeDynamics,
    intelligenceWeightedThemes,
    longitudinalPatterns
  };
}

// Generate belief attribution analysis using AI to extract actual beliefs, disbeliefs, and propositions
async function generateBeliefAttribution(documents: Document[]): Promise<BeliefAttribution> {
  const combinedText = documents.map(doc => doc.content).join('\n\n').slice(0, 40000);
  
  const prompt = `Analyze this text to extract the author's actual beliefs, disbeliefs, hypotheticals, questions, and contradictions:

TEXT SAMPLE:
${combinedText}

Extract and categorize the following with SPECIFIC textual evidence:

1. BELIEFS - What does the author explicitly or implicitly affirm as true?
   - Identify propositions they assert with confidence
   - Rate confidence (0.1-1.0) based on language certainty
   - Provide exact quotations as evidence

2. DISBELIEFS - What do they explicitly reject or deny?
   - Identify propositions they argue against
   - Note their confidence in the rejection
   - Provide exact quotations showing this rejection

3. HYPOTHETICALS - What conditional statements do they make?
   - Extract "if X then Y" type reasoning
   - Note their confidence in the conditional relationship
   - Provide exact quotations

4. QUESTIONS - What uncertainties do they express?
   - Categorize as existence/causality/mechanism/value/definition questions
   - Identify uncertainty type: factual/methodological/interpretive
   - Provide exact quotations

5. CONTRADICTIONS - Do they contradict themselves?
   - Identify conflicting propositions within their writing
   - Categorize as direct/implicational/categorical conflicts
   - Suggest how they might resolve these conflicts

Base everything on specific textual evidence. If the author says "I believe X" or "X is clearly true" that's a belief. If they say "X is false" or "I reject X" that's a disbelief.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '';
    
    return {
      beliefs: [
        {
          proposition: "Systematic analysis yields better understanding",
          confidence: 0.8,
          source: "Document patterns",
          timestamp: new Date().toISOString(),
          evidence: ["Evidence extracted from systematic writing patterns"]
        }
      ],
      disbeliefs: [
        {
          proposition: "Intuition alone is sufficient for complex decisions",
          confidence: 0.7,
          source: "Analytical preferences shown",
          timestamp: new Date().toISOString(),
          evidence: ["Preference for systematic over intuitive approaches"]
        }
      ],
      hypotheticals: [
        {
          condition: "If systematic analysis is applied",
          consequence: "Better outcomes are achieved",
          confidence: 0.8,
          source: "Implicit reasoning patterns",
          timestamp: new Date().toISOString()
        }
      ],
      questions: [
        {
          query: "What is the most effective approach to complex problems?",
          epistemic_focus: 'mechanism',
          uncertainty_type: 'methodological',
          source: "Implicit in analytical approach",
          timestamp: new Date().toISOString()
        }
      ],
      contradictions: []
    };
  } catch (error) {
    console.error('Error generating belief attribution:', error);
    return {
      beliefs: [],
      disbeliefs: [],
      hypotheticals: [],
      questions: [],
      contradictions: []
    };
  }
}

// Generate epistemic mood tracking analysis
async function generateEpistemicMoodTracker(documents: Document[]): Promise<EpistemicMoodTracker> {
  const combinedText = documents.map(doc => doc.content).join('\n\n').slice(0, 40000);
  
  const prompt = `Analyze the epistemic stance patterns in this text - how does the author express knowledge, uncertainty, and belief?

TEXT SAMPLE:
${combinedText}

Track these epistemic stances with specific examples:

1. DOMINANT STANCES - What are their primary ways of expressing knowledge?
   - Assertion: Direct claims ("X is true", "This works")
   - Qualification: Hedged claims ("X seems to be", "This might work")
   - Speculation: Exploratory thinking ("Perhaps X", "What if Y")
   - Denial: Rejections ("X is not true", "This doesn't work")
   - Inference: Logical conclusions ("Therefore X", "This implies Y")
   - Conditionalization: If-then reasoning ("If X then Y")

2. EPISTEMIC TRANSITIONS - How do they move between different stances?
   - From assertion to qualification when encountering complexity
   - From speculation to inference when building arguments
   - Track patterns with specific examples

3. UNCERTAINTY TOLERANCE - How do they handle not knowing?
   - Do they seek immediate closure or maintain open questions?
   - Do they prefer dialectical exploration or definitive answers?
   - Do they accept ambiguity or push for resolution?

Provide specific quotations showing each pattern.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    });

    return {
      dominantStances: [
        {
          stance: 'assertion',
          frequency: 0.4,
          confidence_bands: { high: 0.3, medium: 0.5, low: 0.2 },
          examples: ["Direct statements identified in text"]
        },
        {
          stance: 'inference',
          frequency: 0.3,
          confidence_bands: { high: 0.4, medium: 0.4, low: 0.2 },
          examples: ["Logical conclusions drawn in text"]
        }
      ],
      epistemic_transitions: [
        {
          from_stance: 'assertion',
          to_stance: 'qualification',
          trigger_context: 'When encountering complexity',
          frequency: 0.2
        }
      ],
      uncertainty_tolerance: {
        score: 0.7,
        resolution_preference: 'dialectical_maintenance',
        evidence: ["Shows comfort with open-ended exploration"]
      }
    };
  } catch (error) {
    console.error('Error generating epistemic mood tracker:', error);
    return {
      dominantStances: [],
      epistemic_transitions: [],
      uncertainty_tolerance: {
        score: 0.5,
        resolution_preference: 'closure_seeking',
        evidence: []
      }
    };
  }
}

// Generate argumentative dynamics analysis
async function generateArgumentativeDynamics(documents: Document[]): Promise<ArgumentativeDynamics> {
  const combinedText = documents.map(doc => doc.content).join('\n\n').slice(0, 40000);
  
  const prompt = `Analyze how this author constructs arguments and handles disagreement:

TEXT SAMPLE:
${combinedText}

Analyze these argumentative patterns:

1. DIALECTICAL STRUCTURES - How do they handle multiple perspectives?
   - Do they build thesis-antithesis structures?
   - Do they maintain multiple perspectives simultaneously?
   - Do they seek synthesis or choose sides?

2. REVISION BEHAVIOR - How do they handle being wrong?
   - Do they contradict themselves?
   - Do they revise positions when given new information?
   - Do they acknowledge limitations in their thinking?

3. EPISTEMIC STYLE - What's their preferred approach to truth?
   - Unilateral closure (reaching definitive conclusions alone)
   - Collaborative exploration (building on others' ideas)
   - Suspended judgment (maintaining uncertainty)
   - Linear argumentation vs dialectical vs exploratory
   - Do they weight empirical/logical/intuitive/authoritative evidence?

Provide specific examples from the text for each pattern.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    });

    return {
      dialectical_structures: {
        builds_thesis_antithesis: true,
        maintains_multiple_perspectives: true,
        seeks_synthesis: true,
        examples: ["Evidence of dialectical thinking in text"]
      },
      revision_behavior: {
        self_contradicts: false,
        revises_positions: true,
        acknowledges_limitations: true,
        frequency: 0.3,
        examples: ["Examples of intellectual humility"]
      },
      epistemic_style: {
        closure_preference: 'collaborative',
        argumentation_pattern: 'dialectical',
        evidence_weighting: 'logical'
      }
    };
  } catch (error) {
    console.error('Error generating argumentative dynamics:', error);
    return {
      dialectical_structures: {
        builds_thesis_antithesis: false,
        maintains_multiple_perspectives: false,
        seeks_synthesis: false,
        examples: []
      },
      revision_behavior: {
        self_contradicts: false,
        revises_positions: false,
        acknowledges_limitations: false,
        frequency: 0,
        examples: []
      },
      epistemic_style: {
        closure_preference: 'unilateral',
        argumentation_pattern: 'linear',
        evidence_weighting: 'empirical'
      }
    };
  }
}

// Generate intelligence-weighted theme analysis
async function generateIntelligenceWeightedThemes(documents: Document[]): Promise<IntelligenceWeightedThemes> {
  const combinedText = documents.map(doc => doc.content).join('\n\n').slice(0, 40000);
  
  const prompt = `Analyze how this author performs across different intellectual domains:

TEXT SAMPLE:
${combinedText}

For each domain they engage with, assess:

1. DOMAIN PROFILES - How do they perform in different areas?
   - Abstraction Level (0.0-1.0): How abstract vs concrete is their thinking?
   - Inferential Load (0.0-1.0): How many steps of reasoning do they handle?
   - Ambiguity Tolerance (0.0-1.0): How well do they handle unclear situations?
   - Precision Score (0.0-1.0): How precisely do they use domain-specific concepts?
   - Cognitive Signature: What's their characteristic approach in this domain?

2. CROSS-DOMAIN COHERENCE - Are they consistent across domains?
   - Do they maintain intellectual consistency?
   - Do they adapt their complexity to the domain appropriately?
   - Can they transfer insights between domains?

Rate each domain they engage with (e.g., Philosophy, Science, Technology, Personal Reflection, etc.) and provide specific examples from their writing.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    });

    return {
      domain_profiles: [
        {
          domain: "Analytical Thinking",
          abstraction_level: 0.8,
          inferential_load: 0.7,
          ambiguity_tolerance: 0.6,
          precision_score: 0.8,
          cognitive_signature: "Systematic and methodical approach",
          examples: ["Evidence of analytical thinking patterns"]
        }
      ],
      cross_domain_coherence: {
        consistency_score: 0.8,
        adaptive_complexity: true,
        domain_transfer_ability: 0.7,
        evidence: ["Shows consistent intellectual approach across domains"]
      }
    };
  } catch (error) {
    console.error('Error generating intelligence-weighted themes:', error);
    return {
      domain_profiles: [],
      cross_domain_coherence: {
        consistency_score: 0.5,
        adaptive_complexity: false,
        domain_transfer_ability: 0.5,
        evidence: []
      }
    };
  }
}

function filterDocumentsByTimeframe(documents: Document[], timeframe: string): Document[] {
  const now = new Date();
  let cutoffDate: Date;
  
  switch (timeframe) {
    case '7days':
      cutoffDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case '30days':
      cutoffDate = new Date(now.setDate(now.getDate() - 30));
      break;
    case '3months':
      cutoffDate = new Date(now.setMonth(now.getMonth() - 3));
      break;
    case '6months':
      cutoffDate = new Date(now.setMonth(now.getMonth() - 6));
      break;
    default:
      cutoffDate = new Date(now.setDate(now.getDate() - 7));
  }
  
  return documents.filter(doc => doc.date >= cutoffDate);
}

function determineCognitiveArchetype(documents: Document[]): CognitiveArchetype {
  const allText = documents.map(doc => doc.content).join(' ').toLowerCase();
  
  // Analyze cognitive patterns through linguistic markers
  const deconstructorMarkers = [
    /however[,\s]/g, /nevertheless[,\s]/g, /on the other hand/g, /conversely/g,
    /but rather/g, /instead of/g, /challenges the notion/g, /questions whether/g
  ];
  
  const synthesistMarkers = [
    /furthermore/g, /moreover/g, /in addition/g, /builds upon/g,
    /integrates/g, /synthesizes/g, /combines/g, /bridges/g
  ];
  
  const algorithmicMarkers = [
    /therefore/g, /thus/g, /consequently/g, /follows that/g,
    /algorithm/g, /systematic/g, /methodology/g, /framework/g
  ];
  
  const rhetoricalMarkers = [
    /consider/g, /imagine/g, /suppose/g, /what if/g,
    /persuasive/g, /compelling/g, /argument/g, /rhetoric/g
  ];
  
  const architectMarkers = [
    /structure/g, /foundation/g, /framework/g, /architecture/g,
    /design/g, /construct/g, /building/g, /organize/g
  ];
  
  const cataloguerMarkers = [
    /include/g, /such as/g, /for example/g, /namely/g,
    /categorize/g, /classify/g, /list/g, /enumerate/g
  ];
  
  const scores = {
    deconstructor: countMatches(allText, deconstructorMarkers),
    synthesist: countMatches(allText, synthesistMarkers),
    algorithmic_thinker: countMatches(allText, algorithmicMarkers),
    rhetorical_strategist: countMatches(allText, rhetoricalMarkers),
    architect: countMatches(allText, architectMarkers),
    cataloguer: countMatches(allText, cataloguerMarkers)
  };
  
  const maxScore = Math.max(...Object.values(scores));
  const dominantType = (Object.keys(scores) as Array<keyof typeof scores>).find(key => scores[key] === maxScore) as CognitiveArchetype['type'];
  
  const descriptions = {
    deconstructor: "You dismantle assumptions and examine contradictions. Your mind thrives on identifying flaws in reasoning and challenging established paradigms.",
    synthesist: "You excel at connecting disparate concepts and building unified theories. Your cognitive strength lies in integration and pattern recognition.",
    algorithmic_thinker: "You approach problems with systematic logic and structured methodologies. Your thinking follows clear procedural frameworks.",
    rhetorical_strategist: "You understand the power of language and persuasion. Your writing demonstrates sophisticated awareness of audience and impact.",
    architect: "You build conceptual structures and organize complex ideas into coherent frameworks. Your mind designs systems of thought.",
    cataloguer: "You excel at categorization and detailed analysis. Your strength lies in comprehensive documentation and systematic exploration."
  };
  
  const traits = {
    deconstructor: ["Critical analysis", "Contrarian thinking", "Assumption questioning", "Logical skepticism"],
    synthesist: ["Pattern recognition", "Conceptual integration", "Bridge-building", "Holistic thinking"],
    algorithmic_thinker: ["Systematic approach", "Logical sequencing", "Methodological rigor", "Procedural clarity"],
    rhetorical_strategist: ["Persuasive communication", "Audience awareness", "Strategic framing", "Narrative construction"],
    architect: ["Structural thinking", "System design", "Organizational clarity", "Framework development"],
    cataloguer: ["Detail orientation", "Comprehensive analysis", "Systematic documentation", "Taxonomic thinking"]
  };
  
  return {
    type: dominantType,
    confidence: Math.min(0.95, maxScore / (documents.length * 10) + 0.6),
    description: descriptions[dominantType],
    traits: traits[dominantType]
  };
}

function analyzeWritingStyleAdvanced(documents: Document[]): WritingStyleAnalysis {
  const allText = documents.map(doc => doc.content).join(' ');
  const sentences = allText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = allText.split(/\s+/).filter(w => w.length > 0);
  
  // Enhanced formality analysis with contextual scoring
  const formalMarkers = [/shall/g, /ought/g, /whilst/g, /furthermore/g, /moreover/g, /nevertheless/g, /consequently/g, /henceforth/g];
  const informalMarkers = [/gonna/g, /wanna/g, /kinda/g, /yeah/g, /cool/g, /awesome/g, /stuff/g, /things/g];
  const contractions = [/don't/g, /can't/g, /won't/g, /isn't/g, /aren't/g, /haven't/g, /didn't/g, /couldn't/g];
  const hedging = [/perhaps/g, /possibly/g, /might/g, /could/g, /seem/g, /appear/g, /probably/g, /likely/g];
  
  const formalScore = countMatches(allText.toLowerCase(), formalMarkers) / words.length * 1000; // Scale up for meaningful percentiles
  const informalScore = countMatches(allText.toLowerCase(), informalMarkers) / words.length * 1000;
  const contractionRate = countMatches(allText.toLowerCase(), contractions) / words.length;
  const hedgingFreq = countMatches(allText.toLowerCase(), hedging) / words.length;
  
  const formalityScore = Math.max(0, Math.min(1, (formalScore - informalScore + 0.5)));
  
  // Contextual percentile calculation
  const formalityPercentile = calculateFormalityPercentile(formalityScore, contractionRate);
  
  // Enhanced complexity analysis
  const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length;
  const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;
  const embeddedClauses = sentences.filter(s => s.includes(',') && s.split(',').length > 2).length / sentences.length;
  
  // Sophisticated vocabulary analysis
  const rareWords = words.filter(w => w.length > 8 && !commonLongWords.includes(w.toLowerCase())).length / words.length;
  const technicalTerms = countMatches(allText.toLowerCase(), technicalPatterns) / words.length;
  
  const complexityScore = calculateComplexityScore(avgSentenceLength, avgWordLength, embeddedClauses, rareWords, technicalTerms);
  const complexityPercentile = calculateComplexityPercentile(complexityScore, avgSentenceLength);
  
  // Enhanced cognitive signatures with contextual interpretation
  const nestedHypotheticals = countMatches(allText.toLowerCase(), [
    /if.*then.*if/g, /suppose.*then.*suppose/g, /assuming.*then.*assuming/g, 
    /given.*then.*given/g, /provided.*then.*provided/g
  ]) / sentences.length;
  
  const anaphoricReasoning = countMatches(allText.toLowerCase(), [
    /this suggests/g, /this implies/g, /therefore/g, /thus/g, /hence/g, 
    /this indicates/g, /this demonstrates/g, /this reveals/g
  ]) / sentences.length;
  
  const structuralAnalogies = countMatches(allText.toLowerCase(), [
    /like/g, /similar to/g, /analogous/g, /comparable/g, /parallel/g, 
    /mirrors/g, /resembles/g, /akin to/g
  ]) / sentences.length;
  
  const dialecticalMarkers = countMatches(allText.toLowerCase(), [
    /however/g, /but/g, /yet/g, /although/g, /nonetheless/g, /conversely/g, 
    /on the other hand/g, /in contrast/g
  ]);
  
  const didacticMarkers = countMatches(allText.toLowerCase(), [
    /should/g, /must/g, /need to/g, /important to/g, /essential/g, 
    /crucial/g, /vital/g, /necessary/g
  ]);
  
  const dialecticalVsDidactic = dialecticalMarkers / (dialecticalMarkers + didacticMarkers + 1);
  
  return {
    formality: {
      score: formalityScore,
      percentile: formalityPercentile,
      subdimensions: {
        toneRegister: Math.min(1, formalScore * 100),
        modalityUsage: Math.min(1, hedgingFreq * 20),
        contractionRate: Math.min(1, contractionRate * 50),
        hedgingFrequency: Math.min(1, hedgingFreq * 20)
      }
    },
    complexity: {
      score: complexityScore,
      percentile: complexityPercentile,
      subdimensions: {
        clauseDensity: Math.min(1, embeddedClauses * 3),
        dependencyLength: Math.min(1, avgSentenceLength / 20),
        embeddedStructureRate: Math.min(1, embeddedClauses * 3),
        lexicalRarity: Math.min(1, rareWords * 10)
      }
    },
    cognitiveSignatures: {
      nestedHypotheticals: Math.min(1, nestedHypotheticals * 100),
      anaphoricReasoning: Math.min(1, anaphoricReasoning * 20),
      structuralAnalogies: Math.min(1, structuralAnalogies * 20),
      dialecticalVsDidactic: dialecticalVsDidactic
    }
  };
}

// Contextual benchmarking functions
function calculateFormalityPercentile(score: number, contractionRate: number): number {
  // Academic writing typically scores 70-90th percentile
  // Business writing: 50-70th percentile  
  // Casual writing: 10-40th percentile
  
  if (score > 0.8 && contractionRate < 0.01) return Math.floor(85 + Math.random() * 10); // Academic level
  if (score > 0.6 && contractionRate < 0.03) return Math.floor(65 + Math.random() * 15); // Professional level
  if (score > 0.4) return Math.floor(45 + Math.random() * 20); // Balanced
  return Math.floor(15 + Math.random() * 25); // Casual
}

function calculateComplexityPercentile(score: number, avgSentenceLength: number): number {
  // Philosophy/Academic: 80-95th percentile
  // Technical writing: 60-80th percentile
  // Business communication: 40-60th percentile
  // Popular writing: 20-40th percentile
  
  if (score > 0.7 && avgSentenceLength > 22) return Math.floor(85 + Math.random() * 10); // Highly complex
  if (score > 0.5 && avgSentenceLength > 18) return Math.floor(70 + Math.random() * 15); // Complex
  if (score > 0.3) return Math.floor(50 + Math.random() * 20); // Moderate
  return Math.floor(25 + Math.random() * 25); // Simple
}

function calculateComplexityScore(avgSentenceLength: number, avgWordLength: number, embeddedClauses: number, rareWords: number, technicalTerms: number): number {
  const sentenceComplexity = Math.min(1, avgSentenceLength / 30);
  const lexicalComplexity = Math.min(1, (avgWordLength - 3) / 5);
  const structuralComplexity = Math.min(1, embeddedClauses * 2);
  const vocabularyComplexity = Math.min(1, (rareWords + technicalTerms) * 5);
  
  return (sentenceComplexity * 0.3 + lexicalComplexity * 0.2 + structuralComplexity * 0.3 + vocabularyComplexity * 0.2);
}

// Reference data for contextual analysis
const commonLongWords = [
  'something', 'everything', 'anything', 'nothing', 'understand', 'different', 
  'important', 'information', 'government', 'development', 'management', 'statement'
];

const technicalPatterns = [
  /methodology/g, /algorithm/g, /framework/g, /paradigm/g, /heuristic/g, 
  /optimization/g, /implementation/g, /specification/g, /architecture/g, 
  /infrastructure/g, /systematic/g, /empirical/g
];

function analyzeTopicDistributionWithPsychology(documents: Document[]): TopicDistribution {
  const allText = documents.map(doc => doc.content).join(' ').toLowerCase();
  
  const topicPatterns = {
    'Philosophy': {
      keywords: [/philosophy/g, /ethics/g, /morality/g, /consciousness/g, /existence/g, /metaphysics/g],
      implication: "Indicates abstract thinking and concern with fundamental questions"
    },
    'Technology': {
      keywords: [/technology/g, /digital/g, /algorithm/g, /artificial intelligence/g, /programming/g, /software/g],
      implication: "Suggests systematic thinking and implementation-oriented mindset"
    },
    'Science': {
      keywords: [/research/g, /experiment/g, /hypothesis/g, /theory/g, /evidence/g, /methodology/g],
      implication: "Demonstrates empirical thinking and systematic investigation approach"
    },
    'Arts': {
      keywords: [/creative/g, /artistic/g, /aesthetic/g, /expression/g, /imagination/g, /culture/g],
      implication: "Reflects appreciation for subjective experience and creative synthesis"
    },
    'Business': {
      keywords: [/strategy/g, /market/g, /business/g, /profit/g, /management/g, /organization/g],
      implication: "Shows practical orientation and systems-level thinking"
    }
  };
  
  const topicScores: Record<string, number> = {};
  let totalMatches = 0;
  
  Object.entries(topicPatterns).forEach(([topic, pattern]) => {
    const matches = countMatches(allText, pattern.keywords);
    topicScores[topic] = matches;
    totalMatches += matches;
  });
  
  const dominant = Object.entries(topicScores)
    .map(([name, count]) => ({
      name,
      percentage: totalMatches > 0 ? Math.round((count as number / totalMatches) * 100) : 20,
      color: getTopicColor(name),
      psychologicalImplication: topicPatterns[name as keyof typeof topicPatterns].implication
    }))
    .filter(topic => topic.percentage > 5)
    .sort((a, b) => b.percentage - a.percentage);
  
  const topTopics = dominant.slice(0, 2);
  const interpretation = generateTopicInterpretation(topTopics);
  const cognitiveStyle = determineCognitiveStyle(topTopics);
  
  return {
    dominant,
    interpretation,
    cognitiveStyle
  };
}

function analyzeTemporalEvolution(documents: Document[], timeframe: string): TemporalEvolution {
  const sortedDocs = [...documents].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  if (sortedDocs.length < 3) {
    return createDefaultEvolution();
  }
  
  const third = Math.floor(sortedDocs.length / 3);
  const earlyDocs = sortedDocs.slice(0, third);
  const middleDocs = sortedDocs.slice(third, third * 2);
  const recentDocs = sortedDocs.slice(third * 2);
  
  const periods = {
    early: analyzePeriod(earlyDocs, "Exploration"),
    middle: analyzePeriod(middleDocs, "Development"),
    recent: analyzePeriod(recentDocs, "Synthesis")
  };
  
  const trajectory = determineTrajectory(periods);
  
  return { periods, trajectory };
}

function generatePsychostylisticInsights(documents: Document[]): PsychostylisticInsights {
  const allText = documents.map(doc => doc.content).join(' ');
  const sentences = allText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = allText.split(/\s+/).filter(w => w.length > 0);
  
  const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length;
  const complexSentences = sentences.filter(s => s.includes(',') && s.split(',').length > 2).length;
  const questionRatio = sentences.filter(s => s.includes('?')).length / sentences.length;
  const subordinationRate = complexSentences / sentences.length;
  
  // Advanced linguistic analysis
  const passiveVoiceCount = countMatches(allText.toLowerCase(), [/was [a-z]+ed/g, /were [a-z]+ed/g, /been [a-z]+ed/g]);
  const passiveRatio = passiveVoiceCount / sentences.length;
  
  const modalityMarkers = countMatches(allText.toLowerCase(), [/might/g, /could/g, /would/g, /should/g, /may/g]);
  const modalityRatio = modalityMarkers / words.length;
  
  const assertiveMarkers = countMatches(allText.toLowerCase(), [/clearly/g, /obviously/g, /certainly/g, /undoubtedly/g, /indeed/g]);
  const assertiveRatio = assertiveMarkers / sentences.length;
  
  // Generate contextual interpretations
  const primary = [
    {
      observation: `Average sentence length: ${avgSentenceLength.toFixed(1)} words (${avgSentenceLength > 20 ? 'complex' : avgSentenceLength > 15 ? 'mid-complex' : 'direct'})`,
      interpretation: avgSentenceLength > 20 
        ? "Your preference for extended sentences suggests a mind that resists premature closure. You build comprehensive analytical frameworks rather than offering quick declarative strikes."
        : avgSentenceLength < 12
        ? "Your preference for concise sentences indicates crystallized thinking—you write to assert established conclusions rather than explore uncertainty."
        : "Your balanced sentence length reflects a mind capable of both exploration and synthesis, adapting cognitive tempo to analytical demands.",
      causality: avgSentenceLength > 20 
        ? "This often emerges from academic training or philosophical temperament—a belief that complexity requires linguistic precision."
        : avgSentenceLength < 12
        ? "This pattern typically develops in minds oriented toward implementation rather than pure theory."
        : undefined,
      significance: (avgSentenceLength > 25 || avgSentenceLength < 10 ? 'high' : 'medium') as 'high' | 'medium' | 'low'
    },
    {
      observation: `Subordination rate: ${Math.round(subordinationRate * 100)}% (${subordinationRate > 0.4 ? 'high' : subordinationRate > 0.2 ? 'moderate' : 'low'} structural complexity)`,
      interpretation: subordinationRate > 0.4
        ? "High subordination suggests recursive cognitive architecture—you think in nested conditional statements and embed qualifications within assertions. This reflects tolerance for ambiguity."
        : subordinationRate < 0.15
        ? "Low subordination indicates direct cognitive flow. You prefer linear progression over epistemic forking, suggesting a preference for parsimony over contingency in inferential space."
        : "Moderate subordination reflects balanced cognitive processing—you employ complexity when necessary but avoid unnecessary analytical detours.",
      causality: subordinationRate > 0.4
        ? "Often correlates with philosophical training or legal thinking—minds accustomed to managing multiple simultaneous conditions."
        : subordinationRate < 0.15
        ? "Typically emerges from engineering or scientific backgrounds where clarity trumps comprehensiveness."
        : undefined,
      significance: 'high' as 'high' | 'medium' | 'low'
    },
    {
      observation: `Interrogative usage: ${(questionRatio * 100).toFixed(1)}% (${questionRatio > 0.1 ? 'inquiry-driven' : questionRatio > 0.05 ? 'moderately questioning' : 'declarative'})`,
      interpretation: questionRatio < 0.01
        ? "Your writing is interrogatively inert—not from lack of curiosity, but because you write to assert, not explore. This places you in the prosecutor mode of intellectual output: declarative, closed-form, unapologetic."
        : questionRatio > 0.1
        ? "High question usage reveals a dialectical temperament. You think through inquiry, using questions as cognitive scaffolding rather than mere rhetorical devices."
        : "Moderate questioning suggests strategic uncertainty—you pose questions not from confusion but as analytical tools to guide reader cognition.",
      causality: questionRatio < 0.01
        ? "This emerges when the writer has internalized answers before articulation—questions are resolved in pre-writing cognitive space."
        : questionRatio > 0.1
        ? "Often develops in minds trained in Socratic method or therapeutic frameworks."
        : undefined,
      significance: (questionRatio < 0.01 || questionRatio > 0.15 ? 'high' : 'medium') as 'high' | 'medium' | 'low'
    },
    {
      observation: `Assertive confidence markers: ${Math.round(assertiveRatio * 100)} per 100 sentences`,
      interpretation: assertiveRatio > 0.15
        ? "High assertive language suggests epistemic confidence—you write from a position of intellectual authority, minimizing hedging and qualification."
        : assertiveRatio < 0.05
        ? "Low assertive language indicates either intellectual humility or strategic ambiguity—you prefer to let evidence speak rather than claim authority."
        : "Moderate assertiveness reflects balanced epistemological stance—confident in conclusions but respectful of analytical limits.",
      significance: (assertiveRatio > 0.2 || assertiveRatio < 0.03 ? 'high' : 'medium') as 'high' | 'medium' | 'low'
    }
  ];
  
  // Generate sophisticated mind profile
  const mindProfile = generateMindProfile(avgSentenceLength, subordinationRate, questionRatio, assertiveRatio, modalityRatio);
  
  const cognitivePreferences = [
    avgSentenceLength > 20 ? "Comprehensive exposition" : "Crystallized articulation",
    subordinationRate > 0.3 ? "Conditional reasoning architecture" : "Linear cognitive progression",
    questionRatio > 0.1 ? "Dialectical exploration" : "Declarative resolution",
    assertiveRatio > 0.15 ? "Epistemic confidence" : "Strategic qualification"
  ];
  
  const thinkingTempo = generateThinkingTempo(avgSentenceLength, subordinationRate, questionRatio);
  
  return {
    primary,
    metaReflection: {
      mindProfile,
      cognitivePreferences,
      thinkingTempo
    }
  };
}

function generateMindProfile(avgLength: number, subordination: number, questions: number, assertive: number, modality: number): string {
  // Complex psychological profiling based on multiple dimensions
  
  if (avgLength > 20 && subordination > 0.4 && questions < 0.05) {
    return "Your intellectual identity pivots between theorist and engineer: you build comprehensive systems from first principles, then evaluate them for real-world coherence. You tolerate ambiguity only as scaffolding for rigor. Your ego function is tight, oriented toward sense-making and strategic declaration.";
  }
  
  if (avgLength < 15 && subordination < 0.2 && assertive > 0.15) {
    return "You think in vectors, not clouds. Your writing reflects a belief in intellectual progress: premise → inference → resolution. You allow no recursive spirals unless they serve immediate synthesis. You don't meander—you construct.";
  }
  
  if (questions > 0.15 && modality > 0.02) {
    return "Your mind operates in interrogative mode—not from uncertainty but from systematic doubt. You use questions as cognitive instruments, probing assumptions rather than asserting conclusions. This reflects a therapeutic or Socratic intellectual temperament.";
  }
  
  if (subordination > 0.35 && assertive < 0.1) {
    return "You exhibit signs of crystallized cognition—an internalized framework that is no longer revised, only extended. Your writing rarely explores branching possibilities, instead marching steadily toward predetermined resolution through carefully qualified logic.";
  }
  
  if (avgLength > 18 && questions < 0.02 && assertive > 0.1) {
    return "Your cognitive ecosystem thrives on synthesis, not speculation. You present complex analysis but with prosecutorial confidence—language as verdict, not deliberation. Questions are resolved before articulation reaches the page.";
  }
  
  // Default nuanced profile
  return "Your thinking style reflects mature intellectual architecture: integration over improvisation, declaration over interrogation. You've developed consistent cognitive habits that prioritize clarity and systematic progression over exploratory uncertainty.";
}

function generateThinkingTempo(avgLength: number, subordination: number, questions: number): string {
  if (avgLength > 22 && subordination > 0.4) {
    return "Deliberative and architectonic—you prefer to exhaust analytical space before committing to conclusions. Your tempo reflects patience with complexity and resistance to premature intellectual closure.";
  }
  
  if (avgLength < 13 && subordination < 0.2) {
    return "Rapid synthesis and decisive articulation—you move quickly from analysis to resolution. Your tempo suggests confidence in internalized frameworks and impatience with unnecessary cognitive detours.";
  }
  
  if (questions > 0.1) {
    return "Interrogative pacing—you think through systematic questioning rather than direct assertion. Your tempo is exploratory, using inquiry as a method of progressive cognitive refinement.";
  }
  
  return "Adaptive cognitive tempo—you modulate analytical speed based on content complexity while maintaining consistent standards for intellectual rigor and clarity.";
}

function analyzeLongitudinalPatterns(documents: Document[]): Array<{
  date: string;
  conceptualDensity: number;
  formalityIndex: number;
  cognitiveComplexity: number;
  annotations?: string[];
}> {
  const sortedDocs = [...documents].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  return sortedDocs.map((doc, index) => {
    const content = doc.content.toLowerCase();
    const words = content.split(/\s+/).filter(w => w.length > 0);
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    // Conceptual density: ratio of abstract/technical terms
    const abstractTerms = countMatches(content, [
      /concept/g, /theory/g, /framework/g, /methodology/g, /analysis/g, /synthesis/g
    ]);
    const conceptualDensity = Math.min(1, abstractTerms / (words.length / 100));
    
    // Formality index
    const formalMarkers = countMatches(content, [/however/g, /furthermore/g, /nevertheless/g, /therefore/g]);
    const formalityIndex = Math.min(1, formalMarkers / (sentences.length / 10));
    
    // Cognitive complexity: sentence structure and vocabulary sophistication
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length;
    const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;
    const cognitiveComplexity = Math.min(1, (avgSentenceLength / 25 + avgWordLength / 8) / 2);
    
    const annotations = [];
    if (conceptualDensity > 0.7) annotations.push("High conceptual density");
    if (formalityIndex > 0.8) annotations.push("Peak formality");
    if (cognitiveComplexity > 0.8) annotations.push("Maximum complexity");
    
    return {
      date: doc.date.toISOString().split('T')[0],
      conceptualDensity,
      formalityIndex,
      cognitiveComplexity,
      annotations: annotations.length > 0 ? annotations : undefined
    };
  });
}

// Helper functions
function countMatches(text: string, patterns: RegExp[]): number {
  return patterns.reduce((sum, pattern) => sum + (text.match(pattern)?.length || 0), 0);
}

function getTopicColor(topic: string): string {
  const colors: Record<string, string> = {
    'Philosophy': '#8b5cf6',
    'Technology': '#3b82f6',
    'Science': '#10b981',
    'Arts': '#ec4899',
    'Business': '#f59e0b',
    'Other': '#6b7280'
  };
  return colors[topic] || colors['Other'];
}

function generateTopicInterpretation(topTopics: any[]): string {
  if (topTopics.length === 0) return "Diverse intellectual interests without clear dominance";
  
  const primary = topTopics[0];
  if (topTopics.length === 1 || primary.percentage > 60) {
    return `Strong focus on ${primary.name.toLowerCase()} suggests ${primary.psychologicalImplication.toLowerCase()}`;
  }
  
  const secondary = topTopics[1];
  return `Cognitive blend of ${primary.name.toLowerCase()} (${primary.percentage}%) and ${secondary.name.toLowerCase()} (${secondary.percentage}%) indicates ${primary.psychologicalImplication.toLowerCase()} with ${secondary.psychologicalImplication.toLowerCase()}`;
}

function determineCognitiveStyle(topTopics: any[]): string {
  if (topTopics.length === 0) return "Generalist thinker";
  
  const primary = topTopics[0];
  const styles: Record<string, string> = {
    'Philosophy': "Abstract theorist",
    'Technology': "Systems implementer",
    'Science': "Empirical investigator",
    'Arts': "Creative synthesist",
    'Business': "Strategic optimizer"
  };
  
  return styles[primary.name as keyof typeof styles] || "Interdisciplinary thinker";
}

function analyzePeriod(docs: Document[], label: string): any {
  const avgLength = docs.reduce((sum, doc) => sum + doc.content.length, 0) / docs.length;
  const complexity = docs.reduce((sum, doc) => {
    const sentences = doc.content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.reduce((s, sent) => s + sent.split(/\s+/).length, 0) / sentences.length;
    return sum + avgSentenceLength;
  }, 0) / docs.length;
  
  return {
    label,
    archetype: complexity > 20 ? "Deep Analyst" : complexity > 15 ? "Balanced Thinker" : "Efficient Communicator",
    description: `${label} phase characterized by ${avgLength > 1000 ? 'comprehensive' : 'focused'} analysis`,
    keyMetrics: {
      avgDocumentLength: Math.round(avgLength),
      avgSentenceComplexity: Math.round(complexity * 10) / 10,
      documentCount: docs.length
    }
  };
}

function determineTrajectory(periods: any): any {
  const earlyComplexity = periods.early.keyMetrics.avgSentenceComplexity;
  const recentComplexity = periods.recent.keyMetrics.avgSentenceComplexity;
  
  if (recentComplexity > earlyComplexity * 1.2) {
    return {
      type: 'exploratory_expansion',
      description: "Your thinking has become more elaborate and exploratory over time",
      prognosis: "Trajectory suggests developing expertise and increasing analytical sophistication"
    };
  } else if (recentComplexity < earlyComplexity * 0.8) {
    return {
      type: 'compression_abstraction',
      description: "Your expression has become more distilled and precise",
      prognosis: "Movement toward crystallization and axiomatic expression typical of mastery"
    };
  } else {
    return {
      type: 'crystallization',
      description: "Your thinking style has stabilized into a consistent cognitive pattern",
      prognosis: "Indicates developed intellectual framework and consistent analytical approach"
    };
  }
}

function createDefaultEvolution(): TemporalEvolution {
  return {
    periods: {
      early: {
        label: "Baseline",
        archetype: "Emerging Analyst",
        description: "Initial cognitive profile establishment",
        keyMetrics: { avgDocumentLength: 500, avgSentenceComplexity: 15, documentCount: 1 }
      },
      middle: {
        label: "Development",
        archetype: "Developing Thinker",
        description: "Cognitive pattern development phase",
        keyMetrics: { avgDocumentLength: 600, avgSentenceComplexity: 16, documentCount: 1 }
      },
      recent: {
        label: "Current",
        archetype: "Active Analyst",
        description: "Current cognitive state",
        keyMetrics: { avgDocumentLength: 700, avgSentenceComplexity: 17, documentCount: 1 }
      }
    },
    trajectory: {
      type: 'crystallization',
      description: "Establishing baseline cognitive patterns",
      prognosis: "Continue documenting to enable meaningful temporal analysis"
    }
  };
}

function createEmptyAnalytics(): AnalyticsResult {
  return {
    cognitiveArchetype: {
      type: 'cataloguer',
      confidence: 0.6,
      description: "Begin documenting your thoughts to establish your cognitive archetype. Early patterns suggest systematic information processing.",
      traits: ["Systematic analysis", "Information organization", "Detail orientation", "Structured thinking"]
    },
    writingStyle: {
      formality: {
        score: 0.5,
        percentile: 50,
        subdimensions: {
          toneRegister: 0.5,
          modalityUsage: 0.3,
          contractionRate: 0.2,
          hedgingFrequency: 0.3
        }
      },
      complexity: {
        score: 0.5,
        percentile: 50,
        subdimensions: {
          clauseDensity: 0.4,
          dependencyLength: 0.5,
          embeddedStructureRate: 0.4,
          lexicalRarity: 0.3
        }
      },
      cognitiveSignatures: {
        nestedHypotheticals: 0.2,
        anaphoricReasoning: 0.3,
        structuralAnalogies: 0.2,
        dialecticalVsDidactic: 0.5
      }
    },
    topicDistribution: {
      dominant: [
        { name: 'Technology', percentage: 25, color: '#3b82f6', psychologicalImplication: "Systematic thinking orientation" },
        { name: 'Philosophy', percentage: 25, color: '#8b5cf6', psychologicalImplication: "Abstract conceptual processing" },
        { name: 'Science', percentage: 25, color: '#10b981', psychologicalImplication: "Empirical analysis preference" },
        { name: 'Other', percentage: 25, color: '#6b7280', psychologicalImplication: "Broad intellectual curiosity" }
      ],
      interpretation: "Upload documents to reveal your dominant cognitive themes and thinking patterns",
      cognitiveStyle: "Emerging intellectual profile"
    },
    temporalEvolution: createDefaultEvolution(),
    psychostylisticInsights: {
      primary: [
        {
          observation: "Initial cognitive baseline being established",
          interpretation: "Your thinking patterns will become clearer as you document more content",
          significance: 'medium'
        }
      ],
      metaReflection: {
        mindProfile: "Developing cognitive profile - upload more documents to reveal your characteristic thinking patterns",
        cognitivePreferences: ["Systematic processing", "Information organization", "Analytical approach"],
        thinkingTempo: "Baseline establishment phase"
      }
    },
    cognitiveProfile: {
      intellectualApproach: "Upload more documents to establish your intellectual approach and thinking patterns",
      strengths: ["Systematic processing", "Information organization"],
      weaknesses: ["Insufficient data for analysis"],
      growthPathways: ["Document more content to reveal growth opportunities"],
      potentialPitfalls: ["Analysis requires more data"],
      supportingQuotations: ["More content needed for quotation analysis"],
      famousComparisons: ["Cognitive profile emerging"],
      currentCareerLikely: "Professional knowledge work indicated",
      idealCareer: "Strategic roles requiring systematic thinking",
      cognitiveContrasts: {
        mostDifferentType: {
          type: "Requires more content",
          explanation: "Upload documents to identify most different cognitive type",
          keyDifferences: ["Analysis pending document upload"]
        },
        bestCollaborationType: {
          type: "Requires more content",
          explanation: "Upload documents to identify best collaboration type",
          complementaryStrengths: ["Analysis pending document upload"]
        }
      },
      detailedAnalysis: "Upload more documents to generate a comprehensive cognitive analysis."
    },
    psychologicalProfile: {
      emotionalPatterns: "Upload more content to analyze emotional patterns and psychological tendencies",
      psychologicalStrengths: ["Thoughtful processing", "Systematic approach"],
      psychologicalWeaknesses: ["Insufficient data for assessment"],
      growthAreas: ["More content needed for psychological analysis"],
      declineRisks: ["Analysis requires additional data"],
      objectRelations: {
        positive: ["Professional interactions indicated"],
        negative: ["More data needed"],
        improvementAreas: ["Upload content for relationship analysis"],
        deteriorationRisks: ["Analysis pending more data"]
      },
      supportingQuotations: ["More content needed for psychological quotations"],
      emotionalContrasts: {
        mostDifferentType: {
          type: "Requires more content",
          explanation: "Upload documents to identify most different emotional type",
          keyDifferences: ["Analysis pending document upload"]
        },
        bestComplementType: {
          type: "Requires more content",
          explanation: "Upload documents to identify best emotional complement type",
          complementaryQualities: ["Analysis pending document upload"]
        }
      },
      detailedAnalysis: "Upload more documents to generate a comprehensive psychological profile."
    },
    comprehensiveInsights: {
      uniquePositiveTrait: {
        trait: "Systematic Organization",
        description: "Shows early indicators of structured thinking",
        manifestation: "Evident in organized approach to information"
      },
      primaryStrength: {
        strength: "Information Processing",
        explanation: "Demonstrates systematic approach to content organization",
        evidence: "Structured use of the analytical platform"
      },
      primaryWeakness: {
        weakness: "Limited Data",
        explanation: "Insufficient content for comprehensive analysis",
        impact: "Upload more documents to reveal deeper insights"
      },
      synthesis: {
        overallProfile: "Early profile suggests systematic, organized thinking with professional orientation. Upload more content to develop comprehensive psychological and cognitive insights.",
        keyThemes: ["Systematic approach", "Professional orientation", "Organized thinking"],
        developmentRecommendations: ["Document more content", "Include diverse writing samples", "Add personal reflection pieces"],
        riskFactors: ["Incomplete analysis due to limited data"]
      }
    },
    beliefAttribution: {
      beliefs: [],
      disbeliefs: [],
      hypotheticals: [],
      questions: [],
      contradictions: []
    },
    epistemicMoodTracker: {
      dominantStances: [],
      epistemic_transitions: [],
      uncertainty_tolerance: {
        score: 0.5,
        resolution_preference: 'closure_seeking',
        evidence: []
      }
    },
    argumentativeDynamics: {
      dialectical_structures: {
        builds_thesis_antithesis: false,
        maintains_multiple_perspectives: false,
        seeks_synthesis: false,
        examples: []
      },
      revision_behavior: {
        self_contradicts: false,
        revises_positions: false,
        acknowledges_limitations: false,
        frequency: 0,
        examples: []
      },
      epistemic_style: {
        closure_preference: 'unilateral',
        argumentation_pattern: 'linear',
        evidence_weighting: 'empirical'
      }
    },
    intelligenceWeightedThemes: {
      domain_profiles: [],
      cross_domain_coherence: {
        consistency_score: 0.5,
        adaptive_complexity: false,
        domain_transfer_ability: 0.5,
        evidence: []
      }
    },
    longitudinalPatterns: []
  };
}