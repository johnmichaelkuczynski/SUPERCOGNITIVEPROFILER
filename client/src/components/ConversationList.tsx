import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle, Plus, Trash2 } from "lucide-react";

interface Conversation {
  id: number;
  title: string;
  model: string | null;
  createdAt: Date | null;
}

interface ConversationListProps {
  conversations: Conversation[];
  isLoading: boolean;
  onSelectConversation: (conversation: Conversation) => void;
  onCreateConversation: (data: { title: string; model: string }) => void;
  onDeleteConversation: (id: number) => void;
  isCreating: boolean;
  selectedConversation: Conversation | null;
}

// Form schema
const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  model: z.string({ required_error: "Please select a model" }),
});

export default function ConversationList({
  conversations,
  isLoading,
  onSelectConversation,
  onCreateConversation,
  onDeleteConversation,
  isCreating,
  selectedConversation,
}: ConversationListProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      model: "claude",
    },
  });

  // Handle form submission
  const onSubmit = (data: z.infer<typeof formSchema>) => {
    onCreateConversation(data);
    setIsDialogOpen(false);
    form.reset();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              New Conversation
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a new conversation</DialogTitle>
              <DialogDescription>
                Start a new conversation with an AI model.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Research on Climate Change" {...field} />
                      </FormControl>
                      <FormDescription>
                        Give your conversation a descriptive title.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>AI Model</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a model" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="claude">Claude (Anthropic)</SelectItem>
                          <SelectItem value="gpt4">GPT-4 (OpenAI)</SelectItem>
                          <SelectItem value="perplexity">Perplexity</SelectItem>
                          <SelectItem value="deepseek">DeepSeek</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose the AI model for this conversation.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? "Creating..." : "Create Conversation"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Separator />
      
      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <p className="text-center text-muted-foreground">Loading conversations...</p>
        ) : conversations && conversations.length > 0 ? (
          <div className="space-y-4">
            {conversations.map((conversation) => (
              <Card 
                key={conversation.id} 
                className={`cursor-pointer ${
                  selectedConversation?.id === conversation.id
                    ? "border-primary"
                    : ""
                }`}
                onClick={() => onSelectConversation(conversation)}
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">{conversation.title}</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conversation.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex items-center text-xs text-muted-foreground">
                    <MessageCircle className="h-3 w-3 mr-1" />
                    <span className="mr-2">
                      {conversation.model || "Claude"}
                    </span>
                    {conversation.createdAt && (
                      <span>
                        {formatDistanceToNow(new Date(conversation.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No conversations yet</p>
            <p className="text-sm">Create a new conversation to get started</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}