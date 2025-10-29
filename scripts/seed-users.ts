import { pool } from "../db/index.js";
import bcrypt from "bcryptjs";

async function upsertUser(email: string, role: string, name: string) {
  const hash = await bcrypt.hash("password", 10);
  await pool.query(`
    INSERT INTO users (email, password_hash, role, full_name, is_active, created_at, updated_at)
    VALUES ($1, $2, $3, $4, true, now(), now())
    ON CONFLICT (email) DO UPDATE 
      SET password_hash = EXCLUDED.password_hash,
          role = EXCLUDED.role,
          is_active = true,
          updated_at = now();
  `, [email.toLowerCase(), hash, role, name]);
  console.log(`✅ Upserted user: ${email} (${role})`);
}

(async () => {
  try {
    await upsertUser("admin@test.com", "admin", "Admin");
    await upsertUser("parent@test.com", "parent", "Parent");
    await upsertUser("coach@test.com", "coach", "Coach");
    console.log("✅ Seed complete");
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    await pool.end();
    process.exit(1);
  }
})();

