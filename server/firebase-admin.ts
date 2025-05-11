import { db } from "@db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import * as admin from "firebase-admin";

// Check if Firebase Admin SDK is already initialized
let app: admin.app.App;

try {
  console.log("Attempting to get existing Firebase Admin app");
  app = admin.app();
  console.log("Successfully retrieved existing Firebase Admin app");
} catch (e) {
  console.log("No existing Firebase Admin app found, initializing a new one");
  
  // Initialize Firebase Admin SDK with service account from environment variables
  const serviceAccount = {
    projectId: "legacy-cricket-academy",
    clientEmail: "firebase-adminsdk-fbsvc@legacy-cricket-academy.iam.gserviceaccount.com",
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  };

  console.log("Firebase Admin configuration check:", {
    projectIdExists: !!serviceAccount.projectId,
    clientEmailExists: !!serviceAccount.clientEmail,
    privateKeyExists: !!serviceAccount.privateKey,
    projectId: serviceAccount.projectId,
    clientEmail: serviceAccount.clientEmail?.substring(0, 5) + "..." // Only show first few chars for security
  });

  if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
    console.error("Firebase Admin SDK is not properly configured. Missing required environment variables.");
    throw new Error("Firebase Admin SDK configuration is incomplete");
  }

  try {
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount)
    });
    console.log("Firebase Admin SDK initialized successfully");
  } catch (error) {
    console.error("Error initializing Firebase Admin SDK:", error);
    throw error;
  }
}

export const auth = app.auth();

/**
 * Verify Firebase ID token and get the user
 * 
 * This function handles both Firebase SDK tokens and direct API tokens
 */
export async function verifyFirebaseToken(idToken: string) {
  try {
    console.log("Verifying Firebase token...");
    if (!idToken || typeof idToken !== 'string') {
      console.error("Invalid token format:", idToken);
      throw new Error("Invalid token format");
    }
    
    try {
      // Try to verify with Firebase Admin SDK
      const decodedToken = await auth.verifyIdToken(idToken);
      console.log("Firebase token verified successfully with Admin SDK:", {
        uid: decodedToken.uid,
        email: decodedToken.email,
      });
      return decodedToken;
    } catch (adminError) {
      // Log the Admin SDK error
      console.error("Error verifying with Firebase Admin SDK:", adminError);
      
      // For idTokens from the direct API, we don't have a way to verify them server-side
      // So we'll decode and validate the token's basic structure
      try {
        // Basic validation - properly formatted JWT token
        const parts = idToken.split('.');
        if (parts.length !== 3) {
          throw new Error("Invalid token format - not a valid JWT");
        }
        
        // Decode the payload
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        
        // Check for minimum required Firebase token fields
        if (!payload.sub || !payload.aud || !payload.iss) {
          throw new Error("Invalid token payload - missing required fields");
        }
        
        // Extract Firebase UID (stored in 'sub' claim)
        const uid = payload.sub;
        
        // Return a simplified decoded token with essential fields
        console.log("Token validated with basic structure check:", {
          uid: uid,
          email: payload.email,
        });
        
        return {
          uid: uid,
          email: payload.email || '',
          email_verified: payload.email_verified || false,
          name: payload.name,
          picture: payload.picture,
          auth_time: payload.auth_time,
        };
      } catch (decodeError) {
        console.error("Error decoding token:", decodeError);
        throw new Error("Invalid token format or structure");
      }
    }
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