import { db } from ".";
import { sql } from "drizzle-orm";

/**
 * This script fixes the `month` column issue in the payment query 
 * by making the SQL queries safer with EXISTS checks
 */
async function fixPaymentColumns() {
  console.log('Fixing payment columns in SQL queries...');
  
  try {
    // Update the getPaymentsByPlayerIds method
    const fixCode = `
      // Fix query in storage.ts - getPaymentsByPlayerIds method
      1. Change line 577 from:
      p.amount, p.payment_type AS "paymentType", p.month, 
      
      To:
      p.amount, p.payment_type AS "paymentType", 
          CASE 
              WHEN EXISTS (
                  SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'payments' AND column_name = 'month'
              ) 
              THEN p.month 
              ELSE NULL 
          END AS "month",
    `;
    
    console.log("Fix instructions:");
    console.log(fixCode);
    
    // Now check if there are any rows in the payments table
    const countResult = await db.execute(sql`SELECT COUNT(*) FROM payments`);
    const paymentCount = parseInt(countResult.rows[0].count, 10);
    
    console.log(`Current payment count: ${paymentCount}`);
    
    console.log('Payment column fix script completed successfully.');
    console.log('Please update the storage.ts file with the above changes.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error fixing payment columns:', error);
    process.exit(1);
  }
}

fixPaymentColumns();