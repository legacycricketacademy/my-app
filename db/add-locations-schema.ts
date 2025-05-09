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

    console.log('Added new columns successfully');

    // First, update players with default locations based on age group
    await pool.query(`
      UPDATE players
      SET 
        location = CASE 
          WHEN age_group LIKE '%5-8%' OR age_group LIKE '%Under 8%' THEN '${locations[0]}'
          WHEN age_group LIKE '%8+%' OR age_group LIKE '%8 and above%' THEN '${locations[1]}'
          ELSE '${locations[0]}'
        END
      WHERE location IS NULL;
    `);

    console.log('Updated player locations successfully');
    
    // Update player age groups to match the new enum values if needed
    await pool.query(`
      UPDATE players
      SET age_group = CASE
        WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth)) < 8 THEN '${ageGroups[0]}'
        ELSE '${ageGroups[1]}'
      END
      WHERE age_group NOT IN ('${ageGroups[0]}', '${ageGroups[1]}');
    `);

    console.log('Updated player age groups successfully');

    // Update sessions with default location values based on age group 
    await pool.query(`
      UPDATE sessions
      SET 
        location = CASE 
          WHEN age_group LIKE '%5-8%' OR age_group LIKE '%Under 8%' THEN '${locations[0]}'
          WHEN age_group LIKE '%8+%' OR age_group LIKE '%8 and above%' THEN '${locations[1]}'
          ELSE '${locations[0]}'
        END
      WHERE location NOT IN ('${locations[0]}', '${locations[1]}');
    `);

    console.log('Updated session locations successfully');
    
    // Update session age groups to match the new enum values
    await pool.query(`
      UPDATE sessions
      SET age_group = CASE
        WHEN age_group LIKE '%Under 8%' OR age_group LIKE '%5-8%' THEN '${ageGroups[0]}'
        WHEN age_group LIKE '%8+%' OR age_group LIKE '%8 and above%' THEN '${ageGroups[1]}'
        ELSE '${ageGroups[0]}'
      END
      WHERE age_group NOT IN ('${ageGroups[0]}', '${ageGroups[1]}');
    `);

    console.log('Updated session age groups successfully');

    // Update meal plans with default location values based on age group
    await pool.query(`
      UPDATE meal_plans
      SET 
        location = CASE 
          WHEN age_group LIKE '%5-8%' OR age_group LIKE '%Under 8%' THEN '${locations[0]}'
          WHEN age_group LIKE '%8+%' OR age_group LIKE '%8 and above%' THEN '${locations[1]}'
          ELSE '${locations[0]}'
        END
      WHERE location IS NULL;
    `);

    console.log('Updated meal plan locations successfully');
    
    // Update meal plan age groups to match the new enum values
    await pool.query(`
      UPDATE meal_plans
      SET age_group = CASE
        WHEN age_group LIKE '%Under 8%' OR age_group LIKE '%5-8%' THEN '${ageGroups[0]}'
        WHEN age_group LIKE '%8+%' OR age_group LIKE '%8 and above%' THEN '${ageGroups[1]}'
        ELSE '${ageGroups[0]}'
      END
      WHERE age_group NOT IN ('${ageGroups[0]}', '${ageGroups[1]}');
    `);

    console.log('Updated meal plan age groups successfully');

    // Update existing announcements with default targeting
    await pool.query(`
      UPDATE announcements
      SET 
        target_age_groups = ARRAY['${ageGroups[0]}', '${ageGroups[1]}']::text[],
        target_locations = ARRAY['${locations[0]}', '${locations[1]}']::text[]
      WHERE target_age_groups IS NULL OR target_locations IS NULL;
    `);

    console.log('Updated announcement targeting successfully');

    // Validate enum values with careful check constraint additions
    try {
      await pool.query(`
        -- Set check constraints for location and age_group fields
        DO $$
        BEGIN
          BEGIN
            ALTER TABLE players ADD CONSTRAINT players_location_check 
            CHECK (location IS NULL OR location IN ('${locations[0]}', '${locations[1]}'));
          EXCEPTION
            WHEN duplicate_object THEN NULL;
          END;
          
          BEGIN
            ALTER TABLE sessions ADD CONSTRAINT sessions_location_check 
            CHECK (location IN ('${locations[0]}', '${locations[1]}'));
          EXCEPTION
            WHEN duplicate_object THEN NULL;
          END;
          
          BEGIN
            ALTER TABLE meal_plans ADD CONSTRAINT meal_plans_location_check 
            CHECK (location IS NULL OR location IN ('${locations[0]}', '${locations[1]}'));
          EXCEPTION
            WHEN duplicate_object THEN NULL;
          END;
          
          BEGIN
            ALTER TABLE players ADD CONSTRAINT players_age_group_check 
            CHECK (age_group IN ('${ageGroups[0]}', '${ageGroups[1]}'));
          EXCEPTION
            WHEN duplicate_object THEN NULL;
          END;
          
          BEGIN
            ALTER TABLE sessions ADD CONSTRAINT sessions_age_group_check 
            CHECK (age_group IN ('${ageGroups[0]}', '${ageGroups[1]}'));
          EXCEPTION
            WHEN duplicate_object THEN NULL;
          END;
          
          BEGIN
            ALTER TABLE meal_plans ADD CONSTRAINT meal_plans_age_group_check 
            CHECK (age_group IN ('${ageGroups[0]}', '${ageGroups[1]}'));
          EXCEPTION
            WHEN duplicate_object THEN NULL;
          END;
        END
        $$;
      `);
      console.log('Added constraints successfully');
    } catch (err) {
      console.log('Some constraints may already exist or data may not conform to constraints yet');
    }

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