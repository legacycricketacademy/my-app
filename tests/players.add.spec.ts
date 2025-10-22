import { test, expect } from "@playwright/test";

/**
 * Add Player Tests
 * Verifies that the "Add New Player" form works and player appears in list
 */

test.describe("Add Player", () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto("/auth");
    await page.getByLabel(/email/i).fill("admin@test.com");
    await page.getByLabel(/password/i).fill("password");
    await page.getByRole("button", { name: /log in|sign in/i }).click();
    await page.waitForURL(/\/admin|\/dashboard/, { timeout: 10000 });

    // Navigate to players page
    const playersLink = page.getByRole("link", { name: /team|players/i }).first();
    if (await playersLink.isVisible({ timeout: 3000 })) {
      await playersLink.click();
      await page.waitForTimeout(1000);
    } else {
      await page.goto("/admin/players");
    }
  });

  test("should display Add New Player button", async ({ page }) => {
    const addButton = page.getByRole("button", { name: /add.*player/i }).first();
    await expect(addButton).toBeVisible({ timeout: 5000 });

    // Screenshot
    await page.screenshot({ path: 'test-results/players-page.png' });
  });

  test("should open Add Player dialog with all fields", async ({ page }) => {
    const addButton = page.getByRole("button", { name: /add.*player/i }).first();
    await addButton.click();
    await page.waitForTimeout(500);

    // Verify dialog opened
    await expect(page.getByText(/add new player/i)).toBeVisible({ timeout: 3000 });

    // Verify all required fields exist
    await expect(page.getByLabel(/first name/i)).toBeVisible();
    await expect(page.getByLabel(/last name/i)).toBeVisible();
    await expect(page.getByLabel(/parent name/i)).toBeVisible();
    await expect(page.getByLabel(/parent email/i)).toBeVisible();

    // Screenshot dialog
    await page.screenshot({ path: 'test-results/add-player-dialog.png' });

    // Close dialog
    const closeButton = page.getByLabel(/close/i).first();
    if (await closeButton.isVisible({ timeout: 2000 })) {
      await closeButton.click();
    }
  });

  test("should successfully add a new player", async ({ page }) => {
    const timestamp = Date.now();
    const testPlayer = {
      firstName: "Test",
      lastName: `Player${timestamp}`,
      dateOfBirth: "2010-01-15",
      ageGroup: "Under 14s",
      playerType: "All-rounder",
      parentName: "Test Parent",
      parentEmail: `parent${timestamp}@example.com`,
    };

    // Click Add Player button
    const addButton = page.getByRole("button", { name: /add.*player/i }).first();
    await addButton.click();
    await page.waitForTimeout(500);

    // Fill form
    await page.getByLabel(/first name/i).fill(testPlayer.firstName);
    await page.getByLabel(/last name/i).fill(testPlayer.lastName);

    // Date of birth (may need special handling)
    const dobField = page.getByLabel(/date of birth|dob/i);
    if (await dobField.isVisible({ timeout: 2000 })) {
      await dobField.fill(testPlayer.dateOfBirth);
    }

    // Age group dropdown
    const ageGroupField = page.getByLabel(/age group/i);
    if (await ageGroupField.isVisible({ timeout: 2000 })) {
      await ageGroupField.click();
      await page.getByRole("option", { name: testPlayer.ageGroup }).click();
    }

    // Player type
    const playerTypeField = page.getByLabel(/player type/i);
    if (await playerTypeField.isVisible({ timeout: 2000 })) {
      await playerTypeField.click();
      await page.getByRole("option", { name: testPlayer.playerType }).click();
    }

    // Parent info
    await page.getByLabel(/parent name/i).fill(testPlayer.parentName);
    await page.getByLabel(/parent email/i).fill(testPlayer.parentEmail);

    // Screenshot filled form
    await page.screenshot({ path: 'test-results/add-player-filled.png' });

    // Submit form
    const saveButton = page.getByRole("button", { name: /save.*player/i });
    await saveButton.click();

    // Wait for dialog to close (indicates success)
    await page.waitForTimeout(2000);

    // Verify player appears in list
    const playerInList = page.getByText(`${testPlayer.firstName} ${testPlayer.lastName}`);
    await expect(playerInList).toBeVisible({ timeout: 5000 });

    // Screenshot with new player
    await page.screenshot({ path: 'test-results/player-added-to-list.png' });

    console.log(`✅ Player added: ${testPlayer.firstName} ${testPlayer.lastName}`);
  });

  test("should validate required fields", async ({ page }) => {
    const addButton = page.getByRole("button", { name: /add.*player/i }).first();
    await addButton.click();
    await page.waitForTimeout(500);

    // Try to submit without filling required fields
    const saveButton = page.getByRole("button", { name: /save.*player/i });
    await saveButton.click();
    await page.waitForTimeout(1000);

    // Should show validation errors
    const errorMessages = page.getByText(/required|cannot be empty/i);
    const hasErrors = await errorMessages.count() > 0;
    expect(hasErrors).toBeTruthy();

    console.log("✅ Form validation working");
  });

  test("should show success toast after adding player", async ({ page }) => {
    const timestamp = Date.now();

    const addButton = page.getByRole("button", { name: /add.*player/i }).first();
    await addButton.click();
    await page.waitForTimeout(500);

    // Fill minimal required fields
    await page.getByLabel(/first name/i).fill("Quick");
    await page.getByLabel(/last name/i).fill(`Test${timestamp}`);
    await page.getByLabel(/parent name/i).fill("Parent");
    await page.getByLabel(/parent email/i).fill(`quick${timestamp}@test.com`);

    const saveButton = page.getByRole("button", { name: /save.*player/i });
    await saveButton.click();
    await page.waitForTimeout(2000);

    // Look for success toast
    const toast = page.getByText(/player.*added|success/i).first();
    await expect(toast).toBeVisible({ timeout: 5000 });

    console.log("✅ Success toast displayed");
  });
});

test.describe("Add Player - Mobile", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Login
    await page.goto("/auth");
    await page.getByLabel(/email/i).fill("admin@test.com");
    await page.getByLabel(/password/i).fill("password");
    await page.getByRole("button", { name: /log in|sign in/i }).click();
    await page.waitForURL(/\/admin|\/dashboard/, { timeout: 10000 });

    // Navigate to players
    await page.goto("/admin/players");
  });

  test("should allow adding player on iPhone SE (375px)", async ({ page }) => {
    const addButton = page.getByRole("button", { name: /add.*player/i }).first();
    await addButton.click();
    await page.waitForTimeout(500);

    // Dialog should be scrollable
    await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      if (dialog) {
        dialog.scrollTop = dialog.scrollHeight;
      }
    });

    // Verify save button is accessible after scroll
    const saveButton = page.getByRole("button", { name: /save.*player/i });
    await expect(saveButton).toBeVisible({ timeout: 3000 });

    // Screenshot mobile dialog
    await page.screenshot({ path: 'test-results/add-player-mobile-dialog.png', fullPage: true });
  });
});
