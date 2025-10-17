import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';

export default function SchedulePage() {
  const { data: sessions, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/sessions'],
    queryFn: async () => {
      const response = await fetch('/api/sessions', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch sessions');
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
          <p className="text-gray-600">Manage training sessions, matches, and events.</p>
        </div>
        <LoadingState message="Loading schedule..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
          <p className="text-gray-600">Manage training sessions, matches, and events.</p>
        </div>
        <ErrorState 
          title="Failed to load schedule"
          message="Unable to fetch training sessions. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
            <p className="text-gray-600">Manage training sessions, matches, and events.</p>
          </div>
          <Button>
            <Calendar className="h-4 w-4 mr-2" />
            Add Session
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <EmptyState
              icon={Calendar}
              title="No sessions scheduled"
              description="Create your first training session or match to get started."
              action={{
                label: "Add Session",
                onClick: () => console.log("Add session clicked")
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
          <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
          <p className="text-gray-600">Manage training sessions, matches, and events.</p>
        </div>
        <Button>
          <Calendar className="h-4 w-4 mr-2" />
          Add Session
        </Button>
      </div>

      <div className="grid gap-6">
        {sessions.map((session: any) => (
          <Card key={session.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{session.title}</span>
                <span className="text-sm font-normal text-gray-500">
                  {session.sessionType}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    {new Date(session.startTime).toLocaleDateString()} at{' '}
                    {new Date(session.startTime).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{session.location}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    {session.currentAttendees}/{session.maxAttendees} players
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
