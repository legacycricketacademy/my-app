import { db } from "../db/index.js";
import { 
  users, 
  players, 
  sessions, 
  sessionAttendances, 
  fitnessRecords, 
  mealPlans, 
  mealItems, 
  announcements, 
  announcementViews, 
  payments,
  connectionRequests
} from "../shared/schema.js";
import { eq, and, or, gte, lte, desc, sql, count } from "drizzle-orm";
import { Pool } from "@neondatabase/serverless";
import connectPg from "connect-pg-simple";
import session from "express-session";
import { 
  InsertUser, 
  User, 
  InsertPlayer, 
  InsertSession, 
  InsertFitnessRecord, 
  InsertMealPlan, 
  InsertMealItem, 
  InsertAnnouncement, 
  InsertPayment,
  InsertConnectionRequest
} from "../shared/schema.js";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByUsernameInAcademy(username: string, academyId: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  createUser(userData: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined>;
  updateStripeCustomerId(userId: number, stripeCustomerId: string): Promise<User | undefined>;
  
  // Session store for authentication
  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;
  
  constructor() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }
  
  async getUserByUsernameInAcademy(username: string, academyId: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(
      and(
        eq(users.username, username),
        eq(users.academyId, academyId)
      )
    );
    return result[0];
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }
  
  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid));
    return result[0];
  }
  
  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }
  
  async updateStripeCustomerId(userId: number, stripeCustomerId: string): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ 
        stripeCustomerId, 
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({...userData, updatedAt: new Date()})
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
}

// Create and export the storage instance
export const storage = new DatabaseStorage();
