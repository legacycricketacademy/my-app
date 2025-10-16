import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import passport from "passport";
import path from "path";
import { fileURLToPath } from "url";

import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";
import { setupRedirects } from "./redirect.js";
import { setupStaticRoutes } from "./static-routes.js";
import { multiTenantStorage } from "./multi-tenant-storage.js";

import { db } from "../db/index.js";
import { users } from "../shared/schema.js";
import { eq, and, desc } from "drizzle-orm";
import { MailService } from "@sendgrid/mail";

// ---- __dirname for ES modules ----
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---- Express app ----
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS (dev-friendly)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// Sessions
app.use(
  session({
    secret: "cricket-academy-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }, // 24h
  })
);

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
    port: Number(process.env.PORT) || (process.env.NODE_ENV === "production" ? 5000 : 3002),
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

// Dev login bypass endpoint (for testing without Firebase)
app.post("/api/dev/login", async (req, res) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    
    // Development accounts for testing
    const devAccounts = {
      "admin@test.com": { password: "Test1234!", role: "admin", id: 1 },
      "parent@test.com": { password: "Test1234!", role: "parent", id: 2 }
    };
    
    const account = devAccounts[email as keyof typeof devAccounts];
    
    if (!account || account.password !== password) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials"
      });
    }
    
    // Create mock session
    req.session.userId = account.id;
    req.session.userRole = account.role;
    
    res.json({
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

// ---- SendGrid (optional in dev) ----
const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

async function sendVerificationEmail(
  email: string,
  parentName: string,
  verificationToken: string
) {
  if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
    console.log("SendGrid not configured, skipping email send");
    return false;
  }

  const defaultPort =
    process.env.NODE_ENV === "production" ? 5000 : 3002;
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

  // Port: 3002 in dev (5000 conflicts with macOS ControlCenter), 5000 in prod
  const defaultPort = isDevelopment ? 3002 : 5000;
  const port = parseInt(process.env.PORT || String(defaultPort), 10);

  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    }
  );
})();