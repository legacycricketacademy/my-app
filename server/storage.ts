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
import type { AgeGroup } from "../shared/schema.js";
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
} from "@shared/schema.js";

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
  
  // Player methods
  getPlayerById(id: number): Promise<any>;
  getPlayersByParentId(parentId: number): Promise<any[]>;
  getAllPlayers(ageGroup?: AgeGroup): Promise<any[]>;
  getPlayersPendingReview(): Promise<any[]>;
  createPlayer(playerData: InsertPlayer): Promise<any>;
  updatePlayer(id: number, playerData: Partial<InsertPlayer>): Promise<any | undefined>;
  deletePlayer(id: number): Promise<boolean>;
  deleteFitnessRecordsByPlayerId(playerId: number): Promise<boolean>;
  deleteSessionAttendancesByPlayerId(playerId: number): Promise<boolean>;
  deletePaymentsByPlayerId(playerId: number): Promise<boolean>;
  deleteConnectionRequestsByPlayerId(playerId: number): Promise<boolean>;
  
  // Session methods
  getSessionById(id: number): Promise<any>;
  getTodaySessions(): Promise<any[]>;
  getUpcomingSessions(limit?: number): Promise<any[]>;
  getAllSessions(): Promise<any[]>;
  createSession(sessionData: InsertSession): Promise<any>;
  updateSession(id: number, sessionData: Partial<InsertSession>): Promise<any | undefined>;
  
  // Fitness records methods
  getFitnessRecordsByPlayerId(playerId: number): Promise<any[]>;
  createFitnessRecord(fitnessData: InsertFitnessRecord): Promise<any>;
  getTeamFitnessProgress(ageGroup?: AgeGroup, period?: string): Promise<any>;
  
  // Meal plan methods
  getMealPlanById(id: number): Promise<any>;
  getMealPlansByAgeGroup(ageGroup: AgeGroup): Promise<any[]>;
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
  getPaymentsByPlayerIds(playerIds: number[], status?: string): Promise<any[]>;
  getPlayersIdsByParentId(parentId: number): Promise<number[]>;
  getAllPayments(status?: string): Promise<any[]>;
  getPendingPayments(): Promise<any[]>;
  createPayment(paymentData: InsertPayment): Promise<any>;
  updatePaymentStatus(id: number, status: string, paidDate?: Date): Promise<any | undefined>;
  
  // Stripe methods
  updateStripeCustomerId(userId: number, customerId: string): Promise<User | undefined>;
  updateStripeSubscriptionId(userId: number, subscriptionId: string): Promise<User | undefined>;
  updateUserStripeInfo(userId: number, data: { stripeCustomerId: string; stripeSubscriptionId: string }): Promise<User | undefined>;
  
  // Connection request methods
  getConnectionRequestById(id: number): Promise<any>;
  getConnectionRequestsByParentId(parentId: number): Promise<any[]>;
  getAllConnectionRequests(status?: string): Promise<any[]>;
  createConnectionRequest(requestData: InsertConnectionRequest): Promise<any>;
  updateConnectionRequest(id: number, data: Partial<InsertConnectionRequest>): Promise<any>;
  
  // Stats methods
  getDashboardStats(): Promise<any>;
  
  // Session store for authentication
  sessionStore: any; // Using any type to avoid SessionStore type issues
}

export class DatabaseStorage implements IStorage {
  sessionStore: any; // Using any type to avoid SessionStore type issues
  
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
  
  // Player methods
  async getPlayerById(id: number): Promise<any> {
    const result = await db.select().from(players).where(eq(players.id, id));
    return result[0];
  }
  
  async getPlayersByParentId(parentId: number): Promise<any[]> {
    return await db.select().from(players).where(eq(players.parentId, parentId));
  }
  
  async getAllPlayers(ageGroup?: AgeGroup): Promise<any[]> {
    const baseQuery = db.select({
      id: players.id,
      firstName: players.firstName,
      lastName: players.lastName,
      dateOfBirth: players.dateOfBirth,
      ageGroup: players.ageGroup,
      playerType: players.playerType,
      parentId: players.parentId,
      academyId: players.academyId,
      profileImage: players.profileImage,
      location: players.location,
      parentName: users.fullName,
      parentEmail: users.email,
    }).from(players)
      .leftJoin(users, eq(players.parentId, users.id))
      .orderBy(players.firstName);
    
    if (ageGroup) {
      return await baseQuery.where(eq(players.ageGroup, ageGroup));
    }
    
    return await baseQuery;
  }
  
  async getPlayersPendingReview(): Promise<any[]> {
    const query = db.select({
      id: players.id,
      firstName: players.firstName,
      lastName: players.lastName,
      dateOfBirth: players.dateOfBirth,
      ageGroup: players.ageGroup,
      playerType: players.playerType,
      parentId: players.parentId,
      academyId: players.academyId,
      profileImage: players.profileImage,
      location: players.location,
      parentName: users.fullName,
      parentEmail: users.email,
    }).from(players)
      .leftJoin(users, eq(players.parentId, users.id))
      .where(eq(players.pendingCoachReview, true))
      .orderBy(desc(players.createdAt));
    
    return await query;
  }
  
  async getPlayerByNameAndParent(firstName: string, lastName: string, parentId: number): Promise<any> {
    const result = await db
      .select()
      .from(players)
      .where(
        and(
          eq(players.firstName, firstName),
          eq(players.lastName, lastName),
          eq(players.parentId, parentId)
        )
      );
    return result[0];
  }
  
  async createPlayer(playerData: InsertPlayer): Promise<any> {
    // Check if player already exists with same name and parent
    const existingPlayer = await this.getPlayerByNameAndParent(
      playerData.firstName,
      playerData.lastName,
      playerData.parentId
    );
    
    if (existingPlayer) {
      console.log(`Player ${playerData.firstName} ${playerData.lastName} already exists with ID ${existingPlayer.id}`);
      return existingPlayer;
    }
    
    // Convert Date objects to strings for database storage
    const playerDataForInsert = {
      ...playerData,
      dateOfBirth: playerData.dateOfBirth instanceof Date ? playerData.dateOfBirth.toISOString().split('T')[0] : playerData.dateOfBirth
    };
    
    // Player doesn't exist, create a new one
    const [player] = await db.insert(players).values(playerDataForInsert).returning();
    return player;
  }
  
  async updatePlayer(id: number, playerData: Partial<InsertPlayer>): Promise<any | undefined> {
    // Convert Date objects to strings for database storage
    const updateData: any = {
      ...playerData,
      updatedAt: new Date()
    };
    
    if (playerData.dateOfBirth instanceof Date) {
      updateData.dateOfBirth = playerData.dateOfBirth.toISOString().split('T')[0];
    }
    
    const [updatedPlayer] = await db
      .update(players)
      .set(updateData)
      .where(eq(players.id, id))
      .returning();
    return updatedPlayer;
  }
  
  async deletePlayer(id: number): Promise<boolean> {
    try {
      const result = await db.delete(players).where(eq(players.id, id)).returning({ id: players.id });
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting player:", error);
      return false;
    }
  }
  
  async deleteFitnessRecordsByPlayerId(playerId: number): Promise<boolean> {
    try {
      await db.delete(fitnessRecords).where(eq(fitnessRecords.playerId, playerId));
      return true;
    } catch (error) {
      console.error("Error deleting fitness records:", error);
      return false;
    }
  }
  
  async deleteSessionAttendancesByPlayerId(playerId: number): Promise<boolean> {
    try {
      await db.delete(sessionAttendances).where(eq(sessionAttendances.playerId, playerId));
      return true;
    } catch (error) {
      console.error("Error deleting session attendances:", error);
      return false;
    }
  }
  
  async deletePaymentsByPlayerId(playerId: number): Promise<boolean> {
    try {
      await db.delete(payments).where(eq(payments.playerId, playerId));
      return true;
    } catch (error) {
      console.error("Error deleting payments:", error);
      return false;
    }
  }
  
  async deleteConnectionRequestsByPlayerId(playerId: number): Promise<boolean> {
    try {
      await db.delete(connectionRequests).where(eq(connectionRequests.playerId, playerId));
      return true;
    } catch (error) {
      console.error("Error deleting connection requests:", error);
      return false;
    }
  }
  
  // Session methods
  async getSessionById(id: number): Promise<any> {
    const result = await db
      .select({
        id: sessions.id,
        title: sessions.title,
        description: sessions.description,
        sessionType: sessions.sessionType,
        ageGroup: sessions.ageGroup,
        location: sessions.location,
        startTime: sessions.startTime,
        endTime: sessions.endTime,
        coachId: sessions.coachId,
        maxPlayers: sessions.maxPlayers,
        academyId: sessions.academyId,
        createdAt: sessions.createdAt,
        updatedAt: sessions.updatedAt,
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
        id: sessions.id,
        academyId: sessions.academyId,
        title: sessions.title,
        description: sessions.description,
        sessionType: sessions.sessionType,
        ageGroup: sessions.ageGroup,
        location: sessions.location,
        startTime: sessions.startTime,
        endTime: sessions.endTime,
        coachId: sessions.coachId,
        maxPlayers: sessions.maxPlayers,
        createdAt: sessions.createdAt,
        updatedAt: sessions.updatedAt,
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
        id: sessions.id,
        academyId: sessions.academyId,
        title: sessions.title,
        description: sessions.description,
        sessionType: sessions.sessionType,
        ageGroup: sessions.ageGroup,
        location: sessions.location,
        startTime: sessions.startTime,
        endTime: sessions.endTime,
        coachId: sessions.coachId,
        maxPlayers: sessions.maxPlayers,
        createdAt: sessions.createdAt,
        updatedAt: sessions.updatedAt,
        coachName: users.fullName,
      })
      .from(sessions)
      .leftJoin(users, eq(sessions.coachId, users.id))
      .where(gte(sessions.startTime, now))
      .orderBy(sessions.startTime)
      .limit(limit);
  }
  
  async getAllSessions(): Promise<any[]> {
    return await db
      .select({
        id: sessions.id,
        title: sessions.title,
        description: sessions.description,
        sessionType: sessions.sessionType,
        ageGroup: sessions.ageGroup,
        location: sessions.location,
        startTime: sessions.startTime,
        endTime: sessions.endTime,
        coachId: sessions.coachId,
        maxPlayers: sessions.maxPlayers,
        academyId: sessions.academyId,
        createdAt: sessions.createdAt,
        updatedAt: sessions.updatedAt,
        coachName: users.fullName,
      })
      .from(sessions)
      .leftJoin(users, eq(sessions.coachId, users.id))
      .orderBy(sessions.startTime);
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
  
  async getTeamFitnessProgress(ageGroup?: AgeGroup, period: string = 'week'): Promise<any> {
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
    
    // Convert dates to strings for database comparison
    const startDateStr = startDate.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];
    
    const conditions = [
      gte(fitnessRecords.recordDate, startDateStr),
      lte(fitnessRecords.recordDate, todayStr)
    ];
    
    if (ageGroup) {
      conditions.push(eq(players.ageGroup, ageGroup));
    }
    
    const result = await db
      .select({
        avgRunningSpeed: sql<number>`avg(${fitnessRecords.runningSpeed})`,
        avgEndurance: sql<number>`avg(${fitnessRecords.endurance})`,
        avgStrength: sql<number>`avg(${fitnessRecords.strength})`,
        avgAgility: sql<number>`avg(${fitnessRecords.agility})`,
        avgFlexibility: sql<number>`avg(${fitnessRecords.flexibility})`,
      })
      .from(fitnessRecords)
      .innerJoin(players, eq(fitnessRecords.playerId, players.id))
      .where(and(...conditions));
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
  
  async getMealPlansByAgeGroup(ageGroup: AgeGroup): Promise<any[]> {
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
        id: announcements.id,
        title: announcements.title,
        content: announcements.content,
        createdBy: announcements.createdBy,
        academyId: announcements.academyId,
        targetAgeGroups: announcements.targetAgeGroups,
        targetLocations: announcements.targetLocations,
        createdAt: announcements.createdAt,
        updatedAt: announcements.updatedAt,
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
        id: announcements.id,
        title: announcements.title,
        content: announcements.content,
        createdBy: announcements.createdBy,
        academyId: announcements.academyId,
        targetAgeGroups: announcements.targetAgeGroups,
        targetLocations: announcements.targetLocations,
        createdAt: announcements.createdAt,
        updatedAt: announcements.updatedAt,
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
    try {
      // First check if we need to add the missing columns to handle older database versions
      await this.ensurePaymentsColumnsExist();
      
      // Get the safe select object with conditional columns
      const safeSelect = this.createSafePaymentsSelect();
      
      // Add player information to the select
      const selectWithPlayer = {
        ...safeSelect,
        playerFirstName: players.firstName,
        playerLastName: players.lastName,
      };
      
      const result = await db
        .select(selectWithPlayer)
        .from(payments)
        .leftJoin(players, eq(payments.playerId, players.id))
        .where(eq(payments.id, id));
      
      return result[0];
    } catch (error) {
      console.error("Error in getPaymentById:", error);
      throw error;
    }
  }
  
  async getPaymentsByPlayerId(playerId: number): Promise<any[]> {
    try {
      // First check if we need to add the missing columns to handle older database versions
      await this.ensurePaymentsColumnsExist();
      
      // Get the safe select object with conditional columns
      const safeSelect = this.createSafePaymentsSelect();
      
      return await db
        .select(safeSelect)
        .from(payments)
        .where(eq(payments.playerId, playerId))
        .orderBy(desc(payments.dueDate));
    } catch (error) {
      console.error("Error in getPaymentsByPlayerId:", error);
      throw error;
    }
  }
  
  async getPaymentsByPlayerIds(playerIds: number[], status?: string): Promise<any[]> {
    try {
      if (!playerIds.length) {
        return [];
      }
      
      // Use direct SQL query instead of Drizzle ORM to avoid schema/column issues
      let query = `
        SELECT 
          p.id, p.academy_id AS "academyId", p.player_id AS "playerId", 
          p.amount, p.payment_type AS "paymentType", 
          CASE 
              WHEN EXISTS (
                  SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'payments' AND column_name = 'month'
              ) 
              THEN p.month 
              ELSE NULL 
          END AS "month",
          p.due_date AS "dueDate", p.paid_date AS "paidDate", 
          p.status, p.payment_method AS "paymentMethod", 
          p.stripe_payment_intent_id AS "stripePaymentIntentId",
          p.stripe_payment_intent_status AS "stripePaymentIntentStatus",
          p.notes, p.created_at AS "createdAt", p.updated_at AS "updatedAt",
          pl.first_name AS "playerFirstName", pl.last_name AS "playerLastName",
          pl.age_group AS "playerAgeGroup", pl.location AS "playerLocation"
      `;
      
      // Try to add the new columns if they exist
      // These SQL queries are designed to be resilient to missing columns using CASE
      // WHEN EXISTS handling
      query += `
        , CASE 
            WHEN EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'payments' AND column_name = 'session_duration'
            ) 
            THEN p.session_duration 
            ELSE NULL 
          END AS "sessionDuration"
        , CASE 
            WHEN EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'payments' AND column_name = 'expected_amount'
            ) 
            THEN p.expected_amount 
            ELSE NULL 
          END AS "expectedAmount"
        , CASE 
            WHEN EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'payments' AND column_name = 'is_over_under_payment'
            ) 
            THEN p.is_over_under_payment 
            ELSE FALSE 
          END AS "isOverUnderPayment"
      `;
      
      query += `
        FROM payments p
        LEFT JOIN players pl ON p.player_id = pl.id
        WHERE p.player_id IN (${playerIds.join(',')})
      `;
      
      if (status && status !== 'all') {
        query += ` AND p.status = '${status}'`;
      }
      
      query += ` ORDER BY p.due_date DESC`;
      
      const result = await db.execute(sql.raw(query));
      
      // For raw SQL, the result requires an explicit return of rows
      return result.rows || [];
    } catch (error) {
      console.error("Error in getPaymentsByPlayerIds:", error);
      // Return empty array instead of throwing to prevent UI errors
      return [];
    }
  }
  
  async getPlayersIdsByParentId(parentId: number): Promise<number[]> {
    const result = await db
      .select({ id: players.id })
      .from(players)
      .where(eq(players.parentId, parentId));
    
    return result.map((row: any) => row.id);
  }
  
  async getAllPayments(status?: string): Promise<any[]> {
    try {
      // Use direct SQL query instead of Drizzle ORM to avoid schema/column issues
      let query = `
        SELECT 
          p.id, p.academy_id AS "academyId", p.player_id AS "playerId", 
          p.amount, p.payment_type AS "paymentType",
          p.due_date AS "dueDate", p.paid_date AS "paidDate", 
          p.status, p.payment_method AS "paymentMethod", 
          p.stripe_payment_intent_id AS "stripePaymentIntentId",
          p.notes, p.created_at AS "createdAt", p.updated_at AS "updatedAt",
          pl.first_name AS "playerFirstName", pl.last_name AS "playerLastName",
          pl.age_group AS "playerAgeGroup", pl.location AS "playerLocation"
      `;
      
      // Only include columns we know exist in the database
      query += `
        , CASE 
            WHEN EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'payments' AND column_name = 'session_duration'
            ) 
            THEN p.session_duration 
            ELSE NULL 
          END AS "sessionDuration"
        , CASE 
            WHEN EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'payments' AND column_name = 'expected_amount'
            ) 
            THEN p.expected_amount 
            ELSE NULL 
          END AS "expectedAmount"
      `;
      
      query += `
        FROM payments p
        LEFT JOIN players pl ON p.player_id = pl.id
      `;
      
      if (status && status !== 'all') {
        query += ` WHERE p.status = '${status}'`;
      }
      
      query += ` ORDER BY p.due_date DESC`;
      
      const result = await db.execute(sql.raw(query));
      
      // For raw SQL, the result requires an explicit return of rows
      return result.rows || [];
    } catch (error) {
      console.error("Error in getAllPayments:", error);
      // Return empty array instead of throwing to prevent UI errors
      return [];
    }
  }
  
  async getPendingPayments(): Promise<any[]> {
    try {
      return await db
        .select({
          id: payments.id,
          academyId: payments.academyId,
          playerId: payments.playerId,
          amount: payments.amount,
          paymentType: payments.paymentType,
          dueDate: payments.dueDate,
          paidDate: payments.paidDate,
          status: payments.status,
          notes: payments.notes,
          createdAt: payments.createdAt,
          updatedAt: payments.updatedAt,
          
          // Only include columns known to exist in the database
          sessionDuration: sql<string | null>`payments.session_duration`.as('sessionDuration'),
          expectedAmount: sql<string | null>`payments.expected_amount`.as('expectedAmount'),
          paymentMethod: sql<string | null>`payments.payment_method`.as('paymentMethod'),
          stripePaymentIntentId: sql<string | null>`payments.stripe_payment_intent_id`.as('stripePaymentIntentId'),
          
          // Player information
          playerFirstName: players.firstName,
          playerLastName: players.lastName,
          playerAgeGroup: players.ageGroup,
          playerLocation: players.location,
        })
        .from(payments)
        .leftJoin(players, eq(payments.playerId, players.id))
        .where(eq(payments.status, "pending"))
        .orderBy(payments.dueDate);
    } catch (error) {
      console.error("Error in getPendingPayments:", error);
      // Return empty array instead of throwing to prevent UI errors
      return [];
    }
  }
  
  // Helper method to check if the session_duration and expected_amount columns exist
  private async ensurePaymentsColumnsExist(): Promise<void> {
    try {
      // Just check that the payments table exists - we'll handle missing columns in queries
      await db.select({ count: sql`count(*)` }).from(payments);
    } catch (error: any) {
      console.error("Error accessing payments table:", error.message);
      throw error;
    }
  }
  
  // Helper to create a safe select object for payments table queries
  // This helps prevent errors when columns don't exist in older database versions
  private createSafePaymentsSelect() {
    // Start with required fields that are always present
    const selectObj: Record<string, any> = {
      id: payments.id,
      academyId: payments.academyId,
      playerId: payments.playerId,
      amount: payments.amount,
      paymentType: payments.paymentType,
      month: payments.month,
      dueDate: payments.dueDate,
      paidDate: payments.paidDate,
      status: payments.status,
      notes: payments.notes,
      createdAt: payments.createdAt,
      updatedAt: payments.updatedAt,
      
      // Player information
      playerFirstName: players.firstName,
      playerLastName: players.lastName,
      playerAgeGroup: players.ageGroup,
      playerLocation: players.location,
      parentId: players.parentId
    };
    
    // Use SQL for potentially missing columns
    // Using direct SQL ensures the query works even if columns don't exist
    selectObj.sessionDuration = sql<string | null>`payments.session_duration`.as('sessionDuration');
    selectObj.expectedAmount = sql<string | null>`payments.expected_amount`.as('expectedAmount');
    selectObj.isOverUnderPayment = sql<boolean | null>`COALESCE(payments.is_over_under_payment, false)`.as('isOverUnderPayment');
    selectObj.paymentMethod = sql<string | null>`payments.payment_method`.as('paymentMethod');
    selectObj.stripePaymentIntentId = sql<string | null>`payments.stripe_payment_intent_id`.as('stripePaymentIntentId');
    
    return selectObj;
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

  // Stripe methods (duplicate removed - using implementation at line 159)
  
  async updateStripeSubscriptionId(userId: number, subscriptionId: string): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({
        stripeSubscriptionId: subscriptionId,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }
  
  async updateUserStripeInfo(userId: number, data: { stripeCustomerId: string; stripeSubscriptionId: string }): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({
        stripeCustomerId: data.stripeCustomerId,
        stripeSubscriptionId: data.stripeSubscriptionId,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
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
  
  // Connection request methods
  async getConnectionRequestById(id: number): Promise<any> {
    const result = await db.select().from(connectionRequests).where(eq(connectionRequests.id, id));
    return result[0];
  }
  
  async getConnectionRequestsByParentId(parentId: number): Promise<any[]> {
    const requests = await db.select({
      id: connectionRequests.id,
      parentId: connectionRequests.parentId,
      playerId: connectionRequests.playerId,
      status: connectionRequests.status,
      notes: connectionRequests.notes,
      createdAt: connectionRequests.createdAt,
      updatedAt: connectionRequests.updatedAt,
      playerFirstName: players.firstName,
      playerLastName: players.lastName,
      playerAgeGroup: players.ageGroup
    })
    .from(connectionRequests)
    .leftJoin(players, eq(connectionRequests.playerId, players.id))
    .where(eq(connectionRequests.parentId, parentId))
    .orderBy(desc(connectionRequests.createdAt));
    
    return requests;
  }
  
  async getAllConnectionRequests(status?: string): Promise<any[]> {
    const conditions = [];
    
    if (status && status !== 'all') {
      conditions.push(eq(connectionRequests.status, status));
    }
    
    let query = db.select({
      id: connectionRequests.id,
      parentId: connectionRequests.parentId,
      playerId: connectionRequests.playerId,
      status: connectionRequests.status,
      notes: connectionRequests.notes,
      createdAt: connectionRequests.createdAt,
      updatedAt: connectionRequests.updatedAt,
      parentName: users.fullName,
      parentEmail: users.email,
      playerFirstName: players.firstName,
      playerLastName: players.lastName,
      playerAgeGroup: players.ageGroup
    })
    .from(connectionRequests)
    .leftJoin(users, eq(connectionRequests.parentId, users.id))
    .leftJoin(players, eq(connectionRequests.playerId, players.id));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(connectionRequests.createdAt));
  }
  
  async createConnectionRequest(requestData: InsertConnectionRequest): Promise<any> {
    const [request] = await db.insert(connectionRequests).values(requestData).returning();
    return request;
  }
  
  async updateConnectionRequest(id: number, data: Partial<InsertConnectionRequest>): Promise<any> {
    const [updatedRequest] = await db
      .update(connectionRequests)
      .set(data)
      .where(eq(connectionRequests.id, id))
      .returning();
    return updatedRequest;
  }
}

// Create and export the storage instance
export const storage = new DatabaseStorage();
