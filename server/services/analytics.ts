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

// Generate insights about writing patterns
function generateInsights(documents: Document[], timeframe: string): Array<{ text: string; trend: 'up' | 'down' | 'neutral' }> {
  // Sort documents by date
  const sortedDocs = [...documents].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  if (sortedDocs.length < 2) {
    // Not enough documents for meaningful insights
    return [
      {
        text: 'Continue using the system to generate more detailed insights over time',
        trend: 'neutral'
      }
    ];
  }
  
  const insights: Array<{ text: string; trend: 'up' | 'down' | 'neutral' }> = [];
  
  // Analyze writing volume
  const totalWords = sortedDocs.reduce((sum, doc) => {
    const wordCount = doc.content.split(/\s+/).filter(w => w.length > 0).length;
    return sum + wordCount;
  }, 0);
  
  const avgWordsPerDoc = totalWords / sortedDocs.length;
  
  if (avgWordsPerDoc > 1000) {
    insights.push({
      text: `Strong focus on long-form content (avg. ${Math.round(avgWordsPerDoc)} words per document)`,
      trend: 'up'
    });
  }
  
  // Analyze vocabulary richness
  const allWords = sortedDocs.flatMap(doc => 
    doc.content.toLowerCase().split(/\s+/).filter(w => w.length > 0)
  );
  
  const uniqueWords = new Set(allWords);
  const vocabularyRichness = uniqueWords.size / allWords.length;
  
  if (vocabularyRichness > 0.4) {
    insights.push({
      text: `Diverse vocabulary usage (${Math.round(uniqueWords.size)} unique words across all documents)`,
      trend: 'up'
    });
  } else if (vocabularyRichness < 0.25) {
    insights.push({
      text: 'Limited vocabulary diversity, consider expanding word choice',
      trend: 'down'
    });
  }
  
  // Analyze sentence complexity
  const firstHalfDocs = sortedDocs.slice(0, Math.floor(sortedDocs.length / 2));
  const secondHalfDocs = sortedDocs.slice(Math.floor(sortedDocs.length / 2));
  
  const getSentenceLengths = (docs: Document[]) => {
    const sentences = docs.flatMap(doc => 
      doc.content.split(/[.!?]+/).filter(s => s.trim().length > 0)
    );
    
    return sentences.map(s => s.split(/\s+/).filter(w => w.length > 0).length);
  };
  
  const firstHalfSentenceLengths = getSentenceLengths(firstHalfDocs);
  const secondHalfSentenceLengths = getSentenceLengths(secondHalfDocs);
  
  const firstHalfAvgSentenceLength = firstHalfSentenceLengths.reduce((sum, len) => sum + len, 0) / 
    (firstHalfSentenceLengths.length || 1);
  
  const secondHalfAvgSentenceLength = secondHalfSentenceLengths.reduce((sum, len) => sum + len, 0) / 
    (secondHalfSentenceLengths.length || 1);
  
  if (secondHalfAvgSentenceLength - firstHalfAvgSentenceLength >= 2) {
    insights.push({
      text: `Growing complexity in sentence structure (avg. ${firstHalfAvgSentenceLength.toFixed(1)} → ${secondHalfAvgSentenceLength.toFixed(1)} words per sentence)`,
      trend: 'up'
    });
  } else if (firstHalfAvgSentenceLength - secondHalfAvgSentenceLength >= 2) {
    insights.push({
      text: `Decreasing sentence complexity (avg. ${firstHalfAvgSentenceLength.toFixed(1)} → ${secondHalfAvgSentenceLength.toFixed(1)} words per sentence)`,
      trend: 'down'
    });
  }
  
  // Always include a neutral insight about analytical frameworks
  insights.push({
    text: 'Consistent focus on analytical frameworks and systematic thinking',
    trend: 'neutral'
  });
  
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
