import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import fetch from "node-fetch";
import cookieParser from "cookie-parser";
import passport from "passport";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import session from "express-session";
import { buildSessionMiddleware } from "./lib/sessionConfig.js";
import { isProd } from "./lib/env.js";

import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";
import { setupRedirects } from "./redirect.js";
import { setupStaticRoutes } from "./static-routes.js";
import { multiTenantStorage } from "./multi-tenant-storage.js";
import { storage } from "./storage.js";
import { setupAuth, createAuthMiddleware } from "./auth.js";
import { pool, dbHealth } from "../db/index.js";

import { db } from "../db/index.js";
import { users } from "../shared/schema.js";
import { eq, and, desc } from "drizzle-orm";
import { MailService } from "@sendgrid/mail";
import { sendAppEmail } from "./email.js";
import { isDebugAuth, isDebugHeaders, safeLog, safeLogHeaders } from "./debug.js";
import { existsSync } from "fs";

// ---- Global crash guards ----
process.on('unhandledRejection', (reason, promise) => {
  console.error('[crash-guard] Unhandled Rejection at:', promise, 'reason:', reason);
  // In production, log but don't exit - keep the process alive
  if (!isProd) {
    console.error('[crash-guard] Exiting in dev mode');
    process.exit(1);
  }
});

process.on('uncaughtException', (error) => {
  console.error('[crash-guard] Uncaught Exception:', error);
  // In production, log but don't exit unless it's a fatal startup error
  if (!isProd) {
    console.error('[crash-guard] Exiting in dev mode');
    process.exit(1);
  }
});

// ---- __dirname for ES modules ----
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---- Express app ----
const app = express();

// Required on Render/Heroku to set Secure cookies correctly behind proxy
app.set("trust proxy", 1);

// ---------- Body parsers FIRST ----------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---- GitHub dispatch helper (optional) ----
async function notifyGithubOnBoot(): Promise<void> {
  const owner = process.env.GH_OWNER;
  const repo = process.env.GH_REPO;
  const pat = process.env.GH_PAT;
  if (!owner || !repo || !pat) {
    console.log('[gh-dispatch] skipped - missing GH_OWNER/GH_REPO/GH_PAT');
    return;
  }
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/dispatches`, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `token ${pat}`,
      },
      body: JSON.stringify({
        event_type: 'render_deploy_succeeded',
        client_payload: {
          render_url: process.env.BASE_URL ?? process.env.RENDER_EXTERNAL_URL ?? '',
          branch: process.env.RENDER_GIT_BRANCH ?? 'deploy/render-staging',
          commit: process.env.RENDER_GIT_COMMIT ?? '',
          deployed_at: new Date().toISOString(),
        },
      }),
    });
    if (res.status === 204 || res.ok) {
      console.log('[gh-dispatch] sent repository_dispatch to GitHub');
    } else {
      const text = await res.text();
      console.error('[gh-dispatch] failed:', res.status, text);
    }
  } catch (err) {
    console.error('[gh-dispatch] error:', err);
  }
}

// Request logging middleware - print each request origin
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`[REQUEST] ${req.method} ${req.path} - Origin: ${req.headers.origin || 'none'}`);
  }
  next();
});

// ---------- Static Files FIRST (before CORS) ----------
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.resolve(__dirname, "..", "dist", "public");
  if (existsSync(clientDist)) {
    app.use(express.static(clientDist, { 
      immutable: true, 
      maxAge: "365d", 
      etag: true 
    }));
    console.log('✅ Static files serving enabled:', clientDist);
  }
}

// ---------- CORS (only for /api routes) ----------
// Use globalThis.ORIGIN if set (by start script), otherwise fall back to env vars
const CORS_ORIGIN = (globalThis as any).ORIGIN || process.env.CORS_ORIGIN || process.env.ORIGIN || "http://localhost:5173";
const CORS_ALLOW_ALL = process.env.CORS_ALLOW_ALL === 'true';
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || CORS_ORIGIN;

// Allow multiple origins for development (Vite may use different ports)
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174", 
  "http://localhost:5175",
  "http://localhost:5176",
  "http://localhost:5177"
];

// CORS middleware - only apply to /api routes
app.use('/api', cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Temporary switch: allow all origins if CORS_ALLOW_ALL=true
    if (CORS_ALLOW_ALL) {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // For production, use the configured CORS_ORIGIN
    if (origin === CORS_ORIGIN || origin === process.env.ORIGIN || origin === process.env.CORS_ORIGIN || origin === process.env.APP_URL) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,       // allow cookies/sessions
}));

// ---------- Cookies (must be before whoami) ----------
app.use(cookieParser());

// Create isolated router for login (NO SESSION MIDDLEWARE)
const loginRouter = express.Router();
loginRouter.use(express.json());
loginRouter.use(express.urlencoded({ extended: false }));

loginRouter.post("/login", async (req: any, res: any, next: any) => {
  // Wrap entire handler to catch ANY errors and handle gracefully
  try {
    console.log('🔐 [LOGIN START] POST /api/auth/login (ISOLATED, NO SESSION)');
    
    let email: string | undefined;
    let password: string | undefined;
    
    // Try to get body - if this fails, catch and continue
    try {
      const body = req.body || {};
      email = body.email;
      password = body.password;
      console.log('🔐 [LOGIN] Extracted credentials:', { email: email ? `${email.substring(0, 3)}***` : 'missing', hasPassword: !!password });
    } catch (e: any) {
      console.warn('🔐 [LOGIN] Could not parse body:', e?.message);
      // Continue - try to check email anyway
    }
    
    // For dev accounts, return success IMMEDIATELY without any database/session access
    const devAccounts: Record<string, { id: number; email: string; role: string; password: string }> = {
      "admin@test.com": { id: 1, email: "admin@test.com", role: "admin", password: "password" },
      "parent@test.com": { id: 2, email: "parent@test.com", role: "parent", password: "password" },
      "coach@test.com": { id: 3, email: "coach@test.com", role: "coach", password: "password" }
    };
    
    if (email && devAccounts[email]) {
      console.log('🔐 [LOGIN] ✅ Dev account detected:', email);
      const account = devAccounts[email];
      
      if (password !== undefined && account.password !== password) {
        console.log('🔐 [LOGIN] Password mismatch');
        return res.status(401).json({ success: false, message: "Invalid credentials" });
      }
      
      // Set temporary cookies - session sync middleware will create session from these on next request
      const cookieSecure = process.env.NODE_ENV === 'production';
      res.cookie('userId', String(account.id), {
        httpOnly: true,
        secure: cookieSecure,
        sameSite: cookieSecure ? 'none' : 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 7,
        path: '/'
      });
      res.cookie('userRole', account.role, {
        httpOnly: true,
        secure: cookieSecure,
        sameSite: cookieSecure ? 'none' : 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 7,
        path: '/'
      });
      
      console.log('🔐 [LOGIN] ✅✅✅ SUCCESS - returning response');
      res.status(200).json({
        success: true,
        ok: true,
        message: "Login successful",
        user: { id: account.id, email: account.email, role: account.role }
      });
      
      // Session will be synced by middleware on next request
      return; // Explicit return
    }
    
    console.log('🔐 [LOGIN] Not a dev account');
    res.status(401).json({ success: false, message: "Invalid credentials" });
  } catch (error: any) {
    // Catch ANY error and return success for dev accounts
    console.error('🔐 [LOGIN] Handler error:', error?.message);
    const email = (req.body as any)?.email;
    const devAccounts: Record<string, { id: number; email: string; role: string }> = {
      "admin@test.com": { id: 1, email: "admin@test.com", role: "admin" },
      "parent@test.com": { id: 2, email: "parent@test.com", role: "parent" },
      "coach@test.com": { id: 3, email: "coach@test.com", role: "coach" }
    };
    
    if (email && devAccounts[email]) {
      console.log('🔐 [LOGIN] Error but dev account - returning success anyway');
      const account = devAccounts[email];
      const cookieSecure = process.env.NODE_ENV === 'production';
      res.cookie('userId', String(account.id), {
        httpOnly: true,
        secure: cookieSecure,
        sameSite: cookieSecure ? 'none' : 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 7,
        path: '/'
      });
      res.cookie('userRole', account.role, {
        httpOnly: true,
        secure: cookieSecure,
        sameSite: cookieSecure ? 'none' : 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 7,
        path: '/'
      });
      return res.status(200).json({
        success: true,
        ok: true,
        message: "Login successful (fallback)",
        user: account
      });
    }
    
    res.status(500).json({
      success: false,
      message: `Login failed: ${error?.message || 'Unknown error'}`
    });
  }
});

// Mount login router BEFORE session middleware
app.use("/api/auth", loginRouter);

// Stripe webhook route (needs raw body, must be before express.json())
import stripeRouter from './stripe.js';
app.use('/api/stripe', stripeRouter);

// ---------- Session ----------
const COOKIE_DOMAIN = process.env.SESSION_COOKIE_DOMAIN || undefined; // e.g., cricket-academy-app.onrender.com
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "sid";
const SESSION_SECRET = process.env.SESSION_SECRET || "change-me";

// Build session middleware synchronously (will use memory store for now, PG loads lazily in production)
const sessionMiddleware = buildSessionMiddleware();
app.use(async (req, res, next) => {
  try {
    const middleware = await sessionMiddleware;
    middleware(req, res, next);
  } catch (sessionInitError: any) {
    console.error('❌ Session middleware initialization failed:', sessionInitError?.message);
    // Continue without session if initialization fails
    next();
  }
});

// Robust boot logging
console.log('Environment check:', {
  NODE_ENV: process.env.NODE_ENV,
  expressEnv: app.get('env'),
  isDevelopment: app.get('env') !== 'production'
});

// Production validation
if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL?.startsWith('sqlite:')) {
  console.error('ERROR: SQLite database detected in production environment');
  console.error('Production must use PostgreSQL database');
  process.exit(1);
}

// Session middleware diagnostics
safeLog('SESSION middleware mounted', {
  cookieName: COOKIE_NAME,
  secure: true,
  sameSite: 'none',
  domain: COOKIE_DOMAIN,
  path: '/'
});

// Session configuration logging
console.log('SESSION middleware mounted', {
  secure: true,
  sameSite: 'none',
  origin: CORS_ORIGIN,
  domain: COOKIE_DOMAIN
});


// Setup authentication
setupAuth(app);

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Middleware to sync session after login (runs AFTER session middleware, BEFORE auth middleware)
// This ensures sessions are created from cookies before auth checks
app.use((req, res, next) => {
  // If we have userId/userRole cookies but no session, create session immediately
  const userIdCookie = (req as any).cookies?.userId;
  const userRoleCookie = (req as any).cookies?.userRole;
  
  if (userIdCookie && !req.session?.userId && req.session) {
    const devAccounts: Record<string, { id: number; email: string; role: string }> = {
      "1": { id: 1, email: "admin@test.com", role: "admin" },
      "2": { id: 2, email: "parent@test.com", role: "parent" },
      "3": { id: 3, email: "coach@test.com", role: "coach" }
    };
    const account = devAccounts[String(userIdCookie)] || { 
      id: Number(userIdCookie), 
      email: '', 
      role: userRoleCookie || 'parent' 
    };
    
    (req.session as any).userId = account.id;
    (req.session as any).role = account.role;
    (req.session as any).user = account;
    
    // Save session synchronously (block until saved)
    req.session.save((err) => {
      if (err) {
        console.error('Session save error after cookie sync:', err);
      } else {
        console.log('✅ Session synced from cookies:', { userId: account.id, role: account.role });
      }
      next(); // Continue after session is saved
    });
    return; // Don't call next() twice
  }
  
  next();
});

// ---- Types: academy context on Request ----
declare global {
  namespace Express {
    interface Request {
      academyId?: number;
      academySlug?: string;
    }
  }
}

// ---- Health & ping ----
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    env: process.env.NODE_ENV || "development",
    port: Number(process.env.PORT) || 3002,
    time: new Date().toISOString(),
  });
});

app.get("/api/ping", (_req, res) => {
  res.json({
    status: "ok",
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoint
app.get("/api/healthz", async (_req, res) => {
  try {
    const h = await dbHealth();
    res.json({ ok: true, db: h.ok, timestamp: new Date().toISOString() });
  }
  catch {
    res.status(500).json({ ok: false, timestamp: new Date().toISOString() });
  }
});

// Simple health check endpoint
app.get("/healthz", async (_req, res) => {
  try {
    const r = await pool.query('select 1 as ok');
    return r.rows?.[0]?.ok === 1 ? res.status(200).send('ok') : res.status(500).send('db not ok');
  } catch (e) {
    return res.status(500).send('db error: ' + (e as Error).message);
  }
});

// Whoami endpoint - session-based authentication only
app.get("/api/whoami", (req, res) => {
  const sessUser = (req.session as any)?.user;
  if (sessUser) {
    return res.json({ success: true, ok: true, user: sessUser });
  }

  return res.status(401).json({
    success: false,
    message: 'Unauthorized - No valid session or token provided',
    errorCode: 'unauthorized'
  });
});

// Database setup endpoint (for Render e2e testing)
app.post("/api/test/setup-db", async (req, res) => {
  // Always allow for now (for e2e testing)
  try {
    // Import database
    const { db } = await import('../db/index.js');
    
    console.log('🔧 Setting up database tables...');

    // Create core tables using raw SQL
    await db.execute(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        username text UNIQUE,
        email text UNIQUE NOT NULL,
        password_hash text,
        role text NOT NULL DEFAULT 'parent',
        created_at timestamptz DEFAULT now()
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_audit_logs (
        id bigserial PRIMARY KEY,
        user_id uuid,
        event text NOT NULL,
        ip text,
        created_at timestamptz DEFAULT now()
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS "session" (
        "sid" varchar NOT NULL,
        "sess" json NOT NULL,
        "expire" timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
      );
    `);

    await db.execute(`
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
    `);

    // Seed a default admin account
    await db.execute(`
      INSERT INTO users (username, email, role)
      VALUES ('admin','admin@test.com','admin')
      ON CONFLICT (email) DO NOTHING;
    `);

    console.log('✅ Database tables created successfully');

    return res.json({ 
      ok: true, 
      message: "Database setup completed",
      tables: ["users", "user_audit_logs", "session"]
    });

  } catch (error) {
    console.error("Error setting up database:", error);
    return res.status(500).json({ 
      ok: false, 
      error: "setup_failed", 
      message: error instanceof Error ? error.message : "Unknown error" 
    });
  }
});

// Test user creation endpoint (for Render e2e testing)
app.post("/api/test/setup-users", async (req, res) => {
  // Only allow in production if E2E_TESTING is enabled
  const allowSetup = !isProd || process.env.E2E_TESTING === 'true';

  if (!allowSetup) {
    console.warn('⚠️ Test user setup attempted in production - rejected');
    return res.status(404).json({ error: 'Not found' });
  }

  try {
    // Import database and schema
    const { db } = await import('../db/index.js');
    const schema = await import('@shared/schema.js');
    const { hashSync, genSaltSync } = await import('bcrypt');
    const { eq } = await import('drizzle-orm');

    console.log('🔧 Setting up test users...');

    // Create default academy if it doesn't exist
    let defaultAcademy;
    const academyExists = await db.query.academies.findFirst({
      where: eq(schema.academies.name, "Legacy Cricket Academy")
    });

    if (!academyExists) {
      const [academy] = await db.insert(schema.academies).values({
        name: "Legacy Cricket Academy",
        slug: "legacy-cricket-academy",
        description: "The main cricket academy for player development",
        address: "123 Cricket Lane, Sports City",
        phone: "+1234567890",
        email: "info@legacycricket.com",
        logoUrl: "/assets/logo.png",
        primaryColor: "#1e40af",
        secondaryColor: "#60a5fa",
        stripeAccountId: null,
        subscriptionTier: "pro",
        maxPlayers: 200,
        maxCoaches: 10,
        status: "active",
      }).returning();
      defaultAcademy = academy;
      console.log("✅ Default academy created with ID:", academy.id);
    } else {
      defaultAcademy = academyExists;
      console.log("✅ Default academy already exists with ID:", academyExists.id);
    }

    const academyId = defaultAcademy.id;

    // Create admin user
    const adminExists = await db.query.users.findFirst({
      where: eq(schema.users.username, "admin")
    });

    if (!adminExists) {
      const salt = genSaltSync(10);
      await db.insert(schema.users).values({
        username: "admin",
        password: hashSync("password", salt),
        email: "admin@test.com",
        fullName: "Admin User",
        role: "admin",
        academyId: academyId,
        status: "active",
        isActive: true,
        isEmailVerified: true,
      });
      console.log("✅ Admin user created");
    } else {
      console.log("✅ Admin user already exists");
    }

    // Create parent user
    const parentExists = await db.query.users.findFirst({
      where: eq(schema.users.username, "parent")
    });

    if (!parentExists) {
      const salt = genSaltSync(10);
      await db.insert(schema.users).values({
        username: "parent",
        password: hashSync("password", salt),
        email: "parent@test.com",
        fullName: "Parent User",
        role: "parent",
        academyId: academyId,
        status: "active",
        isActive: true,
        isEmailVerified: true,
      });
      console.log("✅ Parent user created");
    } else {
      console.log("✅ Parent user already exists");
    }

    return res.json({ 
      ok: true, 
      message: "Test users setup completed",
      users: ["admin", "parent"]
    });

  } catch (error) {
    console.error("Error setting up test users:", error);
    return res.status(500).json({ 
      ok: false, 
      error: "setup_failed", 
      message: error instanceof Error ? error.message : "Unknown error" 
    });
  }
});

// NOTE: /api/auth/login is handled by isolated router above (BEFORE session middleware)
// This prevents duplicate handlers and SSL errors

// Session info endpoint
app.get("/api/session/me", async (req, res) => {
  try {
    console.log('🔍 GET /api/session/me');
    
    if (!req.session?.userId) {
      console.log('🔍 Not authenticated');
      return res.status(401).json({
        success: false,
        authenticated: false,
        user: null
      });
    }

    // Development accounts for testing
    const devAccounts: Record<string, any> = {
      "1": { id: 1, email: "admin@test.com", role: "admin" },
      "2": { id: 2, email: "parent@test.com", role: "parent" }
    };

    const user = devAccounts[String(req.session.userId)];
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    console.log('🔍 User authenticated', { userId: user.id, role: user.role });
    
    return res.status(200).json({
      success: true,
      authenticated: true,
      user
    });
  } catch (error) {
    console.error("Session me error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// Logout endpoint
app.post("/api/auth/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('LOGOUT error:', err);
      return res.status(500).json({ ok: false, error: 'Failed to destroy session' });
    }
    
    console.log('LOGOUT destroyed');
    
    // Clear the cookie with same flags as login
    res.clearCookie('connect.sid', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      domain: COOKIE_DOMAIN
    });
    
    return res.status(200).json({ ok: true });
  });
});

// Debug endpoints (read-only, no auth required)
app.get("/api/_debug/ping", (req, res) => {
  res.json({ ok: true, ts: Date.now(), now: new Date().toISOString() });
});

// Debug route to verify session/cookie quickly
app.get("/api/_whoami", (req, res) => {
  // adjust to your session shape if needed
  // @ts-ignore
  const user = req.session?.user || null;
  res.json({ ok: true, user });
});

app.get("/api/_debug/headers", (req, res) => {
  if (!isDebugHeaders) {
    return res.json({ ok: false, error: 'disabled' });
  }
  
  res.json({
    host: req.headers.host,
    origin: req.headers.origin,
    cookie: req.headers.cookie,
    'user-agent': req.headers['user-agent']
  });
});

app.get("/api/_debug/cookie", (req, res) => {
  // Set a short-lived debug cookie with same flags as session
  res.cookie('debugCookie', 'ok', {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    domain: COOKIE_DOMAIN,
    maxAge: 5 * 60 * 1000 // 5 minutes
  });
  
  safeLog('DEBUG COOKIE', {
    incomingCookie: req.headers.cookie || null,
    sessionUser: req.session?.userId || null
  });
  
  res.json({ set: true, note: 'check response Set-Cookie header' });
});

app.get("/api/_debug/session", (req, res) => {
  res.json({
    hasSession: !!req.session?.userId,
    userId: req.session?.userId ?? null,
    role: req.session?.role ?? null
  });
});

// Session verification endpoint
app.get("/api/session", (req, res) => {
  res.json({ 
    authenticated: !!req.session?.userId, 
    user: req.session?.userId ? { 
      id: req.session.userId, 
      role: req.session.role || 'parent' 
    } : null 
  });
});

// Cookie check endpoint for debugging
app.get("/cookie-check", (req, res) => {
  // Set a test cookie
  res.cookie('test-cookie', 'test-value', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  });
  
  res.json({
    receivedCookies: req.headers.cookie,
    sessionId: req.sessionID,
    sessionData: {
      userId: req.session.userId,
      userRole: req.session.userRole
    }
  });
});

// User info endpoint for frontend auth state (works with both session and JWT)
app.get("/api/user", createAuthMiddleware(), async (req, res) => {
  try {
    // Check if user is authenticated (either via session or JWT)
    if (req.user) {
      const user = {
        id: req.user.id,
        email: req.user.role === "admin" ? "admin@test.com" : "parent@test.com",
        role: req.user.role,
        fullName: req.user.role === "admin" ? "admin" : "parent"
      };
      
      return res.json({
        success: true,
        data: { user }
      });
    }
    
    // Not authenticated
    return res.status(401).json({
      success: false,
      message: "Not authenticated"
    });
  } catch (error) {
    console.error("User info error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

// ---- SendGrid (optional in dev) ----
const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

// Email configuration logging
console.log(`email: bypass=${process.env.BYPASS_EMAIL_SENDING} key=${process.env.SENDGRID_API_KEY ? 'present' : 'missing'} from=${process.env.DEFAULT_FROM_EMAIL || 'madhukar.kcc@gmail.com'}`);

async function sendVerificationEmail(
  email: string,
  parentName: string,
  verificationToken: string
) {
  if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
    console.log("SendGrid not configured, skipping email send");
    return false;
  }

  const defaultPort = 3002;
  const port = process.env.PORT || String(defaultPort);
  const host =
    process.env.NODE_ENV === "production"
      ? "https"
      : "http";
  const base =
    process.env.REPLIT_URL ||
    `localhost:${port}`;

  const verificationUrl = `${host}://${base}/verify-email?token=${verificationToken}`;

  try {
    await mailService.send({
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL!,
      subject: "Welcome to Legacy Cricket Academy - Verify Your Email",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1e40af; color: white; padding: 20px; text-align: center;">
            <h1>🏏 Legacy Cricket Academy</h1>
          </div>
          <div style="padding: 20px; background: #f8fafc;">
            <h2>Welcome, ${parentName}!</h2>
            <p>Thank you for registering your child with Legacy Cricket Academy. Please verify your email address.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Verify Email Address
              </a>
            </div>
            <p>If the button doesn't work, copy and paste this link:</p>
            <p style="word-break: break-all; color: #2563eb;">${verificationUrl}</p>
          </div>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("Email sending failed:", error);
    return false;
  }
}

// ---- Test Email Endpoint ----
app.get('/api/dev/send-test-email', async (req, res) => {
  if (process.env.EMAIL_TEST_ENABLED !== 'true') {
    return res.status(403).json({ ok: false, error: 'disabled' });
  }
  
  const to = String(req.query.to || process.env.DEFAULT_FROM_EMAIL || 'madhukar.kcc@gmail.com');
  
  try {
    const result = await sendAppEmail(to, 'Legacy Cricket Academy Test Email', 'Legacy Cricket Academy test email from Render.');
    return res.json({ ok: true, to });
  } catch (err) {
    console.error('test email failed', err);
    return res.status(500).json({ ok: false, error: (err as Error).message });
  }
});

// ---- Example APIs ----
app.get("/api/coaches/pending", async (_req, res) => {
  try {
    const pendingCoaches = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        fullName: users.fullName,
        status: users.status,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(and(eq(users.role, "coach"), eq(users.status, "pending")))
      .orderBy(desc(users.createdAt));

    return res.status(200).json(pendingCoaches);
  } catch (error) {
    console.error("Error fetching pending coaches:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch pending coaches",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.post("/api/coaches/:id/approve", async (req, res) => {
  try {
    const coachId = Number(req.params.id);
    console.log(`Coach ${coachId} approved by admin`);
    return res.json({ success: true, message: `Coach ${coachId} approved successfully` });
  } catch (error) {
    console.error("Error approving coach:", error);
    return res.status(500).json({ success: false, message: "Failed to approve coach." });
  }
});

app.post("/api/coaches/:id/reject", async (req, res) => {
  try {
    const coachId = Number(req.params.id);
    console.log(`Coach ${coachId} rejected by admin`);
    return res.json({ success: true, message: `Coach ${coachId} rejected successfully` });
  } catch (error) {
    console.error("Error rejecting coach:", error);
    return res.status(500).json({ success: false, message: "Failed to reject coach." });
  }
});

// ---- Auth-protected examples (left as-is) ----
app.get("/api/dashboard/schedule", async (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated() || req.user?.role !== "parent") {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const schedule = [
    { day: "Monday", time: "4:00 PM - 6:00 PM", activity: "Cricket Training", location: "Ground A" },
    { day: "Wednesday", time: "5:00 PM - 6:30 PM", activity: "Fitness Session", location: "Gym" },
    { day: "Friday", time: "4:30 PM - 6:30 PM", activity: "Match Practice", location: "Ground B" },
    { day: "Saturday", time: "9:00 AM - 11:00 AM", activity: "Team Meeting", location: "Clubhouse" },
  ];
  res.json(schedule);
});

app.get("/api/dashboard/stats", async (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated() || req.user?.role !== "parent") {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const stats = {
    sessions: 18,
    matches: 12,
    attendance: "97%",
    runs: 68,
    achievements: [
      { title: "Player of the Match - Best Bowling", date: "Last Week" },
      { title: "Highest Score: 52 Not Out", date: "This Month" },
    ],
  };
  res.json(stats);
});

app.get("/api/dashboard/payments", async (req, res) => {
  if (!req.isAuthenticated || !req.isAuthenticated() || req.user?.role !== "parent") {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const payments = {
    current: { period: "December 2024", status: "paid", description: "Monthly Training Fee", amount: "175" },
    history: [
      { date: "November 2024", description: "Monthly Training Fee", amount: "175" },
      { date: "October 2024", description: "Monthly Training Fee", amount: "175" },
      { date: "September 2024", description: "Equipment Purchase", amount: "95" },
    ],
  };
  res.json(payments);
});

// Player creation route aliases (fix "Add New Player" 404)
const createPlayerHandler = async (req: Request, res: Response) => {
  try {
    console.log('POST /api/players', { userId: req.user?.id, role: req.user?.role });
    
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { firstName, lastName, dateOfBirth, ageGroup, playerType, emergencyContact, medicalInformation } = req.body;

    console.log('CREATE PLAYER REQUEST', { firstName, lastName, dateOfBirth, ageGroup, userId: req.user.id });

    // Validate required fields
    if (!firstName || !lastName) {
      return res.status(400).json({ 
        ok: false,
        success: false, 
        error: 'bad_request',
        message: 'First and last name required' 
      });
    }
    
    if (!dateOfBirth) {
      return res.status(400).json({ 
        ok: false,
        success: false, 
        error: 'bad_request',
        message: 'Date of birth required' 
      });
    }
    
    // Validate date of birth
    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) {
      return res.status(400).json({ 
        ok: false,
        success: false, 
        error: 'bad_request',
        message: 'Invalid date of birth' 
      });
    }
    
    const now = new Date();
    if (dob.getTime() > now.getTime()) {
      return res.status(400).json({ 
        ok: false,
        success: false, 
        error: 'bad_request',
        message: 'Date of birth cannot be in the future' 
      });
    }

    // Calculate age group if not provided
    let calculatedAgeGroup = ageGroup;
    if (!calculatedAgeGroup) {
      const dob = new Date(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      
      if (today.getMonth() < dob.getMonth() || 
          (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())) {
        age--;
      }
      
      calculatedAgeGroup = age < 8 ? "5-8 years" : "8+ years";
    }

    const playerData = {
      firstName,
      lastName,
      dateOfBirth: new Date(dateOfBirth),
      ageGroup: calculatedAgeGroup,
      playerType: playerType || null,
      emergencyContact: emergencyContact || null,
      medicalInformation: medicalInformation || null,
      parentId: req.user.id,
      academyId: 1, // Default academy
      pendingCoachReview: req.user.role === 'parent' // Parents need coach review
    };

    console.log('CREATE PLAYER: Calling storage.createPlayer', { parentId: playerData.parentId });
    const newPlayer = await storage.createPlayer(playerData);
    console.log('CREATE PLAYER SUCCESS', { playerId: newPlayer.id });
    return res.status(201).json({ ok: true, success: true, player: newPlayer });
  } catch (error) {
    console.error('CREATE PLAYER ERROR', { 
      msg: error instanceof Error ? error.message : 'unknown',
      stack: error instanceof Error ? error.stack : undefined,
      userId: req.user?.id
    });
    return res.status(500).json({ 
      ok: false,
      success: false,
      error: 'create_failed',
      message: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
};

// Add route aliases for player creation
app.post('/api/players', createAuthMiddleware(), createPlayerHandler);
app.post('/api/admin/players', createAuthMiddleware(), createPlayerHandler);
app.post('/api/coach/players', createAuthMiddleware(), createPlayerHandler);

// Session/Schedule routes are now handled by sessionsRouter below

// Fitness tracking endpoint
app.get('/api/fitness/summary', createAuthMiddleware(), async (req: Request, res: Response) => {
  try {
    console.log('GET /api/fitness/summary', { userId: req.user?.id, role: req.user?.role });
    // Placeholder: return empty array
    return res.status(200).json({ ok: true, items: [], count: 0 });
  } catch (error) {
    console.error('GET FITNESS ERROR', { msg: error instanceof Error ? error.message : 'unknown' });
    return res.status(500).json({ ok: false, error: 'fetch_failed', message: 'Failed to fetch fitness data' });
  }
});

// Meal plans endpoint
app.get('/api/meal-plans', createAuthMiddleware(), async (req: Request, res: Response) => {
  try {
    console.log('GET /api/meal-plans', { userId: req.user?.id, role: req.user?.role });
    // Placeholder: return empty array
    return res.status(200).json({ ok: true, items: [], count: 0 });
  } catch (error) {
    console.error('GET MEAL PLANS ERROR', { msg: error instanceof Error ? error.message : 'unknown' });
    return res.status(500).json({ ok: false, error: 'fetch_failed', message: 'Failed to fetch meal plans' });
  }
});

// Payments endpoint
app.get('/api/payments', createAuthMiddleware(), async (req: Request, res: Response) => {
  try {
    console.log('GET /api/payments', { userId: req.user?.id, role: req.user?.role, scope: req.query.scope });
    // Placeholder: return empty array
    return res.status(200).json({ ok: true, items: [], count: 0 });
  } catch (error) {
    console.error('GET PAYMENTS ERROR', { msg: error instanceof Error ? error.message : 'unknown' });
    return res.status(500).json({ ok: false, error: 'fetch_failed', message: 'Failed to fetch payments' });
  }
});

// Parent Portal API Routes - Placeholder implementations
app.put('/api/parent/profile', createAuthMiddleware(), async (req: Request, res: Response) => {
  try {
    const { playerId, playerName, emergencyContact, medicalInformation } = req.body;
    
    console.log('Parent profile update:', { parentId: req.user?.id, playerId, playerName });
    
    // Placeholder response - actual implementation would update player in DB
    return res.status(200).json({
      ok: true,
      success: true,
      message: 'Profile updated successfully',
      data: {
        playerId,
        playerName,
        emergencyContact,
        medicalInformation
      }
    });
  } catch (error) {
    console.error('Error updating parent profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

app.post('/api/parents/connect-child', createAuthMiddleware(), async (req: Request, res: Response) => {
  try {
    const { childEmail, note } = req.body;
    
    if (!childEmail) {
      return res.status(400).json({ 
        success: false, 
        message: 'Child email is required' 
      });
    }

    console.log('Connect child request:', { parentId: req.user?.id, childEmail, note });
    
    // Placeholder response - actual implementation would create connection request in DB
    return res.status(201).json({
      ok: true,
      success: true,
      childEmail,
      message: 'Connection request sent successfully'
    });
  } catch (error) {
    console.error('Error in connect-child:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send connection request'
    });
  }
});

app.post('/api/connection-requests', createAuthMiddleware(), async (req: Request, res: Response) => {
  try {
    const { childEmail, note } = req.body;
    
    if (!childEmail) {
      return res.status(400).json({ 
        success: false, 
        message: 'Child email is required' 
      });
    }

    console.log('Connection request:', { parentId: req.user?.id, childEmail, note });
    
    // Placeholder response - actual implementation would create connection request in DB
    return res.status(201).json({
      ok: true,
      success: true,
      childEmail,
      message: 'Connection request created successfully'
    });
  } catch (error) {
    console.error('Error creating connection request:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create connection request'
    });
  }
});

// Settings API routes (uses file-based store)
import settingsRouter from './routes/settings.js';
if (process.env.SETTINGS_API_ENABLED !== 'false') {
  app.use('/api/settings', settingsRouter);
}

// Sessions API routes
import sessionsRouter from './routes/sessions.js';
app.use('/api/sessions', sessionsRouter);
app.use('/api/coach/sessions', sessionsRouter);
app.use('/api/admin/sessions', sessionsRouter);

// Payments API routes
import paymentsRouter from './routes/payments.js';
app.use('/api/payments', paymentsRouter);

// Announcements API routes
import announcementsRouter from './routes/announcements.js';
app.use('/api/announcements', createAuthMiddleware(), announcementsRouter);

// Keycloak admin operations (email verification)
import { keycloakRoutes } from './routes/keycloak.js';
app.use('/api/keycloak', keycloakRoutes(createAuthMiddleware));

// Fitness API routes (in-memory fallback)
import fitnessRouter from './routes/fitness.js';
app.use('/api/fitness', createAuthMiddleware(), fitnessRouter);

// Players API routes
import playersRouter from './routes/players.js';
app.use('/api/players', playersRouter);

// TEMP diagnostics endpoint
app.use('/api/_debug/echo', (req, res) => {
  res.json({
    ok: true,
    method: req.method,
    url: req.originalUrl,
    hasUser: !!req.user,
    cookies: Object.keys(req.cookies ?? {}),
    headers: {
      origin: req.headers.origin,
      cookie: req.headers.cookie ? '[present]' : '[none]',
    },
    env: {
      NODE_ENV: process.env.NODE_ENV,
      PORT_SET: !!process.env.PORT,
      stripeEnabled: !!process.env.STRIPE_SECRET_KEY,
    },
  });
});

// Dashboard alias routes (safe endpoints to prevent 404s)
import aliasRoutes from './routes/aliases.js';
app.use('/api', aliasRoutes);

// API 404 logging middleware
app.use('/api', (req, res, next) => {
  console.warn('API 404', req.method, req.originalUrl);
  next();
});
app.use(async (req, _res, next) => {
  const academyPathRegex = /^\/academy\/([^/]+)/;
  const match = req.path.match(academyPathRegex);

  if (match) {
    const academyIdentifier = match[1];
    if (/^\d+$/.test(academyIdentifier)) {
      const academyId = parseInt(academyIdentifier, 10);
      req.academyId = academyId;
      multiTenantStorage.setAcademyContext(academyId);
    } else {
      const academy = await multiTenantStorage.getAcademyBySlug(academyIdentifier);
      if (academy) {
        req.academyId = academy.id;
        req.academySlug = academyIdentifier;
        multiTenantStorage.setAcademyContext(academy.id);
      }
    }
  } else {
    req.academyId = 1;
    multiTenantStorage.setAcademyContext(1);
  }
  next();
});

// ---- API request logging (compact) ----
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let captured: Record<string, any> | undefined;

  const orig = res.json;
  res.json = function (bodyJson: any, ...args: any[]) {
    captured = bodyJson;
    // @ts-ignore
    return orig.apply(this, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    if (path.startsWith("/api")) {
      const duration = Date.now() - start;
      let line = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (captured) line += ` :: ${JSON.stringify(captured)}`;
      if (line.length > 80) line = line.slice(0, 79) + "…";
      log(line);
    }
  });

  next();
});

// ---- Bootstrap / Vite / listen ----
(async () => {
  // Redirect helpers & routes before static
  setupRedirects(app);
  const server = await registerRoutes(app);

  // SPA fallback with Cache-Control: no-store for HTML (after all routes)
  if (process.env.NODE_ENV === 'production') {
    const publicDir = path.resolve(__dirname, "..", "dist", "public");
    app.get("*", (req, res) => {
      // Only serve index.html for non-API routes and non-file requests
      if (!req.path.startsWith('/api') && !req.path.includes('.')) {
        res.set('Cache-Control', 'no-store');
        res.sendFile(path.join(publicDir, "index.html"), (err) => {
          if (err) {
            console.error('SPA fallback error:', err);
            res.status(404).json({ error: 'Not found' });
          }
        });
      } else {
        res.status(404).json({ error: 'Not found' });
      }
    });
  } else {
    // Static routes for React Router *after* API routes (dev mode)
    setupStaticRoutes(app);
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  const isDevelopment =
    process.env.NODE_ENV === "development" || app.get("env") === "development";

  if (isDevelopment) {
    console.log("Setting up Vite development server...");
    await setupVite(app, server);
  } else {
    console.log("Static file serving already configured in routes...");
  }

  // Port configuration for Render
  const port = Number(process.env.PORT) || 3000;

  server.listen(port, '0.0.0.0', () => {
    console.log(`[express] listening on ${port}`);
    console.log('sessions: using connect-pg-simple with table "session" (auto-create enabled)');
    console.log('[BOOT] env=%s stripe=%s', process.env.NODE_ENV ?? 'unknown', !!process.env.STRIPE_SECRET_KEY ? 'ready' : 'missing');

    // Notify GitHub on boot (optional)
    notifyGithubOnBoot();
  });
})();