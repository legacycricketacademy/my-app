// Auth service for handling user authentication operations
import { storage } from "../storage";
import { verifyFirebaseToken } from "../firebase-admin";
import { z } from "zod";
import { InsertUser, insertUserSchema } from "@shared/schema";
import { 
  sendEmail, 
  generateVerificationEmail, 
  generateCoachPendingApprovalEmail,
  generateAdminCoachApprovalRequestEmail
} from "../email";

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

export interface FirebaseRegistrationInput {
  idToken: string;
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
  // First validate the minimal required fields
  if (!input.idToken) {
    throw new ValidationError("Firebase ID token is required");
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
  
  // Verify Firebase token
  let decodedToken;
  try {
    console.log("Verifying Firebase ID token...");
    decodedToken = await verifyFirebaseToken(input.idToken);
    
    if (!decodedToken || !decodedToken.uid) {
      throw new InvalidTokenError("Invalid or missing Firebase UID in token");
    }
    
    console.log(`Firebase token verified successfully for UID: ${decodedToken.uid}`);
  } catch (error) {
    console.error("Firebase token verification failed:", error);
    throw new InvalidTokenError("Failed to verify Firebase authentication token");
  }
  
  // Use the firebaseUid from the verified token
  const firebaseUid = decodedToken.uid;
  
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
      await storage.db.update(storage.schema.users)
        .set({ 
          emailStatus: "pending", 
          lastEmailAttempt: new Date() 
        })
        .where(eq(storage.schema.users.id, userId));
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
        await storage.db.update(storage.schema.users)
          .set({ 
            emailStatus: "sent", 
            lastEmailAttempt: new Date(),
            emailFailureReason: null
          })
          .where(eq(storage.schema.users.id, userId));
      } catch (dbError) {
        console.warn(`Failed to update email status to sent: ${dbError}`);
      }
      
      return true;
    } else {
      const failureReason = "Email service error - SENDGRID_API_KEY may be missing or invalid";
      console.warn(`Failed to send verification email to: ${maskEmail(email)} - ${failureReason}`);
      
      try {
        await storage.db.update(storage.schema.users)
          .set({ 
            emailStatus: "failed", 
            lastEmailAttempt: new Date(),
            emailFailureReason: failureReason
          })
          .where(eq(storage.schema.users.id, userId));
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
      await storage.db.update(storage.schema.users)
        .set({ 
          emailStatus: "failed", 
          lastEmailAttempt: new Date(),
          emailFailureReason: errorMessage
        })
        .where(eq(storage.schema.users.id, userId));
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
    
    // Generate approval link
    const approvalLink = `${appBaseUrl || ''}/admin/coaches-pending-approval`;
    
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