import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, formatDistance } from "date-fns";
import { useLocation } from "wouter";

export function NotificationDropdown() {
  const [, navigate] = useLocation();
  const [hasUnread, setHasUnread] = useState(true);

  // Fetch announcements to use as notifications
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

  // Navigate to specific announcement when clicking notification
  const handleClickNotification = () => {
    navigate("/parent/announcements");
  };

  // Calculate the number of unread notifications (for this demo, showing 3)
  const unreadCount = hasUnread ? 3 : 0;

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
          {announcements && announcements.length > 0 ? (
            announcements.slice(0, 5).map((announcement) => (
              <DropdownMenuItem
                key={announcement.id}
                className="flex flex-col items-start p-3 cursor-pointer focus:bg-gray-100"
                onClick={handleClickNotification}
              >
                <div className="flex w-full justify-between items-start mb-1">
                  <span className="font-medium">{announcement.title}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    {getRelativeDate(announcement.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {announcement.content}
                </p>
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