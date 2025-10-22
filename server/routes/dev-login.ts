import { Router } from "express";
import type { Pool } from "pg";
import type { Express } from "express";

export const devLoginRouter = Router();
const ENABLE = String(process.env.ENABLE_DEV_LOGIN || "").toLowerCase() === "true";

// tiny log helper
function logHit(path: string, body: any) {
  try { console.log(`[HIT] ${path}`, JSON.stringify(body)); }
  catch { console.log(`[HIT] ${path}`); }
}

export function registerDevLogin(app: Express, pool: Pool) {
  app.post("/api/dev/login", async (req, res) => {
    logHit("/api/dev/login", req.body);
    if (!ENABLE) return res.status(404).json({ error: "Not found" });

    try {
      const { email, password } = req.body as { email?: string; password?: string };
      if (!email) return res.status(400).json({ error: "email required" });

      // Query the existing users table (from Drizzle schema)
      const { rows } = await pool.query(
        `SELECT id, username, email, role, full_name FROM users WHERE email = $1 LIMIT 1`,
        [email]
      );

      if (rows.length === 0) {
        console.log(`❌ Dev login failed: user not found for ${email}`);
        return res.status(401).json({ error: "User not found" });
      }

      const user = rows[0];
      console.log(`[DEV LOGIN] Found user:`, { id: user.id, email: user.email, role: user.role });

      // Set session
      req.session.userId = user.id;
      req.session.user = user; // Add this line to match _whoami expectation
      (req.session as any).role = user.role;
      
      await new Promise<void>((resolve, reject) =>
        req.session.save(err => (err ? reject(err) : resolve()))
      );

      console.log(`✅ Dev login successful: ${email} (${user.role})`);
      return res.json({ ok: true, user: { id: user.id, email: user.email, role: user.role, fullName: user.full_name } });
    } catch (e: any) {
      console.error("[DEV LOGIN ERROR]", e?.stack || e);
      return res.status(500).json({ error: "dev login failed", details: String(e?.message || e) });
    }
  });
}
