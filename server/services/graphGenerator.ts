import { processGPT4 } from './openai.js';
import { processClaude } from './anthropic.js';
import { processDeepSeek } from './deepseek.js';

export interface GraphData {
  type: 'line' | 'bar' | 'scatter' | 'pie' | 'area' | 'function' | 'histogram';
  title: string;
  xLabel: string;
  yLabel: string;
  data: Array<{
    x: number | string;
    y: number;
    label?: string;
  }>;
  description: string;
  mathExpression?: string; // For mathematical functions
  domain?: [number, number]; // For function plots
  color?: string;
}

export interface GraphGenerationOptions {
  model: 'claude' | 'gpt4' | 'deepseek';
  context?: string;
  style?: 'academic' | 'business' | 'scientific';
}

/**
 * Parse natural language text to identify graph requirements
 */
export async function parseGraphRequirements(
  text: string, 
  options: GraphGenerationOptions
): Promise<GraphData[]> {
  const { model, context = '', style = 'academic' } = options;

  const prompt = `You are an expert data visualization specialist. Analyze the following assignment/problem and create ONLY the graphs that are specifically needed for the mathematical, scientific, or academic content.

ASSIGNMENT/PROBLEM:
${text}

CRITICAL INSTRUCTIONS:
1. Look for SPECIFIC mathematical functions, equations, or data mentioned in the assignment
2. If it's a calculus problem, create graphs of the actual functions being analyzed
3. If it's a physics problem, graph the physical relationships described
4. If it's economics, graph the specific economic relationships mentioned
5. DO NOT create generic or unrelated graphs
6. ONLY create graphs that directly illustrate the problem being solved

GRAPH CREATION RULES:
- For mathematical functions: Use the exact functions from the problem
- For data analysis: Use the actual data mentioned
- For word problems: Graph the relationships described
- For comparisons: Show the specific comparisons mentioned

For each relevant graph, provide:
- type: 'function' for math equations, 'line' for trends, 'bar' for comparisons, 'scatter' for data points
- title: Exact title based on the problem content
- xLabel: Variable from the problem
- yLabel: Variable from the problem
- data: Accurate data points that match the problem
- mathExpression: Exact mathematical expression from the problem (if applicable)
- domain: Appropriate range for the problem
- description: How this graph relates to solving the problem

Return ONLY valid JSON array. If no specific graphs are needed for the problem, return [].

Example for calculus problem "Find the derivative of f(x) = x² + 3x":
[
  {
    "type": "function",
    "title": "f(x) = x² + 3x",
    "xLabel": "x",
    "yLabel": "f(x)",
    "mathExpression": "x^2 + 3*x",
    "domain": [-5, 5],
    "description": "Original function to be differentiated",
    "color": "#2563eb"
  }
]`;

  let response: string;
  
  try {
    switch (model) {
      case 'claude':
        response = await processClaude(prompt, { temperature: 0.3 });
        break;
      case 'gpt4':
        response = await processGPT4(prompt, { temperature: 0.3 }) || '';
        break;
      case 'deepseek':
        response = await processDeepSeek(prompt, { temperature: 0.3 });
        break;
      default:
        response = await processClaude(prompt, { temperature: 0.3 });
    }
    
    // Extract JSON from response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (!jsonMatch || !jsonMatch[0]) {
      throw new Error('No valid JSON found in response');
    }
    
    const graphData = JSON.parse(jsonMatch[0]) as GraphData[];
    
    // Validate and clean the data
    return graphData.filter(graph => 
      graph.type && graph.title && graph.data && Array.isArray(graph.data)
    );
    
  } catch (error) {
    console.error('Error parsing graph requirements:', error);
    return [];
  }
}

/**
 * Parse mathematical expressions and generate function graphs
 */
export async function parseMathExpression(
  expression: string,
  options: GraphGenerationOptions & { domain?: [number, number] }
): Promise<GraphData | null> {
  const { model, domain = [-10, 10] } = options;

  const prompt = `You are a mathematical function specialist. Analyze this mathematical expression and create a graph specification.

EXPRESSION: ${expression}

INSTRUCTIONS:
1. Identify the mathematical function type
2. Determine appropriate domain and range
3. Generate data points for smooth curve plotting
4. Provide clear mathematical notation
5. Create descriptive title and labels

Generate 50-100 data points for smooth visualization.

Return ONLY valid JSON GraphData object. Example:
{
  "type": "function",
  "title": "f(x) = x² + 2x - 3",
  "xLabel": "x",
  "yLabel": "f(x)",
  "data": [
    {"x": -5, "y": 12},
    {"x": -4.8, "y": 10.24}
  ],
  "description": "Quadratic function showing parabolic curve",
  "mathExpression": "x^2 + 2*x - 3",
  "domain": [-5, 5],
  "color": "#dc2626"
}`;

  try {
    let response: string;
    
    switch (model) {
      case 'claude':
        response = await processClaude(prompt, { temperature: 0.2 });
        break;
      case 'gpt4':
        response = await processGPT4(prompt, { temperature: 0.2 }) || '';
        break;
      case 'deepseek':
        response = await processDeepSeek(prompt, { temperature: 0.2 });
        break;
      default:
        response = await processClaude(prompt, { temperature: 0.2 });
    }
    
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch || !jsonMatch[0]) {
      throw new Error('No valid JSON found in response');
    }
    
    const graphData = JSON.parse(jsonMatch[0]) as GraphData;
    
    // Validate the data
    if (!graphData.type || !graphData.title || !graphData.data || !Array.isArray(graphData.data)) {
      throw new Error('Invalid graph data structure');
    }
    
    return graphData;
    
  } catch (error) {
    console.error('Error parsing math expression:', error);
    return null;
  }
}

/**
 * Generate SVG from graph data
 */
export function generateSVG(graphData: GraphData, width: number = 600, height: number = 400): string {
  const { type, title, xLabel, yLabel, data, color = '#2563eb' } = graphData;
  
  const margin = { top: 60, right: 40, bottom: 80, left: 80 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  
  // Calculate scales
  const xValues = data.map(d => typeof d.x === 'number' ? d.x : 0);
  const yValues = data.map(d => d.y);
  
  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const yMin = Math.min(...yValues);
  const yMax = Math.max(...yValues);
  
  const xScale = (x: number) => margin.left + ((x - xMin) / (xMax - xMin)) * plotWidth;
  const yScale = (y: number) => margin.top + ((yMax - y) / (yMax - yMin)) * plotHeight;
  
  let plotElements = '';
  
  switch (type) {
    case 'line':
    case 'function':
      const pathData = data.map((d, i) => {
        const x = typeof d.x === 'number' ? d.x : i;
        return `${i === 0 ? 'M' : 'L'} ${xScale(x)} ${yScale(d.y)}`;
      }).join(' ');
      
      plotElements = `
        <path d="${pathData}" fill="none" stroke="${color}" stroke-width="2"/>
        ${data.map((d, i) => {
          const x = typeof d.x === 'number' ? d.x : i;
          return `<circle cx="${xScale(x)}" cy="${yScale(d.y)}" r="3" fill="${color}"/>`;
        }).join('')}
      `;
      break;
      
    case 'bar':
      const barWidth = plotWidth / data.length * 0.8;
      plotElements = data.map((d, i) => {
        const x = typeof d.x === 'number' ? d.x : i;
        const barHeight = Math.abs(yScale(d.y) - yScale(0));
        const barY = d.y >= 0 ? yScale(d.y) : yScale(0);
        
        return `<rect x="${xScale(x) - barWidth/2}" y="${barY}" width="${barWidth}" height="${barHeight}" fill="${color}"/>`;
      }).join('');
      break;
      
    case 'scatter':
      plotElements = data.map((d, i) => {
        const x = typeof d.x === 'number' ? d.x : i;
        return `<circle cx="${xScale(x)}" cy="${yScale(d.y)}" r="4" fill="${color}"/>`;
      }).join('');
      break;
      
    case 'area':
      const areaPath = data.map((d, i) => {
        const x = typeof d.x === 'number' ? d.x : i;
        return `${i === 0 ? 'M' : 'L'} ${xScale(x)} ${yScale(d.y)}`;
      }).join(' ');
      
      const baselineY = yScale(Math.min(0, yMin));
      const closePath = `L ${xScale(xMax)} ${baselineY} L ${xScale(xMin)} ${baselineY} Z`;
      
      plotElements = `
        <path d="${areaPath} ${closePath}" fill="${color}" fill-opacity="0.3"/>
        <path d="${areaPath}" fill="none" stroke="${color}" stroke-width="2"/>
      `;
      break;
  }
  
  // Generate axis ticks
  const xTicks = [];
  const yTicks = [];
  
  for (let i = 0; i <= 5; i++) {
    const xValue = xMin + (xMax - xMin) * i / 5;
    const yValue = yMin + (yMax - yMin) * i / 5;
    
    xTicks.push(`
      <line x1="${xScale(xValue)}" y1="${margin.top + plotHeight}" x2="${xScale(xValue)}" y2="${margin.top + plotHeight + 5}" stroke="#666"/>
      <text x="${xScale(xValue)}" y="${margin.top + plotHeight + 20}" text-anchor="middle" font-size="12" fill="#666">${xValue.toFixed(1)}</text>
    `);
    
    yTicks.push(`
      <line x1="${margin.left - 5}" y1="${yScale(yValue)}" x2="${margin.left}" y2="${yScale(yValue)}" stroke="#666"/>
      <text x="${margin.left - 10}" y="${yScale(yValue) + 4}" text-anchor="end" font-size="12" fill="#666">${yValue.toFixed(1)}</text>
    `);
  }
  
  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <!-- Background -->
      <rect width="${width}" height="${height}" fill="white"/>
      
      <!-- Title -->
      <text x="${width/2}" y="30" text-anchor="middle" font-size="16" font-weight="bold" fill="#1f2937">${title}</text>
      
      <!-- Axes -->
      <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + plotHeight}" stroke="#666" stroke-width="1"/>
      <line x1="${margin.left}" y1="${margin.top + plotHeight}" x2="${margin.left + plotWidth}" y2="${margin.top + plotHeight}" stroke="#666" stroke-width="1"/>
      
      <!-- Axis labels -->
      <text x="${margin.left + plotWidth/2}" y="${height - 20}" text-anchor="middle" font-size="14" fill="#374151">${xLabel}</text>
      <text x="20" y="${margin.top + plotHeight/2}" text-anchor="middle" font-size="14" fill="#374151" transform="rotate(-90 20 ${margin.top + plotHeight/2})">${yLabel}</text>
      
      <!-- Ticks -->
      ${xTicks.join('')}
      ${yTicks.join('')}
      
      <!-- Plot elements -->
      ${plotElements}
    </svg>
  `;
}

/**
 * Enhanced essay generation with integrated graphs
 */
export async function generateEssayWithGraphs(
  prompt: string,
  options: GraphGenerationOptions
): Promise<{ content: string; graphs: Array<{ svg: string; data: GraphData; position: number }> }> {
  const { model } = options;
  
  // First, generate the essay content
  const essayPrompt = `${prompt}

IMPORTANT: When writing this essay, use the marker [GRAPH_PLACEHOLDER] wherever a graph would strengthen your argument. After each marker, add a brief description in parentheses of what the graph should show.

Example: "The economic data clearly shows this trend [GRAPH_PLACEHOLDER] (inflation rates 2020-2024).

Write a comprehensive, well-structured essay that would benefit from data visualization.`;

  let essayContent: string;
  
  try {
    switch (model) {
      case 'claude':
        essayContent = await processClaude(essayPrompt, { temperature: 0.7 });
        break;
      case 'gpt4':
        essayContent = await processGPT4(essayPrompt, { temperature: 0.7 }) || '';
        break;
      case 'deepseek':
        essayContent = await processDeepSeek(essayPrompt, { temperature: 0.7 });
        break;
      default:
        essayContent = await processClaude(essayPrompt, { temperature: 0.7 });
    }
  } catch (error) {
    console.error('Error generating essay:', error);
    throw new Error('Failed to generate essay content');
  }
  
  // Find graph placeholders and their descriptions
  const graphPlaceholders = Array.from(essayContent.matchAll(/\[GRAPH_PLACEHOLDER\]\s*\([^)]+\)/g));
  
  if (graphPlaceholders.length === 0) {
    return { content: essayContent, graphs: [] };
  }
  
  // Generate graphs for each placeholder
  const graphs = [];
  
  for (let i = 0; i < graphPlaceholders.length; i++) {
    const match = graphPlaceholders[i];
    const description = match[0].match(/\(([^)]+)\)/)?.[1] || '';
    const position = match.index || 0;
    
    // Generate graph based on context around the placeholder
    const contextStart = Math.max(0, position - 500);
    const contextEnd = Math.min(essayContent.length, position + 500);
    const context = essayContent.slice(contextStart, contextEnd);
    
    const graphRequirements = await parseGraphRequirements(
      `Context: ${context}\nGraph needed: ${description}`,
      options
    );
    
    if (graphRequirements.length > 0) {
      const graphData = graphRequirements[0];
      const svg = generateSVG(graphData);
      
      graphs.push({
        svg,
        data: graphData,
        position: i
      });
    }
  }
  
  // Replace placeholders with graph references
  let finalContent = essayContent;
  graphPlaceholders.forEach((match, index) => {
    const replacement = `\n\n[GRAPH_${index}]\n\n`;
    finalContent = finalContent.replace(match[0], replacement);
  });
  
  return {
    content: finalContent,
    graphs
  };
}