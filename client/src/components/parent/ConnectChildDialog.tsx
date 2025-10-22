import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/shared/toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Users, Loader2 } from 'lucide-react';

interface ConnectChildDialogProps {
  trigger?: React.ReactNode;
}

export function ConnectChildDialog({ trigger }: ConnectChildDialogProps) {
  const [open, setOpen] = useState(false);
  const [childEmail, setChildEmail] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const connectChildMutation = useMutation({
    mutationFn: async (data: { childEmail: string; note?: string }) => {
      // Try primary endpoint first
      let response = await fetch('/api/parents/connect-child', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      // Fallback to alternative endpoint if 404
      if (response.status === 404) {
        response = await fetch('/api/connection-requests', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(data),
        });
      }

      if (!response.ok) {
        if (response.status === 404 || response.status === 501) {
          throw new Error('Connection feature not available yet. Please contact support.');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to send connection request');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Connection Request Sent',
        description: `Request sent to connect with ${childEmail}`,
      });
      // Refresh connection requests list if it exists
      queryClient.invalidateQueries({ queryKey: ['/api/connection-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/parents/children'] });
      // Reset form and close dialog
      setChildEmail('');
      setNote('');
      setError('');
      setOpen(false);
    },
    onError: (error: Error) => {
      setError(error.message);
      toast({
        title: 'Connection Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!childEmail || !childEmail.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    connectChildMutation.mutate({
      childEmail: childEmail.trim(),
      note: note.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Users className="h-4 w-4 mr-2" />
            Connect Child
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Connect to Child Account</DialogTitle>
            <DialogDescription>
              Enter the child's email address to send a connection request.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="childEmail">
                Child's Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="childEmail"
                type="email"
                placeholder="child@example.com"
                value={childEmail}
                onChange={(e) => setChildEmail(e.target.value)}
                disabled={connectChildMutation.isPending}
                required
              />
              <p className="text-xs text-gray-500">
                The child must have an existing account with this email.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="note">Note (Optional)</Label>
              <Textarea
                id="note"
                placeholder="Add a message with your request..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={connectChildMutation.isPending}
                rows={3}
              />
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={connectChildMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={connectChildMutation.isPending}>
              {connectChildMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Request'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
