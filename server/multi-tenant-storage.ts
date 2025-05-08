import { db } from "../db";
import { and, eq } from "drizzle-orm";
import {
  academies,
  users,
  players,
  sessions,
  sessionAttendances,
  fitnessRecords,
  mealPlans,
  mealItems,
  announcements,
  payments,
  connectionRequests,
} from "../shared/schema";
import { DatabaseStorage } from "./storage";

/**
 * Extends the standard DatabaseStorage with multi-tenancy capabilities
 */
export class MultiTenantStorage extends DatabaseStorage {
  private currentAcademyId: number | null = null;

  /**
   * Set the current academy context for this storage instance
   */
  setAcademyContext(academyId: number | null) {
    this.currentAcademyId = academyId;
  }

  /**
   * Get the current academy context
   */
  getAcademyContext(): number | null {
    return this.currentAcademyId;
  }

  /**
   * Get academy by ID
   */
  async getAcademyById(id: number): Promise<any> {
    const result = await db.select().from(academies).where(eq(academies.id, id)).limit(1);
    return result[0] || null;
  }

  /**
   * Get academy by slug
   */
  async getAcademyBySlug(slug: string): Promise<any> {
    const result = await db.select().from(academies).where(eq(academies.slug, slug)).limit(1);
    return result[0] || null;
  }

  /**
   * Get all academies
   */
  async getAllAcademies(): Promise<any[]> {
    return await db.select().from(academies);
  }

  /**
   * Create a new academy
   */
  async createAcademy(academyData: any): Promise<any> {
    const result = await db.insert(academies).values(academyData).returning();
    return result[0];
  }

  /**
   * Update academy by ID
   */
  async updateAcademy(id: number, academyData: any): Promise<any> {
    const result = await db
      .update(academies)
      .set({ ...academyData, updatedAt: new Date() })
      .where(eq(academies.id, id))
      .returning();
    return result[0];
  }

  /**
   * Override user methods to add academy context
   */
  async getUser(id: number): Promise<any> {
    const conditions = [eq(users.id, id)];
    if (this.currentAcademyId) {
      conditions.push(eq(users.academyId, this.currentAcademyId));
    }
    const result = await db.select().from(users).where(and(...conditions)).limit(1);
    return result[0] || null;
  }

  async getUserByUsername(username: string): Promise<any> {
    const conditions = [eq(users.username, username)];
    if (this.currentAcademyId) {
      conditions.push(eq(users.academyId, this.currentAcademyId));
    }
    const result = await db.select().from(users).where(and(...conditions)).limit(1);
    return result[0] || null;
  }

  async getUserByEmail(email: string): Promise<any> {
    const conditions = [eq(users.email, email)];
    if (this.currentAcademyId) {
      conditions.push(eq(users.academyId, this.currentAcademyId));
    }
    const result = await db.select().from(users).where(and(...conditions)).limit(1);
    return result[0] || null;
  }

  async createUser(userData: any): Promise<any> {
    if (this.currentAcademyId && !userData.academyId) {
      userData.academyId = this.currentAcademyId;
    }
    const result = await db.insert(users).values(userData).returning();
    return result[0];
  }

  async updateUser(id: number, userData: any): Promise<any> {
    const conditions = [eq(users.id, id)];
    if (this.currentAcademyId) {
      conditions.push(eq(users.academyId, this.currentAcademyId));
    }
    const result = await db
      .update(users)
      .set({ ...userData, updatedAt: new Date() })
      .where(and(...conditions))
      .returning();
    return result[0];
  }

  /**
   * Override player methods to add academy context
   */
  async getPlayerById(id: number): Promise<any> {
    const conditions = [eq(players.id, id)];
    if (this.currentAcademyId) {
      conditions.push(eq(players.academyId, this.currentAcademyId));
    }
    const result = await db.select().from(players).where(and(...conditions)).limit(1);
    return result[0] || null;
  }

  async getAllPlayers(ageGroup?: string): Promise<any[]> {
    const conditions = [];
    if (this.currentAcademyId) {
      conditions.push(eq(players.academyId, this.currentAcademyId));
    }
    if (ageGroup) {
      conditions.push(eq(players.ageGroup, ageGroup));
    }
    
    if (conditions.length === 0) {
      return await db.select().from(players);
    }
    
    return await db.select().from(players).where(and(...conditions));
  }

  async createPlayer(playerData: any): Promise<any> {
    if (this.currentAcademyId && !playerData.academyId) {
      playerData.academyId = this.currentAcademyId;
    }
    const result = await db.insert(players).values(playerData).returning();
    return result[0];
  }

  /**
   * Override session methods to add academy context
   */
  async getSessionById(id: number): Promise<any> {
    const conditions = [eq(sessions.id, id)];
    if (this.currentAcademyId) {
      conditions.push(eq(sessions.academyId, this.currentAcademyId));
    }
    const result = await db.select().from(sessions).where(and(...conditions)).limit(1);
    return result[0] || null;
  }

  async getAllSessions(): Promise<any[]> {
    const conditions = [];
    if (this.currentAcademyId) {
      conditions.push(eq(sessions.academyId, this.currentAcademyId));
    }
    
    if (conditions.length === 0) {
      return await db.select().from(sessions);
    }
    
    return await db.select().from(sessions).where(and(...conditions));
  }

  async createSession(sessionData: any): Promise<any> {
    if (this.currentAcademyId && !sessionData.academyId) {
      sessionData.academyId = this.currentAcademyId;
    }
    const result = await db.insert(sessions).values(sessionData).returning();
    return result[0];
  }

  /**
   * Override session attendance methods to add academy context
   */
  async getSessionAttendanceById(id: number): Promise<any> {
    const conditions = [eq(sessionAttendances.id, id)];
    if (this.currentAcademyId) {
      conditions.push(eq(sessionAttendances.academyId, this.currentAcademyId));
    }
    const result = await db.select().from(sessionAttendances).where(and(...conditions)).limit(1);
    return result[0] || null;
  }

  async createSessionAttendance(attendanceData: any): Promise<any> {
    if (this.currentAcademyId && !attendanceData.academyId) {
      attendanceData.academyId = this.currentAcademyId;
    }
    const result = await db.insert(sessionAttendances).values(attendanceData).returning();
    return result[0];
  }

  /**
   * Override fitness record methods to add academy context
   */
  async getFitnessRecordById(id: number): Promise<any> {
    const conditions = [eq(fitnessRecords.id, id)];
    if (this.currentAcademyId) {
      conditions.push(eq(fitnessRecords.academyId, this.currentAcademyId));
    }
    const result = await db.select().from(fitnessRecords).where(and(...conditions)).limit(1);
    return result[0] || null;
  }

  async createFitnessRecord(recordData: any): Promise<any> {
    if (this.currentAcademyId && !recordData.academyId) {
      recordData.academyId = this.currentAcademyId;
    }
    const result = await db.insert(fitnessRecords).values(recordData).returning();
    return result[0];
  }

  /**
   * Override meal plan methods to add academy context
   */
  async getMealPlanById(id: number): Promise<any> {
    const conditions = [eq(mealPlans.id, id)];
    if (this.currentAcademyId) {
      conditions.push(eq(mealPlans.academyId, this.currentAcademyId));
    }
    const result = await db.select().from(mealPlans).where(and(...conditions)).limit(1);
    return result[0] || null;
  }

  async getAllMealPlans(): Promise<any[]> {
    const conditions = [];
    if (this.currentAcademyId) {
      conditions.push(eq(mealPlans.academyId, this.currentAcademyId));
    }
    
    if (conditions.length === 0) {
      return await db.select().from(mealPlans);
    }
    
    return await db.select().from(mealPlans).where(and(...conditions));
  }

  async createMealPlan(mealPlanData: any): Promise<any> {
    if (this.currentAcademyId && !mealPlanData.academyId) {
      mealPlanData.academyId = this.currentAcademyId;
    }
    const result = await db.insert(mealPlans).values(mealPlanData).returning();
    return result[0];
  }

  /**
   * Override announcement methods to add academy context
   */
  async getAnnouncementById(id: number): Promise<any> {
    const conditions = [eq(announcements.id, id)];
    if (this.currentAcademyId) {
      conditions.push(eq(announcements.academyId, this.currentAcademyId));
    }
    const result = await db.select().from(announcements).where(and(...conditions)).limit(1);
    return result[0] || null;
  }

  async getRecentAnnouncements(limit: number = 5): Promise<any[]> {
    let query = db.select().from(announcements);
    
    if (this.currentAcademyId) {
      query = query.where(eq(announcements.academyId, this.currentAcademyId));
    }
    
    return await query.orderBy(announcements.createdAt).limit(limit);
  }

  async createAnnouncement(announcementData: any): Promise<any> {
    if (this.currentAcademyId && !announcementData.academyId) {
      announcementData.academyId = this.currentAcademyId;
    }
    const result = await db.insert(announcements).values(announcementData).returning();
    return result[0];
  }

  /**
   * Override payment methods to add academy context
   */
  async getPaymentById(id: number): Promise<any> {
    const conditions = [eq(payments.id, id)];
    if (this.currentAcademyId) {
      conditions.push(eq(payments.academyId, this.currentAcademyId));
    }
    const result = await db.select().from(payments).where(and(...conditions)).limit(1);
    return result[0] || null;
  }

  async getAllPayments(): Promise<any[]> {
    const conditions = [];
    if (this.currentAcademyId) {
      conditions.push(eq(payments.academyId, this.currentAcademyId));
    }
    
    if (conditions.length === 0) {
      return await db.select().from(payments);
    }
    
    return await db.select().from(payments).where(and(...conditions));
  }

  async createPayment(paymentData: any): Promise<any> {
    if (this.currentAcademyId && !paymentData.academyId) {
      paymentData.academyId = this.currentAcademyId;
    }
    const result = await db.insert(payments).values(paymentData).returning();
    return result[0];
  }

  /**
   * Override connection request methods to add academy context
   */
  async getConnectionRequestById(id: number): Promise<any> {
    const conditions = [eq(connectionRequests.id, id)];
    if (this.currentAcademyId) {
      conditions.push(eq(connectionRequests.academyId, this.currentAcademyId));
    }
    const result = await db.select().from(connectionRequests).where(and(...conditions)).limit(1);
    return result[0] || null;
  }

  async createConnectionRequest(requestData: any): Promise<any> {
    if (this.currentAcademyId && !requestData.academyId) {
      requestData.academyId = this.currentAcademyId;
    }
    const result = await db.insert(connectionRequests).values(requestData).returning();
    return result[0];
  }
}

export const multiTenantStorage = new MultiTenantStorage();