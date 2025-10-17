import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, MapPin, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO } from 'date-fns';

export default function FullCalendarPage() {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { data: sessions, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/sessions', 'child'],
    queryFn: async () => {
      const response = await fetch('/api/sessions?scope=child', {
        credentials: 'include'
      });
      if (!response.ok) {
        // Fallback to general sessions endpoint
        const fallbackResponse = await fetch('/api/sessions', {
          credentials: 'include'
        });
        if (!fallbackResponse.ok) throw new Error('Failed to fetch sessions');
        return fallbackResponse.json();
      }
      return response.json();
    }
  });

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  // Get all days in current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Group sessions by date
  const sessionsByDate = new Map<string, any[]>();
  if (sessions && Array.isArray(sessions)) {
    sessions.forEach((session: any) => {
      const sessionDate = format(new Date(session.startTime || session.date), 'yyyy-MM-dd');
      if (!sessionsByDate.has(sessionDate)) {
        sessionsByDate.set(sessionDate, []);
      }
      sessionsByDate.get(sessionDate)!.push(session);
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Training Calendar</h1>
            <p className="text-gray-600">View all scheduled training sessions and events.</p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/parent/schedule')}
            aria-label="Back to schedule"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <LoadingState message="Loading calendar..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Training Calendar</h1>
            <p className="text-gray-600">View all scheduled training sessions and events.</p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/parent/schedule')}
            aria-label="Back to schedule"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <ErrorState 
          title="Failed to load calendar"
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
            <h1 className="text-2xl font-bold text-gray-900">Training Calendar</h1>
            <p className="text-gray-600">View all scheduled training sessions and events.</p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/parent/schedule')}
            aria-label="Back to schedule"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <EmptyState
              icon={Calendar}
              title="No sessions scheduled"
              description="There are no training sessions scheduled at this time."
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
          <h1 className="text-2xl font-bold text-gray-900">Training Calendar</h1>
          <p className="text-gray-600">View all scheduled training sessions and events.</p>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate('/parent/schedule')}
          aria-label="Back to schedule"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      {/* Month Navigator */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousMonth}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle>{format(currentMonth, 'MMMM yyyy')}</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextMonth}
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToToday}
            className="mt-2"
          >
            Today
          </Button>
        </CardHeader>
        <CardContent>
          {/* Agenda View - List sessions by date */}
          <div className="space-y-4">
            {daysInMonth.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const daySessions = sessionsByDate.get(dateKey) || [];
              
              if (daySessions.length === 0) return null;

              return (
                <div key={dateKey} className="border-l-4 border-primary pl-4">
                  <h3 className="font-semibold text-lg mb-2">
                    {format(day, 'EEEE, MMMM d')}
                  </h3>
                  <div className="space-y-2">
                    {daySessions.map((session: any) => (
                      <Card key={session.id} className="bg-gray-50">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium">{session.title}</h4>
                              <div className="mt-2 space-y-1 text-sm text-gray-600">
                                <div className="flex items-center space-x-2">
                                  <Clock className="h-4 w-4" />
                                  <span>
                                    {format(new Date(session.startTime), 'h:mm a')} -{' '}
                                    {format(new Date(session.endTime), 'h:mm a')}
                                  </span>
                                </div>
                                {session.location && (
                                  <div className="flex items-center space-x-2">
                                    <MapPin className="h-4 w-4" />
                                    <span>{session.location}</span>
                                  </div>
                                )}
                                {session.maxAttendees && (
                                  <div className="flex items-center space-x-2">
                                    <Users className="h-4 w-4" />
                                    <span>
                                      {session.currentAttendees || 0}/{session.maxAttendees} players
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                              {session.sessionType || 'Training'}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
            
            {Array.from(sessionsByDate.keys()).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No sessions scheduled for {format(currentMonth, 'MMMM yyyy')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
