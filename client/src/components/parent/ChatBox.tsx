import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

// Types for messages
interface Message {
  id: string;
  sender: string;
  senderRole: "parent" | "coach" | "admin";
  senderAvatar?: string;
  content: string;
  timestamp: string;
}

export function ChatBox() {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const queryClient = useQueryClient();
  
  // Fetch recent messages
  const { data: messages, isLoading } = useQuery({
    queryKey: ["/api/messages/recent"],
    queryFn: () => fetch("/api/messages/recent").then(res => res.json()),
    enabled: !!user,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", "/api/messages", { content });
      return response.json();
    },
    onSuccess: () => {
      // Clear input and refresh messages
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/messages/recent"] });
    }
  });

  const handleSendMessage = () => {
    if (message.trim()) {
      sendMessageMutation.mutate(message);
    }
  };

  // Handle key press (Enter to send)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Sample messages for UI development (will be replaced by API data)
  const sampleMessages: Message[] = [
    {
      id: "1",
      sender: "Coach Smith",
      senderRole: "coach",
      content: "Hi there! Just wanted to let you know that Arjun showed great improvement in batting technique during today's session.",
      timestamp: "2025-05-19T08:30:00Z"
    },
    {
      id: "2",
      sender: user?.fullName || "Parent",
      senderRole: "parent",
      content: "That's great to hear! He's been practicing at home too. Any specific areas we should focus on?",
      timestamp: "2025-05-19T09:15:00Z"
    },
    {
      id: "3",
      sender: "Coach Smith",
      senderRole: "coach",
      content: "Yes, I'd recommend working on his forward defensive stroke. I've shared some drills in the app that you can try at home.",
      timestamp: "2025-05-19T09:45:00Z"
    }
  ];

  // Use actual messages or sample data
  const chatMessages = messages?.data || sampleMessages;

  if (isLoading) {
    return (
      <Card className="h-[400px]">
        <CardHeader>
          <CardTitle>Coach Communication</CardTitle>
          <CardDescription>
            Stay in touch with coaches about your child's progress
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[400px] flex flex-col">
      <CardHeader>
        <CardTitle>Coach Communication</CardTitle>
        <CardDescription>
          Stay in touch with coaches about your child's progress
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto mb-4 space-y-4">
          {chatMessages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex ${msg.senderRole === 'parent' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`flex gap-3 max-w-[80%] ${
                  msg.senderRole === 'parent' 
                    ? 'flex-row-reverse' 
                    : 'flex-row'
                }`}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={msg.senderAvatar} />
                  <AvatarFallback>
                    {msg.sender.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div 
                    className={`px-4 py-2 rounded-lg ${
                      msg.senderRole === 'parent'
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    <span className="font-medium">{msg.sender}</span> • {format(new Date(msg.timestamp), "MMM d, h:mm a")}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex gap-2 mt-auto">
          <Textarea 
            placeholder="Type your message..." 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            className="resize-none"
            rows={2}
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={!message.trim() || sendMessageMutation.isPending}
            className="self-end"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}