import { Express } from "express";
import { setupVite, serveStatic } from "./vite";
import { createServer } from "http";
import { verifyJwt, requireRole } from "./middleware/verifyJwt";
import { setupApiRoutes } from "./api-routes";

export function registerRoutes(app: Express) {
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

  // Setup API routes
  setupApiRoutes(app);

  // Return the HTTP server
  return createHttpServer(app);
}

export function createHttpServer(app: Express) {
  return createServer(app);
}
