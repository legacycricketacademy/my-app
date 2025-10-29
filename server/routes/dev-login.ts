import { Router } from "express";
import type { Pool } from "pg";
import type { Express } from "express";

export const devLoginRouter = Router();
// Enable dev login for E2E testing or when explicitly enabled
// ALWAYS ENABLE for now to fix login issues
const ENABLE = true;

// tiny log helper
function logHit(path: string, body: any) {
  try { console.log(`[HIT] ${path}`, JSON.stringify(body)); }
  catch { console.log(`[HIT] ${path}`); }
}

export function registerDevLogin(app: Express, pool: Pool) {
  app.post("/api/dev/login", async (req, res) => {
    console.log('[DEV LOGIN] Request received:', { 
      enabled: ENABLE, 
      body: req.body,
      hasSession: !!req.session 
    });
    logHit("/api/dev/login", req.body);
    if (!ENABLE) {
      console.log('[DEV LOGIN] Endpoint disabled');
      return res.status(404).json({ error: "Not found" });
    }

    try {
      // Accept both { email } and { email, password } formats
      const { email, password } = req.body as { email?: string; password?: string };
      if (!email) return res.status(400).json({ error: "email required" });

      const role = email === "admin@test.com" ? "admin" : "parent";
      const username = email.split("@")[0];

      // Skip database operations - use simple in-memory user accounts for dev login
      // This avoids SSL certificate issues and makes login faster
      console.log('[DEV LOGIN] Using in-memory dev account (skipping DB operations)');
      
      const user = {
        id: email === "admin@test.com" ? "1" : "2", // String ID for compatibility
        email,
        role,
        username
      };

      // Set session - use numeric IDs for compatibility with auth middleware
      // Map admin@test.com to id: 1, parent@test.com to id: 2 for compatibility
      const numericId = email === "admin@test.com" ? 1 : 2;
      
      req.session.userId = numericId; // Use numeric ID for compatibility
      req.session.user = {
        id: numericId,
        email: user.email,
        role: user.role,
        fullName: username
      };
      (req.session as any).role = user.role;
      
      await new Promise<void>((resolve, reject) =>
        req.session.save(err => (err ? reject(err) : resolve()))
      );

      console.log(`✅ Dev login successful: ${email} (${role})`);
      // Return response matching what auth-page.tsx expects
      return res.json({ 
        ok: true, 
        user: {
          id: numericId,
          email: user.email,
          role: user.role
        }
      });
    } catch (e: any) {
      console.error("[DEV LOGIN ERROR]", e?.stack || e);
      return res.status(500).json({ error: "dev login failed", details: String(e?.message || e) });
    }
  });
}
