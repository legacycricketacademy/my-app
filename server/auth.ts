import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { multiTenantStorage } from "./multi-tenant-storage";
import { User as SelectUser, users } from "@shared/schema";
import { db } from "@db";
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

async function comparePasswords(supplied: string, stored: string) {
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
        // Try to find user with multi-tenant storage first
        let user = await multiTenantStorage.getUserByUsername(username);
        
        // If user not found with current academy context, check without context
        if (!user) {
          // Reset academy context to null to search across all academies
          const currentContext = multiTenantStorage.getAcademyContext();
          multiTenantStorage.setAcademyContext(null);
          
          user = await multiTenantStorage.getUserByUsername(username);
          
          // Restore original context
          multiTenantStorage.setAcademyContext(currentContext);
        }
        
        // Check if user exists and password is correct
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Incorrect username or password" });
        }
        
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
    try {
      // If no academyId was provided in the request but we have it in the context, add it
      if (!req.body.academyId && req.academyId) {
        req.body.academyId = req.academyId;
      } else if (!req.body.academyId) {
        // Default to academy ID 1 if not specified
        req.body.academyId = 1;
      }
      
      // Check for existing user in the current academy context
      const existingUser = await multiTenantStorage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists in this academy" });
      }

      const existingEmail = await multiTenantStorage.getUserByEmail(req.body.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use in this academy" });
      }

      // Check if phone number is provided and if it's already in use
      if (req.body.phone) {
        try {
          const existingUsers = await db.select().from(users)
            .where(and(
              eq(users.phone, req.body.phone),
              req.body.academyId ? eq(users.academyId, req.body.academyId) : undefined
            ))
            .limit(1);
            
          if (existingUsers.length > 0) {
            return res.status(400).json({ message: "Phone number already registered in this academy" });
          }
        } catch (err) {
          console.error("Error checking phone number:", err);
          // Continue with registration even if phone check fails - not critical
        }
      }
      
      // Create new user with hashed password
      const hashedPassword = await hashPassword(req.body.password);
      let userData = {
        ...req.body,
        password: hashedPassword,
        isEmailVerified: false,
      };
      
      // Check role and set appropriate status
      if (userData.role === "admin") {
        // Admin accounts should be pending until approved by superadmin
        userData = {
          ...userData,
          status: "pending", 
          isActive: false
        };
      } else if (userData.role === "coach") {
        userData = {
          ...userData,
          status: "pending", // Coaches need admin approval
          isActive: false    // Inactive until approved
        };
      } else if (userData.role === "parent") {
        userData = {
          ...userData,
          status: "active", // Parents are automatically approved
          isActive: true
        };
      }

      // Set academy context before creating user
      multiTenantStorage.setAcademyContext(userData.academyId);
      
      const user = await multiTenantStorage.createUser(userData);
      
      // Import necessary email-related functions
      const { generateVerificationEmail, sendEmail } = require('./email');
      
      // Generate a verification token if we have the appropriate helper function
      let verificationLink = '';
      try {
        // Check if we have required functions from routes.ts
        if (typeof global.generateVerificationToken === 'function') {
          const token = global.generateVerificationToken(user.id, user.email);
          const baseUrl = `${req.protocol}://${req.get('host')}`;
          verificationLink = `${baseUrl}/api/verify-email?token=${token}`;
          
          // Generate email content
          const { text, html } = generateVerificationEmail(user.fullName, verificationLink);
          
          // Send verification email
          const emailSent = await sendEmail({
            to: user.email,
            subject: "Verify Your Email Address for Legacy Cricket Academy",
            text,
            html
          });
          
          // Log email status but continue with registration regardless
          if (emailSent) {
            console.log(`Verification email sent to ${user.email}`);
          } else {
            console.warn(`Failed to send verification email to ${user.email}`);
          }
        } else {
          console.warn('generateVerificationToken function not available, skipping email verification');
        }
      } catch (emailError) {
        console.error('Error sending verification email:', emailError);
        // Continue with registration even if email fails
      }
      
      // Log the user activity
      try {
        await db.insert(userAuditLogs).values({
          userId: user.id,
          academyId: user.academyId,
          actionType: 'register',
          actionDetails: { role: user.role, status: user.status },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        });
      } catch (auditError) {
        console.error('Error creating audit log:', auditError);
        // Non-critical, continue with registration
      }
      
      // Log in the new user
      req.login(user, (err) => {
        if (err) return next(err);
        // Don't send password back to client
        const { password, ...userWithoutPassword } = user;
        return res.status(201).json({
          ...userWithoutPassword,
          verificationLink: verificationLink || undefined,
          emailSent: !!verificationLink
        });
      });
    } catch (error) {
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
