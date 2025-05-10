import { db } from "./index";
import { users } from "../shared/schema";
import { sql } from "drizzle-orm";

/**
 * Migration script to add Firebase integration fields to the users table
 */
async function addFirebaseIntegration() {
  try {
    console.log("Adding Firebase integration fields to users table...");
    
    // Add firebaseUid column to users table
    await db.execute(sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS firebase_uid VARCHAR(255) UNIQUE,
      ADD COLUMN IF NOT EXISTS last_sign_in_at TIMESTAMP,
      ADD COLUMN IF NOT EXISTS last_sign_in_ip VARCHAR(255),
      ALTER COLUMN password DROP NOT NULL;
    `);
    
    console.log("✅ Firebase integration fields added successfully!");
  } catch (error) {
    console.error("❌ Error adding Firebase integration fields:", error);
    throw error;
  }
}

// Run the migration
addFirebaseIntegration()
  .then(() => {
    console.log("Migration completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });

export { addFirebaseIntegration };