import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Play, Download, Users, Clock, Mic, Upload, FileText, Trash2, Scissors, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CleaningPreview {
  charactersFound: string[];
  dialogueLineCount: number;
  elementsToRemove: {
    stageDirections: number;
    commentary: number;
    narration: number;
  };
  sampleRemovals: {
    stageDirections: string[];
    commentary: string[];
    narration: string[];
  };
}

interface CleanedDocument {
  originalText: string;
  cleanedText: string;
  removedElements: {
    stageDirections: string[];
    commentary: string[];
    narration: string[];
  };
  dialogueLines: Array<{
    character: string;
    text: string;
  }>;
  characters: string[];
}

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
  description?: string;
  labels?: {
    accent?: string;
    gender?: string;
    age?: string;
    use_case?: string;
  };
}

export default function TextToSpeech() {
  const [originalText, setOriginalText] = useState('');
  const [cleanedText, setCleanedText] = useState('');
  const [cleaningPreview, setCleaningPreview] = useState<CleaningPreview | null>(null);
  const [isCleaningText, setIsCleaningText] = useState(false);
  const [voices, setVoices] = useState<ElevenLabsVoice[]>([]);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Load ElevenLabs voices
  const loadVoices = async () => {
    setIsLoadingVoices(true);
    try {
      const response = await fetch('/api/tts/voices');
      if (response.ok) {
        const data = await response.json();
        setVoices(data.voices || []);
      } else {
        toast({
          title: "Error",
          description: "Failed to load voices. Check your ElevenLabs API key.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to voice service",
        variant: "destructive"
      });
    } finally {
      setIsLoadingVoices(false);
    }
  };

  // Upload and extract document text
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/tts/extract-text', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      if (result.success) {
        setOriginalText(result.text);
        toast({
          title: "Success",
          description: `Extracted ${result.text.length} characters from ${file.name}`
        });
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to extract text from document",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload document",
        variant: "destructive"
      });
    }
  };

  // Preview document cleaning
  const previewCleaning = async () => {
    if (!originalText.trim()) {
      toast({
        title: "Error",
        description: "Please enter or upload text first",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/document/preview-cleaning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: originalText })
      });

      if (response.ok) {
        const preview = await response.json();
        setCleaningPreview(preview);
      } else {
        toast({
          title: "Error",
          description: "Failed to preview cleaning",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to analyze document",
        variant: "destructive"
      });
    }
  };

  // Clean document for TTS production
  const cleanDocument = async () => {
    if (!originalText.trim()) {
      toast({
        title: "Error",
        description: "Please enter or upload text first",
        variant: "destructive"
      });
      return;
    }

    setIsCleaningText(true);
    try {
      const response = await fetch('/api/document/clean-for-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: originalText })
      });

      if (response.ok) {
        const cleaned: CleanedDocument = await response.json();
        setCleanedText(cleaned.cleanedText);
        toast({
          title: "Success",
          description: `Document cleaned: ${cleaned.dialogueLines.length} dialogue lines from ${cleaned.characters.length} characters`
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to clean document",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process document",
        variant: "destructive"
      });
    } finally {
      setIsCleaningText(false);
    }
  };

  // Send cleaned text to TTS
  const sendToTTS = async () => {
    if (!cleanedText.trim()) {
      toast({
        title: "Error",
        description: "Please clean document first",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingAudio(true);
    try {
      const response = await fetch('/api/tts/generate-dialogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          script: cleanedText,
          voiceAssignments: {} // Let ElevenLabs auto-assign voices
        })
      });

      if (response.ok) {
        const result = await response.json();
        setGeneratedAudioUrl(result.audioPath);
        toast({
          title: "Success",
          description: "Audio generated successfully"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to generate audio",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to TTS service",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Document to Speech Production</h1>
        <p className="text-muted-foreground mt-2">
          Clean dialogue scripts and convert to professional audio
        </p>
      </div>

      {/* Document Input */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Document Input
        </h2>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload Document
            </Button>
            <Button
              onClick={() => setOriginalText('')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.docx,.pdf"
            onChange={handleFileUpload}
            className="hidden"
          />

          <Textarea
            value={originalText}
            onChange={(e) => setOriginalText(e.target.value)}
            placeholder="Paste your dialogue script here or upload a document..."
            className="min-h-[200px] font-mono"
          />
        </div>
      </Card>

      {/* Document Cleaner */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Scissors className="w-5 h-5" />
          Document Cleaner
        </h2>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={previewCleaning}
              variant="outline"
              disabled={!originalText.trim()}
            >
              Preview Cleaning
            </Button>
            <Button
              onClick={cleanDocument}
              disabled={!originalText.trim() || isCleaningText}
            >
              {isCleaningText && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Clean for TTS
            </Button>
          </div>

          {cleaningPreview && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <h3 className="font-semibold mb-2">Cleaning Preview</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="font-medium">Characters Found</div>
                  <div className="text-blue-600">{cleaningPreview.charactersFound.length}</div>
                </div>
                <div>
                  <div className="font-medium">Dialogue Lines</div>
                  <div className="text-green-600">{cleaningPreview.dialogueLineCount}</div>
                </div>
                <div>
                  <div className="font-medium">Stage Directions</div>
                  <div className="text-orange-600">{cleaningPreview.elementsToRemove.stageDirections} to remove</div>
                </div>
                <div>
                  <div className="font-medium">Commentary</div>
                  <div className="text-red-600">{cleaningPreview.elementsToRemove.commentary} to remove</div>
                </div>
              </div>
            </div>
          )}

          {cleanedText && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Production-Ready Text</label>
              <Textarea
                value={cleanedText}
                onChange={(e) => setCleanedText(e.target.value)}
                className="min-h-[150px] font-mono bg-green-50"
                placeholder="Cleaned dialogue will appear here..."
              />
            </div>
          )}
        </div>
      </Card>

      {/* TTS Section */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Mic className="w-5 h-5" />
          Text-to-Speech Production
        </h2>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={loadVoices}
              variant="outline"
              disabled={isLoadingVoices}
            >
              {isLoadingVoices && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Load Voices
            </Button>
            <Button
              onClick={sendToTTS}
              disabled={!cleanedText.trim() || isGeneratingAudio}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isGeneratingAudio && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <ArrowRight className="w-4 h-4 mr-2" />
              Generate Audio
            </Button>
          </div>

          {voices.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {voices.length} voices available from ElevenLabs
            </div>
          )}

          {generatedAudioUrl && (
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Generated Audio</h3>
              <audio controls className="w-full mb-2">
                <source src={generatedAudioUrl} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
              <Button
                onClick={() => window.open(generatedAudioUrl!, '_blank')}
                variant="outline"
                size="sm"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}