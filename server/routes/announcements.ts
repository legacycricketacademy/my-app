import { Router } from 'express';
import { z } from 'zod';
import { AnnouncementsStore } from '../storage/announcementsStore.js';
import { requireAuth } from '../middleware/authz.js';
import type { CreateAnnouncementRequest, ListAnnouncementsParams } from '../types/announcements.js';

const r = Router();
const dbg = (...args: any[]) => { 
  if (process.env.DEBUG_AUTH === 'true') console.log('[ANNOUNCEMENTS]', ...args); 
};

// Initialize store
const announcementsStore = new AnnouncementsStore();

// Validation schemas
const createAnnouncementSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  body: z.string().min(1, 'Body is required').max(5000, 'Body too long'),
  audience: z.enum(['all', 'players', 'parents', 'coaches']).optional().default('all'),
  priority: z.enum(['low', 'normal', 'high']).optional().default('normal'),
  publishAt: z.string().datetime().optional(),
});

const listAnnouncementsSchema = z.object({
  audience: z.string().optional(),
});

// GET /api/announcements - List announcements
r.get('/', requireAuth, async (req: any, res) => {
  try {
    dbg('ANNOUNCEMENTS_LIST', { 
      userId: req.user.id, 
      role: req.user.role,
      params: req.query 
    });

    // Validate query parameters
    const validation = listAnnouncementsSchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({
        ok: false,
        error: 'validation_failed',
        message: validation.error.errors.map(e => e.message).join(', ')
      });
    }

    const params: ListAnnouncementsParams = validation.data;
    const announcements = await announcementsStore.list(params);

    dbg('ANNOUNCEMENTS_LIST success', { count: announcements.length });

    res.json({
      ok: true,
      data: announcements
    });

  } catch (error: any) {
    dbg('ANNOUNCEMENTS_LIST error', { 
      userId: req.user?.id, 
      error: error.message,
      stack: error.stack 
    });

    res.status(500).json({
      ok: false,
      error: 'list_failed',
      message: error.message || 'Failed to fetch announcements'
    });
  }
});

// POST /api/announcements - Create announcement
r.post('/', requireAuth, async (req: any, res) => {
  try {
    dbg('ANNOUNCEMENTS_CREATE start', { 
      userId: req.user.id, 
      role: req.user.role,
      payload: req.body 
    });

    // Validate request body
    const validation = createAnnouncementSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        ok: false,
        error: 'validation_failed',
        message: validation.error.errors.map(e => e.message).join(', ')
      });
    }

    const data: CreateAnnouncementRequest = validation.data;

    // Create announcement
    const announcement = await announcementsStore.create(data, req.user.id);

    dbg('ANNOUNCEMENTS_CREATE success', { 
      userId: req.user.id, 
      announcementId: announcement.id 
    });

    res.status(201).json({
      ok: true,
      data: announcement
    });

  } catch (error: any) {
    dbg('ANNOUNCEMENTS_CREATE error', { 
      userId: req.user?.id, 
      error: error.message,
      stack: error.stack 
    });

    res.status(500).json({
      ok: false,
      error: 'create_failed',
      message: error.message || 'Failed to create announcement'
    });
  }
});

export default r;
