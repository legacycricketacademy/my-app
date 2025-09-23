import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getCurrentUser } from '@/lib/auth';
import { TID } from '@/ui/testids';

// Mock data for admin sessions
const mockSessions = [
  {
    id: 1,
    title: 'Batting Practice',
    type: 'practice',
    date: '2024-01-15',
    time: '4:00 PM',
    location: 'Field 1',
    participants: 12,
    maxParticipants: 20,
  },
  {
    id: 2,
    title: 'League Match',
    type: 'game',
    date: '2024-01-17',
    time: '5:00 PM',
    location: 'Cricket Ground',
    participants: 18,
    maxParticipants: 22,
  },
];

// Empty state component
function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-8" data-testid={TID.common.empty}>
      <div className="text-gray-500 text-sm">{message}</div>
    </div>
  );
}

// Session row component
function SessionRow({ session }: { session: any }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(session);

  const handleSave = () => {
    // In a real app, this would save to the backend
    console.log('Saving session:', editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(session);
    setIsEditing(false);
  };

  return (
    <div className="border rounded-lg p-4" data-testid={TID.admin.row(session.id)}>
      {isEditing ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={editData.title}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={editData.type}
                onChange={(e) => setEditData({ ...editData, type: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="practice">Practice</option>
                <option value="game">Game</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={editData.date}
                onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <input
                type="time"
                value={editData.time}
                onChange={(e) => setEditData({ ...editData, time: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={editData.location}
                onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex space-x-2">
            <Button onClick={handleSave} size="sm" data-testid={TID.admin.save}>
              Save
            </Button>
            <Button onClick={handleCancel} size="sm" variant="outline" data-testid={TID.admin.cancel}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{session.title}</h3>
            <div className="mt-2 space-y-1">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Type:</span> {session.type.charAt(0).toUpperCase() + session.type.slice(1)}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Date:</span> {session.date} at {session.time}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Location:</span> {session.location}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Participants:</span> {session.participants}/{session.maxParticipants}
              </p>
            </div>
          </div>
          <div className="ml-4 flex space-x-2">
            <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
            <Button size="sm" variant="destructive">
              Delete
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminSessionsPage() {
  console.log('[AdminSessionsPage] Component rendered');
  const user = getCurrentUser();
  console.log('[AdminSessionsPage] User:', user);
  const [sessions, setSessions] = useState(mockSessions);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

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
          <p className="text-gray-600 mb-4">Please sign in to access admin sessions.</p>
          <Button onClick={() => window.location.href = '/auth'}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You need admin privileges to access this page.</p>
          <Button onClick={() => window.location.href = '/'}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <MainLayout title="Session Management">
      <div className="space-y-6" data-testid={TID.admin.page}>
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Session Management</h1>
          <Button 
            onClick={() => setShowCreateDialog(true)}
            data-testid={TID.admin.createBtn}
          >
            Create Session
          </Button>
        </div>

        {/* Sessions List */}
        <Card>
          <CardHeader>
            <CardTitle>All Sessions</CardTitle>
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
            ) : sessions.length === 0 ? (
              <EmptyState message="No sessions found. Create your first session to get started." />
            ) : (
              <div className="space-y-4" data-testid={TID.admin.list}>
                {sessions.map(session => (
                  <SessionRow key={session.id} session={session} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Session Dialog */}
        {showCreateDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold mb-4">Create New Session</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    placeholder="Session title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm">
                    <option value="practice">Practice</option>
                    <option value="game">Game</option>
                  </select>
                </div>
                <div className="flex space-x-2">
                  <Button className="flex-1" data-testid={TID.admin.save}>
                    Create
                  </Button>
                  <Button 
                    className="flex-1" 
                    variant="outline" 
                    onClick={() => setShowCreateDialog(false)}
                    data-testid={TID.admin.cancel}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}