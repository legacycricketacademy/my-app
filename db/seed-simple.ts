import { pool } from "./index.js";

async function seed() {
  try {
    console.log("Starting simple database seeding...");
    
    // Create users table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        role TEXT NOT NULL DEFAULT 'parent',
        full_name TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    console.log("✅ Users table created/verified");
    
    // Just ensure admin user exists with simple schema
    const result = await pool.query(`
      INSERT INTO users (username, email, role, full_name)
      VALUES ('admin', 'admin@test.com', 'admin', 'Admin User')
      ON CONFLICT (email) DO NOTHING
      RETURNING id, username, email, role
    `);
    
    if (result.rows.length > 0) {
      console.log("✅ Admin user created:", result.rows[0]);
    } else {
      console.log("✅ Admin user already exists");
    }
    
    console.log("✅ Database seeding complete");
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Error seeding database:", error.message);
    process.exit(1);
  }
}

seed();

