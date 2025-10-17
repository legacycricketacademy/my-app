import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
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
import { DollarSign, Loader2 } from 'lucide-react';

interface NewPaymentDialogProps {
  trigger?: React.ReactNode;
}

export function NewPaymentDialog({ trigger }: NewPaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createPaymentMutation = useMutation({
    mutationFn: async (data: { amount: number; notes?: string }) => {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (response.status === 404 || response.status === 501) {
          throw new Error('Payments API not available yet. Please try again later.');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create payment');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Payment Created',
        description: 'Payment record has been successfully created.',
      });
      // Refresh payments list
      queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
      // Reset form and close dialog
      setAmount('');
      setNotes('');
      setError('');
      setOpen(false);
    },
    onError: (error: Error) => {
      setError(error.message);
      toast({
        title: 'Payment Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    createPaymentMutation.mutate({
      amount: amountNum,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <DollarSign className="h-4 w-4 mr-2" />
            New Payment
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Record New Payment</DialogTitle>
            <DialogDescription>
              Enter the payment details below. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">
                Amount <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                  $
                </span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="pl-7"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={createPaymentMutation.isPending}
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={createPaymentMutation.isPending}
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
              disabled={createPaymentMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createPaymentMutation.isPending}>
              {createPaymentMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Payment'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
