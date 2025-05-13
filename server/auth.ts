import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { multiTenantStorage } from "./multi-tenant-storage";
import { User as SelectUser, users, userAuditLogs } from "@shared/schema";
import { db } from "@db";
import { generateVerificationEmail, sendEmail } from "./email";
import {
  authenticate,
  authorize,
  generateSessionId,
  createSessionTokens,
  verifyAccessToken,
  verifyRefreshToken,
  refreshTokens,
  setSessionCookies,
  clearSessionCookies
} from "./services/session-service";
import {
  createAuditLog,
  auditSuccessfulLogin,
  auditFailedLogin,
  auditPasswordReset,
  auditRegistration
} from "./services/audit-service";

// Define global types for token functions
declare global {
  namespace NodeJS {
    interface Global {
      generateToken: (payload: any, expiresInMs: number) => string;
      verifyToken: (token: string) => { valid: boolean; payload?: any };
      generateVerificationToken: (userId: number, email: string) => string;
      verifyVerificationToken: (token: string) => { valid: boolean; userId?: number; email?: string };
      generateInvitationToken: (playerId: number, parentEmail: string) => string;
      verifyInvitationToken: (token: string) => { valid: boolean; playerId?: number; email?: string };
      generatePasswordResetToken: (userId: number, email: string) => string;
      verifyPasswordResetToken: (token: string) => { valid: boolean; userId?: number; email?: string };
    }
  }
}
import { eq, and } from "drizzle-orm";
import jwt from "jsonwebtoken";

declare global {
  namespace Express {
    interface User extends SelectUser {}
    // Extend the Request interface to include user and academyId
    interface Request {
      user?: User;
      academyId?: number;
    }
  }
}

// JWT Secret configuration
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "cricket-academy-access-jwt-secret";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "cricket-academy-refresh-jwt-secret";
const JWT_ACCESS_EXPIRY = '15m';  // 15 minutes
const JWT_REFRESH_EXPIRY = '30d'; // 30 days

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "cricket-academy-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log(`Login attempt with username: ${username}`);
        
        // Try to find user with multi-tenant storage first
        let user = await multiTenantStorage.getUserByUsername(username);
        
        // If user not found with current academy context, check without context
        if (!user) {
          console.log(`User ${username} not found in current academy context, trying all academies`);
          // Reset academy context to null to search across all academies
          const currentContext = multiTenantStorage.getAcademyContext();
          multiTenantStorage.setAcademyContext(null);
          
          user = await multiTenantStorage.getUserByUsername(username);
          
          // Restore original context
          multiTenantStorage.setAcademyContext(currentContext);
        }
        
        // If still no user found, return unauthorized
        if (!user) {
          console.log(`No user found with username: ${username}`);
          return done(null, false, { message: "Incorrect username or password" });
        }
        
        // Check if password is correct
        const passwordValid = await comparePasswords(password, user.password);
        console.log(`Password check for ${username}: ${passwordValid ? 'valid' : 'invalid'}`);
        
        if (!passwordValid) {
          return done(null, false, { message: "Incorrect username or password" });
        }
        
        // Log full user object for debugging (except password)
        const { password: pw, ...userDebug } = user;
        console.log(`Login successful for ${username}, user details:`, userDebug);
        
        // Check if the user account is active
        if (user.role === "coach" && user.status === "pending") {
          return done(null, false, { message: "Your coach account is pending approval. Please contact an administrator." });
        }
        
        // If all checks pass, allow login
        // Set the academy context for this user
        if (user.academyId) {
          multiTenantStorage.setAcademyContext(user.academyId);
        }
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    // Store both user ID and academy ID in the session
    done(null, { 
      userId: user.id, 
      academyId: user.academyId || multiTenantStorage.getAcademyContext() 
    });
  });
  
  passport.deserializeUser(async (data: { userId: number, academyId?: number }, done) => {
    try {
      // Set academy context if available
      if (data.academyId) {
        multiTenantStorage.setAcademyContext(data.academyId);
      }
      
      // Get user from storage with academy context
      const user = await multiTenantStorage.getUser(data.userId);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    // Determine if this is a debug request
    const isDebugMode = req.headers['x-debug-mode'] === 'true';
    
    // Set a response timeout to ensure we always send something back
    const responseTimeout = setTimeout(() => {
      if (!res.headersSent) {
        console.error("Registration request timed out after 20 seconds!");
        res.status(500).json({ message: "Registration request timed out" });
      }
    }, 20000);
    
    // Log verbose request details if in debug mode
    if (isDebugMode) {
      console.log("============ DEBUG REGISTRATION START ============");
      console.log("Headers:", req.headers);
      console.log("Session:", req.session ? "exists" : "none");
      console.log("Academy context:", req.academyId || "none");
    }
    
    console.log("Registration request received:", {
      ...req.body,
      password: req.body.password ? "[REDACTED]" : undefined
    });
    
    // Check for missing required fields early
    if (!req.body.username || !req.body.password || !req.body.email || !req.body.fullName || !req.body.role) {
      clearTimeout(responseTimeout); // Clear timeout since we're responding
      return res.status(400).json({ 
        message: "Missing required fields", 
        missing: Object.entries({
          username: !req.body.username,
          password: !req.body.password,
          email: !req.body.email,
          fullName: !req.body.fullName,
          role: !req.body.role
        }).filter(([_, missing]) => missing).map(([field]) => field)
      });
    }
    
    try {
      // Enhanced validation with more detailed error checking
      const requiredFields = ['username', 'password', 'email', 'fullName', 'role'];
      
      // 1. Check required fields are present
      const missingFields = requiredFields.filter(field => !req.body[field]);
      if (missingFields.length > 0) {
        console.error(`Registration failed: Missing required fields: ${missingFields.join(', ')}`);
        return res.status(400).json({ 
          message: `Missing required fields: ${missingFields.join(', ')}`,
          fields: missingFields
        });
      }
      
      // 2. Validate specific field formats
      if (req.body.username && req.body.username.length < 3) {
        console.error(`Registration failed: Username too short (${req.body.username.length} chars)`);
        return res.status(400).json({
          message: "Username must be at least 3 characters long",
          field: "username"
        });
      }
      
      if (req.body.password && req.body.password.length < 6) {
        console.error(`Registration failed: Password too short (${req.body.password.length} chars)`);
        return res.status(400).json({
          message: "Password must be at least 6 characters long",
          field: "password"
        });
      }
      
      // Basic email validation regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (req.body.email && !emailRegex.test(req.body.email)) {
        console.error(`Registration failed: Invalid email format (${req.body.email})`);
        return res.status(400).json({
          message: "Please enter a valid email address",
          field: "email"
        });
      }
      
      // If no academyId was provided in the request but we have it in the context, add it
      if (!req.body.academyId && req.academyId) {
        console.log(`Using academy ID ${req.academyId} from context`);
        req.body.academyId = req.academyId;
      } else if (!req.body.academyId) {
        // Default to academy ID 1 if not specified
        console.log("No academy ID provided, defaulting to 1");
        req.body.academyId = 1;
      }
      
      console.log(`Registration for academy ID: ${req.body.academyId}`);
      
      // Check for existing user in the current academy context
      console.log(`Checking if username '${req.body.username}' already exists...`);
      const existingUser = await multiTenantStorage.getUserByUsername(req.body.username);
      if (existingUser) {
        console.error(`Registration failed: Username '${req.body.username}' already exists`);
        return res.status(400).json({ 
          message: "Username already exists in this academy",
          field: "username" 
        });
      }

      console.log(`Checking if email '${req.body.email}' already exists...`);
      const existingEmail = await multiTenantStorage.getUserByEmail(req.body.email);
      if (existingEmail) {
        // Check if this is a Firebase account (has firebase_uid)
        if (existingEmail.firebaseUid) {
          console.log(`Registration failed: Email '${req.body.email}' is registered with Google authentication`);
          return res.status(400).json({ 
            message: "This email is already registered with Google. Please use Google Sign-In instead.",
            field: "email",
            authMethod: "google"
          });
        } else {
          // Regular case - email already in use with direct registration
          console.error(`Registration failed: Email '${req.body.email}' already in use`);
          return res.status(400).json({ 
            message: "Email already in use. Please use a different email or try logging in.",
            field: "email" 
          });
        }
      }

      // Check if phone number is provided and if it's already in use
      if (req.body.phone) {
        console.log(`Checking if phone '${req.body.phone}' already exists...`);
        try {
          const existingUsers = await db.select().from(users)
            .where(and(
              eq(users.phone, req.body.phone),
              req.body.academyId ? eq(users.academyId, req.body.academyId) : undefined
            ))
            .limit(1);
            
          if (existingUsers.length > 0) {
            console.error(`Registration failed: Phone '${req.body.phone}' already registered`);
            return res.status(400).json({ 
              message: "Phone number already registered in this academy",
              field: "phone" 
            });
          }
        } catch (err) {
          console.error("Error checking phone number:", err);
          // Continue with registration even if phone check fails - not critical
        }
      }
      
      // Create new user with hashed password
      console.log("About to hash password for registration...");
      let userData;
      try {
        const hashedPassword = await hashPassword(req.body.password);
        console.log("Password hashed successfully");
        userData = {
          ...req.body,
          password: hashedPassword,
          isEmailVerified: false,
        };
      } catch (error) {
        const hashError = error as Error;
        console.error("Failed to hash password:", hashError);
        clearTimeout(responseTimeout);
        return res.status(500).json({ 
          message: "Error creating account - password processing failed",
          error: hashError.message
        });
      }
      
      // Check role and set appropriate status
      console.log(`Setting up user with role: ${userData.role}`);
      if (userData.role === "admin") {
        // Admin accounts should be pending until approved by superadmin
        console.log("Admin registration - setting status to pending");
        userData = {
          ...userData,
          status: "pending", 
          isActive: false
        };
      } else if (userData.role === "coach") {
        console.log("Coach registration - setting status to pending");
        userData = {
          ...userData,
          status: "pending", // Coaches need admin approval
          isActive: false    // Inactive until approved
        };
      } else if (userData.role === "parent") {
        console.log("Parent registration - setting status to active");
        userData = {
          ...userData,
          status: "active", // Parents are automatically approved
          isActive: true
        };
      } else {
        console.log(`Unknown role: ${userData.role}, defaulting to parent`);
        userData = {
          ...userData,
          role: "parent",
          status: "active",
          isActive: true
        };
      }

      // Set academy context before creating user
      console.log(`Setting academy context to ${userData.academyId} for user creation`);
      multiTenantStorage.setAcademyContext(userData.academyId);
      
      // Create the user in the database
      console.log("Creating user in database...");
      
      try {
        const user = await multiTenantStorage.createUser(userData);
        console.log("User created successfully:", { userId: user.id, username: user.username });
      
        // Generate a verification token directly
        let verificationLink = '';
        try {
          console.log("Generating verification token...");
          // Generate token for email verification
          // This is the same implementation as in routes.ts
          const generateToken = (payload: any, expiresInMs: number): string => {
            const tokenPayload = {
              ...payload,
              expires: Date.now() + expiresInMs
            };
            return Buffer.from(JSON.stringify(tokenPayload)).toString('base64');
          };
          
          // Generate verification token (24 hour expiration)
          const token = generateToken(
            { userId: user.id, email: user.email },
            24 * 60 * 60 * 1000
          );
          
          const baseUrl = `${req.protocol}://${req.get('host')}`;
          // Fix: Point to frontend verification page instead of API endpoint
          verificationLink = `${baseUrl}/verify-email?token=${token}`;
          console.log("Verification link generated:", verificationLink);
          
          // Generate email content
          console.log("Generating verification email...");
          const { text, html } = generateVerificationEmail(user.fullName, verificationLink);
          
          // Send verification email
          console.log(`Attempting to send verification email to ${user.email}...`);
          const emailSent = await sendEmail({
            to: user.email,
            subject: "Verify Your Email Address for Legacy Cricket Academy",
            text,
            html
          });
          
          // Log email status but continue with registration regardless
          if (emailSent) {
            console.log(`✓ Verification email successfully sent to ${user.email}`);
          } else {
            console.warn(`⚠️ Failed to send verification email to ${user.email}`);
          }
        } catch (emailError) {
          console.error('Error in verification email process:', emailError);
          // Continue with registration even if email fails
        }
        
        // Log the user activity
        try {
          console.log("Creating audit log entry...");
          // Import userAuditLogs directly to avoid TypeScript issues
          const { userAuditLogs } = require("@shared/schema");
          await db.insert(userAuditLogs).values({
            userId: user.id,
            academyId: user.academyId,
            actionType: 'register',
            actionDetails: { role: user.role, status: user.status },
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
          });
          console.log("Audit log created successfully");
        } catch (auditError) {
          console.error('Error creating audit log:', auditError);
          // Non-critical, continue with registration
        }
        
        // Log in the new user
        console.log("Logging in the newly registered user...");
        req.login(user, (err) => {
          // Clear the timeout since we're about to respond
          clearTimeout(responseTimeout);
          
          if (err) {
            console.error("Error during login after registration:", err);
            return next(err);
          }
          
          // Don't send password back to client
          const { password, ...userWithoutPassword } = user;
          console.log("Registration process completed successfully");
          return res.status(201).json({
            ...userWithoutPassword,
            verificationLink: verificationLink || undefined,
            emailSent: !!verificationLink
          });
        });
      } catch (dbError: any) {
        // Clear the timeout since we're about to respond
        clearTimeout(responseTimeout);
        
        // Log detailed error information in debug mode
        if (isDebugMode) {
          console.error("============ DB ERROR DETAILS ============");
          console.error("Database error during user creation:", dbError);
          console.error("SQL error code:", dbError?.code);
          console.error("SQL constraint:", dbError?.constraint);
          console.error("SQL detail:", dbError?.detail);
          console.error("SQL table:", dbError?.table);
          console.error("SQL column:", dbError?.column);
          console.error("Full error:", dbError);
          console.error("User data (except password):", {
            ...userData,
            password: "[REDACTED]"
          });
          console.error("=========================================");
        } else {
          console.error("Database error during user creation:", dbError);
        }
        
        // Check for specific database errors
        let errorMessage = "Error creating user account. Please try again later.";
        let errorField = null;
        
        // PostgreSQL error codes
        if (dbError?.code === '23505') { // Unique violation
          if (dbError.constraint?.includes('username')) {
            errorMessage = "Username already exists. Please choose a different username.";
            errorField = "username";
          } else if (dbError.constraint?.includes('email')) {
            errorMessage = "Email already in use. Please use a different email.";
            errorField = "email";
          } else if (dbError.constraint?.includes('phone')) {
            errorMessage = "Phone number already registered. Please use a different phone number.";
            errorField = "phone";
          }
        }
        
        return res.status(500).json({ 
          message: errorMessage,
          field: errorField,
          error: dbError?.message || "Unknown error",
          // Only include detailed error info in debug mode
          details: isDebugMode ? {
            code: dbError?.code,
            constraint: dbError?.constraint,
            detail: dbError?.detail
          } : undefined
        });
      }
    } catch (error) {
      // Clear the timeout since we're about to respond
      clearTimeout(responseTimeout);
      
      console.error("Unhandled error in registration:", error);
      
      // Send a more detailed error back to the client
      if (error instanceof Error) {
        return res.status(500).json({ 
          message: "Registration failed due to server error", 
          error: error.message,
          stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
        });
      }
      
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: Express.User | false, info: { message?: string } = {}) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info.message || "Login failed" });
      }
      req.login(user, (loginErr) => {
        if (loginErr) {
          return next(loginErr);
        }
        // Don't send password back to client
        const { password, ...userWithoutPassword } = user as any;
        return res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });
  
  // Add a special endpoint to fix Firebase users by adding a password
  app.post("/api/fix-firebase-user", async (req, res) => {
    try {
      const { email, username, password } = req.body;
      
      if (!email || !username || !password) {
        return res.status(400).json({
          message: "Missing required fields",
          missing: Object.entries({
            email: !email,
            username: !username,
            password: !password
          }).filter(([_, missing]) => missing).map(([field]) => field)
        });
      }
      
      console.log(`Looking up user with email: ${email}`);
      const existingUser = await multiTenantStorage.getUserByEmail(email);
      
      if (!existingUser) {
        return res.status(404).json({
          message: `No user found with email: ${email}`
        });
      }
      
      console.log(`Found user: ${existingUser.id} (${existingUser.username || "no username"})`);
      
      // Check if this is a Firebase user without a password
      if (!existingUser.firebaseUid) {
        return res.status(400).json({
          message: "This user is not a Firebase user",
          user: {
            id: existingUser.id,
            email: existingUser.email,
            username: existingUser.username,
            hasFirebaseUid: !!existingUser.firebaseUid,
            hasPassword: !!existingUser.password
          }
        });
      }
      
      if (existingUser.password) {
        return res.status(400).json({
          message: "This user already has a password set",
          user: {
            id: existingUser.id,
            email: existingUser.email,
            username: existingUser.username,
            hasFirebaseUid: !!existingUser.firebaseUid,
            hasPassword: !!existingUser.password
          }
        });
      }
      
      // Hash the new password
      const hashedPassword = await hashPassword(password);
      
      // Update the user
      console.log(`Updating user ${existingUser.id} with new username and password`);
      
      const updatedUser = await multiTenantStorage.updateUser(existingUser.id, {
        username,
        password: hashedPassword,
        updatedAt: new Date()
      });
      
      return res.status(200).json({
        message: "User updated successfully",
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          username: updatedUser.username
        }
      });
    } catch (error: any) {
      console.error("Error fixing Firebase user:", error);
      return res.status(500).json({
        message: "Internal server error",
        error: error.message
      });
    }
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    // Don't send password back to client
    const { password, ...userWithoutPassword } = req.user as SelectUser;
    res.json(userWithoutPassword);
  });
  
  // Middleware for protecting routes by role
  app.use("/api/admin", (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    if (req.user && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  });
  
  app.use("/api/coach", (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    if (req.user && req.user.role !== "coach" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  });
}
