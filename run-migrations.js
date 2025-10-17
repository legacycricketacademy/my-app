import { pool } from '../db/index.js';
import fs from 'fs';
import path from 'path';

async function runMigration() {
  try {
    console.log('Running training sessions migration...');
    const sql = fs.readFileSync(path.join(process.cwd(), 'server/db/migrations/20251017_create_training_sessions.sql'), 'utf8');
    await pool.query(sql);
    console.log('Training sessions migration completed');
    
    console.log('Running settings migration...');
    const settingsSql = fs.readFileSync(path.join(process.cwd(), 'server/db/migrations/20251017_create_settings.sql'), 'utf8');
    await pool.query(settingsSql);
    console.log('Settings migration completed');
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
