import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");

const dialect =
  url.startsWith("file:") || url.startsWith("sqlite")
    ? "sqlite"
    : "postgresql";

export default defineConfig({
  schema: "./db/**/*.ts",
  out: "./drizzle",
  dialect,
  dbCredentials: { url },
  strict: true,
});
