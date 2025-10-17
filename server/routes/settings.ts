import { Router } from 'express';
import { SettingsStore } from '../db/settingsStore';
import { requireAuth, requireAdmin } from '../middleware/authz';
import type {
  ProfileSettings,
  NotificationsSettings,
  PaymentSettings,
  SupportInfo,
  AcademyConfig,
  AccessRolesSettings,
  ParentProfile,
  ParentNotifications,
  ParentPayments
} from '../types/settings';

const r = Router();
const J = (ok: boolean, payload: any) => ok ? { ok: true, data: payload } : payload;
const dbg = (...args: any[]) => { 
  if (process.env.DEBUG_AUTH === 'true') console.log('[SETTINGS]', ...args); 
};

// Initialize settings store - will be injected from main server
let settingsStore: SettingsStore;

export function setSettingsStore(store: SettingsStore) {
  settingsStore = store;
}

// ---------- helpers ----------
async function getOrDefault<T>(key: string, fallback: T): Promise<T> {
  return (await settingsStore.get(key)) ?? fallback;
}

function keyParent(userId: string, leaf: 'profile' | 'notifications' | 'payments') {
  return `parent:${userId}.${leaf}`;
}

// ---------- Public read-only (both roles) ----------
r.get('/support', requireAuth, async (req, res) => {
  try {
    dbg('GET /support', { userId: req.user?.id });
    const data = await getOrDefault<SupportInfo>('academy.support', { 
      supportEmail: 'support@example.com' 
    });
    res.json(J(true, data));
  } catch (e: any) {
    dbg('support get error', e?.message);
    res.status(500).json({ ok: false, error: 'support_get_failed', message: 'Failed to load support' });
  }
});

// ---------- Admin/Coach (academy-scoped) ----------
r.get('/profile', requireAuth, requireAdmin, async (req, res) => {
  try { 
    dbg('GET /profile', { userId: req.user?.id, role: req.user?.role });
    res.json(J(true, await getOrDefault<ProfileSettings>('academy.profile', {}))); 
  }
  catch (e: any) { 
    dbg('profile get error', e?.message);
    res.status(500).json({ ok: false, error: 'profile_get_failed', message: e?.message || 'Failed' }); 
  }
});

r.put('/profile', requireAuth, requireAdmin, async (req, res) => {
  try {
    const body: ProfileSettings = req.body ?? {};
    dbg('PUT /profile', { userId: req.user?.id, body });
    
    if (body.contactEmail && !/^\S+@\S+\.\S+$/.test(body.contactEmail)) {
      return res.status(400).json({ ok: false, error: 'invalid_email', message: 'Invalid contactEmail' });
    }
    const saved = await settingsStore.upsert('academy.profile', body);
    dbg('profile saved', saved);
    res.json(J(true, saved));
  } catch (e: any) { 
    dbg('profile put error', e?.message);
    res.status(500).json({ ok: false, error: 'profile_put_failed', message: e?.message || 'Failed' }); 
  }
});

r.get('/notifications', requireAuth, requireAdmin, async (req, res) => {
  try { 
    dbg('GET /notifications', { userId: req.user?.id });
    res.json(J(true, await getOrDefault<NotificationsSettings>('academy.notifications', {}))); 
  }
  catch (e: any) { 
    dbg('notifications get error', e?.message);
    res.status(500).json({ ok: false, error: 'notifications_get_failed', message: e?.message || 'Failed' }); 
  }
});

r.put('/notifications', requireAuth, requireAdmin, async (req, res) => {
  try {
    const body: NotificationsSettings = req.body ?? {};
    dbg('PUT /notifications', { userId: req.user?.id, body });
    
    if (body.defaultReminderHours != null && (body.defaultReminderHours < 0 || body.defaultReminderHours > 72)) {
      return res.status(400).json({ ok: false, error: 'invalid_reminder_hours', message: '0-72 allowed' });
    }
    const saved = await settingsStore.upsert('academy.notifications', body);
    dbg('notifications saved', saved);
    res.json(J(true, saved));
  } catch (e: any) { 
    dbg('notifications put error', e?.message);
    res.status(500).json({ ok: false, error: 'notifications_put_failed', message: e?.message || 'Failed' }); 
  }
});

r.get('/payments', requireAuth, requireAdmin, async (req, res) => {
  try { 
    dbg('GET /payments', { userId: req.user?.id });
    res.json(J(true, await getOrDefault<PaymentSettings>('academy.payments', { currency: 'INR' }))); 
  }
  catch (e: any) { 
    dbg('payments get error', e?.message);
    res.status(500).json({ ok: false, error: 'payments_get_failed', message: e?.message || 'Failed' }); 
  }
});

r.put('/payments', requireAuth, requireAdmin, async (req, res) => {
  try {
    const b: PaymentSettings = req.body ?? {};
    dbg('PUT /payments', { userId: req.user?.id, body: b });
    
    if (b.dueDays != null && (b.dueDays < 0 || b.dueDays > 60)) {
      return res.status(400).json({ ok: false, error: 'invalid_due_days', message: '0-60 allowed' });
    }
    if (b.invoicePrefix && b.invoicePrefix.length > 10) {
      return res.status(400).json({ ok: false, error: 'invoice_prefix_too_long', message: 'Max 10 chars' });
    }
    const saved = await settingsStore.upsert('academy.payments', b);
    dbg('payments saved', saved);
    res.json(J(true, saved));
  } catch (e: any) { 
    dbg('payments put error', e?.message);
    res.status(500).json({ ok: false, error: 'payments_put_failed', message: e?.message || 'Failed' }); 
  }
});

r.get('/academy', requireAuth, requireAdmin, async (req, res) => {
  try { 
    dbg('GET /academy', { userId: req.user?.id });
    res.json(J(true, await getOrDefault<AcademyConfig>('academy.config', { 
      ageGroups: ['Under 12s', 'Under 14s'] 
    }))); 
  }
  catch (e: any) { 
    dbg('academy get error', e?.message);
    res.status(500).json({ ok: false, error: 'academy_get_failed', message: e?.message || 'Failed' }); 
  }
});

r.put('/academy', requireAuth, requireAdmin, async (req, res) => {
  try {
    const b: AcademyConfig = req.body ?? {};
    dbg('PUT /academy', { userId: req.user?.id, body: b });
    
    if (b.maxPlayersPerSession != null && (b.maxPlayersPerSession < 1 || b.maxPlayersPerSession > 100)) {
      return res.status(400).json({ ok: false, error: 'invalid_max_players', message: '1-100 allowed' });
    }
    const saved = await settingsStore.upsert('academy.config', b);
    dbg('academy saved', saved);
    res.json(J(true, saved));
  } catch (e: any) { 
    dbg('academy put error', e?.message);
    res.status(500).json({ ok: false, error: 'academy_put_failed', message: e?.message || 'Failed' }); 
  }
});

r.get('/access', requireAuth, requireAdmin, async (req, res) => {
  try { 
    dbg('GET /access', { userId: req.user?.id });
    res.json(J(true, await getOrDefault<AccessRolesSettings>('academy.access', { roles: [] }))); 
  }
  catch (e: any) { 
    dbg('access get error', e?.message);
    res.status(500).json({ ok: false, error: 'access_get_failed', message: e?.message || 'Failed' }); 
  }
});

r.put('/access', requireAuth, requireAdmin, async (req, res) => {
  try {
    const b: AccessRolesSettings = req.body ?? { roles: [] };
    dbg('PUT /access', { userId: req.user?.id, body: b });
    
    const saved = await settingsStore.upsert('academy.access', b);
    dbg('access saved', saved);
    res.json(J(true, saved));
  } catch (e: any) { 
    dbg('access put error', e?.message);
    res.status(500).json({ ok: false, error: 'access_put_failed', message: e?.message || 'Failed' }); 
  }
});

// Data management (admin dangerous)
r.post('/data/export', requireAuth, requireAdmin, async (req, res) => {
  try {
    dbg('POST /data/export', { userId: req.user?.id });
    
    // minimal: return current academy settings bundle
    const bundle = {
      profile: await getOrDefault('academy.profile', {}),
      notifications: await getOrDefault('academy.notifications', {}),
      payments: await getOrDefault('academy.payments', {}),
      academy: await getOrDefault('academy.config', {}),
      access: await getOrDefault('academy.access', {}),
    };
    dbg('export bundle', bundle);
    res.json(J(true, { format: 'json', bundle }));
  } catch (e: any) { 
    dbg('export error', e?.message);
    res.status(500).json({ ok: false, error: 'export_failed', message: e?.message || 'Failed' }); 
  }
});

r.post('/data/import', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { bundle } = req.body ?? {};
    dbg('POST /data/import', { userId: req.user?.id, bundle });
    
    if (!bundle || typeof bundle !== 'object') {
      return res.status(400).json({ ok: false, error: 'invalid_bundle', message: 'Provide bundle object' });
    }
    const keys = Object.entries(bundle);
    for (const [k, v] of keys) await settingsStore.upsert(`academy.${k}`, v);
    dbg('import completed', { keys: keys.map(([k]) => k) });
    res.json(J(true, { imported: keys.map(([k]) => k) }));
  } catch (e: any) { 
    dbg('import error', e?.message);
    res.status(500).json({ ok: false, error: 'import_failed', message: e?.message || 'Failed' }); 
  }
});

r.post('/data/purge', requireAuth, requireAdmin, async (req, res) => {
  try {
    dbg('POST /data/purge', { userId: req.user?.id });
    
    // keep it simple: wipe only academy.* keys
    const deleted = await settingsStore.deletePattern('academy.%');
    dbg('purge completed', { deleted });
    res.json(J(true, { deleted }));
  } catch (e: any) { 
    dbg('purge error', e?.message);
    res.status(500).json({ ok: false, error: 'purge_failed', message: e?.message || 'Failed' }); 
  }
});

// ---------- Parent-scoped ----------
r.get('/parent/profile', requireAuth, async (req: any, res) => {
  try { 
    dbg('GET /parent/profile', { userId: req.user.id });
    res.json(J(true, await getOrDefault(`parent:${req.user.id}.profile`, {}))); 
  }
  catch (e: any) { 
    dbg('parent profile get error', e?.message);
    res.status(500).json({ ok: false, error: 'parent_profile_get_failed', message: e?.message || 'Failed' }); 
  }
});

r.put('/parent/profile', requireAuth, async (req: any, res) => {
  try {
    const b: ParentProfile = req.body ?? {};
    dbg('PUT /parent/profile', { userId: req.user.id, body: b });
    
    if (b.email && !/^\S+@\S+\.\S+$/.test(b.email)) {
      return res.status(400).json({ ok: false, error: 'invalid_email', message: 'Invalid email' });
    }
    const saved = await settingsStore.upsert(keyParent(req.user.id, 'profile'), b);
    dbg('parent profile saved', saved);
    res.json(J(true, saved));
  } catch (e: any) { 
    dbg('parent profile put error', e?.message);
    res.status(500).json({ ok: false, error: 'parent_profile_put_failed', message: e?.message || 'Failed' }); 
  }
});

r.get('/parent/notifications', requireAuth, async (req: any, res) => {
  try { 
    dbg('GET /parent/notifications', { userId: req.user.id });
    res.json(J(true, await getOrDefault(keyParent(req.user.id, 'notifications'), {}))); 
  }
  catch (e: any) { 
    dbg('parent notifications get error', e?.message);
    res.status(500).json({ ok: false, error: 'parent_notifications_get_failed', message: e?.message || 'Failed' }); 
  }
});

r.put('/parent/notifications', requireAuth, async (req: any, res) => {
  try {
    const body: ParentNotifications = req.body ?? {};
    dbg('PUT /parent/notifications', { userId: req.user.id, body });
    
    const saved = await settingsStore.upsert(keyParent(req.user.id, 'notifications'), body);
    dbg('parent notifications saved', saved);
    res.json(J(true, saved));
  } catch (e: any) { 
    dbg('parent notifications put error', e?.message);
    res.status(500).json({ ok: false, error: 'parent_notifications_put_failed', message: e?.message || 'Failed' }); 
  }
});

r.get('/parent/payments', requireAuth, async (req: any, res) => {
  try { 
    dbg('GET /parent/payments', { userId: req.user.id });
    res.json(J(true, await getOrDefault(keyParent(req.user.id, 'payments'), {}))); 
  }
  catch (e: any) { 
    dbg('parent payments get error', e?.message);
    res.status(500).json({ ok: false, error: 'parent_payments_get_failed', message: e?.message || 'Failed' }); 
  }
});

r.put('/parent/payments', requireAuth, async (req: any, res) => {
  try {
    const body: ParentPayments = req.body ?? {};
    dbg('PUT /parent/payments', { userId: req.user.id, body });
    
    const saved = await settingsStore.upsert(keyParent(req.user.id, 'payments'), body);
    dbg('parent payments saved', saved);
    res.json(J(true, saved));
  } catch (e: any) { 
    dbg('parent payments put error', e?.message);
    res.status(500).json({ ok: false, error: 'parent_payments_put_failed', message: e?.message || 'Failed' }); 
  }
});

export default r;
