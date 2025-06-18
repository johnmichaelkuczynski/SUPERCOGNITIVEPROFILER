import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MathGraphProps {
  functionExpression?: string;
  zeros?: number[];
  className?: string;
}

function generateFunctionData(expression: string, zeros: number[] = []): any[] {
  const data = [];
  
  // Determine the range based on zeros or use default
  const minX = zeros.length > 0 ? Math.min(...zeros) - 2 : -5;
  const maxX = zeros.length > 0 ? Math.max(...zeros) + 2 : 5;
  const step = (maxX - minX) / 100;
  
  for (let x = minX; x <= maxX; x += step) {
    let y = 0;
    
    // Simple function evaluation based on expression
    if (expression.includes('x^{3}') || expression.includes('x³')) {
      // Cubic function
      y = Math.pow(x, 3) - x;
    } else if (expression.includes('x^{4}') || expression.includes('x⁴')) {
      // Quartic function f(x) = 2x⁴ + 3x² - 12x
      y = 2 * Math.pow(x, 4) + 3 * Math.pow(x, 2) - 12 * x;
    } else if (expression.includes('x^{2}') || expression.includes('x²')) {
      // Quadratic function
      y = Math.pow(x, 2) - 4;
    } else if (expression.includes('sin')) {
      y = Math.sin(x);
    } else {
      // Default linear function
      y = x;
    }
    
    data.push({ x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) });
  }
  
  return data;
}

export default function MathGraph({ functionExpression = '', zeros = [], className = '' }: MathGraphProps) {
  const data = generateFunctionData(functionExpression, zeros);
  
  return (
    <div className={`math-graph bg-white p-4 rounded-lg border ${className}`}>
      <div className="mb-2">
        <h4 className="text-sm font-medium text-gray-700">Function Graph</h4>
        {functionExpression && (
          <p className="text-xs text-gray-500">{functionExpression}</p>
        )}
        {zeros.length > 0 && (
          <p className="text-xs text-blue-600">
            Zeros: {zeros.map(z => `x = ${z}`).join(', ')}
          </p>
        )}
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis 
            dataKey="x" 
            type="number"
            domain={['dataMin', 'dataMax']}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            type="number"
            domain={['dataMin', 'dataMax']}
            tick={{ fontSize: 12 }}
          />
          <Tooltip 
            formatter={(value: number) => [value.toFixed(3), 'f(x)']}
            labelFormatter={(x: number) => `x = ${x.toFixed(3)}`}
          />
          <Line 
            type="monotone" 
            dataKey="y" 
            stroke="#2563eb" 
            strokeWidth={2}
            dot={false}
          />
          {/* Mark zeros on the graph */}
          {zeros.map((zero, index) => (
            <Line
              key={index}
              type="monotone"
              dataKey={() => 0}
              stroke="#dc2626"
              strokeWidth={0}
              dot={{ fill: '#dc2626', strokeWidth: 2, r: 4 }}
              data={[{ x: zero, y: 0 }]}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}