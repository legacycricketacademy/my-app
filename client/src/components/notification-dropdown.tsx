import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, CreditCard, Megaphone } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, formatDistance } from "date-fns";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: number;
  type: "payment" | "announcement";
  title: string;
  content: string;
  createdAt: string;
  read: boolean;
  data?: any;
}

export function NotificationDropdown() {
  const [, navigate] = useLocation();
  const [hasUnread, setHasUnread] = useState(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Fetch announcements
  const { data: announcements } = useQuery<any[]>({
    queryKey: ["/api/parent/announcements"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/parent/announcements");
        if (!response.ok) return [];
        return response.json();
      } catch (error) {
        console.error("Failed to fetch announcements:", error);
        return [];
      }
    }
  });

  // Fetch payments requiring attention
  const { data: pendingPayments } = useQuery<any[]>({
    queryKey: ["/api/parent/payments/pending"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/parent/payments/pending");
        if (!response.ok) return [];
        return response.json();
      } catch (error) {
        console.error("Failed to fetch pending payments:", error);
        return [];
      }
    }
  });

  // Combine announcements and payments into notifications
  useEffect(() => {
    const combinedNotifications: NotificationItem[] = [];
    
    // Add announcements as notifications
    if (announcements?.length) {
      announcements.slice(0, 3).forEach(announcement => {
        combinedNotifications.push({
          id: announcement.id,
          type: "announcement",
          title: announcement.title,
          content: announcement.content,
          createdAt: announcement.createdAt,
          read: false,
          data: announcement
        });
      });
    }
    
    // Add pending payments as notifications
    if (pendingPayments?.length) {
      pendingPayments.forEach(payment => {
        combinedNotifications.push({
          id: payment.id,
          type: "payment",
          title: `Payment Due: ${payment.playerFirstName} ${payment.playerLastName}`,
          content: `Payment of $${
            typeof payment.amount === 'number' 
              ? payment.amount.toFixed(2) 
              : (isNaN(Number(payment.amount)) ? '0.00' : Number(payment.amount).toFixed(2))
          } is due by ${format(new Date(payment.dueDate), 'MMM dd, yyyy')}`,
          createdAt: payment.dueDate,
          read: false,
          data: payment
        });
      });
    }
    
    // Sort by date (newest first)
    combinedNotifications.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    setNotifications(combinedNotifications);
  }, [announcements, pendingPayments]);

  // Mark all as read when dropdown is opened
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setHasUnread(false);
    }
  };

  // Navigate to announcements page when clicking view all
  const handleViewAll = () => {
    navigate("/parent/announcements");
  };

  // Navigate based on notification type
  const handleClickNotification = (notification: NotificationItem) => {
    if (notification.type === "announcement") {
      navigate("/parent/announcements");
    } else if (notification.type === "payment") {
      navigate("/parent/payments");
    }
  };

  // Calculate the number of unread notifications
  const unreadCount = hasUnread ? notifications.length : 0;

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
          <Bell className="h-5 w-5" />
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
        <div className="flex justify-between items-center px-4 py-2 border-b">
          <h3 className="font-semibold">Notifications</h3>
          <Button 
            variant="link" 
            className="p-0 h-auto text-xs text-primary"
            onClick={handleViewAll}
          >
            View all
          </Button>
        </div>
        <ScrollArea className="h-[300px]">
          {notifications && notifications.length > 0 ? (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={`${notification.type}-${notification.id}`}
                className="flex flex-col items-start p-3 cursor-pointer focus:bg-gray-100"
                onClick={() => handleClickNotification(notification)}
              >
                <div className="flex w-full items-start mb-1">
                  <div className={cn(
                    "mr-3 p-1.5 rounded-full",
                    notification.type === "payment" 
                      ? "bg-amber-100 text-amber-700" 
                      : "bg-blue-100 text-blue-700"
                  )}>
                    {notification.type === "payment" ? (
                      <CreditCard className="h-4 w-4" />
                    ) : (
                      <Megaphone className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between w-full">
                      <span className="font-medium">{notification.title}</span>
                      <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                        {getRelativeDate(notification.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                      {notification.content}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">
              <p>No new notifications</p>
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}