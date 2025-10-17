import { Payment } from '../types/payments.js';
import { randomUUID } from 'crypto';

const _payments: Payment[] = [];

export function listPayments(params?: {
  playerId?: string; status?: string; from?: string; to?: string;
}): Payment[] {
  let out = [..._payments];
  if (params?.playerId) out = out.filter(p => p.playerId === params.playerId);
  if (params?.status) out = out.filter(p => p.status === params.status);
  if (params?.from) out = out.filter(p => p.createdAt >= params.from!);
  if (params?.to) out = out.filter(p => p.createdAt <= params.to!);
  return out.sort((a,b) => b.createdAt.localeCompare(a.createdAt));
}

export function createPayment(dto: Omit<Payment, 'id'|'createdAt'|'createdBy'>, userId: string): Payment {
  const created: Payment = { ...dto, id: randomUUID(), createdAt: new Date().toISOString(), createdBy: userId };
  _payments.push(created);
  return created;
}
