import { db } from ".";
import { sql } from "drizzle-orm";

/**
 * Migration script to add the payment_method column to the payments table
 */
async function addPaymentMethodColumn() {
  try {
    // Check if the column exists first
    const checkColumnResult = await db.execute(sql.raw(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'payments' AND column_name = 'payment_method'
    `));

    const hasColumn = checkColumnResult.rows && checkColumnResult.rows.length > 0;

    if (!hasColumn) {
      console.log("Adding payment_method column to payments table...");
      
      await db.execute(sql.raw(`
        ALTER TABLE payments 
        ADD COLUMN IF NOT EXISTS payment_method TEXT,
        ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT
      `));
      
      console.log("Successfully added payment_method column!");
    } else {
      console.log("payment_method column already exists in payments table");
    }

    console.log("Migration completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

addPaymentMethodColumn();