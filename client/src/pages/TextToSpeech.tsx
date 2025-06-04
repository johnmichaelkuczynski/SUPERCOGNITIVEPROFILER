import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Play, Download, Users, Clock, Mic, Upload, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

interface VoiceAssignment {
  voiceId: string;
  voiceName: string;
  gender: string;
  accent: string;
  description: string;
}

interface ScriptPreview {
  characters: string[];
  totalLines: number;
  voiceAssignments: Record<string, VoiceAssignment>;
  dialoguePreview: Array<{
    character: string;
    text: string;
    stageDirections: string[];
    emotion?: string;
    pace?: string;
  }>;
  estimatedDuration: number;
}

interface GenerationResult {
  audioPath: string;
  metadata: {
    characters: string[];
    totalLines: number;
    voiceAssignments: Record<string, string>;
    duration: number;
  };
}

export default function TextToSpeech() {
  const [script, setScript] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingVoices, setIsLoadingVoices] = useState(false);
  const [scriptPreview, setScriptPreview] = useState<ScriptPreview | null>(null);
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [availableVoices, setAvailableVoices] = useState<ElevenLabsVoice[]>([]);
  const [customVoiceAssignments, setCustomVoiceAssignments] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const exampleScript = `ALICE: Hello Bob, how are you feeling today? (cheerfully)
BOB: Not great, Alice. I've been struggling with this problem. (sadly)
ALICE: What kind of problem? (concerned)
BOB: It's about artificial intelligence and consciousness. (thoughtfully)
ALICE: That's fascinating! Tell me more. (excitedly)
BOB: Well, if machines can think... are they truly conscious? (pauses, then continues slowly)
ALICE: That's one of the deepest questions in philosophy. (calmly)
BOB: Exactly! And I can't stop thinking about it. (laughs nervously)`;

  const loadVoices = async () => {
    setIsLoadingVoices(true);
    try {
      const response = await fetch('/api/tts/voices');
      if (!response.ok) {
        throw new Error('Failed to load voices');
      }
      const data = await response.json();
      setAvailableVoices(data.voices || data);
    } catch (error) {
      console.error('Error loading voices:', error);
      toast({
        title: "Voice Loading Error",
        description: "Failed to load available voices. Please check your ElevenLabs API key.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingVoices(false);
    }
  };

  const analyzeScript = async () => {
    if (!script.trim()) {
      toast({
        title: "Error",
        description: "Please enter a script to analyze.",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/tts/parse-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ script }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze script');
      }

      const data = await response.json();
      setScriptPreview(data);
      
      // Load voices if not already loaded
      if (availableVoices.length === 0) {
        await loadVoices();
      }
      
      toast({
        title: "Script Analyzed",
        description: `Found ${data.characters.length} characters with ${data.totalLines} dialogue lines.`,
      });
    } catch (error) {
      console.error('Error analyzing script:', error);
      toast({
        title: "Analysis Error",
        description: "Failed to analyze the script. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateAudio = async () => {
    if (!script.trim()) {
      toast({
        title: "Error",
        description: "Please enter a script to generate audio.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/tts/generate-dialogue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          script,
          customVoices: customVoiceAssignments
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate audio');
      }

      const data = await response.json();
      setGenerationResult(data);
      
      toast({
        title: "Audio Generated",
        description: "Your dialogue audio has been generated successfully!",
      });
    } catch (error) {
      console.error('Error generating audio:', error);
      toast({
        title: "Generation Error",
        description: "Failed to generate audio. Please check your ElevenLabs API key and try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadAudio = () => {
    if (generationResult?.audioPath) {
      const filename = generationResult.audioPath.split('/').pop() || 'generated_dialogue.mp3';
      window.open(`/api/tts/download/${filename}`, '_blank');
    }
  };

  const uploadDocument = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/documents/process', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to process document');
      }

      const result = await response.json();
      
      // Extract text content and add to script
      if (result.extractedText) {
        setScript(prevScript => {
          const newContent = prevScript ? `${prevScript}\n\n${result.extractedText}` : result.extractedText;
          return newContent;
        });
        
        toast({
          title: "Document Uploaded",
          description: `Successfully extracted text from ${file.name}`,
        });
      } else {
        toast({
          title: "Warning",
          description: "Document processed but no text was extracted",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: "Upload Error",
        description: "Failed to process document. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'text/plain'
      ];
      
      if (allowedTypes.includes(file.type)) {
        uploadDocument(file);
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please upload a PDF, Word document, or text file.",
          variant: "destructive"
        });
      }
    }
    
    // Reset the input value so the same file can be selected again
    if (event.target) {
      event.target.value = '';
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleVoiceChange = (character: string, voiceId: string) => {
    setCustomVoiceAssignments(prev => ({
      ...prev,
      [character]: voiceId
    }));
  };

  const loadExample = () => {
    setScript(exampleScript);
    setScriptPreview(null);
    setGenerationResult(null);
    setCustomVoiceAssignments({});
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Mic className="h-8 w-8 text-blue-600" />
          Text-to-Speech Dialogue Generator
        </h1>
        <p className="text-gray-600">
          Create high-quality spoken dialogue from multi-character scripts using ElevenLabs AI voices
        </p>
      </div>

      {/* Script Input */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Script Input</h2>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={triggerFileUpload}
                disabled={isUploading}
                className="flex items-center gap-2"
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Upload Document
              </Button>
              <Button variant="outline" onClick={loadExample}>
                Load Example
              </Button>
            </div>
          </div>
          
          {/* Hidden file input */}
          <Input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Multi-Character Script
            </label>
            <Textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Enter your script here...

Format:
CHARACTER NAME: Dialogue text (stage direction)

Example:
ALICE: Hello there! (cheerfully)
BOB: Hi Alice, how are you? (nervously)
ALICE: I'm doing great, thanks for asking. (pauses) How about you?"
              className="min-h-[200px] font-mono text-sm"
            />
          </div>
          
          <div className="text-xs text-gray-500 space-y-1">
            <p><strong>Input Options:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong>Upload Document:</strong> PDF, Word (.docx/.doc), or text files will be automatically processed</li>
              <li><strong>Manual Entry:</strong> Type or paste your script directly</li>
            </ul>
            <p><strong>Formatting Tips:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Character names should be in ALL CAPS followed by a colon</li>
              <li>Add stage directions in parentheses: (angrily), (whispers), (pauses), (slowly)</li>
              <li>Supported emotions: angry, sad, excited, calm, whisper, shout</li>
              <li>Supported pacing: slowly, quickly, fast</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={analyzeScript} 
              disabled={isAnalyzing || !script.trim()}
              className="flex items-center gap-2"
            >
              {isAnalyzing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Users className="h-4 w-4" />
              )}
              Analyze Script
            </Button>
            
            <Button 
              onClick={generateAudio} 
              disabled={isGenerating || !script.trim()}
              variant="default"
              className="flex items-center gap-2"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Generate Audio
            </Button>
          </div>
        </div>
      </Card>

      {/* Script Preview */}
      {scriptPreview && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Script Analysis</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Users className="h-6 w-6 mx-auto text-blue-600 mb-2" />
              <div className="text-2xl font-bold text-blue-600">{scriptPreview.characters.length}</div>
              <div className="text-sm text-gray-600">Characters</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Mic className="h-6 w-6 mx-auto text-green-600 mb-2" />
              <div className="text-2xl font-bold text-green-600">{scriptPreview.totalLines}</div>
              <div className="text-sm text-gray-600">Dialogue Lines</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Clock className="h-6 w-6 mx-auto text-purple-600 mb-2" />
              <div className="text-2xl font-bold text-purple-600">{scriptPreview.estimatedDuration}s</div>
              <div className="text-sm text-gray-600">Est. Duration</div>
            </div>
          </div>

          {/* Voice Selection */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Voice Selection</h4>
              {isLoadingVoices && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading voices...
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {scriptPreview.characters.map((character) => {
                const defaultVoice = scriptPreview.voiceAssignments[character];
                const selectedVoiceId = customVoiceAssignments[character] || defaultVoice?.voiceId;
                const selectedVoice = Array.isArray(availableVoices) ? 
                  availableVoices.find(v => v.voice_id === selectedVoiceId) : null;
                
                return (
                  <div key={character} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium">{character}</span>
                      <Badge variant="outline">
                        {String(selectedVoice?.labels?.gender || defaultVoice?.gender || 'Unknown')}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <Select
                        value={selectedVoiceId || ''}
                        onValueChange={(value) => handleVoiceChange(character, value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select voice..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableVoices.map((voice) => (
                            <SelectItem key={voice.voice_id} value={voice.voice_id}>
                              <div className="flex items-center justify-between w-full">
                                <span>{voice.name}</span>
                                <div className="flex gap-1 ml-2">
                                  {voice.labels?.gender && (
                                    <Badge variant="outline" className="text-xs">
                                      {voice.labels.gender}
                                    </Badge>
                                  )}
                                  {voice.labels?.accent && (
                                    <Badge variant="secondary" className="text-xs">
                                      {voice.labels.accent}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {selectedVoice && (
                        <div className="text-xs text-gray-500">
                          {String(selectedVoice.description || selectedVoice.labels?.use_case || 'ElevenLabs voice')}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dialogue Preview */}
          <div>
            <h4 className="font-medium mb-3">Dialogue Preview (First 5 Lines)</h4>
            <div className="space-y-2">
              {scriptPreview.dialoguePreview.map((line, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded border-l-4 border-blue-500">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-blue-600">{line.character}:</span>
                    {line.emotion && (
                      <Badge variant="secondary" className="text-xs">
                        {line.emotion}
                      </Badge>
                    )}
                    {line.pace && line.pace !== 'normal' && (
                      <Badge variant="outline" className="text-xs">
                        {line.pace}
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm">{line.text}</div>
                  {line.stageDirections.length > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      Directions: {line.stageDirections.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Generation Result */}
      {generationResult && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Generated Audio</h3>
          
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-green-800">
                    Audio Generation Complete!
                  </div>
                  <div className="text-sm text-green-600 mt-1">
                    {generationResult.metadata.totalLines} dialogue lines • {generationResult.metadata.characters.length} characters • {generationResult.metadata.duration}s duration
                  </div>
                </div>
                <Button 
                  onClick={downloadAudio}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download MP3
                </Button>
              </div>
            </div>

            {/* Generated Audio Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Characters & Voices</h4>
                <div className="space-y-2">
                  {Object.entries(generationResult.metadata.voiceAssignments).map(([character, voice]) => (
                    <div key={character} className="flex justify-between text-sm">
                      <span className="font-medium">{character}</span>
                      <span className="text-gray-600">{voice}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Audio Details</h4>
                <div className="space-y-1 text-sm">
                  <div>Format: MP3</div>
                  <div>Quality: High (ElevenLabs)</div>
                  <div>Total Lines: {generationResult.metadata.totalLines}</div>
                  <div>Estimated Duration: {generationResult.metadata.duration} seconds</div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}