import { db } from "./index";
import { academies } from "../shared/schema";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm/sql";

/**
 * Migration script to add academyId columns to existing tables
 * This makes the transition to multi-tenancy smoother
 */
async function addAcademyIdsToTables() {
  try {
    console.log("Starting multi-tenancy migration...");
    
    // Check if default academy already exists
    const existingAcademy = await db.query.academies.findFirst({
      where: eq(academies.name, "Legacy Cricket Academy")
    });
    
    let academyId: number;
    
    if (existingAcademy) {
      console.log("Default academy already exists with ID:", existingAcademy.id);
      academyId = existingAcademy.id;
    } else {
      // Create the default academy if it doesn't exist
      console.log("Creating default academy...");
      const [newAcademy] = await db.insert(academies).values({
        name: "Legacy Cricket Academy",
        slug: "legacy-cricket-academy",
        description: "The main cricket academy for player development",
        address: "123 Cricket Lane, Sports City",
        phone: "+1234567890",
        email: "info@legacycricket.com",
        logoUrl: "/assets/logo.png",
        primaryColor: "#1e40af", // Blue
        secondaryColor: "#60a5fa", // Light blue
        stripeAccountId: null, // Will be set up later
        subscriptionTier: "pro",
        maxPlayers: 200,
        maxCoaches: 10,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      
      academyId = newAcademy.id;
      console.log("Created default academy with ID:", academyId);
    }
    
    // Add academyId to each table using raw SQL for safety
    // This allows us to add nullable columns first, then set default values

    // Add academyId to users table
    console.log("Adding academyId to users table...");
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS academy_id INTEGER REFERENCES academies(id)`);
    await db.execute(sql`UPDATE users SET academy_id = ${academyId} WHERE academy_id IS NULL`);
    
    // Add academyId to players table
    console.log("Adding academyId to players table...");
    await db.execute(sql`ALTER TABLE players ADD COLUMN IF NOT EXISTS academy_id INTEGER REFERENCES academies(id)`);
    await db.execute(sql`UPDATE players SET academy_id = ${academyId} WHERE academy_id IS NULL`);
    
    // Add academyId to sessions table
    console.log("Adding academyId to sessions table...");
    await db.execute(sql`ALTER TABLE sessions ADD COLUMN IF NOT EXISTS academy_id INTEGER REFERENCES academies(id)`);
    await db.execute(sql`UPDATE sessions SET academy_id = ${academyId} WHERE academy_id IS NULL`);
    
    // Add academyId to fitness_records table
    console.log("Adding academyId to fitness_records table...");
    await db.execute(sql`ALTER TABLE fitness_records ADD COLUMN IF NOT EXISTS academy_id INTEGER REFERENCES academies(id)`);
    await db.execute(sql`UPDATE fitness_records SET academy_id = ${academyId} WHERE academy_id IS NULL`);
    
    // Add academyId to meal_plans table
    console.log("Adding academyId to meal_plans table...");
    await db.execute(sql`ALTER TABLE meal_plans ADD COLUMN IF NOT EXISTS academy_id INTEGER REFERENCES academies(id)`);
    await db.execute(sql`UPDATE meal_plans SET academy_id = ${academyId} WHERE academy_id IS NULL`);
    
    // Add academyId to announcements table
    console.log("Adding academyId to announcements table...");
    await db.execute(sql`ALTER TABLE announcements ADD COLUMN IF NOT EXISTS academy_id INTEGER REFERENCES academies(id)`);
    await db.execute(sql`UPDATE announcements SET academy_id = ${academyId} WHERE academy_id IS NULL`);
    
    // Add academyId to payments table
    console.log("Adding academyId to payments table...");
    await db.execute(sql`ALTER TABLE payments ADD COLUMN IF NOT EXISTS academy_id INTEGER REFERENCES academies(id)`);
    await db.execute(sql`UPDATE payments SET academy_id = ${academyId} WHERE academy_id IS NULL`);
    
    // Add academyId to connection_requests table
    console.log("Adding academyId to connection_requests table...");
    await db.execute(sql`ALTER TABLE connection_requests ADD COLUMN IF NOT EXISTS academy_id INTEGER REFERENCES academies(id)`);
    await db.execute(sql`UPDATE connection_requests SET academy_id = ${academyId} WHERE academy_id IS NULL`);
    
    console.log("Multi-tenancy migration completed successfully");
  } catch (error) {
    console.error("Error during multi-tenancy migration:", error);
    throw error;
  }
}

// Run the migration script
addAcademyIdsToTables()
  .then(() => {
    console.log("Migration completed, exiting...");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });