import React from 'react';
import GraphGenerator from '@/components/GraphGenerator';

export default function Graphs() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Graph Generator</h1>
          <p className="text-gray-600">
            Create intelligent graphs from natural language descriptions, mathematical expressions, 
            or generate complete essays with embedded visualizations.
          </p>
        </div>
        
        <GraphGenerator />
      </div>
    </div>
  );
}