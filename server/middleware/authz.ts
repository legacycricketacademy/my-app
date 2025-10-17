import { Request, Response, NextFunction } from 'express';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.user?.id) return next();
  return res.status(401).json({ ok: false, error: 'unauthorized', message: 'Auth required' });
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role === 'admin') return next();
  return res.status(403).json({ ok: false, error: 'forbidden', message: 'Admin only' });
}
