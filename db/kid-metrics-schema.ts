import { pgTable, text, serial, integer, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";
import { players, users, academies } from "../shared/schema.js";

// Batting Metrics (1-5 scale)
export const battingMetrics = pgTable("batting_metrics", {
  id: serial("id").primaryKey(),
  academyId: integer("academy_id").references(() => academies.id),
  playerId: integer("player_id").references(() => players.id).notNull(),
  recordDate: date("record_date").notNull(),
  footwork: integer("footwork"), // 1-5
  shotSelection: integer("shot_selection"), // 1-5
  batSwingPath: integer("bat_swing_path"), // 1-5
  balancePosture: integer("balance_posture"), // 1-5
  coachId: integer("coach_id").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Bowling Metrics (1-5 scale)
export const bowlingMetrics = pgTable("bowling_metrics", {
  id: serial("id").primaryKey(),
  academyId: integer("academy_id").references(() => academies.id),
  playerId: integer("player_id").references(() => players.id).notNull(),
  recordDate: date("record_date").notNull(),
  runUpRhythm: integer("run_up_rhythm"), // 1-5
  loadGather: integer("load_gather"), // 1-5
  releaseConsistency: integer("release_consistency"), // 1-5
  lineLength: integer("line_length"), // 1-5
  coachId: integer("coach_id").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Fielding Metrics (1-5 scale)
export const fieldingMetrics = pgTable("fielding_metrics", {
  id: serial("id").primaryKey(),
  academyId: integer("academy_id").references(() => academies.id),
  playerId: integer("player_id").references(() => players.id).notNull(),
  recordDate: date("record_date").notNull(),
  throwingAccuracy: integer("throwing_accuracy"), // 1-5
  catching: integer("catching"), // 1-5
  groundFielding: integer("ground_fielding"), // 1-5
  coachId: integer("coach_id").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Discipline/Behaviour Metrics (1-5 scale)
export const disciplineMetrics = pgTable("discipline_metrics", {
  id: serial("id").primaryKey(),
  academyId: integer("academy_id").references(() => academies.id),
  playerId: integer("player_id").references(() => players.id).notNull(),
  recordDate: date("record_date").notNull(),
  focus: integer("focus"), // 1-5
  teamwork: integer("teamwork"), // 1-5
  coachability: integer("coachability"), // 1-5
  coachId: integer("coach_id").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Coach Notes
export const coachNotes = pgTable("coach_notes", {
  id: serial("id").primaryKey(),
  academyId: integer("academy_id").references(() => academies.id),
  playerId: integer("player_id").references(() => players.id).notNull(),
  coachId: integer("coach_id").references(() => users.id).notNull(),
  sessionId: integer("session_id"), // Optional: link to specific session
  noteDate: date("note_date").notNull(),
  content: text("content").notNull(),
  category: text("category"), // general, batting, bowling, fielding, fitness, discipline
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const battingMetricsRelations = relations(battingMetrics, ({ one }) => ({
  player: one(players, { fields: [battingMetrics.playerId], references: [players.id] }),
  coach: one(users, { fields: [battingMetrics.coachId], references: [users.id] }),
  academy: one(academies, { fields: [battingMetrics.academyId], references: [academies.id] }),
}));

export const bowlingMetricsRelations = relations(bowlingMetrics, ({ one }) => ({
  player: one(players, { fields: [bowlingMetrics.playerId], references: [players.id] }),
  coach: one(users, { fields: [bowlingMetrics.coachId], references: [users.id] }),
  academy: one(academies, { fields: [bowlingMetrics.academyId], references: [academies.id] }),
}));

export const fieldingMetricsRelations = relations(fieldingMetrics, ({ one }) => ({
  player: one(players, { fields: [fieldingMetrics.playerId], references: [players.id] }),
  coach: one(users, { fields: [fieldingMetrics.coachId], references: [users.id] }),
  academy: one(academies, { fields: [fieldingMetrics.academyId], references: [academies.id] }),
}));

export const disciplineMetricsRelations = relations(disciplineMetrics, ({ one }) => ({
  player: one(players, { fields: [disciplineMetrics.playerId], references: [players.id] }),
  coach: one(users, { fields: [disciplineMetrics.coachId], references: [users.id] }),
  academy: one(academies, { fields: [disciplineMetrics.academyId], references: [academies.id] }),
}));

export const coachNotesRelations = relations(coachNotes, ({ one }) => ({
  player: one(players, { fields: [coachNotes.playerId], references: [players.id] }),
  coach: one(users, { fields: [coachNotes.coachId], references: [users.id] }),
  academy: one(academies, { fields: [coachNotes.academyId], references: [academies.id] }),
}));

// Zod Schemas
export const insertBattingMetricsSchema = createInsertSchema(battingMetrics);
export const insertBowlingMetricsSchema = createInsertSchema(bowlingMetrics);
export const insertFieldingMetricsSchema = createInsertSchema(fieldingMetrics);
export const insertDisciplineMetricsSchema = createInsertSchema(disciplineMetrics);
export const insertCoachNotesSchema = createInsertSchema(coachNotes);

export const battingMetricsSchema = createSelectSchema(battingMetrics);
export const bowlingMetricsSchema = createSelectSchema(bowlingMetrics);
export const fieldingMetricsSchema = createSelectSchema(fieldingMetrics);
export const disciplineMetricsSchema = createSelectSchema(disciplineMetrics);
export const coachNotesSchema = createSelectSchema(coachNotes);

// Types
export type InsertBattingMetrics = z.infer<typeof insertBattingMetricsSchema>;
export type BattingMetrics = z.infer<typeof battingMetricsSchema>;

export type InsertBowlingMetrics = z.infer<typeof insertBowlingMetricsSchema>;
export type BowlingMetrics = z.infer<typeof bowlingMetricsSchema>;

export type InsertFieldingMetrics = z.infer<typeof insertFieldingMetricsSchema>;
export type FieldingMetrics = z.infer<typeof fieldingMetricsSchema>;

export type InsertDisciplineMetrics = z.infer<typeof insertDisciplineMetricsSchema>;
export type DisciplineMetrics = z.infer<typeof disciplineMetricsSchema>;

export type InsertCoachNotes = z.infer<typeof insertCoachNotesSchema>;
export type CoachNotes = z.infer<typeof coachNotesSchema>;
