import { Router } from 'express';
import { announcementsStore } from '../storage/announcementsStore.js';

const router = Router();

// GET /api/announcements
router.get('/', async (req, res) => {
  if (!req.user) {
    return res
      .status(401)
      .json({ ok: false, error: 'unauthorized', message: 'Please sign in' });
  }

  try {
    const items = await announcementsStore.list({});
    return res.json({ ok: true, data: Array.isArray(items) ? items : [] });
  } catch (err) {
    console.error('ANNOUNCEMENTS_LIST error:', err);
    return res.status(500).json({ ok: false, error: 'server_error' });
  }
});

// POST /api/announcements
router.post('/', async (req, res) => {
  if (!req.user) {
    return res
      .status(401)
      .json({ ok: false, error: 'unauthorized', message: 'Please sign in' });
  }

  try {
    const created = await announcementsStore.create(req.body, req.user);
    return res.json({ ok: true, data: created });
  } catch (err) {
    console.error('ANNOUNCEMENTS_CREATE error:', err);
    return res.status(500).json({ ok: false, error: 'create_failed' });
  }
});

export default router;