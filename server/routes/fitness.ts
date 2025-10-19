import { Router } from 'express';
import crypto from 'node:crypto';

type FitnessLog = {
  id: string;
  playerId?: string;
  date: string; // ISO
  metrics: Record<string, number>;
  notes?: string;
  createdBy: string;
  createdAt: string;
};

const logs: FitnessLog[] = [];
const r = Router();

r.get('/summary', (_req, res) => {
  res.json({ ok:true, items: logs.slice(-50).reverse() });
});

r.post('/logs', (req: any, res) => {
  const { date, metrics, notes, playerId } = req.body ?? {};
  if (!date || !metrics || typeof metrics !== 'object') {
    return res.status(400).json({ ok:false, error:'validation', message:'date and metrics required' });
  }
  const item: FitnessLog = {
    id: crypto.randomUUID(),
    date, metrics, notes, playerId,
    createdBy: String(req.user?.id ?? 'system'),
    createdAt: new Date().toISOString(),
  };
  logs.push(item);
  res.json({ ok:true, item });
});

export default r;
