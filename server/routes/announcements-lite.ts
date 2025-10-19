import { Router } from 'express';
import crypto from 'node:crypto';

type Announcement = {
  id: string;
  title: string;
  body: string;
  audience: 'all'|'players'|'parents'|'coaches';
  priority: 'low'|'normal'|'high';
  createdAt: string;
  createdBy: string;
};

const store: Announcement[] = [];
const r = Router();

r.get('/', (_req, res) => res.json({ ok: true, items: store }));
r.get('/recent', (_req, res) => res.json({ ok: true, items: [...store].slice(-10).reverse() }));

r.post('/', (req: any, res) => {
  const { title, body, audience='all', priority='normal' } = req.body ?? {};
  if (!title || !body) return res.status(400).json({ ok:false, error:'validation', message:'title and body required' });
  const item: Announcement = {
    id: crypto.randomUUID(),
    title, body, audience, priority,
    createdAt: new Date().toISOString(),
    createdBy: String(req.user?.id ?? 'system'),
  };
  store.push(item);
  res.json({ ok:true, item });
});

export default r;
