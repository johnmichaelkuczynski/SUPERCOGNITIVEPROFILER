import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface GraphData {
  type: 'line' | 'bar' | 'scatter' | 'function' | 'pie' | 'area';
  title: string;
  xLabel: string;
  yLabel: string;
  data: Array<{ x: number; y: number; label?: string }>;
  equation?: string;
  color?: string;
  description: string;
}

interface GraphGenerationResult {
  graphs: GraphData[];
  enhancedText: string;
  graphPlacements: Array<{
    graphIndex: number;
    insertAfterParagraph: number;
    contextDescription: string;
  }>;
}

// Parse mathematical expressions and generate appropriate graphs
function parseEquationToGraph(equation: string): GraphData | null {
  try {
    // Handle common mathematical functions
    if (equation.includes('x^3') || equation.includes('x³')) {
      // Cubic function
      const data = [];
      for (let x = -5; x <= 5; x += 0.5) {
        const y = Math.pow(x, 3);
        data.push({ x, y });
      }
      return {
        type: 'function',
        title: 'Cubic Function',
        xLabel: 'x',
        yLabel: 'f(x)',
        data,
        equation: equation,
        color: '#2563eb',
        description: 'Graph of cubic function'
      };
    }

    if (equation.includes('x^2') || equation.includes('x²')) {
      // Quadratic function
      const data = [];
      for (let x = -5; x <= 5; x += 0.5) {
        const y = Math.pow(x, 2);
        data.push({ x, y });
      }
      return {
        type: 'function',
        title: 'Quadratic Function',
        xLabel: 'x',
        yLabel: 'f(x)',
        data,
        equation: equation,
        color: '#dc2626',
        description: 'Graph of quadratic function'
      };
    }

    if (equation.includes('sin') || equation.includes('cos')) {
      // Trigonometric function
      const data = [];
      for (let x = -Math.PI * 2; x <= Math.PI * 2; x += 0.1) {
        const y = equation.includes('sin') ? Math.sin(x) : Math.cos(x);
        data.push({ x, y });
      }
      return {
        type: 'function',
        title: equation.includes('sin') ? 'Sine Function' : 'Cosine Function',
        xLabel: 'x (radians)',
        yLabel: 'f(x)',
        data,
        equation: equation,
        color: '#059669',
        description: 'Graph of trigonometric function'
      };
    }

    if (equation.includes('e^') || equation.includes('exp')) {
      // Exponential function
      const data = [];
      for (let x = -3; x <= 3; x += 0.1) {
        const y = Math.exp(x);
        data.push({ x, y });
      }
      return {
        type: 'function',
        title: 'Exponential Function',
        xLabel: 'x',
        yLabel: 'f(x)',
        data,
        equation: equation,
        color: '#7c3aed',
        description: 'Graph of exponential function'
      };
    }

    if (equation.includes('log') || equation.includes('ln')) {
      // Logarithmic function
      const data = [];
      for (let x = 0.1; x <= 10; x += 0.1) {
        const y = equation.includes('ln') ? Math.log(x) : Math.log10(x);
        data.push({ x, y });
      }
      return {
        type: 'function',
        title: equation.includes('ln') ? 'Natural Logarithm' : 'Logarithm',
        xLabel: 'x',
        yLabel: 'f(x)',
        data,
        equation: equation,
        color: '#ea580c',
        description: 'Graph of logarithmic function'
      };
    }

    return null;
  } catch (error) {
    console.error('Error parsing equation:', error);
    return null;
  }
}

// Generate graphs from natural language descriptions
export async function generateGraphsFromText(text: string, context: string = 'general'): Promise<GraphGenerationResult> {
  try {
    const prompt = `Analyze this text and generate appropriate graphs/charts that would enhance understanding. For each graph needed, provide the data and placement.

TEXT: ${text}

CONTEXT: ${context}

Requirements:
1. Identify where graphs would be most effective
2. Generate realistic data for each graph
3. Specify exact placement within the text
4. Support these graph types: line, bar, scatter, function, pie, area

Return a JSON object with this structure:
{
  "graphs": [
    {
      "type": "line|bar|scatter|function|pie|area",
      "title": "Graph Title",
      "xLabel": "X-axis Label", 
      "yLabel": "Y-axis Label",
      "data": [{"x": number, "y": number, "label": "optional"}],
      "equation": "optional mathematical equation",
      "color": "#hex-color",
      "description": "What this graph shows"
    }
  ],
  "enhancedText": "Original text with [GRAPH_0], [GRAPH_1] markers where graphs should be inserted",
  "graphPlacements": [
    {
      "graphIndex": 0,
      "insertAfterParagraph": 2,
      "contextDescription": "Why this graph goes here"
    }
  ]
}

Focus on:
- Economics: supply/demand curves, inflation trends, GDP growth
- Science: experimental data, trends, correlations  
- Mathematics: function graphs, statistical distributions
- Business: performance metrics, market analysis, financial trends
- General: data visualization that supports arguments

Generate realistic, meaningful data - no placeholder values.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 4000,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    // Also check for mathematical equations in the text and generate function graphs
    const mathEquationRegex = /f\(x\)\s*=\s*[^.]+|y\s*=\s*[^.]+|\$[^$]+\$/g;
    const equations = text.match(mathEquationRegex) || [];
    
    for (const equation of equations) {
      const cleanEquation = equation.replace(/\$|\\[|\\]/g, '').trim();
      const mathGraph = parseEquationToGraph(cleanEquation);
      if (mathGraph) {
        result.graphs = result.graphs || [];
        result.graphs.push(mathGraph);
      }
    }

    return result;
  } catch (error) {
    console.error('Error generating graphs from text:', error);
    return {
      graphs: [],
      enhancedText: text,
      graphPlacements: []
    };
  }
}

// Generate specific economics graphs
export function generateEconomicsGraphs(): GraphData[] {
  return [
    {
      type: 'line',
      title: 'Supply and Demand Curves',
      xLabel: 'Quantity',
      yLabel: 'Price',
      data: [
        // Supply curve
        { x: 0, y: 2, label: 'Supply' },
        { x: 10, y: 4 },
        { x: 20, y: 6 },
        { x: 30, y: 8 },
        { x: 40, y: 10 },
        // Demand curve  
        { x: 0, y: 10, label: 'Demand' },
        { x: 10, y: 8 },
        { x: 20, y: 6 },
        { x: 30, y: 4 },
        { x: 40, y: 2 }
      ],
      color: '#059669',
      description: 'Classic supply and demand economic model'
    },
    {
      type: 'line',
      title: 'Inflation Rate Over Time',
      xLabel: 'Year',
      yLabel: 'Inflation Rate (%)',
      data: [
        { x: 2020, y: 1.2 },
        { x: 2021, y: 4.7 },
        { x: 2022, y: 8.0 },
        { x: 2023, y: 3.2 },
        { x: 2024, y: 2.8 }
      ],
      color: '#dc2626',
      description: 'Historical inflation trends'
    }
  ];
}

// Convert text with mathematical expressions to enhanced content with graphs
export async function enhanceContentWithGraphs(content: string, context: string = 'academic'): Promise<string> {
  try {
    const graphResult = await generateGraphsFromText(content, context);
    
    let enhancedContent = content;
    
    // Insert graph markers where appropriate
    if (graphResult.graphs.length > 0) {
      const paragraphs = content.split('\n\n');
      
      graphResult.graphPlacements.forEach(placement => {
        const { graphIndex, insertAfterParagraph } = placement;
        if (insertAfterParagraph < paragraphs.length) {
          paragraphs[insertAfterParagraph] += `\n\n[GRAPH_${graphIndex}]\n`;
        }
      });
      
      enhancedContent = paragraphs.join('\n\n');
    }
    
    return enhancedContent;
  } catch (error) {
    console.error('Error enhancing content with graphs:', error);
    return content;
  }
}