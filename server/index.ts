import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import passport from "passport";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import PGSession from 'connect-pg-simple';

import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";
import { setupRedirects } from "./redirect.js";
import { setupStaticRoutes } from "./static-routes.js";
import { multiTenantStorage } from "./multi-tenant-storage.js";
import { setupAuth, createAuthMiddleware } from "./auth.js";
import { pool, dbHealth } from "../db/index.js";

import { db } from "../db/index.js";
import { users } from "../shared/schema.js";
import { eq, and, desc } from "drizzle-orm";
import { MailService } from "@sendgrid/mail";
import { sendAppEmail } from "./email.js";

// ---- __dirname for ES modules ----
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---- Express app ----
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Trust proxy for production (Render)
app.set('trust proxy', 1);

// CORS configuration using cors middleware
app.use(cors({ 
  origin: process.env.APP_ORIGIN ?? 'http://localhost:5173', 
  credentials: true 
}));

// Production validation
if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL?.startsWith('sqlite:')) {
  console.error('ERROR: SQLite database detected in production environment');
  console.error('Production must use PostgreSQL database');
  process.exit(1);
}

// Sessions
const isProd = process.env.NODE_ENV === 'production';
if (!process.env.SESSION_SECRET) throw new Error('SESSION_SECRET must be set');

const sessionConfig = {
  name: 'sid',
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  store: isProd ? new (PGSession(session))({ 
    pool,
    tableName: 'session',
    createTableIfMissing: true   // auto-create on first run
  }) : undefined,
  cookie: {
    secure: process.env.NODE_ENV === 'production',   // required on Render (HTTPS)
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    httpOnly: true,
    path: '/',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  }
};

app.use(session(sessionConfig));

// Session configuration logging
console.log('SESSION init', {
  nodeEnv: process.env.NODE_ENV,
  origin: process.env.APP_ORIGIN,
  cookieSecure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
});

// Setup authentication
setupAuth(app);

// Passport
app.use(passport.initialize());
app.use(passport.session());

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

// Whoami endpoint (requires authentication)
app.get("/api/whoami", createAuthMiddleware(), (req, res) => {
  if (req.user) {
    const { password, ...userWithoutPassword } = req.user as any;
    res.json({ 
      success: true, 
      user: userWithoutPassword 
    });
  } else {
    res.status(401).json({ 
      success: false, 
      message: "Not authenticated" 
    });
  }
});

// Dev login bypass endpoint (for testing without Firebase)
app.post("/api/dev/login", async (req, res) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    
    console.log('AUTH login start', { email });
    
    // Development accounts for testing
    const devAccounts = {
      "admin@test.com": { password: "Test1234!", role: "admin", id: 1 },
      "parent@test.com": { password: "Test1234!", role: "parent", id: 2 }
    };
    
    const account = devAccounts[email as keyof typeof devAccounts];
    
    if (!account || account.password !== password) {
      console.log('AUTH login failed', { email, reason: 'invalid credentials' });
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }
    
    // Regenerate session to avoid fixation
    await new Promise<void>((resolve, reject) => 
      req.session.regenerate(err => err ? reject(err) : resolve())
    );
    
    // Set session data
    req.session.userId = account.id;
    req.session.userRole = account.role || 'parent';
    
    console.log('AUTH session cookie flags', req.session.cookie);
    
    // Save the session and only then send the response
    await new Promise<void>((resolve, reject) => 
      req.session.save(err => err ? reject(err) : resolve())
    );
    
    console.log('AUTH login ok', { userId: account.id });
    
    return res.status(200).json({ 
      ok: true, 
      userId: account.id,
      success: true,
      message: "Dev login successful",
      user: {
        id: account.id,
        email: email,
        role: account.role,
        fullName: email.split('@')[0]
      }
    });
  } catch (error) {
    console.error("Dev login error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed"
    });
  }
});

// Session verification endpoint
app.get("/api/session", (req, res) => {
  res.json({ 
    authenticated: !!req.session.userId, 
    userId: req.session.userId ?? null,
    role: req.session.userRole ?? null
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

// ---- Academy context middleware ----
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

  // Static routes for React Router *after* API routes
  setupStaticRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  const isDevelopment =
    process.env.NODE_ENV === "development" || app.get("env") === "development";
  console.log("Environment check:", {
    NODE_ENV: process.env.NODE_ENV,
    expressEnv: app.get("env"),
    isDevelopment,
  });

  if (isDevelopment) {
    console.log("Setting up Vite development server...");
    await setupVite(app, server);
  } else {
    console.log("Static file serving already configured in routes...");
  }

  // Port configuration for Render
  const port = Number(process.env.PORT) || 10000;

  server.listen(port, '0.0.0.0', () => {
    console.log(`server listening on :${port}`);
    console.log('sessions: using connect-pg-simple with table "session" (auto-create enabled)');
  });
})();