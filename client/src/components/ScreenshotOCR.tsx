import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Camera, Upload, Copy, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MathJax } from 'better-react-mathjax';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface OCRResult {
  text: string;
  containsMath: boolean;
  confidence: number;
  processingMethod: string;
  filename: string;
}

interface ScreenshotOCRProps {
  onTextExtracted?: (text: string, containsMath: boolean) => void;
  className?: string;
}

export default function ScreenshotOCR({ onTextExtracted, className = "" }: ScreenshotOCRProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const processScreenshot = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (PNG, JPG, etc.)",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    setOcrResult(null);

    try {
      const formData = new FormData();
      formData.append('screenshot', file);

      const response = await fetch('/api/ocr/screenshot', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process screenshot');
      }

      const result: OCRResult = await response.json();
      setOcrResult(result);

      // Call the callback if provided
      if (onTextExtracted) {
        onTextExtracted(result.text, result.containsMath);
      }

      toast({
        title: "Screenshot processed successfully!",
        description: `Extracted ${result.text.length} characters${result.containsMath ? ' (with math notation)' : ''}`,
      });

    } catch (error) {
      console.error('OCR processing error:', error);
      toast({
        title: "OCR processing failed",
        description: error instanceof Error ? error.message : "An error occurred while processing the screenshot.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (files && files.length > 0) {
      processScreenshot(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const copyToClipboard = async () => {
    if (ocrResult?.text) {
      try {
        await navigator.clipboard.writeText(ocrResult.text);
        toast({
          title: "Copied to clipboard",
          description: "Text has been copied to your clipboard.",
        });
      } catch (error) {
        toast({
          title: "Copy failed",
          description: "Could not copy text to clipboard.",
          variant: "destructive"
        });
      }
    }
  };

  const formatExtractedText = (text: string) => {
    return (
      <div className="prose dark:prose-invert prose-sm max-w-none">
        <MathJax>
          <ReactMarkdown
            rehypePlugins={[rehypeKatex]}
            remarkPlugins={[remarkMath]}
          >
            {text}
          </ReactMarkdown>
        </MathJax>
      </div>
    );
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Screenshot OCR
        </CardTitle>
        <CardDescription>
          Extract text and mathematical notation from screenshots using advanced OCR
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${dragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 hover:border-gray-400'}
            ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
          `}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">
            {dragActive ? 'Drop screenshot here' : 'Upload Screenshot'}
          </p>
          <p className="text-sm text-gray-500">
            Drag and drop or click to select • PNG, JPG, WebP supported
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Powered by Mathpix for accurate math extraction
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={isProcessing}
        />

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Processing screenshot with OCR...</span>
            </div>
            <Progress className="w-full" />
          </div>
        )}

        {/* Results */}
        {ocrResult && (
          <div className="space-y-4">
            {/* Metadata */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                {Math.round(ocrResult.confidence * 100)}% confidence
              </Badge>
              
              {ocrResult.containsMath && (
                <Badge variant="default" className="bg-blue-500">
                  Mathematical notation detected
                </Badge>
              )}
              
              <Badge variant="secondary">
                {ocrResult.processingMethod === 'mathpix' ? 'Mathpix OCR' : 'Fallback OCR'}
              </Badge>
              
              <Badge variant="outline">
                {ocrResult.text.length} characters
              </Badge>
            </div>

            {/* Extracted Text */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Extracted Text:</h3>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyToClipboard}
                    className="flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    Copy
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setOcrResult(null)}
                    className="flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <X className="w-3 h-3" />
                    Clear
                  </Button>
                </div>
              </div>
              
              <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900 max-h-96 overflow-y-auto">
                {ocrResult.text ? (
                  formatExtractedText(ocrResult.text)
                ) : (
                  <p className="text-gray-500 italic">No text extracted from image.</p>
                )}
              </div>
            </div>

            {/* Quality Indicator */}
            {ocrResult.confidence < 0.7 && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    Low confidence result
                  </p>
                  <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                    The extracted text may not be fully accurate. Try uploading a clearer image with better lighting and contrast.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}