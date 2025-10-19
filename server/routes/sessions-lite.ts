import { Router } from 'express';
import crypto from 'node:crypto';

type Session = {
  id: string;
  title: string;
  ageGroup: string;
  location: string;
  startUtc: string;
  endUtc: string;
  maxAttendees: number;
  notes?: string;
  createdBy: string;
  createdAt: string;
};

const sessions: Session[] = [];
const r = Router();

r.get('/', (_req, res) => {
  res.json({ ok: true, items: [...sessions].sort((a,b)=> a.startUtc.localeCompare(b.startUtc)) });
});

// Simple create to unblock UI
r.post('/', (req: any, res) => {
  const { title, ageGroup='Under 12s', location='Main Ground', startLocal, endLocal, timezone, maxAttendees=20, notes } = req.body ?? {};
  if (!title || !startLocal || !endLocal || !timezone) {
    return res.status(400).json({ ok:false, error:'validation', message:'title, startLocal, endLocal, timezone required' });
  }
  // Store as UTC ISO without tz conversion fuss (assume client provided correct local→UTC or just keep local as ISO)
  const item: Session = {
    id: crypto.randomUUID(),
    title, ageGroup, location,
    startUtc: new Date(startLocal).toISOString(),
    endUtc: new Date(endLocal).toISOString(),
    maxAttendees: Number(maxAttendees) || 20,
    notes,
    createdBy: String(req.user?.id ?? 'system'),
    createdAt: new Date().toISOString(),
  };
  sessions.push(item);
  res.json({ ok:true, item });
});

export default r;
