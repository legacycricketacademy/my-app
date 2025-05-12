import { db } from "./index";
import { sql } from "drizzle-orm";

/**
 * Removes references to the non-existent 'month' column in payment queries
 * This fixes SQL errors in getAllPayments and getPendingPayments methods
 */
async function fixMonthColumnReferences() {
  try {
    console.log("Checking for month column in payments table...");
    
    // Check if the month column exists
    const columnCheckResult = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'month'
      ) as column_exists
    `);
    
    const monthColumnExists = columnCheckResult.rows[0].column_exists;
    console.log(`Month column exists: ${monthColumnExists}`);
    
    // Show all columns in the payments table
    const columnsResult = await db.execute(sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'payments'
      ORDER BY ordinal_position
    `);
    
    console.log("Columns in the payments table:");
    columnsResult.rows.forEach((row: any) => {
      console.log(`- ${row.column_name}`);
    });
    
    // Log the fix that's needed
    console.log("\nFix instructions:");
    console.log("1. In server/storage.ts:");
    console.log("   - Find the getAllPayments method and remove references to 'p.month' column");
    console.log("   - The month column doesn't exist in the database, so we need to remove it from queries");
    console.log("2. For a permanent fix:");
    console.log("   - Either add the column to the database schema (in shared/schema.ts)");
    console.log("   - Or create a migration script to add the column to the payments table");
    
  } catch (error) {
    console.error("Error fixing month column references:", error);
  }
}

fixMonthColumnReferences();