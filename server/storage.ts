import { db } from "@db";
import { users, players, sessions, sessionAttendances, fitnessRecords, mealPlans, mealItems, announcements, announcementViews, payments } from "@shared/schema";
import { eq, and, or, gte, lte, desc, sql, count } from "drizzle-orm";
import { Pool } from "@neondatabase/serverless";
import connectPg from "connect-pg-simple";
import session from "express-session";
import { InsertUser, User, InsertPlayer, InsertSession, InsertFitnessRecord, InsertMealPlan, InsertMealItem, InsertAnnouncement, InsertPayment } from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(userData: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined>;
  
  // Player methods
  getPlayerById(id: number): Promise<any>;
  getPlayersByParentId(parentId: number): Promise<any[]>;
  getAllPlayers(ageGroup?: string): Promise<any[]>;
  createPlayer(playerData: InsertPlayer): Promise<any>;
  updatePlayer(id: number, playerData: Partial<InsertPlayer>): Promise<any | undefined>;
  
  // Session methods
  getSessionById(id: number): Promise<any>;
  getTodaySessions(): Promise<any[]>;
  getUpcomingSessions(limit?: number): Promise<any[]>;
  createSession(sessionData: InsertSession): Promise<any>;
  updateSession(id: number, sessionData: Partial<InsertSession>): Promise<any | undefined>;
  
  // Fitness records methods
  getFitnessRecordsByPlayerId(playerId: number): Promise<any[]>;
  createFitnessRecord(fitnessData: InsertFitnessRecord): Promise<any>;
  getTeamFitnessProgress(ageGroup?: string, period?: string): Promise<any>;
  
  // Meal plan methods
  getMealPlanById(id: number): Promise<any>;
  getMealPlansByAgeGroup(ageGroup: string): Promise<any[]>;
  createMealPlan(mealPlanData: InsertMealPlan): Promise<any>;
  createMealItem(mealItemData: InsertMealItem): Promise<any>;
  
  // Announcement methods
  getAnnouncementById(id: number): Promise<any>;
  getRecentAnnouncements(limit?: number): Promise<any[]>;
  createAnnouncement(announcementData: InsertAnnouncement): Promise<any>;
  markAnnouncementAsViewed(announcementId: number, userId: number): Promise<void>;
  getAnnouncementViewStats(announcementId: number): Promise<any>;
  
  // Payment methods
  getPaymentById(id: number): Promise<any>;
  getPaymentsByPlayerId(playerId: number): Promise<any[]>;
  getPendingPayments(): Promise<any[]>;
  createPayment(paymentData: InsertPayment): Promise<any>;
  updatePaymentStatus(id: number, status: string, paidDate?: Date): Promise<any | undefined>;
  
  // Stats methods
  getDashboardStats(): Promise<any>;
  
  // Session store for authentication
  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;
  
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
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }
  
  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }
  
  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({...userData, updatedAt: new Date()})
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }
  
  // Player methods
  async getPlayerById(id: number): Promise<any> {
    const result = await db.select().from(players).where(eq(players.id, id));
    return result[0];
  }
  
  async getPlayersByParentId(parentId: number): Promise<any[]> {
    return await db.select().from(players).where(eq(players.parentId, parentId));
  }
  
  async getAllPlayers(ageGroup?: string): Promise<any[]> {
    let query = db.select({
      ...players,
      parentName: users.fullName,
    }).from(players)
      .leftJoin(users, eq(players.parentId, users.id))
      .orderBy(players.firstName);
    
    if (ageGroup && ageGroup !== 'all') {
      query = query.where(eq(players.ageGroup, ageGroup));
    }
    
    return await query;
  }
  
  async createPlayer(playerData: InsertPlayer): Promise<any> {
    const [player] = await db.insert(players).values(playerData).returning();
    return player;
  }
  
  async updatePlayer(id: number, playerData: Partial<InsertPlayer>): Promise<any | undefined> {
    const [updatedPlayer] = await db
      .update(players)
      .set({...playerData, updatedAt: new Date()})
      .where(eq(players.id, id))
      .returning();
    return updatedPlayer;
  }
  
  // Session methods
  async getSessionById(id: number): Promise<any> {
    const result = await db
      .select({
        ...sessions,
        coachName: users.fullName,
      })
      .from(sessions)
      .leftJoin(users, eq(sessions.coachId, users.id))
      .where(eq(sessions.id, id));
    
    return result[0];
  }
  
  async getTodaySessions(): Promise<any[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return await db
      .select({
        ...sessions,
        coachName: users.fullName,
      })
      .from(sessions)
      .leftJoin(users, eq(sessions.coachId, users.id))
      .where(
        and(
          gte(sessions.startTime, today),
          lte(sessions.startTime, tomorrow)
        )
      )
      .orderBy(sessions.startTime);
  }
  
  async getUpcomingSessions(limit: number = 10): Promise<any[]> {
    const now = new Date();
    
    return await db
      .select({
        ...sessions,
        coachName: users.fullName,
      })
      .from(sessions)
      .leftJoin(users, eq(sessions.coachId, users.id))
      .where(gte(sessions.startTime, now))
      .orderBy(sessions.startTime)
      .limit(limit);
  }
  
  async createSession(sessionData: InsertSession): Promise<any> {
    const [session] = await db.insert(sessions).values(sessionData).returning();
    return session;
  }
  
  async updateSession(id: number, sessionData: Partial<InsertSession>): Promise<any | undefined> {
    const [updatedSession] = await db
      .update(sessions)
      .set({...sessionData, updatedAt: new Date()})
      .where(eq(sessions.id, id))
      .returning();
    return updatedSession;
  }
  
  // Fitness records methods
  async getFitnessRecordsByPlayerId(playerId: number): Promise<any[]> {
    return await db
      .select()
      .from(fitnessRecords)
      .where(eq(fitnessRecords.playerId, playerId))
      .orderBy(desc(fitnessRecords.recordDate));
  }
  
  async createFitnessRecord(fitnessData: InsertFitnessRecord): Promise<any> {
    const [record] = await db.insert(fitnessRecords).values(fitnessData).returning();
    return record;
  }
  
  async getTeamFitnessProgress(ageGroup?: string, period: string = 'week'): Promise<any> {
    // Calculate date range based on period
    const today = new Date();
    const startDate = new Date(today);
    
    if (period === 'week') {
      startDate.setDate(today.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(today.getMonth() - 1);
    } else if (period === 'lastMonth') {
      startDate.setMonth(today.getMonth() - 2);
      today.setMonth(today.getMonth() - 1);
    }
    
    let query = db
      .select({
        avgRunningSpeed: sql<number>`avg(${fitnessRecords.runningSpeed})`,
        avgEndurance: sql<number>`avg(${fitnessRecords.endurance})`,
        avgStrength: sql<number>`avg(${fitnessRecords.strength})`,
        avgAgility: sql<number>`avg(${fitnessRecords.agility})`,
        avgFlexibility: sql<number>`avg(${fitnessRecords.flexibility})`,
      })
      .from(fitnessRecords)
      .innerJoin(players, eq(fitnessRecords.playerId, players.id))
      .where(
        and(
          gte(fitnessRecords.recordDate, startDate),
          lte(fitnessRecords.recordDate, today)
        )
      );
    
    if (ageGroup && ageGroup !== 'all') {
      query = query.where(eq(players.ageGroup, ageGroup));
    }
    
    const result = await query;
    return result[0];
  }
  
  // Meal plan methods
  async getMealPlanById(id: number): Promise<any> {
    const mealPlan = await db
      .select()
      .from(mealPlans)
      .where(eq(mealPlans.id, id));
    
    if (mealPlan[0]) {
      const items = await db
        .select()
        .from(mealItems)
        .where(eq(mealItems.mealPlanId, id))
        .orderBy(mealItems.dayOfWeek, mealItems.mealType);
      
      return {
        ...mealPlan[0],
        items,
      };
    }
    
    return undefined;
  }
  
  async getMealPlansByAgeGroup(ageGroup: string): Promise<any[]> {
    return await db
      .select()
      .from(mealPlans)
      .where(eq(mealPlans.ageGroup, ageGroup))
      .orderBy(desc(mealPlans.weekStartDate));
  }
  
  async createMealPlan(mealPlanData: InsertMealPlan): Promise<any> {
    const [mealPlan] = await db.insert(mealPlans).values(mealPlanData).returning();
    return mealPlan;
  }
  
  async createMealItem(mealItemData: InsertMealItem): Promise<any> {
    const [mealItem] = await db.insert(mealItems).values(mealItemData).returning();
    return mealItem;
  }
  
  // Announcement methods
  async getAnnouncementById(id: number): Promise<any> {
    const result = await db
      .select({
        ...announcements,
        createdByName: users.fullName,
      })
      .from(announcements)
      .leftJoin(users, eq(announcements.createdBy, users.id))
      .where(eq(announcements.id, id));
    
    return result[0];
  }
  
  async getRecentAnnouncements(limit: number = 5): Promise<any[]> {
    return await db
      .select({
        ...announcements,
        createdByName: users.fullName,
      })
      .from(announcements)
      .leftJoin(users, eq(announcements.createdBy, users.id))
      .orderBy(desc(announcements.createdAt))
      .limit(limit);
  }
  
  async createAnnouncement(announcementData: InsertAnnouncement): Promise<any> {
    const [announcement] = await db.insert(announcements).values(announcementData).returning();
    return announcement;
  }
  
  async markAnnouncementAsViewed(announcementId: number, userId: number): Promise<void> {
    // Check if already viewed
    const existing = await db
      .select()
      .from(announcementViews)
      .where(
        and(
          eq(announcementViews.announcementId, announcementId),
          eq(announcementViews.userId, userId)
        )
      );
    
    if (existing.length === 0) {
      await db.insert(announcementViews).values({
        announcementId,
        userId,
      });
    }
  }
  
  async getAnnouncementViewStats(announcementId: number): Promise<any> {
    const viewCount = await db
      .select({ count: count() })
      .from(announcementViews)
      .where(eq(announcementViews.announcementId, announcementId));
    
    // Get total parents count (to determine how many should view it)
    const parentCount = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, 'parent'));
    
    return {
      viewCount: viewCount[0]?.count || 0,
      totalParents: parentCount[0]?.count || 0,
    };
  }
  
  // Payment methods
  async getPaymentById(id: number): Promise<any> {
    const result = await db
      .select({
        ...payments,
        playerFirstName: players.firstName,
        playerLastName: players.lastName,
      })
      .from(payments)
      .leftJoin(players, eq(payments.playerId, players.id))
      .where(eq(payments.id, id));
    
    return result[0];
  }
  
  async getPaymentsByPlayerId(playerId: number): Promise<any[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.playerId, playerId))
      .orderBy(desc(payments.dueDate));
  }
  
  async getPendingPayments(): Promise<any[]> {
    return await db
      .select({
        ...payments,
        playerFirstName: players.firstName,
        playerLastName: players.lastName,
        parentId: players.parentId,
      })
      .from(payments)
      .leftJoin(players, eq(payments.playerId, players.id))
      .where(eq(payments.status, 'pending'))
      .orderBy(payments.dueDate);
  }
  
  async createPayment(paymentData: InsertPayment): Promise<any> {
    const [payment] = await db.insert(payments).values(paymentData).returning();
    return payment;
  }
  
  async updatePaymentStatus(id: number, status: string, paidDate?: Date): Promise<any | undefined> {
    const [updatedPayment] = await db
      .update(payments)
      .set({
        status,
        paidDate: paidDate || undefined,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, id))
      .returning();
    return updatedPayment;
  }
  
  // Stats methods
  async getDashboardStats(): Promise<any> {
    // Get player count
    const playerCount = await db
      .select({ count: count() })
      .from(players);
    
    // Get upcoming sessions count
    const now = new Date();
    const sessionCount = await db
      .select({ count: count() })
      .from(sessions)
      .where(gte(sessions.startTime, now));
    
    // Get pending payment total
    const pendingPayments = await db
      .select({
        total: sql<number>`sum(${payments.amount})`,
        count: count(),
      })
      .from(payments)
      .where(eq(payments.status, 'pending'));
    
    // Get announcement count
    const announcementCount = await db
      .select({ count: count() })
      .from(announcements);
    
    // Get last announcement date
    const lastAnnouncement = await db
      .select()
      .from(announcements)
      .orderBy(desc(announcements.createdAt))
      .limit(1);
    
    return {
      playerCount: playerCount[0]?.count || 0,
      sessionCount: sessionCount[0]?.count || 0,
      pendingPaymentsTotal: pendingPayments[0]?.total || 0,
      pendingPaymentsCount: pendingPayments[0]?.count || 0,
      announcementCount: announcementCount[0]?.count || 0,
      lastAnnouncementDate: lastAnnouncement[0]?.createdAt,
    };
  }
}

// Create and export the storage instance
export const storage = new DatabaseStorage();
