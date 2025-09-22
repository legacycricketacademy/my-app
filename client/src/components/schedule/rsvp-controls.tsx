import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react';
import { rsvpApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface RSVPControlsProps {
  sessionId: number;
  myKidsStatus: Array<{ playerId: number; status: string }>;
  kids: Array<{ id: number; name: string; teamName: string }>;
  isPastEvent?: boolean;
  hasConflict?: boolean;
}

export function RSVPControls({ 
  sessionId, 
  myKidsStatus, 
  kids, 
  isPastEvent = false,
  hasConflict = false 
}: RSVPControlsProps) {
  const [localStatuses, setLocalStatuses] = useState<Record<number, string>>(() => {
    const statusMap: Record<number, string> = {};
    myKidsStatus.forEach(({ playerId, status }) => {
      statusMap[playerId] = status;
    });
    return statusMap;
  });

  const queryClient = useQueryClient();

  const rsvpMutation = useMutation({
    mutationFn: rsvpApi.upsert,
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['/api/rsvps'] });
      queryClient.invalidateQueries({ queryKey: ['/api/schedule'] });
      toast({
        title: "RSVP Updated",
        description: "Your response has been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update RSVP. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (playerId: number, status: 'going' | 'maybe' | 'no') => {
    if (isPastEvent) return;

    // Optimistic update
    setLocalStatuses(prev => ({ ...prev, [playerId]: status }));

    // Send to server
    rsvpMutation.mutate({
      sessionId,
      playerId,
      status,
    });
  };

  const isEventInFuture = (sessionId: number) => {
    // This should be passed as a prop or calculated from session data
    // For now, we'll use the isPastEvent prop which should be calculated correctly
    return !isPastEvent;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'going':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'maybe':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'no':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'going':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'maybe':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'no':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (kids.length === 0) {
    return null;
  }

  return (
    <Card className="mt-3" data-testid="rsvp-controls">
      <CardContent className="p-4">
        <div className="space-y-3">
          {hasConflict && (
            <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 p-2 rounded">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">Time conflict detected</span>
            </div>
          )}
          
          <div className="text-sm font-medium text-gray-700">
            RSVP for your kids:
          </div>
          
          {kids.map((kid) => {
            const currentStatus = localStatuses[kid.id] || 'no-response';
            const isUpdating = rsvpMutation.isPending;
            
            return (
              <div key={kid.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{kid.name}</span>
                  <Badge variant="outline" className="text-xs">
                    {kid.teamName}
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-1">
                  {currentStatus !== 'no-response' && getStatusIcon(currentStatus)}
                  <div className="flex space-x-1">
                    {(['going', 'maybe', 'no'] as const).map((status) => (
                      <Button
                        key={status}
                        variant={currentStatus === status ? "default" : "outline"}
                        size="sm"
                        className={`h-8 px-3 text-xs ${
                          currentStatus === status 
                            ? getStatusColor(status)
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => handleStatusChange(kid.id, status)}
                        disabled={isPastEvent || isUpdating}
                        title={isPastEvent ? "Past event" : ""}
                      >
                        {status === 'going' && 'Going'}
                        {status === 'maybe' && 'Maybe'}
                        {status === 'no' && 'No'}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
          
          {isPastEvent && (
            <div className="text-xs text-gray-500 text-center">
              Past events cannot be modified
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
