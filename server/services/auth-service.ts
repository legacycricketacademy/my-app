// Auth service for handling user authentication operations
import { storage } from "../storage";
import { verifyFirebaseToken } from "../firebase-admin";
import { z } from "zod";
import { InsertUser, insertUserSchema, users } from "@shared/schema";
import { 
  sendEmail, 
  generateVerificationEmail, 
  generateCoachPendingApprovalEmail,
  generateAdminCoachApprovalRequestEmail
} from "../email";
import { eq } from "drizzle-orm";
import { db } from "../../db/index.js";

// Custom error classes for better error handling
export class AuthError extends Error {
  statusCode: number;
  code?: string;
  
  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class InvalidTokenError extends AuthError {
  constructor(message: string = "Invalid or expired token") {
    super(message, 401, "invalid_token");
    this.name = 'InvalidTokenError';
  }
}

export class ValidationError extends AuthError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 400, "validation_error");
    this.name = 'ValidationError';
    Object.assign(this, { details });
  }
}

export class UserExistsError extends AuthError {
  constructor(type: "username" | "email" | "both") {
    const messages = {
      username: "Username already exists",
      email: "Email is already registered",
      both: "User already exists with this username or email"
    };
    super(messages[type], 400, `${type}_exists`);
    this.name = 'UserExistsError';
  }
}

export class EmailAlreadyRegisteredError extends AuthError {
  constructor(email?: string) {
    const maskedEmail = email ? maskEmail(email) : '';
    super(
      `Email ${maskedEmail ? maskedEmail + ' ' : ''}is already registered. Please login instead.`, 
      409, 
      "email_already_registered"
    );
    this.name = 'EmailAlreadyRegisteredError';
  }
}

export class DatabaseError extends AuthError {
  constructor(message: string, code?: string) {
    super(message, 500, code || "database_error");
    this.name = 'DatabaseError';
  }
}

export class EmailError extends AuthError {
  constructor(message: string = "Failed to send email") {
    super(message, 500, "email_error");
    this.name = 'EmailError';
  }
}

export class WeakPasswordError extends AuthError {
  constructor(message: string = "Password does not meet security requirements") {
    super(message, 400, "weak_password");
    this.name = 'WeakPasswordError';
  }
}

// Password validation function that matches our frontend criteria
export function isStrongPassword(password: string): boolean {
  // Check minimum length
  if (password.length < 8) return false;
  
  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) return false;
  
  // Check for lowercase letter
  if (!/[a-z]/.test(password)) return false;
  
  // Check for number
  if (!/[0-9]/.test(password)) return false;
  
  // Check for special character
  if (!/[^A-Za-z0-9]/.test(password)) return false;
  
  return true;
}

// Function to validate password with detailed error message
export function validatePassword(password: string): { valid: boolean; message?: string } {
  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters long" };
  }
  
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "Password must include at least one uppercase letter" };
  }
  
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: "Password must include at least one lowercase letter" };
  }
  
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Password must include at least one number" };
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { valid: false, message: "Password must include at least one special character" };
  }
  
  return { valid: true };
}

export interface FirebaseRegistrationInput {
  idToken?: string;
  firebaseUid?: string;  // Allow direct UID when idToken is not available
  username: string;
  email: string;
  fullName: string;
  role?: "superadmin" | "admin" | "coach" | "parent" | undefined;
  phone?: string | null;
  academyId?: number | null;
}

export interface RegistrationOptions {
  appBaseUrl?: string;
}

export interface RegisterFirebaseUserResult {
  user: any;
  emailSent: boolean;
  isNewUser: boolean;
}

// Mask email for logging - replace middle part with asterisks
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '[invalid-email]';
  
  const [username, domain] = email.split('@');
  if (username.length <= 3) return `${username}***@${domain}`;
  
  const visiblePart = username.substring(0, 3);
  return `${visiblePart}${'*'.repeat(username.length - 3)}@${domain}`;
}

/**
 * Handles the complete registration flow for a Firebase-authenticated user
 */
export async function registerFirebaseUser(
  input: FirebaseRegistrationInput,
  options: RegistrationOptions = {}
): Promise<RegisterFirebaseUserResult> {
  // First validate the minimal required fields - either idToken or firebaseUid is required
  if (!input.idToken && !input.firebaseUid) {
    throw new ValidationError("Either Firebase ID token or Firebase UID is required");
  }
  
  if (!input.username || !input.email || !input.fullName) {
    throw new ValidationError("Missing required user information", {
      username: !input.username ? "Username is required" : null,
      email: !input.email ? "Email is required" : null,
      fullName: !input.fullName ? "Full name is required" : null
    });
  }
  
  const maskedEmail = maskEmail(input.email);
  console.log(`Starting Firebase registration for: ${input.username}, ${maskedEmail}`);
  
  // Special debugging for problematic email
  const isProblematicEmail = input.email === "haumankind@chapsmail.com";
  if (isProblematicEmail) {
    console.log("🔍 SERVER SIDE: Special debugging for haumankind@chapsmail.com");
    console.log("- Input data:", {
      username: input.username,
      email: input.email,
      fullName: input.fullName,
      role: input.role,
      hasIdToken: !!input.idToken,
      hasFirebaseUid: !!input.firebaseUid,
      academyId: input.academyId
    });
  }
  
  // Get Firebase UID - either from token verification or direct input
  let firebaseUid: string;
  
  if (input.idToken) {
    // Verify Firebase token if provided
    try {
      console.log("Verifying Firebase ID token...");
      
      if (isProblematicEmail) {
        console.log("🔍 Attempting to verify Firebase token for haumankind@chapsmail.com");
      }
      
      const decodedToken = await verifyFirebaseToken(input.idToken as string);
      
      if (!decodedToken || !decodedToken.uid) {
        if (isProblematicEmail) {
          console.log("🔍 Token verification returned empty or invalid result:", decodedToken);
        }
        throw new InvalidTokenError("Invalid or missing Firebase UID in token");
      }
      
      firebaseUid = decodedToken.uid;
      
      if (isProblematicEmail) {
        console.log("🔍 Firebase token verified successfully for haumankind@chapsmail.com");
        console.log("- Decoded token data:", {
          uid: decodedToken.uid,
          email: decodedToken.email,
          emailVerified: decodedToken.email_verified,
          name: decodedToken.name,
          provider: decodedToken.firebase?.sign_in_provider
        });
      }
      
      console.log(`Firebase token verified successfully for UID: ${firebaseUid}`);
    } catch (error) {
      console.error("Firebase token verification failed:", error);
      
      if (isProblematicEmail) {
        console.log("🔍 Token verification FAILED for haumankind@chapsmail.com");
        console.log("- Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack,
          code: error.code,
          internal: JSON.stringify(error)
        });
      }
      
      throw new InvalidTokenError("Failed to verify Firebase authentication token");
    }
  } else if (input.firebaseUid) {
    // Use directly provided Firebase UID
    firebaseUid = input.firebaseUid;
    console.log(`Using directly provided Firebase UID: ${firebaseUid}`);
    
    if (isProblematicEmail) {
      console.log("🔍 Using DIRECT Firebase UID for haumankind@chapsmail.com");
      console.log("- Firebase UID:", firebaseUid);
      
      // Validate the UID format to catch obvious issues
      if (!firebaseUid || firebaseUid.length < 20) {
        console.log("⚠️ WARNING: Firebase UID appears to be invalid (too short)");
      } else if (!/^[a-zA-Z0-9]+$/.test(firebaseUid)) {
        console.log("⚠️ WARNING: Firebase UID contains non-alphanumeric characters");
      } else {
        console.log("✅ Firebase UID format appears valid");
      }
    }
  } else {
    // This should never happen due to the earlier validation
    if (isProblematicEmail) {
      console.log("🔍 CRITICAL ERROR: No Firebase authentication for haumankind@chapsmail.com");
      console.log("- No idToken or firebaseUid provided");
    }
    throw new ValidationError("Firebase authentication information is missing");
  }
  
  // Check for existing user by Firebase UID (make registration idempotent)
  const existingUserByUid = await storage.getUserByFirebaseUid(firebaseUid);
  if (existingUserByUid) {
    console.log(`User already exists with Firebase UID: ${firebaseUid}`);
    return {
      user: existingUserByUid,
      emailSent: false,
      isNewUser: false
    };
  }
  
  // Check if username or email already exists
  const existingUser = await storage.getUserByUsername(input.username);
  if (existingUser) {
    throw new UserExistsError("username");
  }
  
  const existingEmail = await storage.getUserByEmail(input.email);
  if (existingEmail) {
    // Use the more specific EmailAlreadyRegisteredError with HTTP 409
    throw new EmailAlreadyRegisteredError(input.email);
  }
  
  // Determine status based on role
  let status = "active";
  let isActive = true;
  
  if (input.role === "coach" || input.role === "admin") {
    status = "pending_approval";  // Use "pending_approval" to match UI expectations
    isActive = false;
  }
  
  // Prepare user data
  const userData: InsertUser = {
    academyId: input.academyId || null,
    firebaseUid,
    username: input.username,
    email: input.email,
    fullName: input.fullName,
    role: input.role || "parent",
    status,
    isActive,
    phone: input.phone || null,
    password: null // No password needed for Firebase auth
  };
  
  // Validate with schema
  try {
    console.log("Validating user data...");
    insertUserSchema.parse(userData);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.reduce((acc, err) => {
        const path = err.path.join('.');
        acc[path] = err.message;
        return acc;
      }, {} as Record<string, string>);
      
      throw new ValidationError("Invalid user data", formattedErrors);
    }
    throw error;
  }
  
  // Create user in database
  console.log(`Creating user in database with Firebase UID: ${firebaseUid}`);
  let user;
  try {
    user = await storage.createUser(userData);
    console.log(`User created successfully with ID: ${user.id}`);
  } catch (error: any) {
    console.error("Error creating user:", error);
    // Handle PostgreSQL constraint violations
    if (error.code === '23505') { // PostgreSQL unique violation error
      throw new DatabaseError(
        "Database constraint violation. User might already exist.",
        "unique_violation"
      );
    }
    throw new DatabaseError("Failed to create user account", error.code);
  }
  
  // Send appropriate emails based on user role
  let emailSent = false;
  try {
    if (input.role === "coach") {
      emailSent = await sendCoachEmails(input.email, input.fullName, options.appBaseUrl);
    } else if (input.role === "parent" || !input.role) {
      emailSent = await sendParentVerificationEmail(
        user.id, 
        input.email, 
        input.fullName, 
        options.appBaseUrl
      );
    }
  } catch (error) {
    console.error("Error sending registration emails:", error);
    // Continue even if emails fail - don't block registration
  }
  
  return {
    user,
    emailSent,
    isNewUser: true
  };
}

/**
 * Resend a verification email to a user
 */
export async function resendVerificationEmail(userId: number, appBaseUrl?: string): Promise<boolean> {
  try {
    const user = await storage.getUser(userId);
    
    if (!user) {
      console.error(`Cannot resend verification email - user not found: ${userId}`);
      return false;
    }
    
    if (user.isEmailVerified) {
      console.log(`User ${maskEmail(user.email)} is already verified, no need to resend`);
      return true;
    }
    
    return await sendParentVerificationEmail(userId, user.email, user.fullName, appBaseUrl);
  } catch (error) {
    console.error(`Failed to resend verification email for user ${userId}:`, error);
    return false;
  }
}

/**
 * Send verification emails to newly registered parents
 */
async function sendParentVerificationEmail(
  userId: number,
  email: string,
  fullName: string,
  appBaseUrl?: string
): Promise<boolean> {
  try {
    console.log(`Sending verification email to parent: ${maskEmail(email)}`);
    
    // First, update the database to indicate we're attempting to send an email
    try {
      await db.update(users)
        .set({ 
          emailStatus: "pending", 
          lastEmailAttempt: new Date() 
        })
        .where(eq(users.id, userId));
    } catch (dbError) {
      console.warn(`Failed to update email status to pending: ${dbError}`);
      // Continue trying to send the email anyway
    }
    
    // This function comes from the main app
    const generateVerificationToken = (global as any).generateVerificationToken;
    if (!generateVerificationToken) {
      throw new Error("Token generation function not available");
    }
    
    const verificationToken = generateVerificationToken(userId, email);
    const verificationLink = `${appBaseUrl || ''}/verify-email?token=${verificationToken}`;
    
    const { text, html } = generateVerificationEmail(fullName, verificationLink);
    
    // Try to send the verification email
    const result = await sendEmail({
      to: email,
      subject: "Verify Your Email Address for Legacy Cricket Academy",
      text,
      html
    });
    
    // Update the database with the result of our attempt
    if (result) {
      console.log(`Verification email sent successfully to: ${maskEmail(email)}`);
      
      try {
        await db.update(users)
          .set({ 
            emailStatus: "sent", 
            lastEmailAttempt: new Date(),
            emailFailureReason: null
          })
          .where(eq(users.id, userId));
      } catch (dbError) {
        console.warn(`Failed to update email status to sent: ${dbError}`);
      }
      
      return true;
    } else {
      const failureReason = "Email service error - SENDGRID_API_KEY may be missing or invalid";
      console.warn(`Failed to send verification email to: ${maskEmail(email)} - ${failureReason}`);
      
      try {
        await db.update(users)
          .set({ 
            emailStatus: "failed", 
            lastEmailAttempt: new Date(),
            emailFailureReason: failureReason
          })
          .where(eq(users.id, userId));
      } catch (dbError) {
        console.warn(`Failed to update email status to failed: ${dbError}`);
      }
      
      // In development, allow registration without email for testing
      if (process.env.NODE_ENV === 'development') {
        console.log('DEVELOPMENT MODE: Continuing without email verification');
        return true;
      }
      
      return false;
    }
  } catch (error) {
    console.error(`Failed to send verification email to: ${maskEmail(email)}`, error);
    
    // Record the error in the database
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    try {
      await db.update(users)
        .set({ 
          emailStatus: "failed", 
          lastEmailAttempt: new Date(),
          emailFailureReason: errorMessage
        })
        .where(eq(users.id, userId));
    } catch (dbError) {
      console.error("Failed to update email status in database:", dbError);
    }
    
    return false;
  }
}

/**
 * Send notification emails for coach registrations (to both coach and admin)
 */
async function sendCoachEmails(
  email: string,
  fullName: string,
  appBaseUrl?: string
): Promise<boolean> {
  try {
    // Send email to coach about pending approval
    const coachEmailContent = generateCoachPendingApprovalEmail(fullName);
    
    await sendEmail({
      to: email,
      subject: "Your Coach Registration Status - Pending Approval",
      text: coachEmailContent.text,
      html: coachEmailContent.html
    });
    
    console.log(`Sent coach pending approval email to: ${maskEmail(email)}`);
    
    // Also notify admin about new coach
    const adminEmail = "madhukar.kcc@gmail.com"; // Administrator email
    
    // Generate approval link - ensure it works both locally and on deployed sites
    // Uses the coaches-pending-approval route which is defined in App.tsx
    const approvalLink = `${appBaseUrl || ''}/coaches-pending-approval`;
    
    const adminEmailContent = generateAdminCoachApprovalRequestEmail(
      "Administrator", // Admin name
      fullName,
      email,
      approvalLink
    );
    
    await sendEmail({
      to: adminEmail,
      subject: "New Coach Registration Requires Approval",
      text: adminEmailContent.text,
      html: adminEmailContent.html
    });
    
    console.log(`Sent admin notification email about coach registration`);
    return true;
  } catch (error) {
    console.error(`Failed to send coach notification emails for: ${maskEmail(email)}`, error);
    return false;
  }
}