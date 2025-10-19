// server/routes/keycloak.ts
import { Router } from 'express';
import { triggerVerifyEmail } from '../lib/keycloak-admin.js';

// Assumes you already have session auth middleware that populates req.user { id, email, email_verified? }
export function keycloakRoutes(createAuthMiddleware: () => any) {
  const r = Router();
  const auth = createAuthMiddleware();

  // POST /api/keycloak/resend-verify
  r.post('/resend-verify', auth, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) return res.status(401).json({ ok: false, error: 'unauthorized' });

      const out = await triggerVerifyEmail(String(userId));
      if (!out.ok) return res.status(out.status ?? 500).json({ ok: false, error: 'resend_failed', message: out.message });
      return res.json({ ok: true });
    } catch (e: any) {
      console.error('[KC] resend-verify error', e);
      return res.status(500).json({ ok: false, error: 'server_error' });
    }
  });

  return r;
}
