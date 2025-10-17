import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type Props = { open: boolean; onOpenChange: (open: boolean) => void; };

export default function RecordPaymentModal({ open, onOpenChange }: Props) {
  const [playerId, setPlayerId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [currency, setCurrency] = useState<'INR'|'USD'>('INR');
  const [method, setMethod] = useState<'cash'|'card'|'upi'|'bank'>('cash');
  const [status, setStatus] = useState<'paid'|'pending'|'failed'|'refunded'>('paid');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [isPending, setIsPending] = useState(false);
  const { toast } = useToast();

  const submit = async () => {
    if (!playerId || !amount || Number(amount) <= 0) {
      toast({ title: 'Validation Error', description: 'Player and positive amount are required.', variant: 'destructive' });
      return;
    }
    
    setIsPending(true);
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          playerId,
          playerName: playerName || undefined,
          amount: Number(amount),
          currency,
          method,
          status,
          reference: reference || undefined,
          notes: notes || undefined,
        }),
      });
      const json = await res.json();
      if (json?.ok) {
        toast({ title: 'Success', description: 'Payment recorded' });
        onOpenChange(false);
        // Reset form
        setPlayerId('');
        setPlayerName('');
        setAmount('');
        setReference('');
        setNotes('');
        // Reload the page to refresh the list
        window.location.reload();
      } else {
        toast({ title: 'Error', description: json?.message || 'Failed to record payment', variant: 'destructive' });
        console.warn('PAYMENT_POST_FAIL', json);
      }
    } catch (err:any) {
      toast({ title: 'Network Error', description: 'Network error while recording payment', variant: 'destructive' });
      console.error('PAYMENT_POST_ERR', err);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="playerId">Player ID *</Label>
            <Input id="playerId" placeholder="Enter player ID" value={playerId} onChange={e=>setPlayerId(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="playerName">Player Name (optional)</Label>
            <Input id="playerName" placeholder="Enter player name" value={playerName} onChange={e=>setPlayerName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input 
                id="amount" 
                type="number" 
                min={1} 
                placeholder="0.00" 
                value={amount} 
                onChange={e=>setAmount(e.target.value ? Number(e.target.value) : '')} 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={(v)=>setCurrency(v as any)}>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">INR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="method">Method</Label>
              <Select value={method} onValueChange={(v)=>setMethod(v as any)}>
                <SelectTrigger id="method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="bank">Bank</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(v)=>setStatus(v as any)}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reference">Reference</Label>
              <Input id="reference" placeholder="Optional" value={reference} onChange={e=>setReference(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" placeholder="Add notes..." value={notes} onChange={e=>setNotes(e.target.value)} rows={3} />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={isPending}>
            {isPending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
