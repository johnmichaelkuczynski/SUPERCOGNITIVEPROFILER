import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

export interface VoiceProfile {
  voice_id: string;
  name: string;
  gender: string;
  accent: string;
  description: string;
  category: string;
}

export interface DialogueLine {
  character: string;
  text: string;
  stageDirections: string[];
  emotion?: string;
  pace?: 'slow' | 'normal' | 'fast';
  volume?: number;
}

export interface ScriptParsing {
  lines: DialogueLine[];
  characters: string[];
  totalDuration: number;
}

class ElevenLabsService {
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';
  private voiceProfiles: Map<string, VoiceProfile> = new Map();

  constructor() {
    this.apiKey = process.env.ELEVEN_LABS_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('ELEVEN_LABS_API_KEY not found in environment variables');
    }
  }

  // Get available voices from ElevenLabs
  async getAvailableVoices(): Promise<VoiceProfile[]> {
    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.statusText}`);
      }

      const data = await response.json() as any;
      const voices: VoiceProfile[] = data.voices.map((voice: any) => ({
        voice_id: voice.voice_id,
        name: voice.name,
        gender: voice.labels?.gender || 'unknown',
        accent: voice.labels?.accent || 'american',
        description: voice.labels?.description || '',
        category: voice.category || 'premade'
      }));

      // Cache voice profiles
      voices.forEach(voice => {
        this.voiceProfiles.set(voice.name.toLowerCase(), voice);
      });

      return voices;
    } catch (error) {
      console.error('Error fetching ElevenLabs voices:', error);
      throw error;
    }
  }

  // Parse multi-character script with stage directions
  parseScript(script: string): ScriptParsing {
    const lines = script.split('\n').filter(line => line.trim());
    const dialogueLines: DialogueLine[] = [];
    const characters = new Set<string>();

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip empty lines and pure stage directions
      if (!trimmedLine || (trimmedLine.startsWith('*') && trimmedLine.endsWith('*'))) {
        continue;
      }

      // Parse character dialogue: "CHARACTER: dialogue text (stage direction)"
      const dialogueMatch = trimmedLine.match(/^([A-Z][^:]*?):\s*(.+)$/);
      if (dialogueMatch) {
        const character = dialogueMatch[1].trim();
        let dialogue = dialogueMatch[2].trim();
        
        // Extract stage directions in parentheses
        const stageDirections: string[] = [];
        let emotion = '';
        let pace: 'slow' | 'normal' | 'fast' = 'normal';
        
        // Find all stage directions
        const stageDirectionMatches = dialogue.match(/\([^)]+\)/g);
        if (stageDirectionMatches) {
          stageDirectionMatches.forEach(match => {
            const direction = match.slice(1, -1).toLowerCase(); // Remove parentheses
            stageDirections.push(direction);
            
            // Parse emotional cues
            if (direction.includes('angrily') || direction.includes('angry')) {
              emotion = 'angry';
            } else if (direction.includes('sadly') || direction.includes('sad')) {
              emotion = 'sad';
            } else if (direction.includes('excitedly') || direction.includes('excited')) {
              emotion = 'excited';
            } else if (direction.includes('calmly') || direction.includes('calm')) {
              emotion = 'calm';
            } else if (direction.includes('whispers') || direction.includes('whispering')) {
              emotion = 'whisper';
            } else if (direction.includes('shouts') || direction.includes('shouting')) {
              emotion = 'shout';
            }
            
            // Parse pacing cues
            if (direction.includes('slowly') || direction.includes('slow')) {
              pace = 'slow';
            } else if (direction.includes('quickly') || direction.includes('fast') || direction.includes('rapidly')) {
              pace = 'fast';
            }
          });
          
          // Remove stage directions from dialogue text
          dialogue = dialogue.replace(/\([^)]+\)/g, '').trim();
        }

        characters.add(character);
        dialogueLines.push({
          character,
          text: dialogue,
          stageDirections,
          emotion,
          pace,
          volume: 1.0
        });
      }
    }

    return {
      lines: dialogueLines,
      characters: Array.from(characters),
      totalDuration: 0 // Will be calculated after audio generation
    };
  }

  // Assign voices to characters intelligently
  async assignVoices(characters: string[]): Promise<Map<string, VoiceProfile>> {
    const voices = await this.getAvailableVoices();
    const assignments = new Map<string, VoiceProfile>();
    
    // Categorize voices by gender and characteristics
    const maleVoices = voices.filter(v => v.gender === 'male');
    const femaleVoices = voices.filter(v => v.gender === 'female');
    const neutralVoices = voices.filter(v => v.gender === 'neutral' || v.gender === 'unknown');
    
    // Smart assignment based on character names and available voices
    let maleIndex = 0;
    let femaleIndex = 0;
    let neutralIndex = 0;
    
    for (const character of characters) {
      const charLower = character.toLowerCase();
      
      // Try to detect gender from name patterns
      const likelyFemale = /\b(dr\.|professor|ms\.|mrs\.|miss|she|her|alice|jane|mary|sarah|emma|olivia|sophia|isabella|mia|charlotte|amelia|harper|evelyn|abigail|emily|elizabeth|sofia|avery|ella|scarlett|grace|chloe|victoria|riley|aria|lily|aubrey|zoey|penelope|lillian|addison|layla|natalie|camila|hannah|brooklyn|zoe|nora|leah|savannah|audrey|claire|eleanor|skylar|luna|bella|samantha|anna|genesis|aaliyah|kennedy|kinsley|allison|maya|sarah|madelyn|adeline|alexa|ariana|elena|gabriella|naomi|alice|sadie|sophie|piper|lila|ivy|ellie|paisley|elena|lucy|anna|peyton|ruby|eva|clara|vivian|reagan|mackenzie|paige|isla|morgan|delilah|molly|brielle|margaret|josephine|emilia|isabel|arabella|leilani|juliette|maria|ariel|adelaide|juliana|amanda|destiny|esther|valeria|lydia|monica|nicole|hazel|iris|faith|rose|alexandra|lauren|noelle|maya|cecilia|catherine|brynlee|helen|phoenix|melody|lyla|leslie|liliana|vera|willow|imani|charli|annie|hayden|luna|alice|kate|taylor|jordan|reese|charlie|drew|sage|haven|sydney|phoenix|winter|rain)\b/i;
      const likelyMale = /\b(dr\.|professor|mr\.|sir|he|him|his|john|james|robert|michael|william|david|richard|joseph|thomas|christopher|charles|daniel|matthew|anthony|mark|donald|steven|paul|andrew|joshua|kenneth|kevin|brian|george|timothy|ronald|jason|edward|jeffrey|ryan|jacob|gary|nicholas|eric|jonathan|stephen|larry|justin|scott|brandon|benjamin|samuel|gregory|alexander|patrick|frank|raymond|jack|dennis|jerry|tyler|aaron|jose|henry|adam|douglas|nathan|peter|zachary|kyle|walter|harold|jeremy|ethan|carl|arthur|gerald|wayne|jordan|lawrence|sean|mason|luke|louis|ralph|roy|eugene|bobby|russell|philip|johnny|mason|liam|noah|oliver|elijah|william|james|benjamin|lucas|henry|alexander|michael|daniel|jacob|owen|jackson|aiden|samuel|sebastian|david|carter|wyatt|jayden|john|matthew|luke|asher|owen|gabriel|julian|levi|mateo|isaac)\b/i;
      
      let selectedVoice: VoiceProfile;
      
      if (likelyFemale.test(charLower) && femaleVoices.length > femaleIndex) {
        selectedVoice = femaleVoices[femaleIndex % femaleVoices.length];
        femaleIndex++;
      } else if (likelyMale.test(charLower) && maleVoices.length > maleIndex) {
        selectedVoice = maleVoices[maleIndex % maleVoices.length];
        maleIndex++;
      } else if (neutralVoices.length > neutralIndex) {
        selectedVoice = neutralVoices[neutralIndex % neutralVoices.length];
        neutralIndex++;
      } else {
        // Fallback to any available voice
        const allVoices = [...maleVoices, ...femaleVoices, ...neutralVoices];
        selectedVoice = allVoices[(maleIndex + femaleIndex + neutralIndex) % allVoices.length];
      }
      
      assignments.set(character, selectedVoice);
    }
    
    return assignments;
  }

  // Generate speech for a single dialogue line
  async generateSpeech(
    text: string, 
    voiceId: string, 
    emotion?: string, 
    pace?: string
  ): Promise<Buffer> {
    try {
      // Adjust voice settings based on emotion and pace
      const voiceSettings = {
        stability: 0.75,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true
      };

      // Modify settings based on emotion
      if (emotion === 'angry') {
        voiceSettings.stability = 0.6;
        voiceSettings.style = 0.3;
      } else if (emotion === 'sad') {
        voiceSettings.stability = 0.8;
        voiceSettings.style = 0.2;
      } else if (emotion === 'excited') {
        voiceSettings.stability = 0.5;
        voiceSettings.style = 0.4;
      } else if (emotion === 'calm') {
        voiceSettings.stability = 0.9;
        voiceSettings.style = 0.1;
      } else if (emotion === 'whisper') {
        voiceSettings.stability = 0.8;
        voiceSettings.similarity_boost = 0.6;
      }

      const requestBody = {
        text,
        voice_settings: voiceSettings,
        model_id: 'eleven_monolingual_v1'
      };

      const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs TTS error: ${response.statusText}`);
      }

      const audioBuffer = await response.buffer();
      return audioBuffer;
    } catch (error) {
      console.error('Error generating speech:', error);
      throw error;
    }
  }

  // Generate complete dialogue audio from script
  async generateDialogueAudio(script: string, customVoices?: Record<string, string>): Promise<{
    audioPath: string;
    metadata: {
      characters: string[];
      totalLines: number;
      voiceAssignments: Record<string, string>;
      duration: number;
    };
  }> {
    try {
      console.log('Parsing script...');
      const parsedScript = this.parseScript(script);
      
      console.log('Assigning voices to characters...');
      let voiceAssignments: Map<string, VoiceProfile>;
      
      if (customVoices && Object.keys(customVoices).length > 0) {
        // Use custom voice assignments
        voiceAssignments = new Map();
        const availableVoices = await this.getAvailableVoices();
        
        for (const character of parsedScript.characters) {
          const customVoiceId = customVoices[character];
          if (customVoiceId) {
            const voice = availableVoices.find(v => v.voice_id === customVoiceId);
            if (voice) {
              voiceAssignments.set(character, voice);
            } else {
              // Fallback to automatic assignment if custom voice not found
              const autoAssignments = await this.assignVoices([character]);
              const autoVoice = autoAssignments.get(character);
              if (autoVoice) voiceAssignments.set(character, autoVoice);
            }
          } else {
            // Use automatic assignment for characters without custom voices
            const autoAssignments = await this.assignVoices([character]);
            const autoVoice = autoAssignments.get(character);
            if (autoVoice) voiceAssignments.set(character, autoVoice);
          }
        }
      } else {
        // Use automatic voice assignment
        voiceAssignments = await this.assignVoices(parsedScript.characters);
      }
      
      console.log('Generating individual audio clips...');
      const audioClips: Buffer[] = [];
      const voiceAssignmentRecord: Record<string, string> = {};
      
      // Generate audio for each dialogue line
      for (let i = 0; i < parsedScript.lines.length; i++) {
        const line = parsedScript.lines[i];
        const voice = voiceAssignments.get(line.character);
        
        if (!voice) {
          throw new Error(`No voice assigned to character: ${line.character}`);
        }
        
        voiceAssignmentRecord[line.character] = voice.name;
        
        console.log(`Generating speech for ${line.character}: "${line.text.substring(0, 50)}..."`);
        
        const audioBuffer = await this.generateSpeech(
          line.text,
          voice.voice_id,
          line.emotion,
          line.pace
        );
        
        audioClips.push(audioBuffer);
        
        // Add pause between dialogue lines (0.5 seconds of silence)
        if (i < parsedScript.lines.length - 1) {
          const silenceDuration = 0.5; // seconds
          const silenceBuffer = this.createSilenceBuffer(silenceDuration);
          audioClips.push(silenceBuffer);
        }
      }
      
      console.log('Combining audio clips...');
      const combinedAudio = Buffer.concat(audioClips);
      
      // Save to file
      const outputPath = path.join(process.cwd(), 'generated_dialogue.mp3');
      fs.writeFileSync(outputPath, combinedAudio);
      
      return {
        audioPath: outputPath,
        metadata: {
          characters: parsedScript.characters,
          totalLines: parsedScript.lines.length,
          voiceAssignments: voiceAssignmentRecord,
          duration: this.estimateAudioDuration(parsedScript.lines)
        }
      };
    } catch (error) {
      console.error('Error generating dialogue audio:', error);
      throw error;
    }
  }

  // Create silence buffer (simple implementation)
  private createSilenceBuffer(durationSeconds: number): Buffer {
    // Create a simple silence buffer - this is a placeholder
    // In a real implementation, you'd want to create proper silence audio data
    const sampleRate = 44100;
    const samples = Math.floor(sampleRate * durationSeconds);
    const silenceData = Buffer.alloc(samples * 2); // 16-bit audio
    return silenceData;
  }

  // Estimate total audio duration based on text length
  private estimateAudioDuration(lines: DialogueLine[]): number {
    let totalChars = 0;
    for (const line of lines) {
      totalChars += line.text.length;
    }
    
    // Rough estimate: ~150 words per minute, ~5 chars per word
    const wordsPerMinute = 150;
    const charsPerWord = 5;
    const estimatedMinutes = totalChars / (charsPerWord * wordsPerMinute);
    
    return Math.ceil(estimatedMinutes * 60); // Return seconds
  }
}

export const elevenLabsService = new ElevenLabsService();