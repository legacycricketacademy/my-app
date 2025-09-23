import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getCurrentUser } from '@/lib/auth';
import { TID } from '@/ui/testids';

// Mock data for schedule
const mockSessions = [
  {
    id: 1,
    type: 'practice',
    title: 'Batting Practice',
    date: '2024-01-15',
    time: '4:00 PM',
    duration: '2 hours',
    location: 'Field 1',
    isPast: false,
  },
  {
    id: 2,
    type: 'game',
    title: 'League Match',
    date: '2024-01-17',
    time: '5:00 PM',
    duration: '3 hours',
    location: 'Cricket Ground',
    isPast: false,
  },
  {
    id: 3,
    type: 'practice',
    title: 'Fielding Drills',
    date: '2024-01-19',
    time: '3:30 PM',
    duration: '1.5 hours',
    location: 'Field 2',
    isPast: false,
  },
];

const mockKids = [
  { id: 1, name: 'John Smith' },
  { id: 2, name: 'Sarah Johnson' },
];

// Empty state component
function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-8" data-testid={TID.common.empty}>
      <div className="text-gray-500 text-sm">{message}</div>
    </div>
  );
}

// RSVP buttons component
function RSVPButtons({ sessionId, isPast }: { sessionId: number; isPast: boolean }) {
  const [status, setStatus] = useState<'going' | 'maybe' | 'no' | null>(null);

  const handleRSVP = (newStatus: 'going' | 'maybe' | 'no') => {
    setStatus(newStatus);
  };

  return (
    <div className="flex space-x-2">
      <Button
        size="sm"
        variant={status === 'going' ? 'default' : 'outline'}
        onClick={() => handleRSVP('going')}
        disabled={isPast}
        data-testid={TID.schedule.rsvpGoing}
        aria-disabled={isPast}
        title={isPast ? 'Past event' : 'Going'}
      >
        Going
      </Button>
      <Button
        size="sm"
        variant={status === 'maybe' ? 'default' : 'outline'}
        onClick={() => handleRSVP('maybe')}
        disabled={isPast}
        data-testid={TID.schedule.rsvpMaybe}
        aria-disabled={isPast}
        title={isPast ? 'Past event' : 'Maybe'}
      >
        Maybe
      </Button>
      <Button
        size="sm"
        variant={status === 'no' ? 'default' : 'outline'}
        onClick={() => handleRSVP('no')}
        disabled={isPast}
        data-testid={TID.schedule.rsvpNo}
        aria-disabled={isPast}
        title={isPast ? 'Past event' : 'No'}
      >
        No
      </Button>
    </div>
  );
}

export default function SchedulePage() {
  const user = getCurrentUser();
  const [activeTab, setActiveTab] = useState<'all' | 'practices' | 'games'>('all');
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [selectedKids, setSelectedKids] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Not Authenticated</h1>
          <p className="text-gray-600 mb-4">Please sign in to access the schedule.</p>
          <Button onClick={() => window.location.href = '/auth'}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  const isParent = user.role === 'parent';
  const isAdmin = user.role === 'admin';

  // Filter sessions based on active tab
  const filteredSessions = mockSessions.filter(session => {
    if (activeTab === 'all') return true;
    if (activeTab === 'practices') return session.type === 'practice';
    if (activeTab === 'games') return session.type === 'game';
    return true;
  });

  return (
    <MainLayout title="Schedule">
      <div className="space-y-6" data-testid={TID.schedule.page}>
        {/* Tabs */}
        <div className="border-b border-gray-200" data-testid={TID.schedule.tabs}>
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('all')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              data-testid={TID.schedule.tabAll}
            >
              All Events
            </button>
            <button
              onClick={() => setActiveTab('practices')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'practices'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              data-testid={TID.schedule.tabPractices}
            >
              Practices
            </button>
            <button
              onClick={() => setActiveTab('games')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'games'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              data-testid={TID.schedule.tabGames}
            >
              Games
            </button>
          </nav>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* View Mode Selector */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">View:</label>
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as 'week' | 'month')}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              data-testid={TID.schedule.viewSelect}
            >
              <option value="week" data-testid={TID.schedule.viewWeek}>Week</option>
              <option value="month" data-testid={TID.schedule.viewMonth}>Month</option>
            </select>
          </div>

          {/* Kid Filter (Parent only) */}
          {isParent && (
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Kids:</label>
              <select
                multiple
                value={selectedKids}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions, option => parseInt(option.value));
                  setSelectedKids(values);
                }}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm min-w-32"
                data-testid={TID.schedule.kidFilter}
              >
                {mockKids.map(kid => (
                  <option key={kid.id} value={kid.id}>
                    {kid.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Schedule Content */}
        <Card>
          <CardHeader>
            <CardTitle>
              {activeTab === 'all' && 'All Events'}
              {activeTab === 'practices' && 'Practice Sessions'}
              {activeTab === 'games' && 'Games'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : filteredSessions.length === 0 ? (
              <EmptyState message="No sessions found for the selected criteria." />
            ) : (
              <div className="space-y-4">
                {filteredSessions.map(session => (
                  <div key={session.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{session.title}</h3>
                        <div className="mt-2 space-y-1">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Date:</span> {session.date}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Time:</span> {session.time} ({session.duration})
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Location:</span> {session.location}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Type:</span> {session.type.charAt(0).toUpperCase() + session.type.slice(1)}
                          </p>
                        </div>
                      </div>
                      <div className="ml-4">
                        <RSVPButtons sessionId={session.id} isPast={session.isPast} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}