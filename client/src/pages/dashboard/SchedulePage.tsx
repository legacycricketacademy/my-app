import { useState } from 'react';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { ScheduleSessionDialog } from '@/components/sessions/schedule-session-dialog';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { format, parseISO } from 'date-fns';

export default function SchedulePage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/coach/sessions"],
    queryFn: () => api.get("/api/coach/sessions"),
  });

  const sessions = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" data-testid="heading-schedule">Schedule</h1>
          <p className="text-gray-600">Manage training sessions, matches, and events.</p>
        </div>
        <LoadingState message="Loading schedule..." />
      </div>
    );
  }

  if (error) {
    // Check if it's a 401 error
    const is401 = error instanceof Error && error.message.includes('401');
    
    if (is401) {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" data-testid="heading-schedule">Schedule</h1>
            <p className="text-gray-600">Manage training sessions, matches, and events.</p>
          </div>
          <Card>
            <CardContent className="p-8 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Your session has expired</h3>
              <p className="text-gray-600 mb-4">Please sign in again to continue.</p>
              <Button onClick={() => window.location.href = '/auth'}>
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" data-testid="heading-schedule">Schedule</h1>
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
            <h1 className="text-2xl font-bold text-gray-900" data-testid="heading-schedule">Schedule</h1>
            <p className="text-gray-600">Manage training sessions, matches, and events.</p>
          </div>
          <ScheduleSessionDialog />
        </div>
        <Card>
          <CardContent className="p-6">
            <EmptyState
              icon={Calendar}
              title="No sessions scheduled"
              description="Create your first training session or match to get started."
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
          <h1 className="text-2xl font-bold text-gray-900" data-testid="heading-schedule">Schedule</h1>
          <p className="text-gray-600">Manage training sessions, matches, and events.</p>
        </div>
        <ScheduleSessionDialog />
      </div>

      <div className="grid gap-6">
        {sessions.map((session: any) => (
          <Card key={session.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{session.title}</span>
                <span className="text-sm font-normal text-gray-500">
                  {session.ageGroup}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    {format(parseISO(session.startTime), 'EEE, d MMM • h:mm a')} - {format(parseISO(session.endTime), 'h:mm a')}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{session.location}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    {session.maxPlayers ? `0/${session.maxPlayers}` : '0'} players
                  </span>
                </div>
              </div>
              {session.description && (
                <div className="mt-3 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-600">{session.description}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
