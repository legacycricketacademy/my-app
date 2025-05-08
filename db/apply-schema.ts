import { db } from "./index";
import { sql } from "drizzle-orm";
import * as schema from "../shared/schema";

async function applySchema() {
  try {
    console.log("Creating academies table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS academies (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        address TEXT,
        phone TEXT,
        email TEXT,
        logo_url TEXT,
        primary_color TEXT DEFAULT '#1e40af',
        secondary_color TEXT DEFAULT '#60a5fa',
        stripe_account_id TEXT,
        subscription_tier TEXT NOT NULL DEFAULT 'free',
        max_players INTEGER DEFAULT 200,
        max_coaches INTEGER DEFAULT 10,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    console.log("Adding academyId to users table...");
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS academy_id INTEGER REFERENCES academies(id);
    `);

    console.log("Adding academyId to players table...");
    await db.execute(sql`
      ALTER TABLE players
      ADD COLUMN IF NOT EXISTS academy_id INTEGER REFERENCES academies(id);
    `);

    console.log("Adding academyId to sessions table...");
    await db.execute(sql`
      ALTER TABLE sessions
      ADD COLUMN IF NOT EXISTS academy_id INTEGER REFERENCES academies(id);
    `);

    console.log("Adding academyId to fitness_records table...");
    await db.execute(sql`
      ALTER TABLE fitness_records
      ADD COLUMN IF NOT EXISTS academy_id INTEGER REFERENCES academies(id);
    `);

    console.log("Adding academyId to meal_plans table...");
    await db.execute(sql`
      ALTER TABLE meal_plans
      ADD COLUMN IF NOT EXISTS academy_id INTEGER REFERENCES academies(id);
    `);

    console.log("Adding academyId to announcements table...");
    await db.execute(sql`
      ALTER TABLE announcements
      ADD COLUMN IF NOT EXISTS academy_id INTEGER REFERENCES academies(id);
    `);

    console.log("Adding academyId to payments table...");
    await db.execute(sql`
      ALTER TABLE payments
      ADD COLUMN IF NOT EXISTS academy_id INTEGER REFERENCES academies(id);
    `);

    console.log("Adding academyId to connection_requests table...");
    await db.execute(sql`
      ALTER TABLE connection_requests
      ADD COLUMN IF NOT EXISTS academy_id INTEGER REFERENCES academies(id);
    `);

    console.log("Adding academyId to session_attendances table...");
    await db.execute(sql`
      ALTER TABLE session_attendances
      ADD COLUMN IF NOT EXISTS academy_id INTEGER REFERENCES academies(id);
    `);

    console.log("Schema changes applied successfully");
  } catch (error) {
    console.error("Error applying schema changes:", error);
  }
}

applySchema()
  .then(() => {
    console.log("Schema update complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Schema update failed:", error);
    process.exit(1);
  });