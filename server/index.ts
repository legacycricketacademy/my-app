import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import passport from "passport";
import http from "http";

import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupRedirects } from "./redirect";
import { setupStaticRoutes } from "./static-routes";
import { multiTenantStorage } from "./multi-tenant-storage";

// keep db imports (used elsewhere if needed)
import { db } from "@db";
import { users } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

// ✅ SQLite direct access
import Database from "better-sqlite3";

// __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---- Express app -----------------------------------------------------------
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// Sessions (MemoryStore is fine for dev; use a store for prod)
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

// Extend Request
declare global {
  namespace Express {
    interface Request {
      academyId?: number;
      academySlug?: string;
      user?: any;
      isAuthenticated?: () => boolean;
    }
  }
}

// Health check
app.get("/api/ping", (_req, res) => {
  res.json({
    status: "ok",
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// ---- SendGrid (optional) ---------------------------------------------------
import { MailService } from "@sendgrid/mail";
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
  const base =
    process.env.NODE_ENV === "production"
      ? `https://${process.env.REPLIT_URL || "localhost:5000"}`
      : "http://localhost:5000";
  const verificationUrl = `${base}/verify-email?token=${verificationToken}`;
  try {
    await mailService.send({
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: "Welcome to Legacy Cricket Academy - Verify Your Email",
      html: `<p>Welcome ${parentName}, verify here: <a href="${verificationUrl}">${verificationUrl}</a></p>`,
    });
    return true;
  } catch (err) {
    console.error("Email sending failed:", err);
    return false;
  }
}

// ---- Example APIs ----------------------------------------------------------
app.get("/test", (_req, res) => {
  res.send(`<!doctype html>
<html><head><title>Server Test</title></head>
<body>
  <h1>✅ Server is Working!</h1>
</body></html>`);
});

// ✅ Pending coaches
app.get("/api/coaches/pending", async (_req, res) => {
  try {
    const db = new Database("./dev.db");
    const rows = db
      .prepare(
        "SELECT id, username, email, fullName, status, createdAt FROM users WHERE role='coach' AND status='pending' ORDER BY datetime(createdAt) DESC"
      )
      .all();
    return res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching pending coaches:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch pending coaches",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// ✅ Approved coaches
app.get("/api/coaches/approved", (_req, res) => {
  try {
    const db = new Database("./dev.db");
    const rows = db
      .prepare(
        "SELECT id, username, email, fullName, status, createdAt FROM users WHERE role='coach' AND status='approved' ORDER BY datetime(createdAt) DESC"
      )
      .all();
    return res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching approved coaches:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch approved coaches",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// ✅ Rejected coaches
app.get("/api/coaches/rejected", (_req, res) => {
  try {
    const db = new Database("./dev.db");
    const rows = db
      .prepare(
        "SELECT id, username, email, fullName, status, createdAt FROM users WHERE role='coach' AND status='rejected' ORDER BY datetime(createdAt) DESC"
      )
      .all();
    return res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching rejected coaches:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch rejected coaches",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// ✅ Unified list endpoint: GET /api/coaches?status=pending|approved|rejected&limit=20&offset=0&search=aryan
app.get("/api/coaches", (_req, res) => {
  try {
    const db = new Database("./dev.db");

    const status = String(_req.query.status || "").toLowerCase();
    const search = String(_req.query.search || "").trim();
    const limit = Math.max(0, Math.min(100, Number(_req.query.limit ?? 50))); // cap at 100
    const offset = Math.max(0, Number(_req.query.offset ?? 0));

    const validStatuses = new Set(["pending", "approved", "rejected"]);
    const where: string[] = ["role='coach'"];
    const params: any[] = [];

    if (validStatuses.has(status)) {
      where.push("status=?");
      params.push(status);
    }

    if (search) {
      // match username/fullName/email
      where.push("(username LIKE ? OR fullName LIKE ? OR email LIKE ?)");
      const like = `%${search}%`;
      params.push(like, like, like);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const sql = `
      SELECT id, username, email, fullName, status, createdAt
      FROM users
      ${whereSql}
      ORDER BY datetime(createdAt) DESC
      LIMIT ? OFFSET ?
    `;
    const countSql = `
      SELECT COUNT(*) as total
      FROM users
      ${whereSql}
    `;

    const rows = db.prepare(sql).all(...params, limit, offset);
    const total = (db.prepare(countSql).get(...params) as any).total as number;

    return res.status(200).json({
      items: rows,
      total,
      limit,
      offset,
      nextOffset: offset + rows.length < total ? offset + rows.length : null,
    });
  } catch (error) {
    console.error("Error fetching coaches:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch coaches",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// ✅ Approve / Reject endpoints
app.post("/api/coaches/:id/approve", (req, res) => {
  try {
    const coachId = Number(req.params.id);
    const db = new Database("./dev.db");
    const result = db
      .prepare("UPDATE users SET status='approved' WHERE id=?")
      .run(coachId);
    return res.json({
      success: true,
      message: `Coach ${coachId} approved successfully`,
      updated: result.changes,
    });
  } catch (error) {
    console.error("Error approving coach:", error);
    return res.status(500).json({ success: false, message: "Failed to approve coach." });
  }
});

app.post("/api/coaches/:id/reject", (req, res) => {
  try {
    const coachId = Number(req.params.id);
    const db = new Database("./dev.db");
    const result = db
      .prepare("UPDATE users SET status='rejected' WHERE id=?")
      .run(coachId);
    return res.json({
      success: true,
      message: `Coach ${coachId} rejected successfully`,
      updated: result.changes,
    });
  } catch (error) {
    console.error("Error rejecting coach:", error);
    return res.status(500).json({ success: false, message: "Failed to reject coach." });
  }
});

// ---- Dashboard dummy APIs --------------------------------------------------
app.get("/api/dashboard/schedule", (req, res) => {
  if (!req.isAuthenticated?.() || req.user?.role !== "parent") {
    return res.status(401).json({ error: "Unauthorized" });
  }
  res.json([{ day: "Monday", time: "4–6PM", activity: "Cricket Training" }]);
});

app.get("/api/dashboard/stats", (req, res) => {
  if (!req.isAuthenticated?.() || req.user?.role !== "parent") {
    return res.status(401).json({ error: "Unauthorized" });
  }
  res.json({ sessions: 18, matches: 12, attendance: "97%", runs: 68 });
});

app.get("/api/dashboard/payments", (req, res) => {
  if (!req.isAuthenticated?.() || req.user?.role !== "parent") {
    return res.status(401).json({ error: "Unauthorized" });
  }
  res.json({ current: { period: "Dec 2024", status: "paid", amount: "175" } });
});

// Academy context middleware
app.use(async (req, _res, next) => {
  const match = req.path.match(/^\/academy\/([^/]+)/);
  if (match) {
    const ident = match[1];
    if (/^\d+$/.test(ident)) {
      req.academyId = Number(ident);
      multiTenantStorage.setAcademyContext(req.academyId);
    } else {
      const academy = await multiTenantStorage.getAcademyBySlug(ident);
      if (academy) {
        req.academyId = academy.id;
        req.academySlug = ident;
        multiTenantStorage.setAcademyContext(academy.id);
      }
    }
  } else {
    req.academyId = 1;
    multiTenantStorage.setAcademyContext(1);
  }
  next();
});

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  const origJson = res.json.bind(res);
  (res as any).json = (body: any, ...args: any[]) => {
    const line = `${req.method} ${req.path} ${res.statusCode} in ${Date.now() - start}ms`;
    log(line);
    return origJson(body, ...args);
  };
  next();
});

// ---- Boot ------------------------------------------------------------------
(async () => {
  setupRedirects(app);
  setupStaticRoutes(app);
  await registerRoutes(app);

  const httpServer = http.createServer(app);
  const isDevelopment =
    process.env.NODE_ENV === "development" || app.get("env") === "development";

  console.log("Environment check:", {
    NODE_ENV: process.env.NODE_ENV,
    expressEnv: app.get("env"),
    isDevelopment,
  });

  if (isDevelopment) {
    console.log("Setting up Vite development server...");
    await setupVite(app, httpServer);
  } else {
    console.log("Setting up static file serving...");
    serveStatic(app);
  }

  const PORT = Number(process.env.PORT ?? 3002);
  const HOST = process.env.HOST ?? "127.0.0.1";

  httpServer.listen(PORT, HOST, () => {
    log(`serving on http://${HOST}:${PORT}`);
  });
})().catch((err) => {
  console.error("Fatal startup error:", err);
  process.exit(1);
});

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ message: err.message || "Internal Server Error" });
});
