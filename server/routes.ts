import { Express } from "express";
import { setupVite, serveStatic } from "./vite";
import { createServer } from "http";
import { requireAuth, requireRole } from "./auth/verifyToken";
import { setupApiRoutes } from "./api-routes";

export function registerRoutes(app: Express) {
  // Disable local auth routes - return 404
  app.all("/auth/*", (req, res) => {
    res.status(404).json({ error: "Local auth disabled - use Keycloak" });
  });

  // Protected API routes with authentication
  app.use("/api/admin/*", requireAuth);
  app.use("/api/parent/*", requireAuth);
  app.use("/api/coach/*", requireAuth);

  // Test endpoints for role verification
  app.get("/api/admin/test", (req, res) => {
    res.json({ message: "Admin access granted", user: req.user });
  });

  app.get("/api/parent/test", (req, res) => {
    res.json({ message: "Parent access granted", user: req.user });
  });

  // Public health check
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      keycloak_enabled: process.env.KEYCLOAK_ENABLED,
      emailEnabled: !!process.env.SENDGRID_API_KEY
    });
  });

  // Setup API routes
  setupApiRoutes(app);

  // Return the HTTP server
  return createHttpServer(app);
}

export function createHttpServer(app: Express) {
  return createServer(app);
}
