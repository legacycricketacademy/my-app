import { test, expect } from "@playwright/test";

test.describe("Coach Session Management", () => {
  test("coach can access schedule page and see form", async ({ page }) => {
    // Admin is already logged in via auth.setup.ts storage state

    // Navigate to coach schedule page
    await page.goto("/coach/schedule");
    await page.waitForLoadState("networkidle");

    // Verify page loaded with test ID
    await expect(page.getByTestId("coach-schedule-page")).toBeVisible();
    await expect(page.locator("text=Session Schedule")).toBeVisible();
    await expect(page.locator("text=Create New Session")).toBeVisible();

    // Verify the create session button is present
    await expect(page.getByTestId("create-session-btn")).toBeVisible();

    // Verify upcoming sessions section exists
    await expect(page.getByTestId("upcoming-sessions-card")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Upcoming Sessions" })).toBeVisible();
  });

  test("coach can view upcoming sessions list", async ({ page }) => {
    // Admin is already logged in via auth.setup.ts storage state

    // Navigate to coach schedule
    await page.goto("/coach/schedule");
    await page.waitForLoadState("networkidle");

    // Verify upcoming sessions section exists
    await expect(page.getByRole("heading", { name: "Upcoming Sessions" })).toBeVisible();
    await expect(page.getByTestId("upcoming-sessions-list")).toBeVisible();

    // Check if there are any sessions or empty state
    const hasNoSessions = await page.getByTestId("no-sessions").isVisible().catch(() => false);
    
    if (hasNoSessions) {
      // Empty state is valid
      await expect(page.getByTestId("no-sessions")).toContainText("No upcoming sessions scheduled");
    } else {
      // If there are sessions, verify at least one session card exists
      const sessionCards = page.locator('[data-testid^="session-card-"]');
      const count = await sessionCards.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test("coach can open session creation dialog", async ({ page }) => {
    // Admin is already logged in via auth.setup.ts storage state

    // Navigate to coach schedule
    await page.goto("/coach/schedule");
    await page.waitForLoadState("networkidle");

    // Click the create session button
    await page.getByTestId("create-session-btn").click();

    // Wait for dialog/modal to open
    await page.waitForTimeout(500);

    // Verify dialog opened with title field visible
    await expect(page.getByTestId("input-session-title")).toBeVisible({ timeout: 5000 });
    
    // Verify dialog title
    await expect(page.getByText("Schedule New Training Session")).toBeVisible();
    
    // Verify submit button exists
    await expect(page.getByTestId("btn-submit-session")).toBeVisible();
  });

  test("form validation requires title", async ({ page }) => {
    // Admin is already logged in via auth.setup.ts storage state

    // Navigate to coach schedule
    await page.goto("/coach/schedule");
    await page.waitForLoadState("networkidle");

    // Open the dialog
    await page.getByTestId("create-session-btn").click();
    await page.waitForTimeout(500);

    // Try to submit without filling required fields
    await page.getByTestId("btn-submit-session").click();
    
    // Wait a moment for validation
    await page.waitForTimeout(500);

    // Verify we're still on the dialog (validation prevented submission)
    await expect(page.getByTestId("input-session-title")).toBeVisible();
    
    // The form should show validation errors or prevent submission
    // We verify by checking that the dialog is still open
    await expect(page.getByText("Schedule New Training Session")).toBeVisible();
  });
});
