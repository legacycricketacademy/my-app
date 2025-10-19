// server/routes/keycloak.ts
import { Router } from 'express';
import { sendVerificationEmail } from '../lib/keycloak-admin.js';

const router = Router();

// POST /api/keycloak/resend-verify
router.post('/resend-verify', async (req: any, res) => {
  // Require authentication
  if (!req.user?.id) {
    return res.status(401).json({ 
      ok: false, 
      error: 'unauthorized', 
      message: 'Authentication required' 
    });
  }

  console.log('[keycloak-resend] Resending verification email for user:', req.user.id);

  const result = await sendVerificationEmail(req.user.id);
  
  if (result.ok) {
    return res.json({ ok: true, message: 'Verification email sent' });
  } else {
    return res.status(500).json(result);
  }
});

export default router;
