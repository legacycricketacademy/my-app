import { pool } from "../db/index.js";
import bcrypt from "bcryptjs";

async function upsertUser(email: string, role: string, name: string) {
  const hash = await bcrypt.hash("password", 10);
  const normalizedEmail = email.toLowerCase();
  const fullName = name || normalizedEmail.split("@")[0];
  await pool.query(
    `
      INSERT INTO users (email, password_hash, role, full_name)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO UPDATE
        SET password_hash = EXCLUDED.password_hash,
            role = EXCLUDED.role,
            full_name = COALESCE(EXCLUDED.full_name, users.full_name);
    `,
    [normalizedEmail, hash, role, fullName]
  );
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

