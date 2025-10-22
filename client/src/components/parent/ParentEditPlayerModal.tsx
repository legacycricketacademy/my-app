import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

interface ParentEditPlayerModalProps {
  open: boolean;
  onClose: () => void;
  initialValues: {
    playerId?: number;
    playerName?: string;
    emergencyContact?: string;
    medicalInformation?: string;
  };
}

export function ParentEditPlayerModal({ open, onClose, initialValues }: ParentEditPlayerModalProps) {
  const [playerName, setPlayerName] = useState(initialValues.playerName || '');
  const [emergencyContact, setEmergencyContact] = useState(initialValues.emergencyContact || '');
  const [medicalInfo, setMedicalInfo] = useState(initialValues.medicalInformation || '');
  const [error, setError] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Update form when initial values change
  useEffect(() => {
    setPlayerName(initialValues.playerName || '');
    setEmergencyContact(initialValues.emergencyContact || '');
    setMedicalInfo(initialValues.medicalInformation || '');
    setError('');
  }, [initialValues, open]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/parent/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update profile');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Profile Updated',
        description: 'Player information has been successfully updated.',
      });
      // Refresh profile data
      queryClient.invalidateQueries({ queryKey: ['/api/parent/profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      onClose();
    },
    onError: (error: Error) => {
      setError(error.message);
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Build update payload with only changed fields
    const updates: any = {};
    
    if (playerName !== initialValues.playerName) {
      updates.playerName = playerName.trim();
    }
    if (emergencyContact !== initialValues.emergencyContact) {
      updates.emergencyContact = emergencyContact.trim();
    }
    if (medicalInfo !== initialValues.medicalInformation) {
      updates.medicalInformation = medicalInfo.trim();
    }

    // Add player ID if available
    if (initialValues.playerId) {
      updates.playerId = initialValues.playerId;
    }

    updateProfileMutation.mutate(updates);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>Update Information</DialogTitle>
          <DialogDescription>
            Update your player's information below.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-4 space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="playerName">Player Name</Label>
              <Input
                id="playerName"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                disabled={updateProfileMutation.isPending}
                placeholder="Enter player name"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="emergencyContact">Emergency Contact</Label>
              <Input
                id="emergencyContact"
                type="tel"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                disabled={updateProfileMutation.isPending}
                placeholder="Enter emergency contact number"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="medicalInfo">Medical Information</Label>
              <Textarea
                id="medicalInfo"
                value={medicalInfo}
                onChange={(e) => setMedicalInfo(e.target.value)}
                disabled={updateProfileMutation.isPending}
                placeholder="Enter any medical conditions or allergies"
                rows={4}
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}
          </div>

          <DialogFooter className="sticky bottom-0 bg-white border-t px-6 py-4 mt-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={updateProfileMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateProfileMutation.isPending}
              data-testid="parent-edit-profile-save"
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
