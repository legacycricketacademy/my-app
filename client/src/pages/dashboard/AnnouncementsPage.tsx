import { useState } from 'react';
import { Megaphone, Send, Calendar, Users, Globe, User, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import CreateAnnouncementModal from './components/CreateAnnouncementModal';
import { useAnnouncements } from '@/api/announcements';
import { format, parseISO } from 'date-fns';

export default function AnnouncementsPage() {
  const [showCreateAnnouncementModal, setShowCreateAnnouncementModal] = useState(false);
  const { data: announcements, isLoading, error, refetch } = useAnnouncements();

  const getAudienceIcon = (audience: string) => {
    switch (audience) {
      case 'all':
        return <Globe className="h-4 w-4" />;
      case 'players':
        return <Users className="h-4 w-4" />;
      case 'parents':
        return <User className="h-4 w-4" />;
      case 'coaches':
        return <Shield className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'normal':
        return 'bg-blue-100 text-blue-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-600">Manage team announcements and communications.</p>
        </div>
        <LoadingState message="Loading announcements..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-600">Manage team announcements and communications.</p>
        </div>
        <ErrorState 
          title="Failed to load announcements"
          message="Unable to fetch announcements. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (!announcements || announcements.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
            <p className="text-gray-600">Manage team announcements and communications.</p>
          </div>
          <Button onClick={() => setShowCreateAnnouncementModal(true)}>
            <Send className="h-4 w-4 mr-2" />
            Create Announcement
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <EmptyState
              icon={Megaphone}
              title="No announcements yet"
              description="Create announcements to keep players and parents informed."
              action={{
                label: "Create Announcement",
                onClick: () => setShowCreateAnnouncementModal(true)
              }}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-600">Manage team announcements and communications.</p>
        </div>
        <Button onClick={() => setShowCreateAnnouncementModal(true)}>
          <Send className="h-4 w-4 mr-2" />
          Create Announcement
        </Button>
      </div>

      <div className="grid gap-6">
        {announcements.map((announcement: any) => (
          <Card key={announcement.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Megaphone className="h-4 w-4 mr-2" />
                  {announcement.title}
                </span>
                <div className="flex items-center gap-2">
                  <Badge className={getPriorityColor(announcement.priority)}>
                    {announcement.priority}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    {getAudienceIcon(announcement.audience)}
                    {announcement.audience}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 mb-4 whitespace-pre-wrap">
                {announcement.body}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {format(parseISO(announcement.createdAt), 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600 capitalize">
                    {announcement.audience}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <CreateAnnouncementModal 
        open={showCreateAnnouncementModal} 
        onOpenChange={setShowCreateAnnouncementModal} 
      />
    </div>
  );
}
