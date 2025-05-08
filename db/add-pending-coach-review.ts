import { pool } from './index';

async function addPendingCoachReviewColumn() {
  try {
    // Connect to the database
    const client = await pool.connect();
    
    try {
      // Start a transaction
      await client.query('BEGIN');
      
      // Check if the column already exists
      const checkColumnQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'players' AND column_name = 'pending_coach_review';
      `;
      
      const { rows } = await client.query(checkColumnQuery);
      
      if (rows.length === 0) {
        console.log('Adding pending_coach_review column to players table...');
        
        // Add the pending_coach_review column if it doesn't exist
        await client.query(`
          ALTER TABLE players 
          ADD COLUMN pending_coach_review BOOLEAN DEFAULT false;
        `);
        
        console.log('Column added successfully!');
      } else {
        console.log('Column pending_coach_review already exists.');
      }
      
      // Add the health_notes and parent_notes columns if they don't exist
      const checkHealthNotesQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'players' AND column_name = 'health_notes';
      `;
      
      const healthNotesResult = await client.query(checkHealthNotesQuery);
      
      if (healthNotesResult.rows.length === 0) {
        console.log('Adding health_notes column to players table...');
        await client.query(`
          ALTER TABLE players 
          ADD COLUMN health_notes TEXT;
        `);
        console.log('health_notes column added successfully!');
      } else {
        console.log('Column health_notes already exists.');
      }
      
      const checkParentNotesQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'players' AND column_name = 'parent_notes';
      `;
      
      const parentNotesResult = await client.query(checkParentNotesQuery);
      
      if (parentNotesResult.rows.length === 0) {
        console.log('Adding parent_notes column to players table...');
        await client.query(`
          ALTER TABLE players 
          ADD COLUMN parent_notes TEXT;
        `);
        console.log('parent_notes column added successfully!');
      } else {
        console.log('Column parent_notes already exists.');
      }
      
      // Commit the transaction
      await client.query('COMMIT');
      
      console.log('Database update completed successfully.');
    } catch (error) {
      // Rollback in case of error
      await client.query('ROLLBACK');
      console.error('Error updating database schema:', error);
      throw error;
    } finally {
      // Release the client back to the pool
      client.release();
    }
  } catch (error) {
    console.error('Failed to connect to database:', error);
    throw error;
  }
}

// Run the function
addPendingCoachReviewColumn()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });