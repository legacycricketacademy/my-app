import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, users } from "@shared/schema";
import { db } from "@db";
import { eq } from "drizzle-orm";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
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
        const user = await storage.getUserByUsername(username);
        
        // Check if user exists and password is correct
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Incorrect username or password" });
        }
        
        // Check if the user account is active
        if (user.role === "coach" && user.status === "pending") {
          return done(null, false, { message: "Your coach account is pending approval. Please contact an administrator." });
        }
        
        // If all checks pass, allow login
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Check for existing user
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }

      // Check if phone number is provided and if it's already in use
      if (req.body.phone) {
        try {
          const existingUsers = await db.select().from(users).where(eq(users.phone, req.body.phone));
          if (existingUsers.length > 0) {
            return res.status(400).json({ message: "Phone number already registered" });
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
      };
      
      // Set default status for coach accounts to pending approval
      if (userData.role === "coach") {
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

      const user = await storage.createUser(userData);
      
      // Log in the new user
      req.login(user, (err) => {
        if (err) return next(err);
        // Don't send password back to client
        const { password, ...userWithoutPassword } = user;
        return res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
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
        const { password, ...userWithoutPassword } = user;
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
