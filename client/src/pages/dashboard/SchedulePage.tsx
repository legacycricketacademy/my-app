import { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { NewSessionModal } from '@/features/sessions/NewSessionModal';
import { useListSessions } from '@/features/sessions/useSessions';
import { format, parseISO } from 'date-fns';

export default function SchedulePage() {
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const { data, isLoading, error, refetch } = useListSessions();

  const sessions = data?.sessions ?? [];

  console.log('=== SchedulePage Debug ===');
  console.log('1. Component rendered');
  console.log('2. showNewSessionModal state:', showNewSessionModal);
  console.log('3. sessions count:', sessions.length);
  console.log('4. isLoading:', isLoading);
  console.log('5. error:', error?.message);
  console.log('6. NewSessionModal component:', NewSessionModal);
  console.log('========================');

  // Watch for state changes
  useEffect(() => {
    console.log('🔄 showNewSessionModal changed to:', showNewSessionModal);
  }, [showNewSessionModal]);

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
    // Check if it's a 401 error
    const is401 = error instanceof Error && error.message.includes('401');
    
    if (is401) {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
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
          <Button onClick={() => setShowNewSessionModal(true)}>
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
                onClick: () => setShowNewSessionModal(true)
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
        <div className="flex gap-2">
          <Button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🔵 Add Session button clicked');
              console.log('🔵 Current state before:', showNewSessionModal);
              setShowNewSessionModal(prev => {
                console.log('🔵 setState callback: prev=', prev, ', setting to true');
                return true;
              });
              console.log('🔵 setState called');
            }}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Add Session
          </Button>
          
          {/* Test with direct boolean */}
          <Button 
            variant="outline" 
            onClick={() => {
              console.log('🟢 Test button - setting state directly to true');
              setShowNewSessionModal(true);
            }}
          >
            Test Modal
          </Button>
        </div>
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
                    {format(parseISO(session.startUtc), 'EEE, d MMM • h:mm a')} - {format(parseISO(session.endUtc), 'h:mm a')}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{session.location}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    0/{session.maxAttendees} players
                  </span>
                </div>
              </div>
              {session.notes && (
                <div className="mt-3 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-600">{session.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Debug indicators */}
      <div className="fixed bottom-4 left-4 bg-blue-500 text-white p-2 rounded z-[9999] text-xs">
        Modal State: {showNewSessionModal ? 'OPEN' : 'CLOSED'}
      </div>
      
      {showNewSessionModal && (
        <div className="fixed top-4 right-4 bg-green-500 text-white p-4 rounded z-[9999]">
          ✅ State is TRUE - Modal should be visible
        </div>
      )}
      
      {/* Simple conditional render test */}
      {showNewSessionModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg">
            <h2 className="text-xl font-bold mb-4">TEST: Modal State is TRUE</h2>
            <p>If you see this, state is working but Dialog component might be the issue</p>
            <Button onClick={() => setShowNewSessionModal(false)} className="mt-4">
              Close Test Overlay
            </Button>
          </div>
        </div>
      )}
      
      <NewSessionModal 
        open={showNewSessionModal} 
        onOpenChange={(open) => {
          console.log('🔴 onOpenChange called with:', open);
          setShowNewSessionModal(open);
        }} 
      />
    </div>
  );
}
