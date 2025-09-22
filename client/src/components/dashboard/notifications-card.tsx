import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, DollarSign, Calendar, Mail, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Link } from 'wouter';
import { api } from '@/lib/api';
import { format, formatDistance } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface Notification {
  id: number;
  type: 'payment_reminder' | 'session_reminder' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  actionUrl: string;
}

export function NotificationsCard() {
  const queryClient = useQueryClient();
  const [showAll, setShowAll] = useState(false);

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    queryFn: () => api.get('/notifications'),
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: number) => api.patch(`/notifications/${notificationId}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark notification as read.",
        variant: "destructive",
      });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unreadNotifications = notifications.filter(n => !n.isRead);
      await Promise.all(
        unreadNotifications.map(notification => 
          api.patch(`/notifications/${notification.id}/read`)
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      toast({
        title: "All Notifications Marked as Read",
        description: "All notifications have been marked as read.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark all notifications as read.",
        variant: "destructive",
      });
    },
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'payment_reminder':
        return <DollarSign className="h-4 w-4 text-amber-600" />;
      case 'session_reminder':
        return <Calendar className="h-4 w-4 text-blue-600" />;
      case 'system':
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <Bell className="h-4 w-4 text-gray-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'payment_reminder':
        return 'bg-amber-100 text-amber-800';
      case 'session_reminder':
        return 'bg-blue-100 text-blue-800';
      case 'system':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatRelativeTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistance(date, new Date(), { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const displayNotifications = showAll ? notifications : notifications.slice(0, 3);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
  };

  return (
    <Card className="bg-white rounded-lg shadow">
      <CardHeader className="flex items-center justify-between border-b border-gray-200 p-4">
        <CardTitle className="font-semibold text-lg heading flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unreadCount}
            </Badge>
          )}
        </CardTitle>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              className="text-xs"
            >
              Mark All Read
            </Button>
          )}
          <Link href="/notifications" className="text-primary text-sm hover:underline">
            View All
          </Link>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="flex items-start space-x-3 animate-pulse">
                <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : displayNotifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="mb-4">
              <Bell className="h-12 w-12 mx-auto text-gray-300" />
            </div>
            <p className="text-lg font-medium mb-2">No notifications</p>
            <p className="text-sm">You're all caught up!</p>
          </div>
        ) : (
          <ScrollArea className="h-64">
            <div className="space-y-3">
              {displayNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    notification.isRead 
                      ? 'bg-gray-50 hover:bg-gray-100' 
                      : 'bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-500'
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className={`p-1.5 rounded-full ${
                    notification.isRead ? 'bg-gray-100' : 'bg-blue-100'
                  }`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className={`text-sm font-medium ${
                        notification.isRead ? 'text-gray-700' : 'text-blue-900'
                      }`}>
                        {notification.title}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getNotificationColor(notification.type)}`}
                        >
                          {notification.type.replace('_', ' ')}
                        </Badge>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                    <p className={`text-sm ${
                      notification.isRead ? 'text-gray-600' : 'text-blue-800'
                    }`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatRelativeTime(notification.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        
        {notifications.length > 3 && !showAll && (
          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(true)}
              className="text-primary"
            >
              Show {notifications.length - 3} more notifications
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
