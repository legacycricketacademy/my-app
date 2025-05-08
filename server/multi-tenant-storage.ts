import { db } from "@db";
import { 
  users, 
  players, 
  sessions, 
  fitnessRecords, 
  mealPlans, 
  academies,
  announcements, 
  payments,
  connectionRequests
} from "@shared/schema";
import { eq, and } from "drizzle-orm";
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
    const result = await db.select().from(academies).where(eq(academies.id, id));
    return result[0];
  }

  /**
   * Get academy by name
   */
  async getAcademyByName(name: string): Promise<any> {
    const result = await db.select().from(academies).where(eq(academies.name, name));
    return result[0];
  }

  /**
   * Get all academies
   */
  async getAllAcademies(): Promise<any[]> {
    return await db.select().from(academies).orderBy(academies.name);
  }

  /**
   * Create a new academy
   */
  async createAcademy(academyData: any): Promise<any> {
    const [academy] = await db.insert(academies).values(academyData).returning();
    return academy;
  }

  /**
   * Update academy by ID
   */
  async updateAcademy(id: number, academyData: any): Promise<any> {
    const [updatedAcademy] = await db
      .update(academies)
      .set({...academyData, updatedAt: new Date()})
      .where(eq(academies.id, id))
      .returning();
    return updatedAcademy;
  }

  /**
   * Override user methods to add academy context
   */
  async getUser(id: number): Promise<any> {
    let query = db.select().from(users).where(eq(users.id, id));
    
    if (this.currentAcademyId) {
      query = query.where(eq(users.academyId, this.currentAcademyId));
    }
    
    const result = await query;
    return result[0];
  }

  async getUserByUsername(username: string): Promise<any> {
    let query = db.select().from(users).where(eq(users.username, username));
    
    if (this.currentAcademyId) {
      query = query.where(eq(users.academyId, this.currentAcademyId));
    }
    
    const result = await query;
    return result[0];
  }

  async getUserByEmail(email: string): Promise<any> {
    let query = db.select().from(users).where(eq(users.email, email));
    
    if (this.currentAcademyId) {
      query = query.where(eq(users.academyId, this.currentAcademyId));
    }
    
    const result = await query;
    return result[0];
  }

  async createUser(userData: any): Promise<any> {
    if (this.currentAcademyId && !userData.academyId) {
      userData.academyId = this.currentAcademyId;
    }
    
    return super.createUser(userData);
  }

  /**
   * Override player methods to add academy context
   */
  async getPlayerById(id: number): Promise<any> {
    let query = db.select().from(players).where(eq(players.id, id));
    
    if (this.currentAcademyId) {
      query = query.where(eq(players.academyId, this.currentAcademyId));
    }
    
    const result = await query;
    return result[0];
  }

  async getAllPlayers(ageGroup?: string): Promise<any[]> {
    // Call original query to get the basic structure
    let query = db.select({
      ...players,
      parentName: users.fullName,
      parentEmail: users.email,
    }).from(players)
      .leftJoin(users, eq(players.parentId, users.id))
      .orderBy(players.firstName);
    
    if (ageGroup && ageGroup !== 'all') {
      query = query.where(eq(players.ageGroup, ageGroup));
    }
    
    // Add academy filter if in academy context
    if (this.currentAcademyId) {
      query = query.where(eq(players.academyId, this.currentAcademyId));
    }
    
    return await query;
  }

  async createPlayer(playerData: any): Promise<any> {
    if (this.currentAcademyId && !playerData.academyId) {
      playerData.academyId = this.currentAcademyId;
    }
    
    return super.createPlayer(playerData);
  }

  /**
   * Override session methods to add academy context
   */
  async getSessionById(id: number): Promise<any> {
    let query = db
      .select({
        ...sessions,
        coachName: users.fullName,
      })
      .from(sessions)
      .leftJoin(users, eq(sessions.coachId, users.id))
      .where(eq(sessions.id, id));
    
    if (this.currentAcademyId) {
      query = query.where(eq(sessions.academyId, this.currentAcademyId));
    }
    
    const result = await query;
    return result[0];
  }

  async createSession(sessionData: any): Promise<any> {
    if (this.currentAcademyId && !sessionData.academyId) {
      sessionData.academyId = this.currentAcademyId;
    }
    
    return super.createSession(sessionData);
  }

  /**
   * Override meal plan methods to add academy context
   */
  async getMealPlanById(id: number): Promise<any> {
    let query = db.select().from(mealPlans).where(eq(mealPlans.id, id));
    
    if (this.currentAcademyId) {
      query = query.where(eq(mealPlans.academyId, this.currentAcademyId));
    }
    
    const result = await query;
    
    if (result[0]) {
      const items = await db
        .select()
        .from(mealPlans)
        .where(eq(mealPlans.id, id));
      
      return {
        ...result[0],
        items,
      };
    }
    
    return undefined;
  }

  async createMealPlan(mealPlanData: any): Promise<any> {
    if (this.currentAcademyId && !mealPlanData.academyId) {
      mealPlanData.academyId = this.currentAcademyId;
    }
    
    return super.createMealPlan(mealPlanData);
  }

  /**
   * Override announcement methods to add academy context
   */
  async getAnnouncementById(id: number): Promise<any> {
    let query = db
      .select({
        ...announcements,
        createdByName: users.fullName,
      })
      .from(announcements)
      .leftJoin(users, eq(announcements.createdBy, users.id))
      .where(eq(announcements.id, id));
    
    if (this.currentAcademyId) {
      query = query.where(eq(announcements.academyId, this.currentAcademyId));
    }
    
    const result = await query;
    return result[0];
  }

  async getRecentAnnouncements(limit: number = 5): Promise<any[]> {
    let query = db
      .select({
        ...announcements,
        createdByName: users.fullName,
      })
      .from(announcements)
      .leftJoin(users, eq(announcements.createdBy, users.id));
    
    if (this.currentAcademyId) {
      query = query.where(eq(announcements.academyId, this.currentAcademyId));
    }
    
    return await query.limit(limit);
  }

  async createAnnouncement(announcementData: any): Promise<any> {
    if (this.currentAcademyId && !announcementData.academyId) {
      announcementData.academyId = this.currentAcademyId;
    }
    
    return super.createAnnouncement(announcementData);
  }

  /**
   * Override payment methods to add academy context
   */
  async getPaymentById(id: number): Promise<any> {
    let query = db
      .select({
        ...payments,
        playerFirstName: players.firstName,
        playerLastName: players.lastName,
      })
      .from(payments)
      .leftJoin(players, eq(payments.playerId, players.id))
      .where(eq(payments.id, id));
    
    if (this.currentAcademyId) {
      query = query.where(eq(payments.academyId, this.currentAcademyId));
    }
    
    const result = await query;
    return result[0];
  }

  async createPayment(paymentData: any): Promise<any> {
    if (this.currentAcademyId && !paymentData.academyId) {
      paymentData.academyId = this.currentAcademyId;
    }
    
    return super.createPayment(paymentData);
  }

  /**
   * Override connection request methods to add academy context
   */
  async getConnectionRequestById(id: number): Promise<any> {
    let query = db.select().from(connectionRequests).where(eq(connectionRequests.id, id));
    
    if (this.currentAcademyId) {
      query = query.where(eq(connectionRequests.academyId, this.currentAcademyId));
    }
    
    const result = await query;
    return result[0];
  }

  async createConnectionRequest(requestData: any): Promise<any> {
    if (this.currentAcademyId && !requestData.academyId) {
      requestData.academyId = this.currentAcademyId;
    }
    
    return super.createConnectionRequest(requestData);
  }
}

// Create a singleton instance
export const multiTenantStorage = new MultiTenantStorage();