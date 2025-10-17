import { useQuery } from '@tanstack/react-query';
import { Megaphone, Send, Calendar, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';

export default function AnnouncementsPage() {
  const { data: announcements, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/announcements'],
    queryFn: async () => {
      const response = await fetch('/api/announcements', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch announcements');
      return response.json();
    }
  });

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
          <Button>
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
                onClick: () => console.log("Create announcement clicked")
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
        <Button>
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
                  {announcement.title || 'Announcement'}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  announcement.priority === 'high' 
                    ? 'bg-red-100 text-red-700' 
                    : announcement.priority === 'medium'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {announcement.priority || 'normal'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 mb-4">
                {announcement.message || announcement.content || 'No message'}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {announcement.date || announcement.createdAt 
                      ? new Date(announcement.date || announcement.createdAt).toLocaleDateString() 
                      : 'No date'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {announcement.targetAudience || 'All players'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
