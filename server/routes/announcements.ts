import { Router } from 'express';
import { listAnnouncements, createAnnouncement } from '../storage/announcementsStore.js';
import type { Audience, Priority } from '../types/announcements.js';

const r = Router();

function requireAuth(req:any, res:any, next:any){
  if (req.user?.id) return next();
  return res.status(401).json({ ok:false, error:'unauthorized', message:'Login required' });
}

r.get('/', requireAuth, (req,res) => {
  try {
    console.log('ANNOUNCEMENTS_LIST', { userId: req.user?.id, query: req.query });
    const data = listAnnouncements({ audience: (req.query.audience as string) || undefined });
    res.json({ ok:true, data });
  } catch (e:any) {
    console.error('ANNOUNCEMENTS_LIST error', e);
    res.status(500).json({ ok:false, error:'list_failed', message:e?.message || 'Failed to list announcements' });
  }
});

r.post('/', requireAuth, (req,res) => {
  try {
    console.log('ANNOUNCEMENTS_CREATE', { userId: req.user?.id, body: req.body });
    const { title, body, audience='all', priority='normal', publishAt } = req.body ?? {};
    if (!title || !body) return res.status(400).json({ ok:false, error:'validation', message:'title and body are required' });
    const created = createAnnouncement({ title, body, audience:audience as Audience, priority:priority as Priority, publishAt }, req.user.id);
    console.log('ANNOUNCEMENTS_CREATE success', { id: created.id });
    res.status(201).json({ ok:true, data: created });
  } catch (e:any) {
    console.error('ANNOUNCEMENTS_CREATE error', e);
    res.status(500).json({ ok:false, error:'create_failed', message:e?.message || 'Failed to create announcement' });
  }
});

export default r;
