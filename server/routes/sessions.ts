import { Router } from 'express';
import { z } from 'zod';
import * as tz from 'date-fns-tz';
import { pool } from '../../db/index.js';
import { requireAuth } from '../middleware/authz.js';

const r = Router();
const dbg = (...args: any[]) => { 
  if (process.env.DEBUG_AUTH === 'true') console.log('[SESSIONS]', ...args); 
};

// Runtime guard: ensure date-fns-tz exports what we need
if (!('fromZonedTime' in tz)) {
  console.error('[TZ] date-fns-tz missing fromZonedTime export. Installed keys:', Object.keys(tz));
  throw new Error('date-fns-tz export not found: fromZonedTime');
}

// Validation schemas
const createSessionSchema = z.object({
  title: z.string().min(3).max(80),
  ageGroup: z.enum(['Under 10s', 'Under 12s', 'Under 14s', 'Under 16s', 'Under 19s', 'Open']),
  location: z.string().min(1),
  // Support both old format (startLocal/endLocal/timezone) and new format (startUtc/endUtc)
  startLocal: z.string().datetime().optional(),
  endLocal: z.string().datetime().optional(),
  timezone: z.string().optional(),
  startUtc: z.string().datetime().optional(),
  endUtc: z.string().datetime().optional(),
  maxAttendees: z.number().min(1).max(200).optional().default(20),
  notes: z.string().optional(),
});

const listSessionsSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  ageGroup: z.enum(['Under 10s', 'Under 12s', 'Under 14s', 'Under 16s', 'Under 19s', 'Open']).optional(),
});

// Helper to convert local time to UTC
function convertToUTC(localTime: string, timezone: string): Date {
  return tz.fromZonedTime(localTime, timezone);
}

// POST /api/sessions - Create a new session
r.post('/', requireAuth, async (req: any, res) => {
  try {
    dbg('SESSIONS_CREATE start', { 
      userId: req.user.id, 
      role: req.user.role,
      payload: req.body 
    });

    // Validate request body
    const validation = createSessionSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        ok: false,
        error: 'validation_failed',
        message: validation.error.errors.map(e => e.message).join(', ')
      });
    }

    const data = validation.data;

    // Determine UTC times from either new format (startUtc/endUtc) or old format (startLocal/endLocal/timezone)
    let startUtc: Date;
    let endUtc: Date;

    if (data.startUtc && data.endUtc) {
      // New format: direct UTC
      startUtc = new Date(data.startUtc);
      endUtc = new Date(data.endUtc);
    } else if (data.startLocal && data.endLocal && data.timezone) {
      // Old format: convert local to UTC
      startUtc = convertToUTC(data.startLocal, data.timezone);
      endUtc = convertToUTC(data.endLocal, data.timezone);
    } else {
      return res.status(400).json({
        ok: false,
        error: 'validation_error',
        message: 'Either provide startUtc+endUtc OR startLocal+endLocal+timezone'
      });
    }

    // Validate business rules
    if (endUtc <= startUtc) {
      return res.status(400).json({
        ok: false,
        error: 'validation_error',
        message: 'End time must be after start time'
      });
    }

    // Check duration (max 8 hours)
    const durationHours = (endUtc.getTime() - startUtc.getTime()) / (1000 * 60 * 60);
    if (durationHours > 8) {
      return res.status(400).json({
        ok: false,
        error: 'validation_error',
        message: 'Session duration cannot exceed 8 hours'
      });
    }

    // Insert session
    const { rows } = await pool.query(`
      INSERT INTO training_sessions (
        title, age_group, location, start_utc, end_utc, 
        max_attendees, notes, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, title, age_group, location, start_utc, end_utc, 
                max_attendees, notes, created_by, created_at, updated_at
    `, [
      data.title,
      data.ageGroup,
      data.location,
      startUtc,
      endUtc,
      data.maxAttendees,
      data.notes || null,
      req.user.id
    ]);

    const session = rows[0];

    dbg('SESSIONS_CREATE ok', { 
      userId: req.user.id, 
      sessionId: session.id 
    });

    res.status(201).json({
      ok: true,
      data: {
        id: session.id,
        title: session.title,
        ageGroup: session.age_group,
        location: session.location,
        startUtc: session.start_utc.toISOString(),
        endUtc: session.end_utc.toISOString(),
        maxAttendees: session.max_attendees,
        notes: session.notes,
        createdBy: session.created_by,
        createdAt: session.created_at.toISOString(),
        updatedAt: session.updated_at.toISOString(),
      }
    });

  } catch (error: any) {
    dbg('SESSIONS_CREATE error', { 
      userId: req.user?.id, 
      error: error.message,
      stack: error.stack 
    });

    res.status(500).json({
      ok: false,
      error: 'create_failed',
      message: error.message || 'Failed to create session'
    });
  }
});

// GET /api/sessions - List sessions
r.get('/', requireAuth, async (req: any, res) => {
  try {
    dbg('SESSIONS_LIST', { 
      userId: req.user.id, 
      role: req.user.role,
      params: req.query 
    });

    // Validate query parameters
    const validation = listSessionsSchema.safeParse(req.query);
    if (!validation.success) {
      return res.status(400).json({
        ok: false,
        error: 'validation_failed',
        message: validation.error.errors.map(e => e.message).join(', ')
      });
    }

    const { from, to, ageGroup } = validation.data;

    // Build query
    let query = `
      SELECT id, title, age_group, location, start_utc, end_utc, 
             max_attendees, notes, created_by, created_at, updated_at
      FROM training_sessions
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 0;

    if (from) {
      paramCount++;
      query += ` AND start_utc >= $${paramCount}`;
      params.push(new Date(from));
    }

    if (to) {
      paramCount++;
      query += ` AND start_utc <= $${paramCount}`;
      params.push(new Date(to));
    }

    if (ageGroup) {
      paramCount++;
      query += ` AND age_group = $${paramCount}`;
      params.push(ageGroup);
    }

    query += ` ORDER BY start_utc ASC`;

    const { rows } = await pool.query(query, params);

    const sessions = rows.map(row => ({
      id: row.id,
      title: row.title,
      ageGroup: row.age_group,
      location: row.location,
      startUtc: row.start_utc.toISOString(),
      endUtc: row.end_utc.toISOString(),
      maxAttendees: row.max_attendees,
      notes: row.notes,
      createdBy: row.created_by,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    }));

    res.json({
      ok: true,
      sessions
    });

  } catch (error: any) {
    dbg('SESSIONS_LIST error', { 
      userId: req.user?.id, 
      error: error.message 
    });

    res.status(500).json({
      ok: false,
      error: 'list_failed',
      message: error.message || 'Failed to fetch sessions'
    });
  }
});

export default r;
