import { defineConfig } from "drizzle-kit";

function pickDialect(url?: string) {
  if (!url) throw new Error("DATABASE_URL is required");
  return /^postgres(ql)?:\/\//i.test(url) ? "postgresql" : "sqlite";
}

export default defineConfig({
  schema: "./db/**/*.ts",   // ← look for any TS schema in db/
  out: "./drizzle",
  dialect: pickDialect(process.env.DATABASE_URL),
  dbCredentials: { url: process.env.DATABASE_URL! },
  strict: true,
});
