import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CreditCard, Banknote, Smartphone, Building2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreatePayment } from '@/api/payments';
import { toast } from '@/hooks/use-toast';

const formSchema = z.object({
  playerId: z.string().min(1, 'Player is required'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.enum(['INR', 'USD']).default('INR'),
  method: z.enum(['cash', 'card', 'upi', 'bank']),
  status: z.enum(['paid', 'pending', 'failed', 'refunded']).default('paid'),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface RecordPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Mock players data - in real app, this would come from API
const mockPlayers = [
  { id: 'player_1', name: 'John Doe' },
  { id: 'player_2', name: 'Jane Smith' },
  { id: 'player_3', name: 'Mike Johnson' },
  { id: 'player_4', name: 'Sarah Wilson' },
];

export function RecordPaymentModal({ open, onOpenChange }: RecordPaymentModalProps) {
  const createPayment = useCreatePayment();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      playerId: '',
      amount: 0,
      currency: 'INR',
      method: 'cash',
      status: 'paid',
      reference: '',
      notes: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await createPayment.mutateAsync(data);

      toast({
        title: 'Success',
        description: 'Payment recorded successfully',
      });

      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to record payment',
        variant: 'destructive',
      });
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return <Banknote className="h-4 w-4" />;
      case 'card':
        return <CreditCard className="h-4 w-4" />;
      case 'upi':
        return <Smartphone className="h-4 w-4" />;
      case 'bank':
        return <Building2 className="h-4 w-4" />;
      default:
        return <Banknote className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record a payment for a player.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto space-y-6 px-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Player Selection */}
            <div className="md:col-span-2">
              <Label htmlFor="playerId">Player *</Label>
              <Select
                value={form.watch('playerId')}
                onValueChange={(value) => form.setValue('playerId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a player" />
                </SelectTrigger>
                <SelectContent>
                  {mockPlayers.map((player) => (
                    <SelectItem key={player.id} value={player.id}>
                      {player.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.playerId && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.playerId.message}</p>
              )}
            </div>

            {/* Amount */}
            <div>
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...form.register('amount', { valueAsNumber: true })}
              />
              {form.formState.errors.amount && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.amount.message}</p>
              )}
            </div>

            {/* Currency */}
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={form.watch('currency')}
                onValueChange={(value) => form.setValue('currency', value as 'INR' | 'USD')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">INR (₹)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.currency && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.currency.message}</p>
              )}
            </div>

            {/* Payment Method */}
            <div>
              <Label htmlFor="method">Payment Method *</Label>
              <Select
                value={form.watch('method')}
                onValueChange={(value) => form.setValue('method', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-4 w-4" />
                      Cash
                    </div>
                  </SelectItem>
                  <SelectItem value="card">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Card
                    </div>
                  </SelectItem>
                  <SelectItem value="upi">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4" />
                      UPI
                    </div>
                  </SelectItem>
                  <SelectItem value="bank">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Bank Transfer
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.method && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.method.message}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.watch('status')}
                onValueChange={(value) => form.setValue('status', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.status && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.status.message}</p>
              )}
            </div>

            {/* Reference */}
            <div>
              <Label htmlFor="reference">Reference</Label>
              <Input
                id="reference"
                placeholder="Transaction ID, check number, etc."
                {...form.register('reference')}
              />
              {form.formState.errors.reference && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.reference.message}</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Additional information about the payment..."
              {...form.register('notes')}
            />
            {form.formState.errors.notes && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.notes.message}</p>
            )}
          </div>
        </form>

        <DialogFooter className="sticky bottom-0 bg-background border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createPayment.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={form.handleSubmit(onSubmit)}
            disabled={createPayment.isPending}
          >
            {createPayment.isPending ? 'Recording...' : 'Record Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
