import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

const { DATABASE_URL, NODE_ENV } = process.env;
if (!DATABASE_URL) throw new Error('DATABASE_URL must be set');

export const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export const db = drizzle(pool, { schema });

export async function dbHealth() {
  const client = await pool.connect();
  try { 
    await client.query('select 1'); 
    return { ok: true }; 
  }
  finally { 
    client.release(); 
  }
}