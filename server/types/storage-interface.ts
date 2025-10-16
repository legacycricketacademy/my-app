// Comprehensive interface for MultiTenantStorage
export interface IMultiTenantStorage {
  // User management methods
  getUser(id: number): Promise<any>;
  getUserByEmail(email: string): Promise<any>;
  getUserByUsername(username: string): Promise<any>;
  getUserByFirebaseUid(firebaseUid: string): Promise<any>;
  createUser(userData: any): Promise<any>;
  updateUser(id: number, userData: any): Promise<any>;
  updateUserPassword(userId: number, password: string): Promise<any>;
  updateUserFirebaseUid(userId: number, firebaseUid: string): Promise<any>;
  
  // Session management methods
  validateSession(userId: number, sessionId: string, tokenVersion: number): Promise<boolean>;
  createSession(userId: number, sessionId: string): Promise<void>;
  invalidateSession(userId: number, sessionId: string): Promise<void>;
  updateLastLogin(userId: number): Promise<void>;
  
  // Password reset methods
  savePasswordResetToken(userId: number, token: string, expiresAt: Date): Promise<void>;
  verifyPasswordResetToken(token: string): Promise<any>;
  invalidatePasswordResetToken(token: string): Promise<void>;
  
  // Academy methods
  getAcademy(id: number): Promise<any>;
  getAcademyById(id: number): Promise<any>;
  getAcademyBySlug(slug: string): Promise<any>;
  
  // Player methods
  getPlayerById(id: number): Promise<any>;
  getPlayersByParentId(parentId: number): Promise<any[]>;
  getAllPlayers(ageGroup?: string): Promise<any[]>;
  createPlayer(playerData: any): Promise<any>;
  updatePlayer(id: number, playerData: any): Promise<any>;
  deletePlayer(id: number): Promise<boolean>;
  
  // Session methods
  getSessionById(id: number): Promise<any>;
  getAllSessions(ageGroup?: string): Promise<any[]>;
  createSession(sessionData: any): Promise<any>;
  updateSession(id: number, sessionData: any): Promise<any>;
  deleteSession(id: number): Promise<boolean>;
  
  // Payment methods
  getPaymentById(id: number): Promise<any>;
  getPaymentsByPlayerId(playerId: number): Promise<any[]>;
  getPaymentsByCoachId(coachId: number): Promise<any[]>;
  getPaymentsByParentId(parentId: number): Promise<any[]>;
  createPayment(paymentData: any): Promise<any>;
  updatePaymentStatus(id: number, status: string, paidDate?: Date): Promise<any>;
  
  // Fitness methods
  getFitnessRecordsByPlayerId(playerId: number): Promise<any[]>;
  createFitnessRecord(recordData: any): Promise<any>;
  getTeamFitnessProgress(ageGroup?: string, period?: string): Promise<any>;
  
  // Meal plan methods
  getMealPlanById(id: number): Promise<any>;
  getMealPlansByAgeGroup(ageGroup: string): Promise<any[]>;
  createMealPlan(mealPlanData: any): Promise<any>;
  
  // Announcement methods
  getAnnouncementById(id: number): Promise<any>;
  getRecentAnnouncements(limit?: number): Promise<any[]>;
  createAnnouncement(announcementData: any): Promise<any>;
  
  // Connection request methods
  getConnectionRequestById(id: number): Promise<any>;
  getConnectionRequestsByParentId(parentId: number): Promise<any[]>;
  getAllConnectionRequests(status?: string): Promise<any[]>;
  createConnectionRequest(requestData: any): Promise<any>;
  updateConnectionRequest(id: number, data: any): Promise<any>;
  
  // Audit methods
  createAuditLog(logEntry: any): Promise<void>;
  
  // Stats methods
  getDashboardStats(userId: number, userRole: string): Promise<any>;
  getAcademyStats(academyId: number): Promise<any>;
  
  // Stripe methods
  updateStripeCustomerId(userId: number, stripeCustomerId: string): Promise<any>;
  updateStripeSubscriptionId(userId: number, subscriptionId: string): Promise<any>;
  updateUserStripeInfo(userId: number, data: { stripeCustomerId: string; stripeSubscriptionId: string }): Promise<any>;
}
