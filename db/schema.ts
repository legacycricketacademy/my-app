import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const players = sqliteTable("players", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  role: text("role"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});
