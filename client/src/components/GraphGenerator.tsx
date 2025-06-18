import React, { useRef, useEffect } from 'react';

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
  const svgRef = useRef<SVGSVGElement>(null);
  const width = graphData.width || 400;
  const height = graphData.height || 300;
  const margin = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  useEffect(() => {
    if (!svgRef.current || !graphData.data.length) return;

    const svg = svgRef.current;
    
    // Clear previous content
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    const data = graphData.data as Point[];
    
    // Calculate scales
    const xMin = Math.min(...data.map(d => d.x));
    const xMax = Math.max(...data.map(d => d.x));
    const yMin = Math.min(...data.map(d => d.y));
    const yMax = Math.max(...data.map(d => d.y));
    
    const xScale = (x: number) => margin.left + ((x - xMin) / (xMax - xMin)) * chartWidth;
    const yScale = (y: number) => margin.top + chartHeight - ((y - yMin) / (yMax - yMin)) * chartHeight;

    // Create main group
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    svg.appendChild(g);

    // Draw axes
    const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    xAxis.setAttribute('x1', margin.left.toString());
    xAxis.setAttribute('y1', (height - margin.bottom).toString());
    xAxis.setAttribute('x2', (width - margin.right).toString());
    xAxis.setAttribute('y2', (height - margin.bottom).toString());
    xAxis.setAttribute('stroke', '#374151');
    xAxis.setAttribute('stroke-width', '1');
    g.appendChild(xAxis);

    const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    yAxis.setAttribute('x1', margin.left.toString());
    yAxis.setAttribute('y1', margin.top.toString());
    yAxis.setAttribute('x2', margin.left.toString());
    yAxis.setAttribute('y2', (height - margin.bottom).toString());
    yAxis.setAttribute('stroke', '#374151');
    yAxis.setAttribute('stroke-width', '1');
    g.appendChild(yAxis);

    // Add axis labels
    const xLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    xLabel.setAttribute('x', (width / 2).toString());
    xLabel.setAttribute('y', (height - 5).toString());
    xLabel.setAttribute('text-anchor', 'middle');
    xLabel.setAttribute('font-size', '12');
    xLabel.setAttribute('fill', '#374151');
    xLabel.textContent = graphData.xLabel;
    g.appendChild(xLabel);

    const yLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    yLabel.setAttribute('x', '12');
    yLabel.setAttribute('y', (height / 2).toString());
    yLabel.setAttribute('text-anchor', 'middle');
    yLabel.setAttribute('font-size', '12');
    yLabel.setAttribute('fill', '#374151');
    yLabel.setAttribute('transform', `rotate(-90, 12, ${height / 2})`);
    yLabel.textContent = graphData.yLabel;
    g.appendChild(yLabel);

    // Draw data based on type
    const color = graphData.color || '#2563eb';

    if (graphData.type === 'line' || graphData.type === 'function') {
      // Draw line graph
      const pathData = data.map((d, i) => 
        `${i === 0 ? 'M' : 'L'} ${xScale(d.x)} ${yScale(d.y)}`
      ).join(' ');

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', pathData);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', color);
      path.setAttribute('stroke-width', '2');
      g.appendChild(path);

      // Add points
      data.forEach(d => {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', xScale(d.x).toString());
        circle.setAttribute('cy', yScale(d.y).toString());
        circle.setAttribute('r', '3');
        circle.setAttribute('fill', color);
        g.appendChild(circle);
      });
    } else if (graphData.type === 'scatter') {
      // Draw scatter plot
      data.forEach(d => {
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', xScale(d.x).toString());
        circle.setAttribute('cy', yScale(d.y).toString());
        circle.setAttribute('r', '4');
        circle.setAttribute('fill', color);
        circle.setAttribute('opacity', '0.7');
        g.appendChild(circle);
      });
    } else if (graphData.type === 'bar') {
      // Draw bar chart
      const barWidth = chartWidth / data.length * 0.8;
      data.forEach((d, i) => {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', (xScale(d.x) - barWidth / 2).toString());
        rect.setAttribute('y', yScale(Math.max(0, d.y)).toString());
        rect.setAttribute('width', barWidth.toString());
        rect.setAttribute('height', Math.abs(yScale(d.y) - yScale(0)).toString());
        rect.setAttribute('fill', color);
        rect.setAttribute('opacity', '0.8');
        g.appendChild(rect);
      });
    }

    // Add grid lines
    const gridColor = '#e5e7eb';
    
    // Vertical grid lines
    for (let i = 0; i <= 5; i++) {
      const x = margin.left + (i / 5) * chartWidth;
      const gridLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      gridLine.setAttribute('x1', x.toString());
      gridLine.setAttribute('y1', margin.top.toString());
      gridLine.setAttribute('x2', x.toString());
      gridLine.setAttribute('y2', (height - margin.bottom).toString());
      gridLine.setAttribute('stroke', gridColor);
      gridLine.setAttribute('stroke-width', '0.5');
      gridLine.setAttribute('opacity', '0.5');
      g.insertBefore(gridLine, g.firstChild);
    }

    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = margin.top + (i / 5) * chartHeight;
      const gridLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      gridLine.setAttribute('x1', margin.left.toString());
      gridLine.setAttribute('y1', y.toString());
      gridLine.setAttribute('x2', (width - margin.right).toString());
      gridLine.setAttribute('y2', y.toString());
      gridLine.setAttribute('stroke', gridColor);
      gridLine.setAttribute('stroke-width', '0.5');
      gridLine.setAttribute('opacity', '0.5');
      g.insertBefore(gridLine, g.firstChild);
    }

  }, [graphData, width, height, chartWidth, chartHeight, margin]);

  return (
    <div className={`graph-container bg-white rounded-lg border p-4 ${className}`}>
      <h3 className="text-lg font-semibold mb-2 text-center">{graphData.title}</h3>
      {graphData.equation && (
        <p className="text-sm text-gray-600 text-center mb-2 font-mono">
          {graphData.equation}
        </p>
      )}
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="border rounded"
        style={{ backgroundColor: '#fafafa' }}
      >
      </svg>
    </div>
  );
}