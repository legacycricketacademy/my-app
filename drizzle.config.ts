import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: './shared/schema.ts',  // adjust if schema path differs
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
    ssl: process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : undefined
  }
});
