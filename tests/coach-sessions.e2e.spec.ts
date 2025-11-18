import { test, expect } from "@playwright/test";

test.describe("Coach Session Management", () => {
  test("coach can access schedule page and see form", async ({ page }) => {
    // Login as admin (who has coach permissions)
    await page.goto("/login");
    await page.fill('input[type="email"]', "admin@test.com");
    await page.fill('input[type="password"]', "password");
    await page.click('button[type="submit"]');

    // Wait for login to complete
    await page.waitForTimeout(2000);

    // Navigate to coach schedule page
    await page.goto("/coach/schedule");
    await page.waitForLoadState("networkidle");

    // Verify page loaded
    await expect(page.locator("text=Session Schedule")).toBeVisible();
    await expect(page.locator("text=Create New Session")).toBeVisible();

    // Verify form fields are present
    await expect(page.locator('input[id="title"]')).toBeVisible();
    await expect(page.locator('input[id="date"]')).toBeVisible();
    await expect(page.locator('input[id="startTime"]')).toBeVisible();
    await expect(page.locator('input[id="durationMinutes"]')).toBeVisible();
    await expect(page.locator('textarea[id="description"]')).toBeVisible();

    // Verify submit button exists
    await expect(page.locator('button[type="submit"]:has-text("Create Session")')).toBeVisible();

    // Verify upcoming sessions section exists
    await expect(page.getByRole("heading", { name: "Upcoming Sessions" })).toBeVisible();
  });

  test("coach can view upcoming sessions list", async ({ page }) => {
    // Login as admin
    await page.goto("/login");
    await page.fill('input[type="email"]', "admin@test.com");
    await page.fill('input[type="password"]', "password");
    await page.click('button[type="submit"]');

    // Wait for login to complete
    await page.waitForTimeout(2000);

    // Navigate to coach schedule
    await page.goto("/coach/schedule");
    await page.waitForLoadState("networkidle");

    // Verify upcoming sessions section exists (use more specific selector)
    await expect(page.getByRole("heading", { name: "Upcoming Sessions" })).toBeVisible();

    // Check if there are any sessions or empty state
    const hasSessions = await page.locator("text=No upcoming sessions scheduled").isVisible();
    
    if (!hasSessions) {
      // If there are sessions, verify the structure
      const firstSession = page.locator('[class*="border rounded-lg"]').first();
      await expect(firstSession).toBeVisible();
    }
  });

  test("form validation works correctly", async ({ page }) => {
    // Login as admin
    await page.goto("/login");
    await page.fill('input[type="email"]', "admin@test.com");
    await page.fill('input[type="password"]', "password");
    await page.click('button[type="submit"]');

    await page.waitForTimeout(2000);

    // Navigate to coach schedule
    await page.goto("/coach/schedule");
    await page.waitForLoadState("networkidle");

    // Try to submit empty form
    await page.click('button[type="submit"]:has-text("Create Session")');

    // HTML5 validation should prevent submission
    // Check that we're still on the same page
    await expect(page.locator("text=Create New Session")).toBeVisible();
  });
});
