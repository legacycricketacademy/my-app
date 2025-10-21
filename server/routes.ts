import { Express } from "express";
import { setupVite, serveStatic } from "./vite";
import { createServer } from "http";
import { verifyJwt, requireRole } from "./middleware/verifyJwt";
// import { setupApiRoutes } from "./api-routes";
import { isTestAuth, testLogin, testLogout } from "./auth/test-auth.js";
import paymentsRouter from "./routes/payments.js";
import registerRouter from "./routes/register.js";
import availabilityRouter from "./routes/availability.js";
import announcementsRouter from "./routes/announcements.js";
import mailboxRouter from "./routes/_mailbox.js";

export function registerRoutes(app: Express) {
  // Test auth routes (only available in test mode)
  if (isTestAuth()) {
    app.post("/api/test/login", testLogin);
    app.post("/api/test/logout", testLogout);
  }

  // Disable local auth routes - return 404
  app.all("/auth/*", (req, res) => {
    res.status(404).json({ error: "Local auth disabled - use Keycloak" });
  });

  // Protected API routes with JWT verification
  app.use("/api/admin/*", verifyJwt, requireRole("admin"));
  app.use("/api/parent/*", verifyJwt, requireRole("parent"));
  app.use("/api/coach/*", verifyJwt, requireRole("coach"));

  // Test endpoints for role verification
  app.get("/api/admin/test", (req, res) => {
    res.json({ message: "Admin access granted", user: req.user });
  });

  app.get("/api/parent/test", (req, res) => {
    res.json({ message: "Parent access granted", user: req.user });
  });

  // Public health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", keycloak_enabled: process.env.KEYCLOAK_ENABLED });
  });

  // Payments API (feature-flagged for testing)
  app.use("/api/payments", paymentsRouter);

  // Registration API (public) - parent registration form
  app.use("/api/registration", registerRouter);

  // Availability API (public for now, can add auth later)
  app.use("/api/availability", availabilityRouter);

  // Announcements API (public for now, can add auth later)
  app.use("/api/announcements", announcementsRouter);

  // Test-only mailbox for E2E email assertions (always available)
  app.use("/api/_mailbox", mailboxRouter);

  // Setup API routes
  // setupApiRoutes(app);

  // Return the HTTP server
  return createHttpServer(app);
}

export function createHttpServer(app: Express) {
  return createServer(app);
}
