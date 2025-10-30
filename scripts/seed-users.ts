// scripts/seed-users.ts
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // ✅ this is the key part for Render Postgres
  ssl: process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : false,
});

async function upsertUser(
  email: string,
  role: string,
  fullName: string = ""
) {
  const passwordHash = await bcrypt.hash("password", 10);

  await pool.query(
    `
    INSERT INTO users (email, password_hash, role, full_name)
    VALUES ($1, $2, $3, NULLIF($4, ''))
    ON CONFLICT (email) DO UPDATE
      SET password_hash = EXCLUDED.password_hash,
          role = EXCLUDED.role,
          full_name = COALESCE(EXCLUDED.full_name, users.full_name);
    `,
    [email.toLowerCase(), passwordHash, role, fullName]
  );
}

(async () => {
  try {
    await upsertUser("admin@test.com", "admin", "Admin User");
    await upsertUser("parent@test.com", "parent", "Parent User");
    await upsertUser("coach@test.com", "coach", "Coach User");
    console.log("✅ Seeded users");
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();

