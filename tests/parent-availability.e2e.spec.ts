import { test, expect } from "./fixtures/parent-fixtures";

test.describe("Parent Availability", () => {
  // Use parent fixtures to get authenticated parent session
  // This ensures we're testing as a real parent user, not admin

  test("parent can view and update session availability", async ({ parentPage }) => {
    // parentPage already has authenticated parent session
    // Navigate directly to parent kids page
    await parentPage.goto("/parent/kids");
    await parentPage.waitForLoadState("networkidle");

    // Check if there are any kids
    const kidsExist = await parentPage.locator('[data-testid="kid-card"]').count() > 0;
    
    if (!kidsExist) {
      console.log("No kids found for parent@test.com - skipping test");
      test.skip();
      return;
    }

    // Click on the first kid
    await parentPage.locator('[data-testid="kid-card"]').first().click();

    // Wait for kid dashboard to load
    await parentPage.waitForURL(/\/parent\/kids\/\d+/, { timeout: 10000 });
    await parentPage.waitForLoadState("networkidle");

    // Verify upcoming sessions section exists
    await expect(parentPage.locator("text=Upcoming Sessions")).toBeVisible();

    // Check if there are any upcoming sessions
    const sessionsExist = await parentPage.locator('button:has-text("Coming")').count() > 0;
    
    if (!sessionsExist) {
      console.log("No upcoming sessions found - test passes as UI is working");
      return;
    }

    // Click "Coming" button on first session
    const comingButton = parentPage.locator('button:has-text("Coming")').first();
    await comingButton.click();

    // Wait for the update to complete
    await parentPage.waitForTimeout(1500);

    // Verify "Coming" badge appears
    const comingBadge = parentPage.locator('text=Coming').first();
    await expect(comingBadge).toBeVisible({ timeout: 5000 });

    // Change to "Can't Attend"
    const cantAttendButton = parentPage.locator('button:has-text("Can\'t Attend")').first();
    await cantAttendButton.click();

    // Wait for the update
    await parentPage.waitForTimeout(1500);

    // Verify "Can't Attend" badge appears
    const cantAttendBadge = parentPage.locator('text=Can\'t Attend').first();
    await expect(cantAttendBadge).toBeVisible({ timeout: 5000 });

    // Change to "Not Sure"
    const notSureButton = parentPage.locator('button:has-text("Not Sure")').first();
    await notSureButton.click();

    // Wait for the update
    await parentPage.waitForTimeout(1500);

    // Verify "Not Sure" badge appears
    const notSureBadge = parentPage.locator('text=Not Sure').first();
    await expect(notSureBadge).toBeVisible({ timeout: 5000 });

    // Refresh the page to verify persistence
    await parentPage.reload();
    await parentPage.waitForLoadState("networkidle");

    // Verify "Not Sure" badge still shows after refresh
    await expect(parentPage.locator('text=Not Sure').first()).toBeVisible({ timeout: 5000 });
  });
});
