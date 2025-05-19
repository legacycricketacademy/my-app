import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Send, CheckCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { messagesData } from "@/data";

// Types for messages
interface Message {
  id: string;
  sender: string;
  senderRole: "parent" | "coach" | "admin";
  senderAvatar?: string;
  content: string;
  timestamp: string;
  isNew?: boolean; // For animation
}

export function ChatBox() {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<Message[]>(messagesData);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom of messages whenever messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  const handleSendMessage = () => {
    if (message.trim()) {
      setLoading(true);
      
      // Simulate API call delay
      setTimeout(() => {
        const newMessage: Message = {
          id: `msg-${Date.now()}`,
          sender: user?.fullName || "Parent",
          senderRole: "parent",
          content: message,
          timestamp: new Date().toISOString(),
          isNew: true
        };
        
        setChatMessages([...chatMessages, newMessage]);
        setMessage("");
        setLoading(false);
      }, 500);
    }
  };

  // Handle key press (Enter to send)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (loading && chatMessages.length === 0) {
    return (
      <Card className="h-[400px] bg-white shadow-md rounded-lg">
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
    <Card className="h-[400px] flex flex-col bg-white shadow-md rounded-lg">
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
              className={`flex ${msg.senderRole === 'parent' ? 'justify-end' : 'justify-start'} ${
                msg.isNew ? 'animate-fade-in' : ''
              }`}
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
                  <AvatarFallback className={msg.senderRole === 'coach' ? 'bg-blue-100 text-blue-600' : 'bg-primary-50 text-primary-600'}>
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
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <span className="font-medium">{msg.sender}</span> • {format(new Date(msg.timestamp), "MMM d, h:mm a")}
                    {msg.senderRole === 'parent' && (
                      <CheckCheck className="h-3 w-3 text-primary ml-1" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
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
            disabled={!message.trim() || loading}
            className="self-end"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}