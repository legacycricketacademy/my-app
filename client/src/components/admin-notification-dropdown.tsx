import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, CreditCard, UserPlus, Megaphone } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, formatDistance } from "date-fns";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: number;
  type: "payment" | "connection" | "system";
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export function AdminNotificationDropdown() {
  const [, navigate] = useLocation();
  const [hasUnread, setHasUnread] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  // Fetch pending payments as one type of notification
  const { data: pendingPayments, isLoading: isLoadingPayments } = useQuery<any[]>({
    queryKey: ["/api/payments/pending"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/payments/pending");
        if (!response.ok) return [];
        return response.json();
      } catch (error) {
        console.error("Failed to fetch pending payments:", error);
        return [];
      }
    }
  });

  // Fetch connection requests as another type of notification
  const { data: connectionRequests, isLoading: isLoadingConnections } = useQuery<any[]>({
    queryKey: ["/api/connection-requests"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/connection-requests?status=pending");
        if (!response.ok) return [];
        return response.json();
      } catch (error) {
        console.error("Failed to fetch connection requests:", error);
        return [];
      }
    }
  });

  // Fetch announcements for system notifications
  const { data: announcements, isLoading: isLoadingAnnouncements } = useQuery<any[]>({
    queryKey: ["/api/announcements/recent"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/announcements/recent");
        if (!response.ok) return [];
        return response.json();
      } catch (error) {
        console.error("Failed to fetch announcements:", error);
        return [];
      }
    }
  });

  // Combine and transform all notifications
  const allNotifications: NotificationItem[] = [
    ...(pendingPayments || []).map((payment: any) => ({
      id: payment.id,
      type: "payment" as const,
      title: "Payment Pending",
      message: `Payment of $${payment.amount} for ${payment.player?.firstName || 'unknown player'} is pending.`,
      createdAt: payment.createdAt,
      read: false
    })),
    ...(connectionRequests || []).map((request: any) => ({
      id: request.id,
      type: "connection" as const,
      title: "Connection Request",
      message: `New connection request for ${request.player?.firstName || 'unknown player'} from ${request.parent?.fullName || 'unknown parent'}.`,
      createdAt: request.createdAt,
      read: false
    })),
    ...(announcements || []).map((announcement: any) => ({
      id: announcement.id,
      type: "system" as const,
      title: announcement.title,
      message: announcement.content.substring(0, 50) + (announcement.content.length > 50 ? '...' : ''),
      createdAt: announcement.createdAt,
      read: true
    }))
  ];

  // Filter notifications based on active tab
  const filteredNotifications = activeTab === 'all' 
    ? allNotifications 
    : allNotifications.filter(notification => notification.type === activeTab);

  // Mark all as read when dropdown is opened
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setHasUnread(false);
    }
  };

  // Navigate to specific page based on notification type
  const handleClickNotification = (notification: NotificationItem) => {
    switch (notification.type) {
      case "payment":
        navigate("/payments");
        break;
      case "connection":
        navigate("/connection-requests");
        break;
      case "system":
        navigate("/announcements");
        break;
    }
  };

  // Calculate the number of unread notifications
  const unreadCount = allNotifications.filter(n => !n.read).length;

  // Format relative date for notifications
  const getRelativeDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistance(date, new Date(), { addSuffix: true });
    } catch (error) {
      return "Recently";
    }
  };

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-6 w-6" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white"
              variant="destructive"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="font-normal">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg">Notifications</h3>
            <span className="text-xs text-muted-foreground">
              {unreadCount} unread
            </span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="payment">Payments</TabsTrigger>
            <TabsTrigger value="connection">Requests</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>
          <TabsContent value={activeTab} className="mt-0">
            <ScrollArea className="h-[300px]">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map(notification => (
                  <DropdownMenuItem
                    key={`${notification.type}-${notification.id}`}
                    className={`flex flex-col items-start p-3 cursor-pointer hover:bg-gray-100 border-b ${notification.read ? 'opacity-80' : 'bg-primary/5'}`}
                    onClick={() => handleClickNotification(notification)}
                  >
                    <div className="flex w-full items-start mb-1">
                      <div className={cn(
                        "mr-3 p-1.5 rounded-full",
                        notification.type === "payment" 
                          ? "bg-amber-100 text-amber-700" 
                          : notification.type === "connection"
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-700"
                      )}>
                        {notification.type === "payment" ? (
                          <CreditCard className="h-4 w-4" />
                        ) : notification.type === "connection" ? (
                          <UserPlus className="h-4 w-4" />
                        ) : (
                          <Megaphone className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between w-full">
                          <span className={`font-medium ${!notification.read ? 'text-primary' : ''}`}>
                            {notification.title}
                          </span>
                          <span className="text-xs text-muted-foreground ml-2 whitespace-nowrap">
                            {getRelativeDate(notification.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                          {notification.message}
                        </p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="p-6 text-center text-muted-foreground">
                  {activeTab === 'all'
                    ? "No notifications to display"
                    : `No ${activeTab} notifications`}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}