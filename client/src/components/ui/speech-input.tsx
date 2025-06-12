import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface SpeechInputProps {
  onTranscript: (text: string) => void;
  onAppend?: boolean; // Whether to append to existing text or replace
  disabled?: boolean;
  language?: string;
  className?: string;
  size?: "sm" | "default" | "lg";
}

export function SpeechInput({
  onTranscript,
  onAppend = true,
  disabled = false,
  language = "en",
  className,
  size = "default"
}: SpeechInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = useCallback(async () => {
    try {
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support microphone access. Please use Chrome, Firefox, or Safari.');
      }

      // Request microphone permission with fallback options
      let stream: MediaStream;
      try {
        // Try with optimal settings first
        stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 16000
          }
        });
      } catch (constraintError) {
        console.warn('Failed with constraints, trying basic audio:', constraintError);
        // Fallback to basic audio if constraints fail
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      // Check MediaRecorder support and find best mime type
      let mimeType = '';
      const supportedTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg',
        'audio/wav'
      ];

      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }

      if (!mimeType) {
        throw new Error('Your browser does not support audio recording. Please update your browser.');
      }

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
        
        if (audioChunksRef.current.length > 0) {
          await processRecording();
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        toast({
          title: "Recording error",
          description: "An error occurred during recording. Please try again.",
          variant: "destructive"
        });
        setIsRecording(false);
      };

      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);

      toast({
        title: "Recording started",
        description: "Speak clearly into your microphone. Click again to stop.",
      });

    } catch (error) {
      console.error('Error starting recording:', error);
      
      let errorMessage = "Please check microphone permissions";
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = "Microphone access denied. Please allow microphone permissions and try again.";
        } else if (error.name === 'NotFoundError') {
          errorMessage = "No microphone found. Please connect a microphone and try again.";
        } else if (error.name === 'NotSupportedError') {
          errorMessage = "Your browser doesn't support microphone recording. Please use Chrome, Firefox, or Safari.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Recording failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  }, [toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const processRecording = async () => {
    setIsProcessing(true);

    try {
      // Create audio blob
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      if (audioBlob.size === 0) {
        throw new Error('No audio data recorded');
      }

      // Convert to FormData for upload
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('language', language);
      formData.append('punctuate', 'true');
      formData.append('format_text', 'true');

      // Send to transcription API
      const response = await fetch('/api/speech-to-text', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.text) {
        onTranscript(result.text);
        toast({
          title: "Speech transcribed",
          description: `Successfully transcribed ${result.text.length} characters`,
        });
      } else {
        throw new Error(result.error || 'No speech detected');
      }

    } catch (error) {
      console.error('Transcription error:', error);
      toast({
        title: "Transcription failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      audioChunksRef.current = [];
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const isDisabled = disabled || isProcessing;

  const sizeClasses = {
    sm: "h-8 w-8",
    default: "h-10 w-10",
    lg: "h-12 w-12"
  };

  return (
    <Button
      type="button"
      variant={isRecording ? "destructive" : "outline"}
      size="icon"
      onClick={toggleRecording}
      disabled={isDisabled}
      className={cn(
        sizeClasses[size],
        "shrink-0 transition-colors",
        isRecording && "animate-pulse",
        className
      )}
      title={isRecording ? "Stop recording" : "Start voice dictation"}
    >
      {isProcessing ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : isRecording ? (
        <Square className="w-4 h-4" />
      ) : (
        <Mic className="w-4 h-4" />
      )}
    </Button>
  );
}

// Hook for easier integration with form inputs
export function useSpeechInput(
  setValue: (value: string) => void,
  getCurrentValue?: () => string,
  options?: Omit<SpeechInputProps, 'onTranscript'>
) {
  const handleTranscript = useCallback((text: string) => {
    if (options?.onAppend && getCurrentValue) {
      const currentValue = getCurrentValue();
      const newValue = currentValue ? `${currentValue} ${text}` : text;
      setValue(newValue);
    } else {
      setValue(text);
    }
  }, [setValue, getCurrentValue, options?.onAppend]);

  const SpeechButton = useCallback((props: { className?: string }) => (
    <SpeechInput
      {...options}
      onTranscript={handleTranscript}
      className={props.className}
    />
  ), [handleTranscript, options]);

  return { SpeechButton, handleTranscript };
}