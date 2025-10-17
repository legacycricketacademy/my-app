import type { Payment, CreatePaymentRequest, ListPaymentsParams } from '../types/payments.js';

export class PaymentsStore {
  private payments: Payment[] = [];
  private nextId = 1;

  async list(params: ListPaymentsParams = {}): Promise<Payment[]> {
    let filtered = [...this.payments];

    if (params.playerId) {
      filtered = filtered.filter(p => p.playerId === params.playerId);
    }

    if (params.status) {
      filtered = filtered.filter(p => p.status === params.status);
    }

    if (params.from) {
      const fromDate = new Date(params.from);
      filtered = filtered.filter(p => new Date(p.createdAt) >= fromDate);
    }

    if (params.to) {
      const toDate = new Date(params.to);
      filtered = filtered.filter(p => new Date(p.createdAt) <= toDate);
    }

    // Sort by creation date, newest first
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async create(dto: CreatePaymentRequest, userId: string): Promise<Payment> {
    const payment: Payment = {
      id: `payment_${this.nextId++}`,
      playerId: dto.playerId,
      playerName: dto.playerName,
      amount: dto.amount,
      currency: dto.currency || 'INR',
      method: dto.method,
      status: dto.status || 'paid',
      reference: dto.reference,
      notes: dto.notes,
      createdAt: new Date().toISOString(),
      createdBy: userId,
    };

    this.payments.push(payment);
    return payment;
  }

  async getById(id: string): Promise<Payment | null> {
    return this.payments.find(p => p.id === id) || null;
  }

  async update(id: string, updates: Partial<Payment>): Promise<Payment | null> {
    const index = this.payments.findIndex(p => p.id === id);
    if (index === -1) return null;

    this.payments[index] = { ...this.payments[index], ...updates };
    return this.payments[index];
  }

  async delete(id: string): Promise<boolean> {
    const index = this.payments.findIndex(p => p.id === id);
    if (index === -1) return false;

    this.payments.splice(index, 1);
    return true;
  }
}
