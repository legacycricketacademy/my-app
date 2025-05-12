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

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
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
    console.log("Registration request received:", {
      ...req.body,
      password: req.body.password ? "[REDACTED]" : undefined
    });
    
    try {
      // Validate required fields
      const requiredFields = ['username', 'password', 'email', 'fullName', 'role'];
      for (const field of requiredFields) {
        if (!req.body[field]) {
          console.error(`Registration failed: Missing required field '${field}'`);
          return res.status(400).json({ 
            message: `Missing required field: ${field}`,
            field: field
          });
        }
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
        console.error(`Registration failed: Email '${req.body.email}' already in use`);
        return res.status(400).json({ 
          message: "Email already in use in this academy",
          field: "email" 
        });
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
      console.log("Hashing password...");
      const hashedPassword = await hashPassword(req.body.password);
      let userData = {
        ...req.body,
        password: hashedPassword,
        isEmailVerified: false,
      };
      
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
      
      try {
        console.log("Creating user in database...");
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
          verificationLink = `${baseUrl}/api/verify-email?token=${token}`;
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
      } catch (dbError) {
        console.error("Database error during user creation:", dbError);
        return res.status(500).json({ 
          message: "Error creating user account. Please try again later.",
          error: dbError.message
        });
      }
    } catch (error) {
      console.error("Unhandled error in registration:", error);
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
