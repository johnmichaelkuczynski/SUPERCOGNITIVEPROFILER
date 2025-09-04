import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Send, Loader2, Settings2, Eye, Edit3 } from "lucide-react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import "katex/dist/katex.min.css";

declare global {
  interface Window {
    renderMathInElement: any;
  }
}
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

interface Message {
  id: number;
  content: string;
  role: string;
  timestamp: Date | null;
}

interface ChatWindowProps {
  conversation: {
    id: number;
    title: string;
    model: string | null;
  } | null;
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (content: string, options?: any) => void;
  streamingMessage: string;
  wsStatus: 'connecting' | 'connected' | 'disconnected' | 'failed';
}

export default function ChatWindow({
  conversation,
  messages,
  isLoading,
  onSendMessage,
  streamingMessage,
  wsStatus,
}: ChatWindowProps) {
  const [inputValue, setInputValue] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [chunkSize, setChunkSize] = useState("auto");
  const [maxTokens, setMaxTokens] = useState(2048);
  const [stream, setStream] = useState(true);
  const [mathViewStates, setMathViewStates] = useState<{[key: number]: boolean}>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, streamingMessage]);
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || !conversation) return;
    
    // Send message with options
    onSendMessage(inputValue, {
      temperature,
      chunkSize,
      maxTokens,
      stream,
    });
    
    // Clear input
    setInputValue("");
  };
  
  // Auto-resize textarea as content grows
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);
  
  // Handle Enter key to submit (Shift+Enter for new line)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  
  const toggleMathView = (messageId: number) => {
    setMathViewStates(prev => ({
      ...prev,
      [messageId]: !prev[messageId]
    }));
  };

  const MathContent = ({ content, messageId }: { content: string; messageId: number }) => {
    const isMathView = mathViewStates[messageId] !== false;
    
    if (isMathView) {
      return (
        <div className="prose dark:prose-invert prose-sm max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[rehypeKatex]}
            components={{
              p: ({ children }) => <p className="mb-2">{children}</p>,
              code: ({ children }) => <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">{children}</code>
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      );
    } else {
      return (
        <div className="whitespace-pre-wrap text-sm">
          {content}
        </div>
      );
    }
  };

  const renderMessageContent = (content: string, messageId?: number) => {
    if (messageId !== undefined) {
      return <MathContent content={content} messageId={messageId} />;
    }
    return <MathContent content={content} messageId={0} />;
  };
  
  if (!conversation) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-8 text-center">
        <div className="space-y-4 max-w-md">
          <h2 className="text-2xl font-bold">No conversation selected</h2>
          <p className="text-muted-foreground">
            Select a conversation from the list or create a new one to get started.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      <div className="border-b p-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium">{conversation.title}</h2>
          <p className="text-sm text-muted-foreground">
            Model: {(() => {
              const modelMap: Record<string, string> = {
                'claude': 'ZHI 2',
                'gpt4': 'ZHI 3', 
                'perplexity': 'ZHI 4',
                'deepseek': 'ZHI 1'
              };
              return modelMap[conversation.model || 'claude'] || 'ZHI 2';
            })()}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          {wsStatus === 'connecting' && (
            <div className="text-sm text-yellow-500 flex items-center">
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              Connecting...
            </div>
          )}
          
          {wsStatus === 'connected' && (
            <div className="text-sm text-green-500 flex items-center">
              <div className="h-2 w-2 rounded-full bg-green-500 mr-1" />
              Connected
            </div>
          )}
          
          {wsStatus === 'disconnected' && (
            <div className="text-sm text-red-500 flex items-center">
              <div className="h-2 w-2 rounded-full bg-red-500 mr-1" />
              Disconnected
            </div>
          )}
          
          {wsStatus === 'failed' && (
            <div className="text-sm text-red-500 flex items-center">
              <div className="h-2 w-2 rounded-full bg-red-500 mr-1" />
              Connection Failed
            </div>
          )}
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Settings2 className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Conversation Settings</SheetTitle>
                <SheetDescription>
                  Adjust model parameters for this conversation.
                </SheetDescription>
              </SheetHeader>
              
              <div className="space-y-6 py-6">
                <div className="space-y-2">
                  <Label>Temperature: {temperature}</Label>
                  <Slider
                    value={[temperature]}
                    min={0}
                    max={1}
                    step={0.01}
                    onValueChange={(value) => setTemperature(value[0])}
                  />
                  <p className="text-xs text-muted-foreground">
                    Higher values make output more random, lower values make it more deterministic.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Max Tokens</Label>
                  <Input
                    type="number"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(Number(e.target.value))}
                    min={1}
                    max={8192}
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum length of the model's response.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Chunk Size</Label>
                  <Select
                    value={chunkSize}
                    onValueChange={setChunkSize}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select chunk size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto</SelectItem>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Controls how the input is chunked for processing (relevant for long documents).
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>Stream Response</Label>
                  <Switch
                    checked={stream}
                    onCheckedChange={setStream}
                  />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          {messages && messages.length > 0 ? (
            messages.map((message) => (
              <div key={message.id} className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">
                    {message.role === "user" ? "You" : "AI"}
                  </span>
                  {message.timestamp && (
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(message.timestamp), "h:mm a, MMM d")}
                    </span>
                  )}
                </div>
                
                <Card className={`${
                  message.role === "user" 
                    ? "bg-primary-foreground" 
                    : "bg-card"
                }`}>
                  <CardContent className="p-4">
                    {message.role === "assistant" && (
                      <div className="flex justify-end mb-2">
                        <div className="flex space-x-1">
                          <Button
                            variant={mathViewStates[message.id] === false ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleMathView(message.id)}
                            className="h-6 px-2 text-xs"
                          >
                            <Edit3 className="h-3 w-3 mr-1" />
                            Text
                          </Button>
                          <Button
                            variant={mathViewStates[message.id] !== false ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleMathView(message.id)}
                            className="h-6 px-2 text-xs"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Math
                          </Button>
                        </div>
                      </div>
                    )}
                    {renderMessageContent(message.content, message.id)}
                  </CardContent>
                </Card>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No messages yet</p>
              <p className="text-sm">Start typing to begin the conversation</p>
            </div>
          )}
          
          {streamingMessage && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="font-medium">AI</span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(), "h:mm a, MMM d")}
                </span>
              </div>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex justify-end mb-2">
                    <div className="flex space-x-1">
                      <Button
                        variant={mathViewStates[-1] === false ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleMathView(-1)}
                        className="h-6 px-2 text-xs"
                      >
                        <Edit3 className="h-3 w-3 mr-1" />
                        Text
                      </Button>
                      <Button
                        variant={mathViewStates[-1] !== false ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleMathView(-1)}
                        className="h-6 px-2 text-xs"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Math
                      </Button>
                    </div>
                  </div>
                  {renderMessageContent(streamingMessage, -1)}
                </CardContent>
              </Card>
            </div>
          )}
          
          {isLoading && !streamingMessage && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="font-medium">AI</span>
              </div>
              
              <Card>
                <CardContent className="p-4 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
              </Card>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      <Separator />
      
      <form onSubmit={handleSubmit} className="p-4">
        <div className="flex space-x-4">
          <Textarea
            placeholder="Type your message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            ref={textareaRef}
            rows={1}
            className="flex-1 min-h-[44px] resize-none"
            disabled={wsStatus !== 'connected'}
          />
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={!inputValue.trim() || wsStatus !== 'connected'}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Send message</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </form>
    </div>
  );
}