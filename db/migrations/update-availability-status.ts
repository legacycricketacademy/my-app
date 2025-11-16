/**
 * Migration: Update session_availability status enum values
 * Changes status from ["pending", "confirmed", "declined"] to ["yes", "no", "maybe"]
 */

import { pool } from '../index.js';

async function updateAvailabilityStatus() {
  const client = await pool.connect();
  
  try {
    console.log('Starting session_availability status migration...');
    
    // Start transaction
    await client.query('BEGIN');
    
    // Update existing records to new values
    console.log('Updating existing records...');
    await client.query(`
      UPDATE session_availability
      SET status = CASE
        WHEN status = 'confirmed' THEN 'yes'
        WHEN status = 'declined' THEN 'no'
        WHEN status = 'pending' THEN 'maybe'
        ELSE status
      END
    `);
    
    // Drop the old constraint if it exists
    console.log('Dropping old constraint...');
    await client.query(`
      ALTER TABLE session_availability
      DROP CONSTRAINT IF EXISTS session_availability_status_check
    `);
    
    // Add new constraint with updated values
    console.log('Adding new constraint...');
    await client.query(`
      ALTER TABLE session_availability
      ADD CONSTRAINT session_availability_status_check
      CHECK (status IN ('yes', 'no', 'maybe'))
    `);
    
    // Update default value
    console.log('Updating default value...');
    await client.query(`
      ALTER TABLE session_availability
      ALTER COLUMN status SET DEFAULT 'maybe'
    `);
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('✅ Migration completed successfully!');
    
    // Show updated records
    const result = await client.query('SELECT status, COUNT(*) FROM session_availability GROUP BY status');
    console.log('Updated status distribution:', result.rows);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  updateAvailabilityStatus()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

export { updateAvailabilityStatus };
