// server/routes/settings.ts
import { Router } from 'express';
import { ok, fail } from '../utils/ok.js';
import { getSettings, setSettings } from '../storage/settingsStore.js';

function requireAuth(req: any) {
  if (!req.user) throw Object.assign(new Error('Unauthorized'), { status: 401 });
  return req.user as { id: string; role: 'admin'|'coach'|'parent'; email?: string; name?: string };
}

const r = Router();

// Key strategy: parents/coaches store by userId; admin "academy" lives under key 'academy'
function keyFor(u: {id:string,role:string}) { return u.role === 'admin' ? 'academy' : u.id; }

// GET /api/settings/:section
r.get('/:section', (req, res) => {
  try {
    const user = requireAuth(req);
    const doc = getSettings(keyFor(user));
    const section = req.params.section as keyof typeof doc;
    const data = (doc as any)[section] ?? {};
    return res.json(ok(data));
  } catch (e: any) {
    return res.status(e.status ?? 500).json(fail(e.message ?? 'error', 'get_failed', e.status ?? 500));
  }
});

// PUT /api/settings/:section
r.put('/:section', (req, res) => {
  try {
    const user = requireAuth(req);
    const section = req.params.section as string;

    // role gating
    const adminOnly = ['academy','access','data'];
    if (adminOnly.includes(section) && user.role !== 'admin') {
      return res.status(403).json(fail('Forbidden', 'forbidden', 403));
    }
    const patch = { [section]: req.body ?? {} };
    const saved = setSettings(keyFor(user), patch);
    return res.json(ok((saved as any)[section] ?? {}));
  } catch (e: any) {
    return res.status(e.status ?? 500).json(fail(e.message ?? 'error', 'save_failed', e.status ?? 500));
  }
});

export default r;