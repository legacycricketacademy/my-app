import { test, expect } from "@playwright/test";
import { db } from "../db";
import { users, players, sessions, sessionAvailability } from "../shared/schema";
import { eq, and } from "drizzle-orm";

test.describe("Scheduling & Availability MVP", () => {
  let testParent: any;
  let testKid: any;
  let testSession: any;
  let testCoach: any;

  test.beforeAll(async () => {
    // Create test coach
    const coaches = await db
      .select()
      .from(users)
      .where(eq(users.role, "coach"))
      .limit(1);

    if (coaches.length > 0) {
      testCoach = coaches[0];
    } else {
      // Create a test coach if none exists
      const [coach] = await db
        .insert(users)
        .values({
          username: `testcoach_${Date.now()}`,
          email: `testcoach_${Date.now()}@test.com`,
          password: "password123",
          fullName: "Test Coach",
          role: "coach",
          status: "active",
        })
        .returning();
      testCoach = coach;
    }

    // Create test parent
    const [parent] = await db
      .insert(users)
      .values({
        username: `testparent_${Date.now()}`,
        email: `testparent_${Date.now()}@test.com`,
        password: "password123",
        fullName: "Test Parent",
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
        ageGroup: "8+ years",
        location: "Solon",
        parentId: testParent.id,
      })
      .returning();
    testKid = kid;

    // Create test session (2 days from now)
    const sessionDate = new Date();
    sessionDate.setDate(sessionDate.getDate() + 2);
    sessionDate.setHours(10, 0, 0, 0);

    const sessionEndDate = new Date(sessionDate);
    sessionEndDate.setHours(11, 30, 0, 0);

    const [session] = await db
      .insert(sessions)
      .values({
        title: "Test Training Session",
        description: "Test session for availability",
        sessionType: "Training",
        ageGroup: "8+ years",
        location: "Solon",
        startTime: sessionDate,
        endTime: sessionEndDate,
        coachId: testCoach.id,
        maxPlayers: 20,
      })
      .returning();
    testSession = session;
  });

  test.afterAll(async () => {
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
  });

  test("parent can view upcoming sessions with availability status", async ({ page }) => {
    // Login as test parent
    await page.goto("/login");
    await page.fill('input[type="email"]', testParent.email);
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    // Wait for redirect to My Kids
    await page.waitForURL(/\/parent\/kids/, { timeout: 10000 });

    // Click on the test kid
    await page.click(`text=${testKid.firstName} ${testKid.lastName}`);

    // Wait for kid dashboard to load
    await page.waitForURL(/\/parent\/kids\/\d+/, { timeout: 10000 });

    // Verify upcoming sessions section is visible
    await expect(page.locator("text=Upcoming Sessions")).toBeVisible();

    // Verify the test session is shown
    await expect(page.locator(`text=${testSession.title}`)).toBeVisible();

    // Verify initial status is Pending
    await expect(page.locator("text=Pending")).toBeVisible();
  });

  test("parent can mark session as confirmed", async ({ page }) => {
    // Login as test parent
    await page.goto("/login");
    await page.fill('input[type="email"]', testParent.email);
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    // Navigate to kid dashboard
    await page.waitForURL(/\/parent\/kids/, { timeout: 10000 });
    await page.click(`text=${testKid.firstName} ${testKid.lastName}`);
    await page.waitForURL(/\/parent\/kids\/\d+/, { timeout: 10000 });

    // Click "I can attend" button
    await page.click('button:has-text("I can attend")');

    // Wait for the update to complete
    await page.waitForTimeout(1000);

    // Verify status changed to Attending
    await expect(page.locator("text=Attending")).toBeVisible();

    // Verify in database
    const availability = await db
      .select()
      .from(sessionAvailability)
      .where(
        and(
          eq(sessionAvailability.sessionId, testSession.id),
          eq(sessionAvailability.playerId, testKid.id)
        )
      )
      .limit(1);

    expect(availability.length).toBe(1);
    expect(availability[0].status).toBe("confirmed");
  });

  test("parent can mark session as declined", async ({ page }) => {
    // Login as test parent
    await page.goto("/login");
    await page.fill('input[type="email"]', testParent.email);
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    // Navigate to kid dashboard
    await page.waitForURL(/\/parent\/kids/, { timeout: 10000 });
    await page.click(`text=${testKid.firstName} ${testKid.lastName}`);
    await page.waitForURL(/\/parent\/kids\/\d+/, { timeout: 10000 });

    // Click "Can't attend" button
    await page.click('button:has-text("Can\'t attend")');

    // Wait for the update to complete
    await page.waitForTimeout(1000);

    // Verify status changed to Not Attending
    await expect(page.locator("text=Not Attending")).toBeVisible();

    // Verify in database
    const availability = await db
      .select()
      .from(sessionAvailability)
      .where(
        and(
          eq(sessionAvailability.sessionId, testSession.id),
          eq(sessionAvailability.playerId, testKid.id)
        )
      )
      .limit(1);

    expect(availability.length).toBe(1);
    expect(availability[0].status).toBe("declined");
  });

  test("availability status persists after page refresh", async ({ page }) => {
    // First, set availability to confirmed
    await page.goto("/login");
    await page.fill('input[type="email"]', testParent.email);
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/parent\/kids/, { timeout: 10000 });
    await page.click(`text=${testKid.firstName} ${testKid.lastName}`);
    await page.waitForURL(/\/parent\/kids\/\d+/, { timeout: 10000 });

    await page.click('button:has-text("I can attend")');
    await page.waitForTimeout(1000);

    // Refresh the page
    await page.reload();

    // Wait for page to load
    await page.waitForSelector("text=Upcoming Sessions");

    // Verify status is still Attending
    await expect(page.locator("text=Attending")).toBeVisible();
  });
});
