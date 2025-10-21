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
      const { email } = req.body as { email?: string };
      if (!email) return res.status(400).json({ error: "email required" });

      const role = email === "admin@test.com" ? "admin" : "parent";
      const username = email.split("@")[0];

      // Ensure tables exist (no-op if already there)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          username text UNIQUE,
          email text UNIQUE NOT NULL,
          password_hash text,
          role text NOT NULL DEFAULT 'parent',
          created_at timestamptz DEFAULT now()
        )
      `);
      
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "session" (
          "sid" varchar NOT NULL,
          "sess" json NOT NULL,
          "expire" timestamp(6) NOT NULL,
          CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
        )
      `);
      
      await pool.query(`
        CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire")
      `);
      
      // Drop old training_sessions table if it has wrong columns
      try {
        const tableCheck = await pool.query(`
          SELECT column_name FROM information_schema.columns 
          WHERE table_name = 'training_sessions' AND column_name = 'start_time'
        `);
        if (tableCheck.rows.length > 0) {
          console.log('[DEV LOGIN] Dropping old training_sessions table with wrong column names');
          await pool.query(`DROP TABLE IF EXISTS training_sessions CASCADE`);
        }
      } catch (e) {
        // Table doesn't exist, that's fine
      }
      
      await pool.query(`
        CREATE TABLE IF NOT EXISTS training_sessions (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          title text NOT NULL,
          age_group text NOT NULL,
          location text NOT NULL,
          start_utc timestamptz NOT NULL,
          end_utc timestamptz NOT NULL,
          max_attendees integer DEFAULT 20,
          notes text,
          created_at timestamptz DEFAULT now(),
          updated_at timestamptz DEFAULT now(),
          created_by uuid REFERENCES users(id)
        )
      `);

      // Upsert user
      const { rows } = await pool.query(
        `INSERT INTO users (username, email, role)
         VALUES ($1,$2,$3)
         ON CONFLICT (email) DO UPDATE SET role=EXCLUDED.role
         RETURNING id, email, role`,
        [username, email, role]
      );
      const user = rows[0];

      // Set session
      req.session.userId = user.id;
      (req.session as any).role = user.role;
      await new Promise<void>((resolve, reject) =>
        req.session.save(err => (err ? reject(err) : resolve()))
      );

      console.log(`✅ Dev login successful: ${email} (${role})`);
      return res.json({ ok: true, user });
    } catch (e: any) {
      console.error("[DEV LOGIN ERROR]", e?.stack || e);
      return res.status(500).json({ error: "dev login failed", details: String(e?.message || e) });
    }
  });
}
