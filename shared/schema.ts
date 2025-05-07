import { pgTable, text, serial, integer, boolean, timestamp, decimal, primaryKey, date } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// User roles
export const userRoles = ["admin", "coach", "parent"] as const;
export type UserRole = (typeof userRoles)[number];

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: text("role", { enum: userRoles }).notNull().default("parent"),
  status: text("status").default("pending_verification"),  // active, pending_verification, pending_approval, inactive
  isActive: boolean("is_active").default(true),
  isEmailVerified: boolean("is_email_verified").default(false),
  emailVerificationToken: text("email_verification_token"),
  emailVerificationExpires: timestamp("email_verification_expires"),
  phone: text("phone").unique(),
  address: text("address"),
  profileImage: text("profile_image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Players table
export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: date("date_of_birth").notNull(),
  ageGroup: text("age_group").notNull(),
  playerType: text("player_type"),
  parentId: integer("parent_id").references(() => users.id).notNull(),
  emergencyContact: text("emergency_contact"),
  medicalInformation: text("medical_information"),
  profileImage: text("profile_image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Sessions table
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  sessionType: text("session_type").notNull(),
  ageGroup: text("age_group").notNull(),
  location: text("location").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  coachId: integer("coach_id").references(() => users.id).notNull(),
  maxPlayers: integer("max_players"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Session Attendances
export const sessionAttendances = pgTable("session_attendances", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => sessions.id).notNull(),
  playerId: integer("player_id").references(() => players.id).notNull(),
  attended: boolean("attended").default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Fitness Records
export const fitnessRecords = pgTable("fitness_records", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").references(() => players.id).notNull(),
  recordDate: date("record_date").notNull(),
  runningSpeed: decimal("running_speed", { precision: 5, scale: 2 }),
  endurance: decimal("endurance", { precision: 5, scale: 2 }),
  strength: decimal("strength", { precision: 5, scale: 2 }),
  agility: decimal("agility", { precision: 5, scale: 2 }),
  flexibility: decimal("flexibility", { precision: 5, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Meal Plans
export const mealPlans = pgTable("meal_plans", {
  id: serial("id").primaryKey(),
  ageGroup: text("age_group").notNull(),
  title: text("title").notNull(),
  weekStartDate: date("week_start_date").notNull(),
  weekEndDate: date("week_end_date").notNull(),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Meal Items
export const mealItems = pgTable("meal_items", {
  id: serial("id").primaryKey(),
  mealPlanId: integer("meal_plan_id").references(() => mealPlans.id).notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0 = Sunday, 1 = Monday, etc.
  mealType: text("meal_type").notNull(), // breakfast, lunch, dinner, snack
  items: text("items").array().notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Announcements
export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  targetGroups: text("target_groups").array(), // array of age groups or 'all'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Announcement Views (to track if parents have viewed announcements)
export const announcementViews = pgTable("announcement_views", {
  id: serial("id").primaryKey(),
  announcementId: integer("announcement_id").references(() => announcements.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  viewedAt: timestamp("viewed_at").defaultNow().notNull(),
});

// Payments
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  playerId: integer("player_id").references(() => players.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentType: text("payment_type").notNull(), // monthly_fee, equipment_fee, tournament_fee, etc.
  dueDate: date("due_date").notNull(),
  paidDate: timestamp("paid_date"),
  status: text("status").notNull().default("pending"), // pending, paid, overdue
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Parent-Child Connection Requests
export const connectionRequests = pgTable("connection_requests", {
  id: serial("id").primaryKey(),
  parentId: integer("parent_id").references(() => users.id).notNull(),
  playerId: integer("player_id").references(() => players.id).notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Define relationships
export const usersRelations = relations(users, ({ many }) => ({
  players: many(players),
  sessions: many(sessions),
  announcementViews: many(announcementViews),
  announcements: many(announcements, { relationName: "created_by" }),
  mealPlans: many(mealPlans, { relationName: "created_by" }),
  connectionRequests: many(connectionRequests),
}));

export const playersRelations = relations(players, ({ one, many }) => ({
  parent: one(users, { fields: [players.parentId], references: [users.id] }),
  fitnessRecords: many(fitnessRecords),
  payments: many(payments),
  sessionAttendances: many(sessionAttendances),
  connectionRequests: many(connectionRequests),
}));

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  coach: one(users, { fields: [sessions.coachId], references: [users.id] }),
  attendances: many(sessionAttendances),
}));

export const sessionAttendancesRelations = relations(sessionAttendances, ({ one }) => ({
  session: one(sessions, { fields: [sessionAttendances.sessionId], references: [sessions.id] }),
  player: one(players, { fields: [sessionAttendances.playerId], references: [players.id] }),
}));

export const fitnessRecordsRelations = relations(fitnessRecords, ({ one }) => ({
  player: one(players, { fields: [fitnessRecords.playerId], references: [players.id] }),
}));

export const mealPlansRelations = relations(mealPlans, ({ one, many }) => ({
  createdByUser: one(users, { fields: [mealPlans.createdBy], references: [users.id] }),
  mealItems: many(mealItems),
}));

export const mealItemsRelations = relations(mealItems, ({ one }) => ({
  mealPlan: one(mealPlans, { fields: [mealItems.mealPlanId], references: [mealPlans.id] }),
}));

export const announcementsRelations = relations(announcements, ({ one, many }) => ({
  createdByUser: one(users, { fields: [announcements.createdBy], references: [users.id] }),
  views: many(announcementViews),
}));

export const announcementViewsRelations = relations(announcementViews, ({ one }) => ({
  announcement: one(announcements, { fields: [announcementViews.announcementId], references: [announcements.id] }),
  user: one(users, { fields: [announcementViews.userId], references: [users.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  player: one(players, { fields: [payments.playerId], references: [players.id] }),
}));

export const connectionRequestsRelations = relations(connectionRequests, ({ one }) => ({
  parent: one(users, { fields: [connectionRequests.parentId], references: [users.id] }),
  player: one(players, { fields: [connectionRequests.playerId], references: [players.id] }),
}));

// Zod Schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const insertPlayerSchema = createInsertSchema(players, {
  // Override dateOfBirth to accept both Date objects and ISO string dates
  dateOfBirth: (schema) => z.union([
    z.date(),
    z.string().refine((val) => !isNaN(new Date(val).getTime()), {
      message: "Invalid date string format, must be ISO 8601"
    }).transform(val => new Date(val))
  ]),
});
export const insertSessionSchema = createInsertSchema(sessions);
export const insertFitnessRecordSchema = createInsertSchema(fitnessRecords);
export const insertMealPlanSchema = createInsertSchema(mealPlans);
export const insertMealItemSchema = createInsertSchema(mealItems);
export const insertAnnouncementSchema = createInsertSchema(announcements);
export const insertPaymentSchema = createInsertSchema(payments);
export const insertConnectionRequestSchema = createInsertSchema(connectionRequests);

// Create select schemas
export const userSchema = createSelectSchema(users);
export const playerSchema = createSelectSchema(players);
export const sessionSchema = createSelectSchema(sessions);
export const fitnessRecordSchema = createSelectSchema(fitnessRecords);
export const mealPlanSchema = createSelectSchema(mealPlans);
export const mealItemSchema = createSelectSchema(mealItems);
export const announcementSchema = createSelectSchema(announcements);
export const paymentSchema = createSelectSchema(payments);
export const connectionRequestSchema = createSelectSchema(connectionRequests);

// Types for the schemas
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = z.infer<typeof userSchema>;

export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = z.infer<typeof playerSchema>;

export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = z.infer<typeof sessionSchema>;

export type InsertFitnessRecord = z.infer<typeof insertFitnessRecordSchema>;
export type FitnessRecord = z.infer<typeof fitnessRecordSchema>;

export type InsertMealPlan = z.infer<typeof insertMealPlanSchema>;
export type MealPlan = z.infer<typeof mealPlanSchema>;

export type InsertMealItem = z.infer<typeof insertMealItemSchema>;
export type MealItem = z.infer<typeof mealItemSchema>;

export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type Announcement = z.infer<typeof announcementSchema>;

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = z.infer<typeof paymentSchema>;

export type InsertConnectionRequest = z.infer<typeof insertConnectionRequestSchema>;
export type ConnectionRequest = z.infer<typeof connectionRequestSchema>;