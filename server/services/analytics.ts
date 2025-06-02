import { Document } from '@shared/schema';

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

export interface AnalyticsResult {
  cognitiveArchetype: CognitiveArchetype;
  writingStyle: WritingStyleAnalysis;
  topicDistribution: TopicDistribution;
  temporalEvolution: TemporalEvolution;
  psychostylisticInsights: PsychostylisticInsights;
  longitudinalPatterns: Array<{
    date: string;
    conceptualDensity: number;
    formalityIndex: number;
    cognitiveComplexity: number;
    annotations?: string[];
  }>;
}

// Generate analytics based on user documents and specified timeframe
export function generateAnalytics(documents: Document[], timeframe: string): AnalyticsResult {
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

  return {
    cognitiveArchetype,
    writingStyle,
    topicDistribution,
    temporalEvolution,
    psychostylisticInsights,
    longitudinalPatterns
  };
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
  
  // Formality analysis
  const formalMarkers = [/shall/g, /ought/g, /whilst/g, /furthermore/g, /moreover/g, /nevertheless/g];
  const informalMarkers = [/gonna/g, /wanna/g, /kinda/g, /yeah/g, /cool/g, /awesome/g];
  const contractions = [/don't/g, /can't/g, /won't/g, /isn't/g, /aren't/g, /haven't/g];
  const hedging = [/perhaps/g, /possibly/g, /might/g, /could/g, /seem/g, /appear/g];
  
  const formalScore = countMatches(allText.toLowerCase(), formalMarkers) / words.length;
  const informalScore = countMatches(allText.toLowerCase(), informalMarkers) / words.length;
  const contractionRate = countMatches(allText.toLowerCase(), contractions) / words.length;
  const hedgingFreq = countMatches(allText.toLowerCase(), hedging) / words.length;
  
  const formalityScore = Math.max(0, Math.min(1, (formalScore - informalScore + 0.5)));
  const formalityPercentile = Math.floor(formalityScore * 100);
  
  // Complexity analysis
  const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length;
  const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length;
  const embeddedClauses = sentences.filter(s => s.includes(',') && s.split(',').length > 2).length / sentences.length;
  
  // Rare word analysis
  const rareWords = words.filter(w => w.length > 8).length / words.length;
  
  const complexityScore = Math.min(1, (avgSentenceLength / 25 + avgWordLength / 8 + embeddedClauses + rareWords) / 4);
  const complexityPercentile = Math.floor(complexityScore * 100);
  
  // Cognitive signatures
  const nestedHypotheticals = countMatches(allText.toLowerCase(), [/if.*then.*if/g, /suppose.*then.*suppose/g]) / sentences.length;
  const anaphoricReasoning = countMatches(allText.toLowerCase(), [/this suggests/g, /this implies/g, /therefore/g, /thus/g]) / sentences.length;
  const structuralAnalogies = countMatches(allText.toLowerCase(), [/like/g, /similar to/g, /analogous/g, /comparable/g]) / sentences.length;
  const dialecticalMarkers = countMatches(allText.toLowerCase(), [/however/g, /but/g, /yet/g, /although/g]);
  const didacticMarkers = countMatches(allText.toLowerCase(), [/should/g, /must/g, /need to/g, /important to/g]);
  const dialecticalVsDidactic = dialecticalMarkers / (dialecticalMarkers + didacticMarkers + 1);
  
  return {
    formality: {
      score: formalityScore,
      percentile: formalityPercentile,
      subdimensions: {
        toneRegister: formalScore,
        modalityUsage: hedgingFreq,
        contractionRate: contractionRate,
        hedgingFrequency: hedgingFreq
      }
    },
    complexity: {
      score: complexityScore,
      percentile: complexityPercentile,
      subdimensions: {
        clauseDensity: embeddedClauses,
        dependencyLength: avgSentenceLength / 20,
        embeddedStructureRate: embeddedClauses,
        lexicalRarity: rareWords
      }
    },
    cognitiveSignatures: {
      nestedHypotheticals: Math.min(1, nestedHypotheticals * 10),
      anaphoricReasoning: Math.min(1, anaphoricReasoning * 5),
      structuralAnalogies: Math.min(1, structuralAnalogies * 5),
      dialecticalVsDidactic: dialecticalVsDidactic
    }
  };
}

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
  
  const primary = [
    {
      observation: `Your average sentence length is ${avgSentenceLength.toFixed(1)} words`,
      interpretation: avgSentenceLength > 20 
        ? "This indicates a preference for detailed exposition and comprehensive analysis" 
        : avgSentenceLength < 12
        ? "This suggests clarity-focused communication and distilled thinking"
        : "This reflects balanced communication between detail and accessibility",
      significance: (avgSentenceLength > 25 || avgSentenceLength < 8 ? 'high' : 'medium') as 'high' | 'medium' | 'low'
    },
    {
      observation: `${Math.round((complexSentences / sentences.length) * 100)}% of your sentences use complex subordination`,
      interpretation: complexSentences / sentences.length > 0.3
        ? "This pattern suggests recursive thinking and consideration of multiple contingencies"
        : "This indicates preference for direct communication and linear reasoning",
      significance: 'high' as 'high' | 'medium' | 'low'
    },
    {
      observation: `Your interrogative ratio is ${(questionRatio * 100).toFixed(1)}%`,
      interpretation: questionRatio > 0.1
        ? "High question usage suggests a dialectical approach - you think through inquiry"
        : "Low question usage indicates declarative confidence in your analytical conclusions",
      significance: (questionRatio > 0.15 ? 'high' : 'medium') as 'high' | 'medium' | 'low'
    }
  ];
  
  const mindProfile = avgSentenceLength > 20 && complexSentences / sentences.length > 0.3
    ? "Analytical, recursive, and reluctant to commit until every possibility is parsed. Resists closure and thrives on conceptual tension."
    : avgSentenceLength < 15 && questionRatio < 0.05
    ? "Direct, decisive, and clarity-focused. Prefers distilled insights over exploratory analysis."
    : "Balanced between exploration and synthesis. Adapts thinking style to content requirements.";
  
  const cognitivePreferences = [
    avgSentenceLength > 20 ? "Extended analysis" : "Concise expression",
    complexSentences / sentences.length > 0.3 ? "Conditional reasoning" : "Linear logic",
    questionRatio > 0.1 ? "Dialectical inquiry" : "Declarative assertion"
  ];
  
  const thinkingTempo = avgSentenceLength > 25 
    ? "Deliberate and comprehensive - prefers thorough exploration before conclusion"
    : avgSentenceLength < 12
    ? "Rapid and decisive - moves quickly from analysis to synthesis"
    : "Adaptive tempo - adjusts processing speed to complexity requirements";
  
  return {
    primary,
    metaReflection: {
      mindProfile,
      cognitivePreferences,
      thinkingTempo
    }
  };
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
  const colors = {
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
  const styles = {
    'Philosophy': "Abstract theorist",
    'Technology': "Systems implementer",
    'Science': "Empirical investigator",
    'Arts': "Creative synthesist",
    'Business': "Strategic optimizer"
  };
  
  return styles[primary.name] || "Interdisciplinary thinker";
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
    longitudinalPatterns: []
  };
}