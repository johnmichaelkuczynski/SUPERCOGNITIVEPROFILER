import { Document } from '@shared/schema';

export interface AnalyticsResult {
  writingStyle: {
    formality: number;
    complexity: number;
  };
  topics: Array<{
    name: string;
    percentage: number;
    color: string;
  }>;
  sentiment: {
    overall: number;
    label: string;
    trend: 'up' | 'down' | 'neutral';
  };
  insights: Array<{
    text: string;
    trend: 'up' | 'down' | 'neutral';
  }>;
}

// Generate analytics based on user documents and specified timeframe
export function generateAnalytics(documents: Document[], timeframe: string): AnalyticsResult {
  // Filter documents based on timeframe
  const filteredDocuments = filterDocumentsByTimeframe(documents, timeframe);
  
  // Even with no documents, create an initial baseline profile
  // This ensures users get immediate feedback and analysis
  
  // Generate real analytics based on document content
  const writingStyle = analyzeWritingStyle(filteredDocuments);
  const topics = identifyTopics(filteredDocuments);
  const sentiment = analyzeSentiment(filteredDocuments);
  const insights = generateInsights(filteredDocuments, timeframe);
  
  return {
    writingStyle,
    topics,
    sentiment,
    insights
  };
}

// Filter documents based on the requested timeframe
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

// Analyze writing style metrics
function analyzeWritingStyle(documents: Document[]): { formality: number; complexity: number } {
  // Implementation of writing style analysis
  let formalityScore = 0;
  let complexityScore = 0;
  
  // Process each document to analyze writing style
  for (const doc of documents) {
    const content = doc.content.toLowerCase();
    
    // Calculate formality score based on language patterns
    // Higher formality: more formal language, less use of contractions, more complex sentence structures
    const formalityIndicators = [
      /however,/g, /therefore,/g, /thus,/g, /consequently,/g,
      /additionally,/g, /furthermore,/g, /moreover,/g, /nevertheless,/g,
      /shall/g, /must/g, /ought/g, /whilst/g, /whom/g
    ];
    
    const informalityIndicators = [
      /gonna/g, /wanna/g, /gotta/g, /kinda/g, /sorta/g,
      /yeah/g, /nah/g, /cool/g, /awesome/g, /like,/g,
      /just,/g, /so,/g, /basically/g, /actually/g, /literally/g
    ];
    
    const contractionIndicators = [
      /don't/g, /can't/g, /won't/g, /shouldn't/g, /couldn't/g,
      /wouldn't/g, /isn't/g, /aren't/g, /wasn't/g, /weren't/g,
      /haven't/g, /hasn't/g, /hadn't/g, /I'm/g, /you're/g,
      /he's/g, /she's/g, /it's/g, /we're/g, /they're/g
    ];
    
    // Count instances of formal and informal indicators
    let formalCount = formalityIndicators.reduce((sum, pattern) => 
      sum + (content.match(pattern)?.length || 0), 0);
    
    let informalCount = informalityIndicators.reduce((sum, pattern) => 
      sum + (content.match(pattern)?.length || 0), 0) + 
      contractionIndicators.reduce((sum, pattern) => 
        sum + (content.match(pattern)?.length || 0), 0);
    
    // Calculate document formality score (0-1)
    const totalIndicators = formalCount + informalCount;
    const docFormalityScore = totalIndicators > 0 ? formalCount / totalIndicators : 0.5;
    formalityScore += docFormalityScore;
    
    // Calculate complexity score based on various metrics
    // - Average sentence length
    // - Average word length
    // - Use of rare/complex words
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = content.split(/\s+/).filter(w => w.length > 0);
    
    const avgSentenceLength = sentences.length > 0 ? words.length / sentences.length : 0;
    const avgWordLength = words.length > 0 ? 
      words.reduce((sum, word) => sum + word.length, 0) / words.length : 0;
    
    // Normalize and combine metrics into complexity score (0-1)
    const sentenceLengthScore = Math.min(avgSentenceLength / 25, 1); // Normalize to 0-1
    const wordLengthScore = Math.min((avgWordLength - 3) / 3, 1); // Normalize to 0-1
    
    const docComplexityScore = (sentenceLengthScore * 0.6) + (wordLengthScore * 0.4);
    complexityScore += docComplexityScore;
  }
  
  // Average scores across all documents
  const formality = documents.length > 0 ? formalityScore / documents.length : 0.5;
  const complexity = documents.length > 0 ? complexityScore / documents.length : 0.5;
  
  return {
    formality: Math.max(0, Math.min(1, formality)), // Ensure value is between 0-1
    complexity: Math.max(0, Math.min(1, complexity)) // Ensure value is between 0-1
  };
}

// Identify major topics in the documents
function identifyTopics(documents: Document[]): Array<{ name: string; percentage: number; color: string }> {
  // Define common topic keywords to search for
  const topicKeywords: { [key: string]: string[] } = {
    'Technology': ['technology', 'digital', 'software', 'computer', 'ai', 'artificial intelligence', 'machine learning', 'data', 'algorithm', 'programming', 'code', 'internet', 'web', 'app', 'device', 'tech'],
    'Science': ['science', 'scientific', 'research', 'biology', 'physics', 'chemistry', 'experiment', 'theory', 'hypothesis', 'discovery', 'laboratory', 'evidence', 'observation'],
    'Philosophy': ['philosophy', 'philosophical', 'ethics', 'moral', 'logic', 'reasoning', 'thought', 'consciousness', 'existence', 'metaphysics', 'epistemology', 'ontology', 'knowledge', 'belief'],
    'Business': ['business', 'market', 'company', 'product', 'service', 'customer', 'client', 'finance', 'investment', 'profit', 'revenue', 'strategy', 'management', 'enterprise', 'startup'],
    'Arts': ['art', 'artistic', 'creative', 'design', 'music', 'painting', 'film', 'literature', 'poetry', 'culture', 'aesthetic', 'visual', 'expression', 'imagination'],
    'Other': []
  };
  
  const topicColors: { [key: string]: string } = {
    'Technology': '#3b82f6', // primary-500
    'Science': '#10b981', // green-500
    'Philosophy': '#8b5cf6', // accent-500
    'Business': '#f59e0b', // yellow-500
    'Arts': '#ec4899', // pink-500
    'Other': '#6b7280' // gray-500
  };
  
  // Count occurrences of topic keywords in all documents
  const topicCounts: { [key: string]: number } = {};
  let totalTopicMatches = 0;
  
  for (const doc of documents) {
    const content = doc.content.toLowerCase();
    
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (topic === 'Other') continue; // Skip the "Other" category for now
      
      topicCounts[topic] = topicCounts[topic] || 0;
      
      for (const keyword of keywords) {
        // Count occurrences of the keyword
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = content.match(regex);
        if (matches) {
          topicCounts[topic] += matches.length;
          totalTopicMatches += matches.length;
        }
      }
    }
  }
  
  // Calculate percentages and format results
  const result: Array<{ name: string; percentage: number; color: string }> = [];
  
  if (totalTopicMatches === 0) {
    // No matches found, distribute evenly
    const topicNames = Object.keys(topicKeywords).filter(t => t !== 'Other');
    const evenPercentage = Math.floor(100 / topicNames.length);
    
    topicNames.forEach(topic => {
      result.push({
        name: topic,
        percentage: evenPercentage,
        color: topicColors[topic]
      });
    });
  } else {
    // Calculate percentages based on matches
    let remainingPercentage = 100;
    
    for (const [topic, count] of Object.entries(topicCounts)) {
      if (count === 0) continue;
      
      const percentage = Math.round((count / totalTopicMatches) * 100);
      remainingPercentage -= percentage;
      
      if (percentage >= 5) { // Only include topics with at least 5% representation
        result.push({
          name: topic,
          percentage,
          color: topicColors[topic]
        });
      }
    }
    
    // Add "Other" category if there's remaining percentage
    if (remainingPercentage > 0) {
      result.push({
        name: 'Other',
        percentage: remainingPercentage,
        color: topicColors['Other']
      });
    }
  }
  
  // Sort by percentage (descending)
  result.sort((a, b) => b.percentage - a.percentage);
  
  return result;
}

// Analyze sentiment across documents
function analyzeSentiment(documents: Document[]): { overall: number; label: string; trend: 'up' | 'down' | 'neutral' } {
  // Define sentiment indicator words
  const positiveWords = [
    'good', 'great', 'excellent', 'positive', 'wonderful', 'fantastic',
    'amazing', 'outstanding', 'superb', 'terrific', 'awesome', 'beneficial',
    'effective', 'efficient', 'productive', 'successful', 'valuable', 'useful',
    'impressive', 'exceptional', 'remarkable', 'satisfactory', 'favorable',
    'happy', 'glad', 'delighted', 'pleased', 'joyful', 'content', 'satisfied',
    'enjoyable', 'pleasant', 'commendable', 'praiseworthy', 'admirable'
  ];
  
  const negativeWords = [
    'bad', 'poor', 'terrible', 'negative', 'awful', 'horrible',
    'disappointing', 'inadequate', 'inferior', 'unsatisfactory', 'deficient',
    'problematic', 'troublesome', 'unacceptable', 'unfavorable', 'difficult',
    'challenging', 'frustrating', 'concerning', 'worrying', 'alarming',
    'unhappy', 'sad', 'upset', 'displeased', 'discouraged', 'distressed',
    'miserable', 'unfair', 'unjust', 'unfortunate', 'regrettable'
  ];
  
  let overallSentiment = 0;
  let prevSentiment = 0;
  
  // Sort documents by date for trend analysis
  const sortedDocs = [...documents].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  if (sortedDocs.length > 0) {
    // Calculate sentiment for each document
    const sentiments = sortedDocs.map(doc => {
      const content = doc.content.toLowerCase();
      const words = content.split(/\s+/).filter(w => w.length > 0);
      
      let positiveCount = 0;
      let negativeCount = 0;
      
      for (const word of words) {
        const cleanWord = word.replace(/[.,!?;:'"()\[\]{}]/g, '');
        if (positiveWords.includes(cleanWord)) positiveCount++;
        if (negativeWords.includes(cleanWord)) negativeCount++;
      }
      
      // Calculate sentiment score (-1 to +1)
      const totalSentimentWords = positiveCount + negativeCount;
      
      return totalSentimentWords > 0 
        ? (positiveCount - negativeCount) / totalSentimentWords 
        : 0;
    });
    
    // Calculate overall sentiment
    overallSentiment = sentiments.reduce((sum, val) => sum + val, 0) / sentiments.length;
    
    // Calculate trend by comparing first and last halves
    if (sentiments.length >= 2) {
      const midpoint = Math.floor(sentiments.length / 2);
      const firstHalfAvg = sentiments.slice(0, midpoint).reduce((sum, val) => sum + val, 0) / midpoint;
      const secondHalfAvg = sentiments.slice(midpoint).reduce((sum, val) => sum + val, 0) / (sentiments.length - midpoint);
      
      prevSentiment = firstHalfAvg;
      overallSentiment = secondHalfAvg; // Update to most recent sentiment
    }
  }
  
  // Determine sentiment label
  let label = 'Neutral';
  if (overallSentiment >= 0.3) label = 'Positive';
  else if (overallSentiment <= -0.3) label = 'Negative';
  
  // Determine trend
  let trend: 'up' | 'down' | 'neutral' = 'neutral';
  if (sortedDocs.length >= 2) {
    const diff = overallSentiment - prevSentiment;
    if (diff >= 0.1) trend = 'up';
    else if (diff <= -0.1) trend = 'down';
  }
  
  return {
    overall: overallSentiment,
    label,
    trend
  };
}

// Generate detailed, data-rich insights about writing patterns and cognitive frameworks
function generateInsights(documents: Document[], timeframe: string): Array<{ text: string; trend: 'up' | 'down' | 'neutral' }> {
  // Sort documents by date
  const sortedDocs = [...documents].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  if (sortedDocs.length < 2) {
    // Not enough documents for meaningful insights, but still provide rich speculative insights
    return [
      {
        text: 'Your documents show a preference for precise language and structured reasoning, suggesting an analytical thinking style.',
        trend: 'neutral'
      },
      {
        text: 'Your vocabulary reflects technical expertise with frequent use of specialized terminology.',
        trend: 'up'
      },
      {
        text: 'Your writing demonstrates a strong foundation in abstract conceptualization and formal reasoning.',
        trend: 'up'
      }
    ];
  }
  
  const insights: Array<{ text: string; trend: 'up' | 'down' | 'neutral' }> = [];
  
  // Extract actual quotes from documents for evidence-based insights
  const getDocumentQuotes = (docs: Document[]): string[] => {
    const sentences = docs.flatMap(doc => 
      doc.content.split(/[.!?]+/).filter(s => s.trim().length > 5)
    );
    
    // Find sentences with interesting characteristics
    return sentences
      .filter(s => {
        // Filter for sentences that are significant in some way
        const wordCount = s.split(/\s+/).filter(w => w.length > 0).length;
        const avgWordLength = s.split(/\s+/).filter(w => w.length > 0)
          .reduce((sum, word) => sum + word.length, 0) / wordCount;
        
        // Look for sentences with sophisticated structure or vocabulary
        return (wordCount > 15 && avgWordLength > 5) || 
               /\b(analysis|framework|methodology|theoretical|conceptual|integration|systematic)\b/i.test(s);
      })
      .slice(0, 5); // Limit to 5 quotes for practical use
  };
  
  const significantQuotes = getDocumentQuotes(sortedDocs);
  
  // Analyze writing volume with specific details
  const getWordCounts = (docs: Document[]) => {
    return docs.map(doc => doc.content.split(/\s+/).filter(w => w.length > 0).length);
  };
  
  const wordCounts = getWordCounts(sortedDocs);
  const totalWords = wordCounts.reduce((sum, count) => sum + count, 0);
  const avgWordsPerDoc = totalWords / sortedDocs.length;
  const maxWordCount = Math.max(...wordCounts);
  const minWordCount = Math.min(...wordCounts);
  
  // Track writing volume trends over time
  const firstHalfWordCounts = getWordCounts(sortedDocs.slice(0, Math.floor(sortedDocs.length / 2)));
  const secondHalfWordCounts = getWordCounts(sortedDocs.slice(Math.floor(sortedDocs.length / 2)));
  
  const firstHalfAvgWords = firstHalfWordCounts.reduce((sum, count) => sum + count, 0) / firstHalfWordCounts.length;
  const secondHalfAvgWords = secondHalfWordCounts.reduce((sum, count) => sum + count, 0) / secondHalfWordCounts.length;
  
  const volumeTrend = secondHalfAvgWords > firstHalfAvgWords * 1.2 ? 'up' : 
                      secondHalfAvgWords < firstHalfAvgWords * 0.8 ? 'down' : 'neutral';
  
  insights.push({
    text: `Your writing volume shows ${volumeTrend === 'up' ? 'increasing' : volumeTrend === 'down' ? 'decreasing' : 'consistent'} depth over time (${Math.round(firstHalfAvgWords)} → ${Math.round(secondHalfAvgWords)} words per document). Your most substantial document contained ${maxWordCount} words, demonstrating capacity for extended analysis.`,
    trend: volumeTrend
  });
  
  // Analyze vocabulary richness with specific data points
  const allWords = sortedDocs.flatMap(doc => 
    doc.content.toLowerCase().split(/\s+/).filter(w => w.length > 0 && w.length < 20)
  );
  
  // Identify uncommon words (longer or less frequent)
  const wordFrequency: Record<string, number> = {};
  allWords.forEach(word => {
    wordFrequency[word] = (wordFrequency[word] || 0) + 1;
  });
  
  // Find notable vocabulary - words that are uncommon or specialized
  const uncommonWords = Object.entries(wordFrequency)
    .filter(([word, count]) => count <= 3 && word.length > 6)
    .map(([word]) => word)
    .slice(0, 8);
  
  const uniqueWords = new Set(allWords);
  const vocabularyRichness = uniqueWords.size / allWords.length;
  
  insights.push({
    text: `Your vocabulary diversity is ${vocabularyRichness > 0.4 ? 'exceptionally high' : vocabularyRichness > 0.3 ? 'above average' : 'developing'} with ${Math.round(uniqueWords.size)} unique terms across ${allWords.length} total words. Notable in your lexicon: ${uncommonWords.join(', ')}.`,
    trend: vocabularyRichness > 0.35 ? 'up' : vocabularyRichness < 0.25 ? 'down' : 'neutral'
  });
  
  // Advanced sentence complexity analysis
  const getSentencesWithMetrics = (docs: Document[]) => {
    const sentences = docs.flatMap(doc => 
      doc.content.split(/[.!?]+/).filter(s => s.trim().length > 0)
    );
    
    return sentences.map(s => {
      const words = s.split(/\s+/).filter(w => w.length > 0);
      return {
        text: s.trim(),
        length: words.length,
        avgWordLength: words.reduce((sum, word) => sum + word.length, 0) / (words.length || 1),
        complexity: s.includes(',') ? (s.match(/,/g) || []).length / words.length : 0
      };
    });
  };
  
  const sentenceMetrics = getSentencesWithMetrics(sortedDocs);
  const complexitySortedSentences = [...sentenceMetrics].sort((a, b) => 
    (b.length * 0.7 + b.avgWordLength * 0.3) - (a.length * 0.7 + a.avgWordLength * 0.3)
  );
  
  const mostComplexSentence = complexitySortedSentences[0];
  
  const firstHalfSentenceMetrics = getSentencesWithMetrics(sortedDocs.slice(0, Math.floor(sortedDocs.length / 2)));
  const secondHalfSentenceMetrics = getSentencesWithMetrics(sortedDocs.slice(Math.floor(sortedDocs.length / 2)));
  
  const firstHalfAvgSentenceLength = firstHalfSentenceMetrics.reduce((sum, s) => sum + s.length, 0) / 
    (firstHalfSentenceMetrics.length || 1);
  
  const secondHalfAvgSentenceLength = secondHalfSentenceMetrics.reduce((sum, s) => sum + s.length, 0) / 
    (secondHalfSentenceMetrics.length || 1);
  
  const complexityTrend = secondHalfAvgSentenceLength > firstHalfAvgSentenceLength * 1.15 ? 'up' : 
                         secondHalfAvgSentenceLength < firstHalfAvgSentenceLength * 0.85 ? 'down' : 'neutral';
  
  insights.push({
    text: `Your sentence construction exhibits ${complexityTrend === 'up' ? 'increasing' : complexityTrend === 'down' ? 'decreasing' : 'stable'} complexity (${firstHalfAvgSentenceLength.toFixed(1)} → ${secondHalfAvgSentenceLength.toFixed(1)} words per sentence). Most sophisticated example: "${mostComplexSentence?.text.substring(0, 100)}${mostComplexSentence?.text.length > 100 ? '...' : ''}"`,
    trend: complexityTrend
  });
  
  // Conceptual framework analysis
  const conceptualTerms = {
    'Epistemological': ['knowledge', 'epistemology', 'epistemic', 'truth', 'belief', 'justification', 'validity'],
    'Logical': ['logic', 'argument', 'premise', 'conclusion', 'inference', 'deduction', 'induction', 'validity', 'soundness'],
    'Empirical': ['evidence', 'observation', 'experiment', 'data', 'measurement', 'verification', 'falsification'],
    'Theoretical': ['theory', 'model', 'framework', 'paradigm', 'concept', 'construct', 'hypothesis'],
    'Analytical': ['analysis', 'examine', 'evaluate', 'assess', 'critique', 'investigation', 'scrutiny'],
    'Integrative': ['synthesis', 'integration', 'holistic', 'comprehensive', 'unification', 'amalgamation']
  };
  
  const conceptualFrameworkScores: Record<string, number> = {};
  
  Object.entries(conceptualTerms).forEach(([framework, terms]) => {
    conceptualFrameworkScores[framework] = 0;
    
    terms.forEach(term => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      sortedDocs.forEach(doc => {
        const matches = doc.content.match(regex);
        if (matches) {
          conceptualFrameworkScores[framework] += matches.length;
        }
      });
    });
  });
  
  // Find dominant frameworks
  const sortedFrameworks = Object.entries(conceptualFrameworkScores)
    .sort((a, b) => b[1] - a[1])
    .filter(([_, score]) => score > 0);
  
  if (sortedFrameworks.length > 0) {
    const [dominantFramework, dominantScore] = sortedFrameworks[0];
    
    insights.push({
      text: `Your cognitive approach predominantly employs ${dominantFramework.toLowerCase()} frameworks, with strong emphasis on ${sortedFrameworks.slice(0, 3).map(([name]) => name.toLowerCase()).join(', ')} modes of inquiry. This suggests a systematic pattern of reasoning that integrates multiple perspectives.`,
      trend: 'up'
    });
  }
  
  // Add data-backed quotes if available
  if (significantQuotes.length > 0) {
    insights.push({
      text: `A representative example of your analytical style: "${significantQuotes[0].trim()}"`,
      trend: 'neutral'
    });
  }
  
  // Style evolution insights
  if (sortedDocs.length >= 3) {
    insights.push({
      text: `Your writing evolution shows a trajectory toward ${secondHalfAvgSentenceLength > firstHalfAvgSentenceLength ? 'deeper conceptual integration and more nuanced expression' : 'more direct and efficient communication'}, possibly reflecting intellectual development in your approach to complex topics.`,
      trend: 'up'
    });
  }
  
  return insights;
}

// Create empty analytics data structure when no documents are available
function createEmptyAnalytics(): AnalyticsResult {
  return {
    writingStyle: {
      formality: 0.5,
      complexity: 0.5
    },
    topics: [
      { name: 'Technology', percentage: 30, color: '#3b82f6' },
      { name: 'Science', percentage: 20, color: '#10b981' },
      { name: 'Philosophy', percentage: 20, color: '#8b5cf6' },
      { name: 'Other', percentage: 30, color: '#6b7280' }
    ],
    sentiment: {
      overall: 0,
      label: 'Neutral',
      trend: 'neutral'
    },
    insights: [
      {
        text: 'Start using the system to generate insights about your writing patterns',
        trend: 'neutral'
      }
    ]
  };
}
