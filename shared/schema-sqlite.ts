import { sqliteTable, text, integer, real, blob } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// User roles
export const userRoles = ["superadmin", "admin", "coach", "parent"] as const;
export type UserRole = (typeof userRoles)[number];

// User statuses for account approval flow
export const userStatuses = ["active", "pending", "rejected", "suspended"] as const;
export type UserStatus = (typeof userStatuses)[number];

// Academies table
export const academies = sqliteTable("academies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color").default("#1e40af"),
  secondaryColor: text("secondary_color").default("#60a5fa"),
  stripeAccountId: text("stripe_account_id"),
  subscriptionTier: text("subscription_tier").notNull().default("free"),
  maxPlayers: integer("max_players").default(200),
  maxCoaches: integer("max_coaches").default(10),
  status: text("status").notNull().default("active"),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

// Users table
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  academyId: integer("academy_id").references(() => academies.id),
  firebaseUid: text("firebase_uid").unique(),
  username: text("username").notNull().unique(),
  password: text("password"),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("parent"),
  status: text("status").default("pending_verification"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  isEmailVerified: integer("is_email_verified", { mode: "boolean" }).default(false),
  emailVerificationToken: text("email_verification_token"),
  emailVerificationExpires: text("email_verification_expires"),
  emailStatus: text("email_status").default("pending"),
  emailFailureReason: text("email_failure_reason"),
  lastEmailAttempt: text("last_email_attempt"),
  phone: text("phone").unique(),
  address: text("address"),
  profileImage: text("profile_image"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  lastSignInAt: text("last_sign_in_at"),
  lastSignInIp: text("last_sign_in_ip"),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

// Players table
export const players = sqliteTable("players", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  parentId: integer("parent_id").references(() => users.id),
  academyId: integer("academy_id").references(() => academies.id),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

// Sessions table
export const sessions = sqliteTable("sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  date: text("date").notNull(),
  time: text("time").notNull(),
  duration: text("duration").notNull(),
  location: text("location").notNull(),
  coachId: integer("coach_id").references(() => users.id),
  academyId: integer("academy_id").references(() => academies.id),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

// Payments table
export const payments = sqliteTable("payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  amount: real("amount").notNull(),
  status: text("status").notNull().default("pending"),
  parentId: integer("parent_id").references(() => users.id),
  sessionId: integer("session_id").references(() => sessions.id),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
  updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

// User Audit Logs table
export const userAuditLogs = sqliteTable("user_audit_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").references(() => users.id).notNull(),
  action: text("action").notNull(),
  details: text("details"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
});

// Relations
export const academiesRelations = relations(academies, ({ many }) => ({
  users: many(users),
  players: many(players),
  sessions: many(sessions),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  academy: one(academies, {
    fields: [users.academyId],
    references: [academies.id],
  }),
  players: many(players),
  sessions: many(sessions),
  payments: many(payments),
}));

export const playersRelations = relations(players, ({ one }) => ({
  parent: one(users, {
    fields: [players.parentId],
    references: [users.id],
  }),
  academy: one(academies, {
    fields: [players.academyId],
    references: [academies.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  coach: one(users, {
    fields: [sessions.coachId],
    references: [users.id],
  }),
  academy: one(academies, {
    fields: [sessions.academyId],
    references: [academies.id],
  }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  parent: one(users, {
    fields: [payments.parentId],
    references: [users.id],
  }),
  session: one(sessions, {
    fields: [payments.sessionId],
    references: [sessions.id],
  }),
}));

// Zod schemas
export const insertAcademySchema = createInsertSchema(academies);
export const selectAcademySchema = createSelectSchema(academies);

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export const insertPlayerSchema = createInsertSchema(players);
export const selectPlayerSchema = createSelectSchema(players);

export const insertSessionSchema = createInsertSchema(sessions);
export const selectSessionSchema = createSelectSchema(sessions);

export const insertPaymentSchema = createInsertSchema(payments);
export const selectPaymentSchema = createSelectSchema(payments);

// Types
export type Academy = typeof academies.$inferSelect;
export type NewAcademy = typeof academies.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
