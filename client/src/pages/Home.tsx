import React from 'react';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">TextMind Chat</h1>
      
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
        <p className="text-lg mb-4">
          Welcome to TextMind - an advanced AI writing and analysis tool.
        </p>
        
        <p className="text-center mb-4">
          This is a simplified interface for testing.
        </p>
        
        <div className="flex justify-center gap-4 mt-8">
          <Button>Claude</Button>
          <Button variant="outline">GPT-4</Button>
          <Button variant="outline">Perplexity</Button>
        </div>
        
        <div className="mt-8">
          <textarea 
            className="w-full h-32 p-4 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type your message here..."
          />
          
          <Button className="w-full mt-4">
            Send Message
          </Button>
        </div>
      </div>
    </div>
  );
}
