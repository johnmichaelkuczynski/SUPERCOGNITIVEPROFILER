export interface CleanedDocument {
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

/**
 * Clean document text for TTS production by removing everything except character dialogue
 */
export function cleanDocumentForTTS(text: string): CleanedDocument {
  console.log('[DocumentCleaner] Processing text length:', text.length);
  console.log('[DocumentCleaner] First 500 chars:', text.substring(0, 500));
  
  const removedElements = {
    stageDirections: [] as string[],
    commentary: [] as string[],
    narration: [] as string[]
  };
  
  const dialogueLines: Array<{ character: string; text: string }> = [];
  const characters: Set<string> = new Set();
  
  // Split text into lines and examine structure
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  console.log('[DocumentCleaner] Total lines:', lines.length);
  console.log('[DocumentCleaner] First 5 lines:', lines.slice(0, 5));
  
  let cleanedText = '';
  
  for (const line of lines) {
    // Skip empty lines
    if (!line.trim()) continue;
    
    // Remove stage directions in parentheses
    const stageDirectionRegex = /\([^)]*\)/g;
    const stageDirections = line.match(stageDirectionRegex) || [];
    stageDirections.forEach(direction => removedElements.stageDirections.push(direction));
    
    // Remove stage directions in brackets
    const bracketDirectionRegex = /\[[^\]]*\]/g;
    const bracketDirections = line.match(bracketDirectionRegex) || [];
    bracketDirections.forEach(direction => removedElements.stageDirections.push(direction));
    
    // Remove italicized stage directions
    const italicDirectionRegex = /\*[^*]*\*/g;
    const italicDirections = line.match(italicDirectionRegex) || [];
    italicDirections.forEach(direction => removedElements.stageDirections.push(direction));
    
    // Clean the line of stage directions
    let cleanLine = line
      .replace(stageDirectionRegex, '')
      .replace(bracketDirectionRegex, '')
      .replace(italicDirectionRegex, '')
      .trim();
    
    // More flexible character name detection patterns
    let characterFound = false;
    let character = '';
    let dialogue = '';
    
    // Pattern 1: **Character:** dialogue
    let match = cleanLine.match(/^\*\*([A-Za-z\s]+)\*\*:?\s*(.*)$/);
    if (match) {
      character = match[1].trim();
      dialogue = match[2].trim();
      characterFound = true;
    }
    
    // Pattern 2: Character: dialogue (no bold) - more flexible
    if (!characterFound) {
      match = cleanLine.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*:\s*(.+)$/);
      if (match) {
        const potentialCharacter = match[1].trim();
        const potentialDialogue = match[2].trim();
        
        // Accept any reasonable character name with dialogue
        if (potentialCharacter.length <= 25 && potentialDialogue.length > 5) {
          character = potentialCharacter;
          dialogue = potentialDialogue;
          characterFound = true;
        }
      }
    }
    
    // Pattern 3: CHARACTER: dialogue (all caps)
    if (!characterFound) {
      match = cleanLine.match(/^([A-Z\s]{2,20}):\s*(.+)$/);
      if (match) {
        character = match[1].trim();
        dialogue = match[2].trim();
        characterFound = true;
      }
    }
    
    // Skip lines that are clearly not dialogue - simplified patterns
    const nonDialoguePatterns = [
      /^(vs\.|versus|by|chapter|section|perspective|introduction|conclusion|references|citations)/i,
      /^\d+/,  // Numbers
      /^[A-Z]{3,}\s+[A-Z]{3,}/,  // ALL CAPS headers
    ];
    
    const isNonDialogue = nonDialoguePatterns.some(pattern => pattern.test(cleanLine));
    
    // Pattern 4: Character names (only for known dialogue characters)
    if (!characterFound && !isNonDialogue) {
      match = cleanLine.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*(.*)$/);
      if (match && match[1].length <= 20) {
        const potentialCharacter = match[1].trim();
        const potentialDialogue = match[2].trim();
        
        // Only accept well-known character names
        const knownCharacters = ['batman', 'joker', 'riddler', 'freud', 'dennett', 'davidson', 'socrates', 'plato', 'aristotle', 'nietzsche', 'kant', 'hegel', 'descartes'];
        
        if (knownCharacters.some(name => potentialCharacter.toLowerCase() === name.toLowerCase()) && 
            potentialDialogue.length > 10 && potentialDialogue.length < 500) {
          character = potentialCharacter;
          dialogue = potentialDialogue;
          characterFound = true;
        }
      }
    }
    
    if (characterFound && dialogue.length > 0) {
      // Clean the dialogue further by removing stage directions
      let cleanDialogue = dialogue
        .replace(/\([^)]*\)/g, '') // Remove parenthetical stage directions
        .replace(/\[[^\]]*\]/g, '') // Remove bracketed stage directions
        .replace(/\*[^*]*\*/g, '') // Remove italic stage directions
        .replace(/with\s+(growing\s+)?confidence[^,]*,?\s*/gi, '') // Remove common stage direction phrases
        .replace(/incredulously[^,]*,?\s*/gi, '')
        .replace(/calmly[^,]*,?\s*/gi, '')
        .replace(/carefully\s+tamping[^,]*,?\s*/gi, '')
        .replace(/nearly\s+rising[^,]*,?\s*/gi, '')
        .replace(/with\s+measured\s+precision[^,]*,?\s*/gi, '')
        .replace(/\s{2,}/g, ' ') // Multiple spaces to single
        .trim();
      
      if (cleanDialogue.length > 10) {
        console.log(`[DocumentCleaner] Found character: "${character}" with clean dialogue: "${cleanDialogue.substring(0, 50)}..."`);
        characters.add(character);
        dialogueLines.push({ character, text: cleanDialogue });
        cleanedText += `${character}: ${cleanDialogue}\n`;
      }
      continue;
    }
    
    // Check if this is pure dialogue following a character name
    if (cleanLine.length > 0 && !cleanLine.includes(':')) {
      // This might be continuation of dialogue
      const lastDialogue = dialogueLines[dialogueLines.length - 1];
      if (lastDialogue) {
        lastDialogue.text += ' ' + cleanLine;
        // Update the cleaned text by replacing the last line
        const lines = cleanedText.split('\n');
        lines[lines.length - 2] = `${lastDialogue.character}: ${lastDialogue.text}`;
        cleanedText = lines.join('\n');
      } else {
        // This is narration or commentary
        removedElements.narration.push(cleanLine);
      }
      continue;
    }
    
    // Everything else is commentary or narration
    if (cleanLine.length > 0) {
      removedElements.commentary.push(cleanLine);
    }
  }
  
  return {
    originalText: text,
    cleanedText: cleanedText.trim(),
    removedElements,
    dialogueLines,
    characters: Array.from(characters)
  };
}

/**
 * Preview what would be removed from the document
 */
export function previewDocumentCleaning(text: string): {
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
} {
  const cleaned = cleanDocumentForTTS(text);
  
  return {
    charactersFound: cleaned.characters,
    dialogueLineCount: cleaned.dialogueLines.length,
    elementsToRemove: {
      stageDirections: cleaned.removedElements.stageDirections.length,
      commentary: cleaned.removedElements.commentary.length,
      narration: cleaned.removedElements.narration.length
    },
    sampleRemovals: {
      stageDirections: cleaned.removedElements.stageDirections.slice(0, 3),
      commentary: cleaned.removedElements.commentary.slice(0, 3),
      narration: cleaned.removedElements.narration.slice(0, 3)
    }
  };
}