import { db } from "./index";
import { sql } from "drizzle-orm";

/**
 * Migration script to add email status columns to the users table
 */
async function addEmailStatusColumns() {
  try {
    console.log("Adding email_status column to users table...");
    
    // Check if column exists
    const checkResult = await db.execute(sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'email_status'
    `);
    
    // If column does not exist, add it
    if ((checkResult as any).rows.length === 0) {
      console.log("email_status column does not exist, creating it...");
      await db.execute(sql`
        ALTER TABLE users
        ADD COLUMN email_status TEXT DEFAULT 'pending',
        ADD COLUMN email_failure_reason TEXT,
        ADD COLUMN last_email_attempt TIMESTAMP
      `);
      console.log("Columns added successfully.");
    } else {
      console.log("email_status column already exists, skipping migration.");
    }
    
    // We need to ensure the allowed values for the enum are set correctly
    await db.execute(sql`
      ALTER TABLE users
      DROP CONSTRAINT IF EXISTS users_email_status_check;
    `);
    
    await db.execute(sql`
      ALTER TABLE users
      ADD CONSTRAINT users_email_status_check 
      CHECK (email_status::text = ANY (ARRAY['sent'::text, 'failed'::text, 'pending'::text]));
    `);
    
    console.log("Enum constraint updated for email_status.");
    
    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Error in migration:", error);
    throw error;
  }
}

// Run the migration
addEmailStatusColumns()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });