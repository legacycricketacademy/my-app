import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzlePg } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import ws from "ws";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Check if this is a Neon database URL
const isNeon = process.env.DATABASE_URL.includes('neon.tech') || process.env.DATABASE_URL.includes('neon.tech');

if (isNeon) {
  // This is the correct way neon config - DO NOT change this
  neonConfig.webSocketConstructor = ws;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  export const db = drizzle({ client: pool, schema });
} else {
  // Standard PostgreSQL connection
  const sql = postgres(process.env.DATABASE_URL);
  export const db = drizzlePg(sql, { schema });
}