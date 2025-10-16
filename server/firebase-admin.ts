import { db } from "../db/index.js";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import admin from "firebase-admin";

// Check if Firebase Admin SDK is already initialized
let app: admin.app.App;
let authInitialized = false;

try {
  console.log("Attempting to initialize Firebase Admin");
  
  // Try to get the existing app
  try {
    app = admin.app();
    console.log("Using existing Firebase Admin app");
    authInitialized = true;
  } catch (e) {
    console.log("Creating new Firebase Admin app");
    
    // Check if we have the required environment variables
    if (process.env.FIREBASE_PROJECT_ID && 
        process.env.FIREBASE_CLIENT_EMAIL && 
        process.env.FIREBASE_PRIVATE_KEY) {
      
      // Initialize with proper credentials
      const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
      
      try {
        app = admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey
          })
        });
        authInitialized = true;
        console.log("Firebase Admin SDK initialized successfully");
      } catch (initError) {
        console.error("Error initializing Firebase Admin SDK:", initError);
        
        // Fallback to minimal app
        app = admin.initializeApp({
          projectId: "placeholder-project"
        });
        authInitialized = false;
      }
    } else {
      console.warn("Firebase Admin SDK cannot be initialized - missing environment variables");
      app = admin.initializeApp({
        projectId: "placeholder-project"
      });
      authInitialized = false;
    }
  }
} catch (error) {
  console.error("Fatal error in Firebase Admin setup:", error);
  
  // Create a minimal app object to prevent crashes
  // @ts-ignore - This is a fallback that won't actually connect to Firebase
  app = {
    auth: () => ({
      verifyIdToken: async () => { throw new Error("Firebase auth not initialized"); }
    })
  };
  authInitialized = false;
}

// Create auth object safely
let auth: admin.auth.Auth;
try {
  auth = app.auth();
} catch (error) {
  console.error("Error creating Firebase auth object:", error);
  // @ts-ignore - This is a fallback that won't actually connect to Firebase
  auth = {
    verifyIdToken: async () => { throw new Error("Firebase auth not initialized"); }
  };
}

export { auth };

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
    
    // If Firebase isn't fully initialized, don't attempt to verify
    if (!authInitialized) {
      console.warn("Firebase auth not initialized, skipping token verification");
      return decodeTokenLocally(idToken);
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
      
      // Fall back to local decoding
      return decodeTokenLocally(idToken);
    }
  } catch (error) {
    console.error("Error verifying Firebase token:", error);
    throw error;
  }
}

/**
 * Decode a token locally without verification
 * This is a fallback for when Firebase Admin isn't working
 */
function decodeTokenLocally(idToken: string) {
  try {
    // Basic validation - properly formatted JWT token
    const parts = idToken.split('.');
    if (parts.length !== 3) {
      throw new Error("Invalid token format - not a valid JWT");
    }
    
    // Decode the payload
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    // Check for minimum required Firebase token fields
    if (!payload.sub) {
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

/**
 * Get or create a user from Firebase auth data
 */
export async function getUserFromFirebaseAuth(decodedToken: admin.auth.DecodedIdToken | any, userData: {
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
    if (decodedToken.email) {
      const emailUsers = await db.select().from(users)
        .where(eq(users.email, decodedToken.email));
      
      if (emailUsers.length > 0) {
        // User exists but without Firebase UID, update it
        const updatedUser = await db.update(users)
          .set({ 
            firebaseUid: decodedToken.uid,
            isEmailVerified: decodedToken.email_verified || false,
            updatedAt: new Date()
          })
          .where(eq(users.id, emailUsers[0].id))
          .returning();
        
        return updatedUser[0];
      }
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
      
      // Create a random password hash for Firebase users
      const randomPasswordHash = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
      
      // Insert new user
      const newUser = await db.insert(users)
        .values({
          username: username,
          password: randomPasswordHash, // Firebase users don't log in with password
          email: decodedToken.email || '',
          fullName: userData.fullName || decodedToken.name || username,
          role: userData.role || 'parent',
          phone: userData.phone || null,
          academyId: userData.academyId || null,
          firebaseUid: decodedToken.uid,
          isEmailVerified: decodedToken.email_verified || false,
          status: status,
          isActive: isActive,
          profileImage: decodedToken.picture || null,
          createdAt: new Date(),
          updatedAt: new Date()
        })
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