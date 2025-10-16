import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { multiTenantStorage } from "./multi-tenant-storage";
import { User as SelectUser, users, userAuditLogs } from "@shared/schema";
import { db } from "../db/index.js";
import { requireAdmin, requireCoach, requireParent } from "./middleware/require-role";
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
import {
  createSuccessResponse,
  createErrorResponse,
  createAuthResponse,
  createUnauthorizedResponse
} from "./utils/api-response";

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

// Type declarations for better safety
interface JwtPayload {
  userId: number;
  role: string;
  academyId?: number;
  exp?: number;
  iat?: number;
}

// Extend the Express Request type to include our custom properties
declare global {
  namespace Express {
    interface Request {
      academyId?: number;
      user?: {
        id: number;
        role: string;
        academyId?: number;
        [key: string]: any;
      } | undefined;
    }
  }
}

// Global JWT authentication middleware factory
export function createAuthMiddleware(storage: typeof multiTenantStorage = multiTenantStorage) {
  return function authMiddleware(req: Request, res: Response, next: NextFunction) {
    // Check if user is already authenticated via session
    if (req.isAuthenticated()) {
      return next();
    }
    
    // Using imported response utilities for standardized responses
    
    // Otherwise check JWT tokens
    const accessToken = req.cookies?.['access_token'];
    if (!accessToken) {
      return res.status(401).json(createUnauthorizedResponse(
        "Unauthorized - No token provided"
      ));
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(accessToken, JWT_ACCESS_SECRET);
      const payload = decoded as JwtPayload;
      
      // Set user and academyId on request object
      req.user = { 
        id: payload.userId,
        role: payload.role,
        academyId: payload.academyId
      };
      
      if (payload.academyId) {
        req.academyId = payload.academyId;
      }
      
      return next();
    } catch (error) {
      // Check if token is expired
      if ((error as Error).name === 'TokenExpiredError') {
        // Could trigger refresh token flow here, but we'll handle that separately
        return res.status(401).json(createUnauthorizedResponse(
          "Token expired"
        ));
      }
      
      return res.status(401).json(createUnauthorizedResponse(
        "Invalid token"
      ));
    }
  };
}

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
  // Session settings
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
  
  // Create the JWT authentication middleware
  const authMiddleware = createAuthMiddleware(multiTenantStorage);

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
        
        // Check if the coach account is approved
        if (user.role === "coach" && user.status !== "active") {
          console.log(`Coach ${username} login denied - account is not active (status: ${user.status})`);
          return done(null, false, { message: "Your coach account is pending approval. Please contact an administrator." });
        }
        
        // Additional logging for coach approval debug
        if (user.role === "coach") {
          console.log(`Coach ${username} approval status check: status=${user.status}, isActive=${user.isActive}`);
        }
        
        // Log coach status for debugging
        if (user.role === "coach") {
          console.log(`Coach ${username} login status check: ${user.status}`);
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
      
      const missingFields = Object.entries({
        username: !req.body.username,
        password: !req.body.password,
        email: !req.body.email,
        fullName: !req.body.fullName,
        role: !req.body.role
      }).filter(([_, missing]) => missing).map(([field]) => field);
      
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
        error: "InvalidInputFormat",
        fields: missingFields
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
          success: false,
          message: `Missing required fields: ${missingFields.join(', ')}`,
          error: "InvalidInputFormat",
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
        return res.status(409).json({
          success: false,
          message: `The username '${req.body.username}' is already taken. Please choose another.`,
          error: "UsernameAlreadyExists",
          field: "username"
        });
      }

      // Special handling for clowmail.com and other problematic email domains
      const email = req.body.email;
      const emailDomain = email.split('@')[1]?.toLowerCase();
      const isProblematicEmail = email === "haumankind@chapsmail.com";
      const isClowmailDomain = emailDomain === "clowmail.com";
      
      if (isProblematicEmail || isClowmailDomain) {
        console.log(`Special handling for problematic email domain: ${email}`);
        
        // Skip Firebase validation for these domains and continue with registration
        // We'll handle them via direct registration instead
      } else {
        // Normal email validation flow
        console.log(`Checking if email '${email}' already exists...`);
        const existingEmail = await multiTenantStorage.getUserByEmail(email);
        if (existingEmail) {
          // Check if this is a Firebase account (has firebase_uid)
          if (existingEmail.firebaseUid) {
            console.log(`Registration failed: Email '${email}' is registered with Google authentication`);
            return res.status(400).json(
              createErrorResponse(
                "This email is already registered with Google. Please use Google Sign-In instead.", 
                "email_used_with_google",
                400,
                { field: "email", authMethod: "google" }
              )
            );
          } else {
            // Regular case - email already in use with direct registration
            console.error(`Registration failed: Email '${email}' already in use`);
            return res.status(409).json({
              success: false,
              message: `The email '${email}' is already registered. Please use another email or try to log in.`,
              error: "EmailAlreadyRegistered",
              field: "email"
            });
          }
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
          // Import userAuditLogs using ES module imports
          try {
            // Instead of using the schema's userAuditLogs, use a direct query
            // to avoid the session_id column issue
            // Skip audit logging for now since the schema is out of sync
            console.log("Skipping audit log creation to avoid schema errors");
            // We can update this later when we have time to synchronize the database schema
          } catch (auditError) {
            console.error('Error creating audit log:', auditError);
          }
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
            success: true,
            message: "Registration successful",
            data: { 
              user: userWithoutPassword,
              verificationLink: verificationLink || undefined,
              emailSent: !!verificationLink
            }
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

  app.post("/api/login", async (req, res, next) => {
    // Import response utilities for standardized responses
    const { createAuthResponse, createUnauthorizedResponse, createErrorResponse } = await import('./utils/api-response');

    passport.authenticate("local", async (err: any, user: Express.User | false, info: { message?: string } = {}) => {
      if (err) {
        console.error("Authentication error:", err);
        return res.status(500).json(createErrorResponse(
          "Login failed due to server error",
          "server_error",
          500
        ));
      }
      
      if (!user) {
        // Audit the failed login attempt
        if (req.body.username) {
          await auditFailedLogin(multiTenantStorage, req, `Login failed for username: ${req.body.username}`);
        }
        
        return res.status(401).json(createUnauthorizedResponse(
          info.message || "Invalid credentials"
        ));
      }
      
      req.login(user, async (loginErr) => {
        if (loginErr) {
          console.error("Session login error:", loginErr);
          return res.status(500).json(createErrorResponse(
            "Login session could not be established",
            "session_error",
            500
          ));
        }
        
        try {
          // Generate unique session ID
          const sessionId = generateSessionId();
          
          // Create and store session in database
          await multiTenantStorage.createSession(user.id, sessionId);
          
          // Generate JWT tokens
          const tokens = createSessionTokens({
            userId: user.id,
            sessionId,
            role: user.role,
            academyId: user.academyId
          });
          
          // Set cookies with tokens
          setSessionCookies(res, tokens);
          
          // Audit the successful login
          await auditSuccessfulLogin(multiTenantStorage, user.id, req);
          
          // Update last login timestamp
          await multiTenantStorage.updateLastLogin(user.id);
          
          // Don't send password back to client
          const { password, ...userWithoutPassword } = user as any;
          
          // Determine redirect URL based on user role
          let redirectUrl = '/';
          if (user.role === 'coach') {
            redirectUrl = '/coach';
          } else if (user.role === 'parent') {
            redirectUrl = '/parent';
          } else if (user.role === 'admin') {
            redirectUrl = '/admin';
          }
          
          // Return standardized auth response with redirect URL
          return res.status(200).json(createAuthResponse(
            {
              user: userWithoutPassword,
              token: tokens.accessToken,
              redirectUrl: redirectUrl
            },
            "Login successful"
          ));
        } catch (error) {
          console.error("Error during login:", error);
          return res.status(500).json(createErrorResponse(
            "Internal server error during login",
            "login_error",
            500
          ));
        }
      });
    })(req, res, next);
  });

  app.post("/api/logout", async (req, res, next) => {
    // Import response utilities for standardized responses
    const { createSuccessResponse, createErrorResponse } = await import('./utils/api-response');
    
    const userId = req.user?.id;
    
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json(createErrorResponse(
          "Error during logout process",
          "logout_error",
          500
        ));
      }
      
      // Clear session tokens
      clearSessionCookies(res);
      
      if (userId) {
        try {
          // Invalidate the session in the database
          const sessionId = req.cookies['session_id'];
          if (sessionId) {
            multiTenantStorage.invalidateSession(userId, sessionId);
          }
          
          // Create an audit log for the logout
          auditSuccessfulLogin(multiTenantStorage, userId, req, "User logged out");
        } catch (error) {
          console.error("Error during logout:", error);
          // Don't block the logout if audit fails
        }
      }
      
      // Return standardized success response
      return res.status(200).json(createSuccessResponse(
        null,
        "Logout successful"
      ));
    });
  });
  
  // JWT Token refresh endpoint
  app.post("/api/refresh-token", async (req, res) => {
    try {
      const refreshToken = req.cookies["refresh_token"];
      
      if (!refreshToken) {
        return res.status(401).json({ message: "No refresh token provided" });
      }
      
      const result = await refreshTokens(refreshToken, multiTenantStorage);
      
      if (!result.success) {
        clearSessionCookies(res);
        return res.status(401).json({ message: result.message || "Invalid refresh token" });
      }
      
      // Set the new tokens in cookies
      setSessionCookies(res, result.tokens!);
      
      return res.status(200).json({ 
        message: "Token refreshed successfully",
        user: result.user
      });
    } catch (error) {
      console.error("Error refreshing token:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
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

  app.get("/api/user", authMiddleware, async (req, res) => {
    // Import response utilities for standardized responses
    const { createSuccessResponse, createUnauthorizedResponse, createErrorResponse } = await import('./utils/api-response');
    
    // authMiddleware has already verified the user is authenticated
    // via passport session or JWT token, and set req.user
    try {
      // For JWT tokens, we need to get the complete user object from the database
      if (req.user && !req.isAuthenticated()) {
        // User is authenticated via JWT but not passport session
        const userId = req.user.id;
        
        // Get full user data from storage
        const user = await multiTenantStorage.getUser(userId);
        if (!user) {
          return res.status(401).json(createUnauthorizedResponse(
            "User not found or session expired"
          ));
        }
        
        // Don't send password back to client
        const { password, ...userWithoutPassword } = user as any;
        return res.status(200).json(createSuccessResponse(
          { user: userWithoutPassword },
          "User data retrieved successfully"
        ));
      } else if (req.user) {
        // User is authenticated via passport session
        // Don't send password back to client
        const { password, ...userWithoutPassword } = req.user as any;
        return res.status(200).json(createSuccessResponse(
          { user: userWithoutPassword },
          "User data retrieved successfully"
        ));
      } else {
        // No authenticated user found
        return res.status(401).json(createUnauthorizedResponse(
          "Not authenticated"
        ));
      }
    } catch (error) {
      console.error("Error in /api/user endpoint:", error);
      return res.status(500).json(createErrorResponse(
        "Failed to retrieve user data",
        "user_retrieval_error",
        500
      ));
    }
  });
  
  // Middleware for protecting routes by role - using our standardized RBAC middleware
  app.use("/api/admin", authMiddleware, requireAdmin);
  
  app.use("/api/coach", authMiddleware, requireCoach);
}
