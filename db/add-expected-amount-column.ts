import { db } from './index';
import { pool } from './index';

/**
 * Migration script to add the expected_amount column to the payments table
 */
async function addExpectedAmountColumn() {
  console.log('Adding expected_amount column to payments table...');
  
  try {
    // Check if the column already exists to avoid errors
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'payments' 
      AND column_name = 'expected_amount'
    `;
    
    const result = await pool.query(checkColumnQuery);
    
    if (result.rows.length === 0) {
      // Column doesn't exist, so add it
      const alterTableQuery = `
        ALTER TABLE payments 
        ADD COLUMN expected_amount DECIMAL(10, 2)
      `;
      
      await pool.query(alterTableQuery);
      console.log('Successfully added expected_amount column to payments table');
    } else {
      console.log('expected_amount column already exists, skipping migration');
    }
  } catch (error) {
    console.error('Error adding expected_amount column:', error);
    throw error;
  }
}

// Run the migration
addExpectedAmountColumn()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });