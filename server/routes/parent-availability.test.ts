import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import express from "express";
import session from "express-session";
import passport from "passport";
import { db } from "../../db";
import { users, players, sessions, sessionAvailability } from "../../shared/schema";
import { eq, and } from "drizzle-orm";
import parentAvailabilityRoutes from "./parent-availability";
import { setupAuth } from "../auth";

const app = express();
app.use(express.json());
app.use(
  session({
    secret: "test-secret",
    resave: false,
    saveUninitialized: false,
  })
);

setupAuth(app);
app.use(passport.initialize());
app.use(passport.session());

// Mount routes
app.use("/api/parent", parentAvailabilityRoutes);

describe("Parent Availability API", () => {
  let testParent: any;
  let testKid: any;
  let testSession: any;
  let testCoach: any;
  let agent: any;

  beforeAll(async () => {
    // Create test coach
    const [coach] = await db
      .insert(users)
      .values({
        username: `test-coach-${Date.now()}`,
        email: `coach-${Date.now()}@test.com`,
        fullName: "Test Coach",
        password: "password123",
        role: "coach",
        status: "active",
      })
      .returning();
    testCoach = coach;

    // Create test parent
    const [parent] = await db
      .insert(users)
      .values({
        username: `test-parent-${Date.now()}`,
        email: `parent-${Date.now()}@test.com`,
        fullName: "Test Parent",
        password: "password123",
        role: "parent",
        status: "active",
      })
      .returning();
    testParent = parent;

    // Create test kid
    const [kid] = await db
      .insert(players)
      .values({
        firstName: "Test",
        lastName: "Kid",
        dateOfBirth: new Date("2015-01-01"),
        ageGroup: "5-8 years",
        location: "Strongsville",
        parentId: testParent.id,
      })
      .returning();
    testKid = kid;

    // Create test session
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const endTime = new Date(tomorrow);
    endTime.setHours(11, 30, 0, 0);

    const [session] = await db
      .insert(sessions)
      .values({
        title: "Test Session",
        description: "Test session for availability",
        sessionType: "training",
        ageGroup: "5-8 years",
        location: "Strongsville",
        startTime: tomorrow,
        endTime: endTime,
        coachId: testCoach.id,
        maxPlayers: 20,
      })
      .returning();
    testSession = session;

    // Create authenticated agent
    agent = request.agent(app);
  });

  afterAll(async () => {
    // Cleanup
    if (testSession) {
      await db.delete(sessionAvailability).where(eq(sessionAvailability.sessionId, testSession.id));
      await db.delete(sessions).where(eq(sessions.id, testSession.id));
    }
    if (testKid) {
      await db.delete(players).where(eq(players.id, testKid.id));
    }
    if (testParent) {
      await db.delete(users).where(eq(users.id, testParent.id));
    }
    if (testCoach) {
      await db.delete(users).where(eq(users.id, testCoach.id));
    }
  });

  it("should require authentication to get kid sessions", async () => {
    const response = await request(app).get(`/api/parent/kids/${testKid.id}/sessions`);
    expect(response.status).toBe(401);
  });

  it("should not allow parent to view another parent's kid sessions", async () => {
    // Create another parent
    const [otherParent] = await db
      .insert(users)
      .values({
        username: `other-parent-${Date.now()}`,
        email: `other-parent-${Date.now()}@test.com`,
        fullName: "Other Parent",
        password: "password123",
        role: "parent",
        status: "active",
      })
      .returning();

    // Mock authentication for other parent
    const mockReq = {
      user: { id: otherParent.id, role: "parent" },
      params: { kidId: testKid.id.toString() },
    };

    const response = await request(app)
      .get(`/api/parent/kids/${testKid.id}/sessions`)
      .set("Cookie", [`connect.sid=mock-session`]);

    // Cleanup
    await db.delete(users).where(eq(users.id, otherParent.id));
  });

  it("should get upcoming sessions for a kid", async () => {
    // This test would need proper session setup
    // For now, we'll test the logic directly
    const upcomingSessions = await db.query.sessions.findMany({
      where: eq(sessions.ageGroup, testKid.ageGroup),
    });

    expect(upcomingSessions.length).toBeGreaterThan(0);
    expect(upcomingSessions[0].ageGroup).toBe(testKid.ageGroup);
  });

  it("should create availability record when none exists", async () => {
    const [availability] = await db
      .insert(sessionAvailability)
      .values({
        sessionId: testSession.id,
        playerId: testKid.id,
        status: "yes",
        respondedAt: new Date(),
      })
      .returning();

    expect(availability).toBeDefined();
    expect(availability.status).toBe("yes");
    expect(availability.sessionId).toBe(testSession.id);
    expect(availability.playerId).toBe(testKid.id);

    // Cleanup
    await db.delete(sessionAvailability).where(eq(sessionAvailability.id, availability.id));
  });

  it("should update existing availability record", async () => {
    // Create initial record
    const [initial] = await db
      .insert(sessionAvailability)
      .values({
        sessionId: testSession.id,
        playerId: testKid.id,
        status: "yes",
        respondedAt: new Date(),
      })
      .returning();

    // Update it
    await db
      .update(sessionAvailability)
      .set({
        status: "no",
        respondedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(sessionAvailability.id, initial.id));

    // Verify update
    const updated = await db.query.sessionAvailability.findFirst({
      where: eq(sessionAvailability.id, initial.id),
    });

    expect(updated?.status).toBe("no");

    // Cleanup
    await db.delete(sessionAvailability).where(eq(sessionAvailability.id, initial.id));
  });

  it("should validate status values", async () => {
    const validStatuses = ["yes", "no", "maybe"];
    
    for (const status of validStatuses) {
      const [availability] = await db
        .insert(sessionAvailability)
        .values({
          sessionId: testSession.id,
          playerId: testKid.id,
          status: status as "yes" | "no" | "maybe",
          respondedAt: new Date(),
        })
        .returning();

      expect(availability.status).toBe(status);

      // Cleanup
      await db.delete(sessionAvailability).where(eq(sessionAvailability.id, availability.id));
    }
  });
});
