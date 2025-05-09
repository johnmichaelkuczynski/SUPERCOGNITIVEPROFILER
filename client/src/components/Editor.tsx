import React, { useEffect, useRef, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { countWords } from '@/lib/utils';
import { Bold, Italic, List, Link, Code, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
  contextDocuments: string[];
  onSubmit?: () => void; // Add onSubmit prop for Enter key functionality
}

export default function Editor({ value, onChange, contextDocuments, onSubmit }: EditorProps) {
  const [activeTab, setActiveTab] = useState('input');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Handle key down events for Enter key submission
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on just Enter key (for simpler usage)
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (onSubmit) onSubmit();
    }
    // Allow Shift+Enter for new lines
  };
  
  // Auto-resize textarea as content grows
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.max(250, textarea.scrollHeight)}px`;
    }
  }, [value]);

  const handleKeyCommand = (command: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    let newText = value;
    let newCursorPos = end;
    
    switch (command) {
      case 'bold':
        newText = value.substring(0, start) + `**${selectedText}**` + value.substring(end);
        newCursorPos = end + 4;
        break;
      case 'italic':
        newText = value.substring(0, start) + `*${selectedText}*` + value.substring(end);
        newCursorPos = end + 2;
        break;
      case 'list':
        // Add a bullet point at the beginning of each line
        if (selectedText.includes('\n')) {
          const formattedText = selectedText
            .split('\n')
            .map(line => line.trim() ? `- ${line}` : line)
            .join('\n');
          newText = value.substring(0, start) + formattedText + value.substring(end);
        } else {
          newText = value.substring(0, start) + `- ${selectedText}` + value.substring(end);
        }
        newCursorPos = start + newText.substring(start).length;
        break;
      case 'link':
        newText = value.substring(0, start) + `[${selectedText}](url)` + value.substring(end);
        newCursorPos = end + 3;
        break;
      case 'code':
        newText = value.substring(0, start) + `\`${selectedText}\`` + value.substring(end);
        newCursorPos = end + 2;
        break;
    }
    
    onChange(newText);
    
    // Set cursor position after state update
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex border-b border-slate-200 bg-transparent">
          <TabsTrigger 
            value="input" 
            className="px-4 py-3 text-sm font-medium data-[state=active]:text-primary-600 data-[state=active]:border-b-2 data-[state=active]:border-primary-500 data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-slate-900 rounded-none"
          >
            Input & Prompts
          </TabsTrigger>
          <TabsTrigger 
            value="context" 
            className="px-4 py-3 text-sm font-medium data-[state=active]:text-primary-600 data-[state=active]:border-b-2 data-[state=active]:border-primary-500 data-[state=inactive]:text-slate-600 data-[state=inactive]:hover:text-slate-900 rounded-none"
          >
            Context Documents
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="input" className="p-0 m-0">
          <div className="p-5">
            <textarea 
              ref={textareaRef}
              className="w-full border-0 focus:ring-0 p-0 text-slate-800 placeholder-slate-400 resize-none min-h-[250px]" 
              placeholder="Type your question or prompt here and press Enter to send..."
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          
          <div className="flex justify-between items-center px-5 py-3 border-t border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <button onClick={() => handleKeyCommand('bold')} className="hover:text-slate-800">
                <Bold className="h-4 w-4" />
              </button>
              <button onClick={() => handleKeyCommand('italic')} className="hover:text-slate-800">
                <Italic className="h-4 w-4" />
              </button>
              <button onClick={() => handleKeyCommand('list')} className="hover:text-slate-800">
                <List className="h-4 w-4" />
              </button>
              <button onClick={() => handleKeyCommand('link')} className="hover:text-slate-800">
                <Link className="h-4 w-4" />
              </button>
              <button onClick={() => handleKeyCommand('code')} className="hover:text-slate-800">
                <Code className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-xs text-slate-500">{countWords(value)} words</div>
              {onSubmit && (
                <Button 
                  onClick={onSubmit} 
                  className="bg-primary-600 hover:bg-primary-700 text-white"
                  size="sm"
                >
                  <Send className="h-3.5 w-3.5 mr-1" />
                  Send
                </Button>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="context" className="p-5 m-0">
          {contextDocuments.length > 0 ? (
            <div className="space-y-3">
              {contextDocuments.map((doc, index) => (
                <div key={index} className="bg-slate-50 p-3 rounded-md border border-slate-200">
                  <p className="text-sm text-slate-700">{doc}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-slate-500">No context documents added yet.</p>
              <p className="text-xs text-slate-400 mt-1">Upload files using the document uploader.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
