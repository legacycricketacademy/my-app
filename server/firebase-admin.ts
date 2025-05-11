import { db } from "@db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import * as admin from "firebase-admin";

// Check if Firebase Admin SDK is already initialized
let app: admin.app.App;

try {
  app = admin.app();
} catch (e) {
  // Initialize Firebase Admin SDK with service account from environment variables
  const serviceAccount = {
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  };

  if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
    console.error("Firebase Admin SDK is not properly configured. Missing required environment variables.");
    throw new Error("Firebase Admin SDK configuration is incomplete");
  }

  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
  });
}

export const auth = app.auth();

/**
 * Verify Firebase ID token and get the user
 */
export async function verifyFirebaseToken(idToken: string) {
  try {
    return await auth.verifyIdToken(idToken);
  } catch (error) {
    console.error("Error verifying Firebase token:", error);
    throw error;
  }
}

/**
 * Get or create a user from Firebase auth data
 */
export async function getUserFromFirebaseAuth(decodedToken: admin.auth.DecodedIdToken, userData: {
  username?: string;
  fullName?: string;
  role?: string;
  phone?: string;
  academyId?: number;
}) {
  try {
    // First check if user already exists with this Firebase UID
    const existingUsers = await db.select().from(users)
      .where(eq(users.firebaseUid, decodedToken.uid));
    
    if (existingUsers.length > 0) {
      // User exists, return it
      return existingUsers[0];
    }
    
    // Check if user exists with same email
    const emailUsers = await db.select().from(users)
      .where(eq(users.email, decodedToken.email || ''));
    
    if (emailUsers.length > 0) {
      // User exists but without Firebase UID, update it
      const updatedUser = await db.update(users)
        .set({ 
          firebaseUid: decodedToken.uid,
          isEmailVerified: decodedToken.email_verified || false,
          status: decodedToken.email_verified ? 'active' : 'pending_verification',
          updatedAt: new Date()
        })
        .where(eq(users.id, emailUsers[0].id))
        .returning();
      
      return updatedUser[0];
    }
    
    // Create new user if necessary
    if (userData.username && userData.fullName) {
      // Generate a unique username if not provided
      const username = userData.username || `user_${Date.now()}`;
      
      // Determine appropriate status based on role
      let status = decodedToken.email_verified ? 'active' : 'pending_verification';
      let isActive = decodedToken.email_verified;
      
      // For coach and admin roles, override status to pending approval
      if (userData.role === 'coach' || userData.role === 'admin') {
        status = 'pending';
        isActive = false;
      }
      
      // Insert new user
      const insertData: any = {
        username: username,
        email: decodedToken.email || '',
        fullName: userData.fullName || decodedToken.name || username,
        role: userData.role || 'parent',
        phone: userData.phone,
        academyId: userData.academyId || null,
        isEmailVerified: decodedToken.email_verified || false,
        status: status,
        isActive: isActive,
        profileImage: decodedToken.picture,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Add Firebase UID
      insertData.firebaseUid = decodedToken.uid;
      
      const newUser = await db.insert(users)
        .values(insertData)
        .returning();
      
      return newUser[0];
    }
    
    // If we reach here, we don't have enough data to create a user
    throw new Error("Not enough information to create user");
  } catch (error) {
    console.error("Error handling Firebase user:", error);
    throw error;
  }
}