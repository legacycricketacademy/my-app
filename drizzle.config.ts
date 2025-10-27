import 'dotenv/config';
import type { Config } from 'drizzle-kit';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

// Add SSL mode to DATABASE_URL if in production
const dbUrl = process.env.DATABASE_URL;
const urlWithSsl = process.env.NODE_ENV === 'production' && !dbUrl.includes('ssl=')
  ? `${dbUrl}${dbUrl.includes('?') ? '&' : '?'}ssl=true`
  : dbUrl;

export default {
  schema: ['./shared/schema.ts'],
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { 
    url: urlWithSsl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  },
  verbose: true,
  strict: true,
} satisfies Config;
