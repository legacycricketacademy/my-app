import { pool, db } from './index';
import { players, sessions, announcements, mealPlans } from '../shared/schema';
import { sql } from 'drizzle-orm';
import { locations, ageGroups } from '../shared/schema';

/**
 * Migration script to add location fields to various tables and update existing data
 */
async function addLocationFields() {
  console.log('Starting location field migration...');

  try {
    // Add new columns with minimal disruption
    await pool.query(`
      -- Add location field to players table if it doesn't exist
      ALTER TABLE IF EXISTS players 
      ADD COLUMN IF NOT EXISTS location text DEFAULT NULL;
      
      -- Update announcements table for location targeting
      ALTER TABLE IF EXISTS announcements 
      ADD COLUMN IF NOT EXISTS target_age_groups text[] DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS target_locations text[] DEFAULT NULL;
      
      -- Migrate data from target_groups to target_age_groups if needed
      UPDATE announcements 
      SET target_age_groups = target_groups 
      WHERE target_age_groups IS NULL AND target_groups IS NOT NULL;
      
      -- Add location field to meal_plans table if it doesn't exist
      ALTER TABLE IF EXISTS meal_plans
      ADD COLUMN IF NOT EXISTS location text DEFAULT NULL;
    `);

    // Validate enum values
    await pool.query(`
      -- Set check constraints for location fields
      ALTER TABLE players 
      ADD CONSTRAINT players_location_check 
      CHECK (location IS NULL OR location IN (${locations.map(l => `'${l}'`).join(', ')}));
      
      ALTER TABLE sessions 
      ADD CONSTRAINT sessions_location_check 
      CHECK (location IN (${locations.map(l => `'${l}'`).join(', ')}));
      
      ALTER TABLE meal_plans 
      ADD CONSTRAINT meal_plans_location_check 
      CHECK (location IS NULL OR location IN (${locations.map(l => `'${l}'`).join(', ')}));

      -- Set check constraints for age_group fields
      ALTER TABLE players 
      ADD CONSTRAINT players_age_group_check 
      CHECK (age_group IN (${ageGroups.map(a => `'${a}'`).join(', ')}));
      
      ALTER TABLE sessions 
      ADD CONSTRAINT sessions_age_group_check 
      CHECK (age_group IN (${ageGroups.map(a => `'${a}'`).join(', ')}));
      
      ALTER TABLE meal_plans 
      ADD CONSTRAINT meal_plans_age_group_check 
      CHECK (age_group IN (${ageGroups.map(a => `'${a}'`).join(', ')}));
    `).catch(err => {
      // Constraints might already exist, which is fine
      console.log('Some constraints may already exist:', err.message);
    });

    // Update existing players with default location based on age group
    await db.execute(sql`
      UPDATE players
      SET 
        location = CASE 
          WHEN age_group = ${ageGroups[0]} THEN ${locations[0]}
          WHEN age_group = ${ageGroups[1]} THEN ${locations[1]}
          ELSE ${locations[0]}
        END,
        age_group = CASE
          WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth)) < 8 THEN ${ageGroups[0]}
          ELSE ${ageGroups[1]}
        END
      WHERE location IS NULL;
    `);

    // Update existing sessions with default location values
    await db.execute(sql`
      UPDATE sessions
      SET 
        location = CASE 
          WHEN age_group = ${ageGroups[0]} THEN ${locations[0]}
          WHEN age_group = ${ageGroups[1]} THEN ${locations[1]}
          ELSE ${locations[0]}
        END
      WHERE location NOT IN (${sql.join(locations.map(l => sql.literal(l)), sql`, `)});
    `);

    // Update existing meal plans with default location values
    await db.execute(sql`
      UPDATE meal_plans
      SET 
        location = CASE 
          WHEN age_group = ${ageGroups[0]} THEN ${locations[0]}
          WHEN age_group = ${ageGroups[1]} THEN ${locations[1]}
          ELSE NULL
        END,
        age_group = CASE
          WHEN age_group NOT IN (${sql.join(ageGroups.map(a => sql.literal(a)), sql`, `)}) 
          THEN ${ageGroups[0]}
          ELSE age_group
        END
      WHERE location IS NULL;
    `);

    // Update existing announcements with default targeting
    await db.execute(sql`
      UPDATE announcements
      SET 
        target_age_groups = ARRAY['5-8 years', '8+ years']::text[],
        target_locations = ARRAY['Strongsville', 'Solon']::text[]
      WHERE target_age_groups IS NULL OR target_locations IS NULL;
    `);

    console.log('Location field migration completed successfully');
  } catch (error) {
    console.error('Error during location field migration:', error);
    throw error;
  }
}

// Run migration
addLocationFields().then(() => {
  console.log('Migration completed');
  process.exit(0);
}).catch(error => {
  console.error('Migration failed:', error);
  process.exit(1);
});