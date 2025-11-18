import { pool } from '../index';

async function addSessionAvailability() {
  console.log("Creating session_availability table...");
  
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS session_availability (
        id SERIAL PRIMARY KEY,
        session_id INTEGER NOT NULL REFERENCES sessions(id),
        player_id INTEGER NOT NULL REFERENCES players(id),
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'declined')),
        responded_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        UNIQUE(session_id, player_id)
      )
    `);
    
    console.log("✅ session_availability table created successfully");
  } catch (error) {
    console.error("Error creating session_availability table:", error);
    throw error;
  }
}

addSessionAvailability()
  .then(() => {
    console.log("Migration completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
