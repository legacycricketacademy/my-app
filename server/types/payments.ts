export interface Payment {
  id: string;
  playerId: string;
  playerName?: string;
  amount: number;           // in minor units or number (assume number for now)
  currency: 'INR' | 'USD';
  method: 'cash' | 'card' | 'upi' | 'bank';
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  reference?: string;
  notes?: string;
  createdAt: string;
  createdBy: string; // userId
}

export interface CreatePaymentRequest {
  playerId: string;
  amount: number;
  currency?: 'INR' | 'USD';
  method: 'cash' | 'card' | 'upi' | 'bank';
  status?: 'paid' | 'pending' | 'failed' | 'refunded';
  reference?: string;
  notes?: string;
}

export interface ListPaymentsParams {
  playerId?: string;
  status?: string;
  from?: string;
  to?: string;
}
