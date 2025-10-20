import { Request, Response, NextFunction } from 'express';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Check both req.user (from passport/JWT) and req.session.userId (from session-based auth)
  const isAuthenticated = req.user?.id || req.session?.userId;
  
  if (isAuthenticated) {
    // Ensure req.user is populated for downstream handlers
    if (!req.user && req.session?.userId) {
      req.user = {
        id: req.session.userId,
        role: req.session.role || 'parent'
      };
    }
    return next();
  }
  
  console.log('[requireAuth] Unauthorized - no user or session', {
    hasUser: !!req.user,
    hasSession: !!req.session,
    hasSessionUserId: !!req.session?.userId
  });
  
  return res.status(401).json({ ok: false, error: 'unauthorized', message: 'Auth required' });
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  // Check both req.user.role and req.session.role
  const role = req.user?.role || req.session?.role;
  
  if (role === 'admin') return next();
  
  return res.status(403).json({ ok: false, error: 'forbidden', message: 'Admin only' });
}
