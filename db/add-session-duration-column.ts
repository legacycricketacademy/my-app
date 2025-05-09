import { db } from './index';
import { pool } from './index';

/**
 * Migration script to add the session_duration column to the payments table
 */
async function addSessionDurationColumn() {
  console.log('Adding session_duration column to payments table...');
  
  try {
    // Check if the column already exists to avoid errors
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'payments' 
      AND column_name = 'session_duration'
    `;
    
    const result = await pool.query(checkColumnQuery);
    
    if (result.rows.length === 0) {
      // Column doesn't exist, so add it
      const alterTableQuery = `
        ALTER TABLE payments 
        ADD COLUMN session_duration TEXT CHECK (session_duration IN ('60min', '90min'))
      `;
      
      await pool.query(alterTableQuery);
      console.log('Successfully added session_duration column to payments table');
    } else {
      console.log('session_duration column already exists, skipping migration');
    }
  } catch (error) {
    console.error('Error adding session_duration column:', error);
    throw error;
  }
}

// Run the migration
addSessionDurationColumn()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });