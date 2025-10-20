import { Router } from "express";
import { pool } from "../../db/index.js";

export const devLoginRouter = Router();

const ENABLE = String(process.env.ENABLE_DEV_LOGIN || "").toLowerCase() === "true";

devLoginRouter.post("/dev/login", async (req, res) => {
  // Allow dev login if flag is enabled
  if (!ENABLE) {
    console.warn('⚠️ Dev login attempted but ENABLE_DEV_LOGIN is not true');
    return res.status(404).json({ error: "Not found" });
  }

  console.log("[HIT] /api/dev/login", req.body?.email);

  try {
    const { email } = req.body as { email: string };
    if (!email) {
      return res.status(400).json({ error: "email required" });
    }

    // Determine role based on email
    const role = email === "admin@test.com" ? "admin" : "parent";
    const username = email.split("@")[0];

    // Upsert user (create if not exists, update role if exists)
    const result = await pool.query(
      `INSERT INTO users (username, email, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) 
       DO UPDATE SET role = EXCLUDED.role
       RETURNING id, email, role`,
      [username, email, role]
    );

    const user = result.rows[0];

    // Set session data
    req.session.userId = user.id;
    (req.session as any).role = user.role;

    // Save session explicitly
    await new Promise<void>((resolve, reject) =>
      req.session.save(err => (err ? reject(err) : resolve()))
    );

    console.log(`✅ Dev login successful: ${email} (${role})`);

    return res.json({ ok: true, user });
  } catch (e: any) {
    console.error("DEV LOGIN ERROR", e);
    return res.status(500).json({ 
      error: "dev login failed", 
      details: e?.message 
    });
  }
});

