import React from 'react';
import { AlertCircle, Check, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AIDetectionBadgeProps {
  metadata?: string;
  showDetails?: boolean;
}

export default function AIDetectionBadge({ metadata, showDetails = false }: AIDetectionBadgeProps) {
  if (!metadata) return null;
  
  try {
    const parsedMetadata = JSON.parse(metadata);
    
    // Check if we have AI probability data in the metadata
    if (!('aiProbability' in parsedMetadata)) {
      return null;
    }
    
    const aiProbability = parsedMetadata.aiProbability as number;
    const humanProbability = parsedMetadata.humanProbability as number;
    
    // Determine the probability level for styling and messaging
    let level: 'low' | 'medium' | 'high';
    let icon;
    let colorClass;
    let message;
    
    if (aiProbability < 0.3) {
      level = 'low';
      icon = <Check className="h-3 w-3" />;
      colorClass = "bg-green-100 text-green-800 border-green-200";
      message = "Likely human-written";
    } else if (aiProbability >= 0.3 && aiProbability < 0.7) {
      level = 'medium';
      icon = <AlertTriangle className="h-3 w-3" />;
      colorClass = "bg-amber-100 text-amber-800 border-amber-200";
      message = "May contain AI-generated content";
    } else {
      level = 'high';
      icon = <AlertCircle className="h-3 w-3" />;
      colorClass = "bg-red-100 text-red-800 border-red-200";
      message = "Likely AI-generated";
    }
    
    // Percentage rounded to whole number
    const aiPercentage = Math.round(aiProbability * 100);
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${colorClass}`}>
              {icon}
              {showDetails ? (
                <span>AI: {aiPercentage}%</span>
              ) : (
                <span>AI Detection</span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1 p-1">
              <p className="font-medium text-sm">{message}</p>
              <div className="flex justify-between text-xs gap-4">
                <div>
                  <span className="font-medium">AI probability:</span> {aiPercentage}%
                </div>
                <div>
                  <span className="font-medium">Human probability:</span> {Math.round(humanProbability * 100)}%
                </div>
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  } catch (error) {
    console.error("Error parsing metadata for AI detection:", error);
    return null;
  }
}