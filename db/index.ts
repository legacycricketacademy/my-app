import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "../shared/schema.js";
import 'dotenv/config';

const DATABASE_URL = process.env.DATABASE_URL || `postgresql://sandbox:@localhost:5432/cricket_academy`;

console.log('Using database URL:', DATABASE_URL.replace(/:[^:@]+@/, ':***@'));

// Create the connection
const sql = postgres(DATABASE_URL);
export const db = drizzle(sql, { schema });
