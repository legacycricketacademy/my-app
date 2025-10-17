export type Currency = 'INR' | 'USD';
export type PayMethod = 'cash' | 'card' | 'upi' | 'bank';
export type PayStatus = 'paid' | 'pending' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  playerId: string;
  playerName?: string;
  amount: number;    // assume number
  currency: Currency;
  method: PayMethod;
  status: PayStatus;
  reference?: string;
  notes?: string;
  createdAt: string; // ISO
  createdBy: string; // userId
}
