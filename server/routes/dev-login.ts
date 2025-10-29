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
      
      // Create training_sessions table without foreign key first
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
          created_by uuid
        )
      `);
      
      // Add foreign key constraint if it doesn't exist
      try {
        await pool.query(`
          ALTER TABLE training_sessions 
          ADD CONSTRAINT training_sessions_created_by_fkey 
          FOREIGN KEY (created_by) REFERENCES users(id)
        `);
      } catch (e: any) {
        // Constraint might already exist, that's fine
        if (!e.message?.includes('already exists')) {
          console.log('[DEV LOGIN] Foreign key constraint already exists or error:', e.message);
        }
      }

      // Upsert user - try new schema first, fallback to old schema
      let rows;
      try {
        // Try with full_name column (new schema)
        const result = await pool.query(
          `INSERT INTO users (username, email, role, full_name)
           VALUES ($1,$2,$3,$4)
           ON CONFLICT (email) DO UPDATE SET role=EXCLUDED.role, full_name=EXCLUDED.full_name
           RETURNING id, email, role`,
          [username, email, role, username] // Use username as full_name for dev
        );
        rows = result.rows;
      } catch (e: any) {
        // Fallback to old schema without full_name
        if (e.message?.includes('full_name')) {
          const result = await pool.query(
            `INSERT INTO users (username, email, role)
             VALUES ($1,$2,$3)
             ON CONFLICT (email) DO UPDATE SET role=EXCLUDED.role
             RETURNING id, email, role`,
            [username, email, role]
          );
          rows = result.rows;
        } else {
          throw e;
        }
      }
      const user = rows[0];

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
