import type { Request, Response } from "express";

export function isTestAuth() { 
  return process.env.AUTH_MODE === "stub"; 
}

export function testLogin(req: Request, res: Response) {
  if (!isTestAuth()) {
    return res.status(400).json({ ok: false, error: "Not in test mode" });
  }
  
  const { role } = (req.body ?? {}) as { role: "admin" | "parent" | "coach" };
  
  if (!role) {
    return res.status(400).json({ ok: false, error: "role required" });
  }
  
  const user = { 
    id: 9999, 
    email: role === "admin" ? process.env.TEST_ADMIN_EMAIL : process.env.TEST_PARENT_EMAIL, 
    name: role.toUpperCase(), 
    role, 
    roles: [role] 
  };
  
  // @ts-ignore - Session typing
  req.session.user = user; 
  req.session.userId = user.id; 
  req.session.userRole = role;
  
  return res.json({ ok: true, user });
}

export function testLogout(req: Request, res: Response) {
  if (!isTestAuth()) {
    return res.status(400).json({ ok: false, error: "Not in test mode" });
  }
  
  req.session.destroy(() => res.json({ ok: true }));
}

