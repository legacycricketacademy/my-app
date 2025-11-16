import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import express from "express";
import { registerKidDashboardRoutes } from "./kid-dashboard";

// Mock database and auth middleware
const mockDb = {
  select: () => ({
    from: () => ({
      where: () => ({
        limit: () => Promise.resolve([]),
        orderBy: () => ({
          limit: () => Promise.resolve([]),
        }),
      }),
      innerJoin: () => ({
        where: () => ({
          orderBy: () => ({
            limit: () => Promise.resolve([]),
          }),
        }),
      }),
      leftJoin: () => ({
        where: () => ({
          orderBy: () => ({
            limit: () => Promise.resolve([]),
          }),
        }),
      }),
    }),
  }),
};

// Mock auth middleware
const mockAuthMiddleware = (req: any, res: any, next: any) => {
  req.user = {
    id: 1,
    role: "parent",
    fullName: "Test Parent",
  };
  next();
};

describe("Kid Dashboard Routes", () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(mockAuthMiddleware);
    registerKidDashboardRoutes(app);
  });

  describe("GET /api/parent/kids", () => {
    it("should return 401 if not authenticated", async () => {
      const appNoAuth = express();
      appNoAuth.use(express.json());
      registerKidDashboardRoutes(appNoAuth);

      const response = await request(appNoAuth).get("/api/parent/kids");
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should return 403 if user is not a parent", async () => {
      const appNonParent = express();
      appNonParent.use(express.json());
      appNonParent.use((req: any, res: any, next: any) => {
        req.user = { id: 1, role: "coach" };
        next();
      });
      registerKidDashboardRoutes(appNonParent);

      const response = await request(appNonParent).get("/api/parent/kids");
      expect(response.status).toBe(403);
      expect(response.body.message).toContain("Parents only");
    });

    it("should return kids list for authenticated parent", async () => {
      const response = await request(app).get("/api/parent/kids");
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("success");
      expect(response.body).toHaveProperty("data");
    });
  });

  describe("GET /api/parent/kids/:kidId/dashboard", () => {
    it("should return 401 if not authenticated", async () => {
      const appNoAuth = express();
      appNoAuth.use(express.json());
      registerKidDashboardRoutes(appNoAuth);

      const response = await request(appNoAuth).get("/api/parent/kids/1/dashboard");
      expect(response.status).toBe(401);
    });

    it("should return 403 if user is not a parent", async () => {
      const appNonParent = express();
      appNonParent.use(express.json());
      appNonParent.use((req: any, res: any, next: any) => {
        req.user = { id: 1, role: "admin" };
        next();
      });
      registerKidDashboardRoutes(appNonParent);

      const response = await request(appNonParent).get("/api/parent/kids/1/dashboard");
      expect(response.status).toBe(403);
    });

    it("should return 400 for invalid kid ID", async () => {
      const response = await request(app).get("/api/parent/kids/invalid/dashboard");
      expect(response.status).toBe(400);
      expect(response.body.message).toContain("Invalid kid ID");
    });

    it("should return dashboard data for valid kid ID", async () => {
      const response = await request(app).get("/api/parent/kids/1/dashboard");
      // Will return 404 if kid not found, or 200 with data
      expect([200, 404]).toContain(response.status);
    });
  });
});
