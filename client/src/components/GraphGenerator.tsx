import React from 'react';

interface Point {
  x: number;
  y: number;
}

interface GraphData {
  type: 'line' | 'bar' | 'scatter' | 'function';
  title: string;
  xLabel: string;
  yLabel: string;
  data: Point[] | { x: number; y: number; label?: string }[];
  equation?: string;
  color?: string;
  width?: number;
  height?: number;
}

interface GraphGeneratorProps {
  graphData: GraphData;
  className?: string;
}

export default function GraphGenerator({ graphData, className = '' }: GraphGeneratorProps) {
  const {
    type,
    title,
    xLabel,
    yLabel,
    data,
    equation,
    color = '#2563eb',
    width = 400,
    height = 300
  } = graphData;

  const margin = { top: 40, right: 40, bottom: 60, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Calculate data bounds
  const xMin = Math.min(...data.map(d => d.x));
  const xMax = Math.max(...data.map(d => d.x));
  const yMin = Math.min(...data.map(d => d.y));
  const yMax = Math.max(...data.map(d => d.y));

  // Add padding to bounds
  const xPadding = (xMax - xMin) * 0.1;
  const yPadding = (yMax - yMin) * 0.1;
  const xDomain = [xMin - xPadding, xMax + xPadding];
  const yDomain = [yMin - yPadding, yMax + yPadding];

  // Scale functions
  const scaleX = (x: number) => ((x - xDomain[0]) / (xDomain[1] - xDomain[0])) * innerWidth;
  const scaleY = (y: number) => innerHeight - ((y - yDomain[0]) / (yDomain[1] - yDomain[0])) * innerHeight;

  // Generate tick marks
  const xTicks = Array.from({ length: 6 }, (_, i) => 
    xDomain[0] + (i / 5) * (xDomain[1] - xDomain[0])
  );
  const yTicks = Array.from({ length: 6 }, (_, i) => 
    yDomain[0] + (i / 5) * (yDomain[1] - yDomain[0])
  );

  const renderLineGraph = () => {
    const pathData = data
      .map((point, index) => {
        const x = scaleX(point.x);
        const y = scaleY(point.y);
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');

    return (
      <>
        <path
          d={pathData}
          stroke={color}
          strokeWidth="2"
          fill="none"
        />
        {data.map((point, index) => (
          <circle
            key={index}
            cx={scaleX(point.x)}
            cy={scaleY(point.y)}
            r="3"
            fill={color}
          />
        ))}
      </>
    );
  };

  const renderBarGraph = () => {
    const barWidth = innerWidth / data.length * 0.8;
    return data.map((point, index) => {
      const x = (index / data.length) * innerWidth + (innerWidth / data.length - barWidth) / 2;
      const barHeight = ((point.y - yDomain[0]) / (yDomain[1] - yDomain[0])) * innerHeight;
      const y = innerHeight - barHeight;
      
      return (
        <rect
          key={index}
          x={x}
          y={y}
          width={barWidth}
          height={barHeight}
          fill={color}
          opacity="0.8"
        />
      );
    });
  };

  const renderScatterPlot = () => {
    return data.map((point, index) => (
      <circle
        key={index}
        cx={scaleX(point.x)}
        cy={scaleY(point.y)}
        r="4"
        fill={color}
        opacity="0.7"
      />
    ));
  };

  const renderFunctionGraph = () => {
    // For function graphs, generate more points for smooth curves
    const points = [];
    const steps = 100;
    for (let i = 0; i <= steps; i++) {
      const x = xDomain[0] + (i / steps) * (xDomain[1] - xDomain[0]);
      // Find closest data point or interpolate
      const dataPoint = data.find(d => Math.abs(d.x - x) < 0.1) || 
                       data.reduce((prev, curr) => 
                         Math.abs(curr.x - x) < Math.abs(prev.x - x) ? curr : prev
                       );
      if (dataPoint) {
        points.push({ x, y: dataPoint.y });
      }
    }

    const pathData = points
      .map((point, index) => {
        const x = scaleX(point.x);
        const y = scaleY(point.y);
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');

    return (
      <path
        d={pathData}
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
    );
  };

  const renderGraph = () => {
    switch (type) {
      case 'line':
        return renderLineGraph();
      case 'bar':
        return renderBarGraph();
      case 'scatter':
        return renderScatterPlot();
      case 'function':
        return renderFunctionGraph();
      default:
        return renderLineGraph();
    }
  };

  return (
    <div className={`inline-block ${className}`}>
      <svg width={width} height={height} className="border rounded-lg bg-white">
        {/* Background */}
        <rect width={width} height={height} fill="white" />
        
        {/* Graph area */}
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {/* Grid lines */}
          {xTicks.map((tick, index) => (
            <line
              key={`x-grid-${index}`}
              x1={scaleX(tick)}
              y1={0}
              x2={scaleX(tick)}
              y2={innerHeight}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          ))}
          {yTicks.map((tick, index) => (
            <line
              key={`y-grid-${index}`}
              x1={0}
              y1={scaleY(tick)}
              x2={innerWidth}
              y2={scaleY(tick)}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          ))}
          
          {/* Axes */}
          <line x1={0} y1={innerHeight} x2={innerWidth} y2={innerHeight} stroke="#374151" strokeWidth="2" />
          <line x1={0} y1={0} x2={0} y2={innerHeight} stroke="#374151" strokeWidth="2" />
          
          {/* X-axis ticks and labels */}
          {xTicks.map((tick, index) => (
            <g key={`x-tick-${index}`}>
              <line
                x1={scaleX(tick)}
                y1={innerHeight}
                x2={scaleX(tick)}
                y2={innerHeight + 5}
                stroke="#374151"
                strokeWidth="1"
              />
              <text
                x={scaleX(tick)}
                y={innerHeight + 20}
                textAnchor="middle"
                fontSize="12"
                fill="#374151"
              >
                {tick.toFixed(1)}
              </text>
            </g>
          ))}
          
          {/* Y-axis ticks and labels */}
          {yTicks.map((tick, index) => (
            <g key={`y-tick-${index}`}>
              <line
                x1={-5}
                y1={scaleY(tick)}
                x2={0}
                y2={scaleY(tick)}
                stroke="#374151"
                strokeWidth="1"
              />
              <text
                x={-10}
                y={scaleY(tick) + 4}
                textAnchor="end"
                fontSize="12"
                fill="#374151"
              >
                {tick.toFixed(1)}
              </text>
            </g>
          ))}
          
          {/* Graph content */}
          {renderGraph()}
        </g>
        
        {/* Title */}
        <text x={width / 2} y={20} textAnchor="middle" fontSize="16" fontWeight="bold" fill="#1f2937">
          {title}
        </text>
        
        {/* X-axis label */}
        <text x={width / 2} y={height - 10} textAnchor="middle" fontSize="14" fill="#374151">
          {xLabel}
        </text>
        
        {/* Y-axis label */}
        <text
          x={15}
          y={height / 2}
          textAnchor="middle"
          fontSize="14"
          fill="#374151"
          transform={`rotate(-90, 15, ${height / 2})`}
        >
          {yLabel}
        </text>
        
        {/* Equation display */}
        {equation && (
          <text x={width - 10} y={30} textAnchor="end" fontSize="12" fill="#6b7280">
            {equation}
          </text>
        )}
      </svg>
    </div>
  );
}