import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SimpleScheduleDialog } from '@/components/sessions/simple-schedule-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Users, Calendar, MapPin, Trophy, Target } from 'lucide-react';
import { api, rsvpApi } from '@/lib/api';
import { format, parseISO } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface Session {
  id: number;
  type: 'practice' | 'game';
  teamId: number;
  teamName: string;
  start: string;
  end: string;
  location: string;
  opponent?: string;
  notes?: string;
  createdAt: string;
}

interface RSVPData {
  sessionId: number;
  counts: { going: number; maybe: number; no: number };
  byPlayer: Array<{ playerId: number; playerName: string; status: string; comment?: string }>;
}

export default function AdminSessionsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  // Fetch sessions
  const { data: sessions = [], isLoading } = useQuery<Session[]>({
    queryKey: ['/api/admin/sessions'],
    queryFn: () => api.get('/admin/sessions'),
  });

  // Fetch RSVP data for selected session
  const { data: rsvpData } = useQuery<RSVPData>({
    queryKey: ['/api/rsvps', selectedSessionId],
    queryFn: () => rsvpApi.get(selectedSessionId!),
    enabled: !!selectedSessionId,
  });

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: (data: Partial<Session>) => api.post('/admin/sessions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/sessions'] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Session Created",
        description: "The session has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create session. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update session mutation
  const updateSessionMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Session> }) => 
      api.patch(`/admin/sessions/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/sessions'] });
      setEditingSession(null);
      toast({
        title: "Session Updated",
        description: "The session has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update session. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete session mutation
  const deleteSessionMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/sessions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/sessions'] });
      toast({
        title: "Session Deleted",
        description: "The session has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete session. Please try again.",
        variant: "destructive",
      });
    },
  });

  const formatTime = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'MMM d, yyyy h:mm a');
    } catch {
      return 'Invalid time';
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'practice' ? <Target className="h-4 w-4" /> : <Trophy className="h-4 w-4" />;
  };

  const getTypeColor = (type: string) => {
    return type === 'practice' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'going':
        return 'bg-green-100 text-green-800';
      case 'maybe':
        return 'bg-yellow-100 text-yellow-800';
      case 'no':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Session Management</h1>
        <SimpleScheduleDialog />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sessions List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>All Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array(3).fill(0).map((_, i) => (
                    <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />
                  ))}
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No sessions found. Create your first session above.
                </div>
              ) : (
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <Card key={session.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {getTypeIcon(session.type)}
                            <div>
                              <h3 className="font-semibold">{session.teamName}</h3>
                              <p className="text-sm text-gray-600">
                                {formatTime(session.start)} - {formatTime(session.end)}
                              </p>
                              <div className="flex items-center space-x-4 mt-1">
                                <div className="flex items-center space-x-1 text-sm text-gray-600">
                                  <MapPin className="h-3 w-3" />
                                  <span>{session.location}</span>
                                </div>
                                {session.opponent && (
                                  <div className="flex items-center space-x-1 text-sm text-gray-600">
                                    <Users className="h-3 w-3" />
                                    <span>vs {session.opponent}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getTypeColor(session.type)}>
                              {session.type === 'practice' ? 'Practice' : 'Game'}
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedSessionId(session.id)}
                            >
                              <Users className="h-4 w-4 mr-1" />
                              RSVPs
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingSession(session)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteSessionMutation.mutate(session.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RSVP Summary */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>RSVP Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedSessionId && rsvpData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-green-50 p-3 rounded">
                      <div className="text-2xl font-bold text-green-600">
                        {rsvpData.counts.going}
                      </div>
                      <div className="text-sm text-green-800">Going</div>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded">
                      <div className="text-2xl font-bold text-yellow-600">
                        {rsvpData.counts.maybe}
                      </div>
                      <div className="text-sm text-yellow-800">Maybe</div>
                    </div>
                    <div className="bg-red-50 p-3 rounded">
                      <div className="text-2xl font-bold text-red-600">
                        {rsvpData.counts.no}
                      </div>
                      <div className="text-sm text-red-800">No</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Player Responses</h4>
                    {rsvpData.byPlayer.map((player) => (
                      <div key={player.playerId} className="flex items-center justify-between">
                        <span className="text-sm">{player.playerName}</span>
                        <Badge className={getStatusColor(player.status)}>
                          {player.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Select a session to view RSVPs
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Session Dialog */}
      {editingSession && (
        <Dialog open={!!editingSession} onOpenChange={() => setEditingSession(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Session</DialogTitle>
            </DialogHeader>
            <SessionForm
              initialData={editingSession}
              onSubmit={(data) => updateSessionMutation.mutate({ id: editingSession.id, data })}
              isLoading={updateSessionMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Session Form Component
function SessionForm({ 
  initialData, 
  onSubmit, 
  isLoading 
}: { 
  initialData?: Session; 
  onSubmit: (data: Partial<Session>) => void; 
  isLoading: boolean; 
}) {
  const [formData, setFormData] = useState({
    type: initialData?.type || 'practice',
    teamId: initialData?.teamId || 1,
    teamName: initialData?.teamName || '',
    start: initialData?.start ? format(parseISO(initialData.start), "yyyy-MM-dd'T'HH:mm") : '',
    end: initialData?.end ? format(parseISO(initialData.end), "yyyy-MM-dd'T'HH:mm") : '',
    location: initialData?.location || '',
    opponent: initialData?.opponent || '',
    notes: initialData?.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">Type</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as 'practice' | 'game' }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="practice">Practice</SelectItem>
              <SelectItem value="game">Game</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="teamId">Team ID</Label>
          <Input
            id="teamId"
            type="number"
            value={formData.teamId}
            onChange={(e) => setFormData(prev => ({ ...prev, teamId: parseInt(e.target.value) }))}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="teamName">Team Name</Label>
        <Input
          id="teamName"
          value={formData.teamName}
          onChange={(e) => setFormData(prev => ({ ...prev, teamName: e.target.value }))}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="start">Start Time</Label>
          <Input
            id="start"
            type="datetime-local"
            value={formData.start}
            onChange={(e) => setFormData(prev => ({ ...prev, start: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="end">End Time</Label>
          <Input
            id="end"
            type="datetime-local"
            value={formData.end}
            onChange={(e) => setFormData(prev => ({ ...prev, end: e.target.value }))}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
          required
        />
      </div>

      <div>
        <Label htmlFor="opponent">Opponent (for games)</Label>
        <Input
          id="opponent"
          value={formData.opponent}
          onChange={(e) => setFormData(prev => ({ ...prev, opponent: e.target.value }))}
        />
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Session'}
        </Button>
      </div>
    </form>
  );
}
