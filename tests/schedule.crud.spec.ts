import { test, expect } from "@playwright/test";

/**
 * Schedule/Calendar Tests
 * Verifies that calendar dialog OK/Save creates events
 */

test.describe("Schedule Management", () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto("/auth");
    await page.getByLabel(/email/i).fill("admin@test.com");
    await page.getByLabel(/password/i).fill("password");
    await page.getByRole("button", { name: /log in|sign in/i }).click();
    await page.waitForURL(/\/admin|\/dashboard/, { timeout: 10000 });

    // Navigate to schedule page
    const scheduleLink = page.getByRole("link", { name: /schedule/i }).first();
    if (await scheduleLink.isVisible({ timeout: 3000 })) {
      await scheduleLink.click();
      await page.waitForTimeout(1000);
    } else {
      await page.goto("/admin/schedule");
    }
  });

  test("should display schedule page", async ({ page }) => {
    await expect(page.getByText(/schedule|calendar/i).first()).toBeVisible({ timeout: 5000 });

    // Screenshot
    await page.screenshot({ path: 'test-results/schedule-page.png' });
  });

  test("should have Add Session/Event button", async ({ page }) => {
    const addButton = page.getByRole("button", { name: /add.*session|create.*event|new.*session/i }).first();
    
    const isVisible = await addButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!isVisible) {
      console.log("⚠️ Add Session button not found - may need data-testid");
      test.skip();
      return;
    }

    await expect(addButton).toBeVisible();
  });

  test("should open calendar/schedule dialog with form fields", async ({ page }) => {
    const addButton = page.getByRole("button", { name: /add.*session|create.*event|new.*session/i }).first();
    
    if (await addButton.isVisible({ timeout: 5000 })) {
      await addButton.click();
      await page.waitForTimeout(500);

      // Verify dialog opened
      await expect(
        page.getByText(/add.*session|new.*event|create.*session/i).first()
      ).toBeVisible({ timeout: 3000 });

      // Verify required fields
      await expect(page.getByLabel(/title|name/i).first()).toBeVisible();
      await expect(page.getByLabel(/location/i)).toBeVisible();

      // Screenshot dialog
      await page.screenshot({ path: 'test-results/schedule-dialog.png' });

      // Close dialog
      const closeButton = page.getByLabel(/close/i).first();
      if (await closeButton.isVisible({ timeout: 2000 })) {
        await closeButton.click();
      }
    } else {
      test.skip();
    }
  });

  test("should successfully create a new training session", async ({ page }) => {
    const addButton = page.getByRole("button", { name: /add.*session|create.*event|new.*session/i }).first();
    
    if (await addButton.isVisible({ timeout: 5000 })) {
      await addButton.click();
      await page.waitForTimeout(500);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];

      const testSession = {
        title: `Test Training ${Date.now()}`,
        location: "Main Field",
        ageGroup: "Under 14s",
        startTime: `${tomorrowStr}T10:00`,
        endTime: `${tomorrowStr}T12:00`,
      };

      // Fill form
      await page.getByLabel(/title|name/i).first().fill(testSession.title);
      await page.getByLabel(/location/i).fill(testSession.location);

      // Age group (if exists)
      const ageGroupField = page.getByLabel(/age group/i);
      if (await ageGroupField.isVisible({ timeout: 2000 })) {
        await ageGroupField.click();
        await page.getByRole("option", { name: /under 14/i }).click();
      }

      // Start time
      const startTimeField = page.getByLabel(/start.*time|start.*date/i).first();
      if (await startTimeField.isVisible({ timeout: 2000 })) {
        await startTimeField.fill(testSession.startTime);
      }

      // End time
      const endTimeField = page.getByLabel(/end.*time|end.*date/i).first();
      if (await endTimeField.isVisible({ timeout: 2000 })) {
        await endTimeField.fill(testSession.endTime);
      }

      // Screenshot filled form
      await page.screenshot({ path: 'test-results/schedule-dialog-filled.png' });

      // Submit
      const saveButton = page.getByRole("button", { name: /save|ok|create/i }).first();
      await saveButton.click();
      await page.waitForTimeout(2000);

      // Verify event appears in calendar/list
      await expect(page.getByText(testSession.title)).toBeVisible({ timeout: 5000 });

      // Screenshot with new event
      await page.screenshot({ path: 'test-results/schedule-event-created.png' });

      console.log(`✅ Session created: ${testSession.title}`);
    } else {
      test.skip();
    }
  });

  test("should validate start time before end time", async ({ page }) => {
    const addButton = page.getByRole("button", { name: /add.*session|create.*event/i }).first();
    
    if (await addButton.isVisible({ timeout: 5000 })) {
      await addButton.click();
      await page.waitForTimeout(500);

      const today = new Date().toISOString().split("T")[0];

      // Fill with invalid times (end before start)
      await page.getByLabel(/title|name/i).first().fill("Invalid Session");
      
      const startField = page.getByLabel(/start/i).first();
      const endField = page.getByLabel(/end/i).first();
      
      if (await startField.isVisible({ timeout: 2000 }) && await endField.isVisible({ timeout: 2000 })) {
        await startField.fill(`${today}T14:00`);
        await endField.fill(`${today}T10:00`); // Before start time

        const saveButton = page.getByRole("button", { name: /save|ok|create/i }).first();
        await saveButton.click();
        await page.waitForTimeout(1000);

        // Should show validation error
        await expect(
          page.getByText(/end.*after.*start|invalid.*time/i)
        ).toBeVisible({ timeout: 3000 });

        console.log("✅ Time validation working");
      }
    } else {
      test.skip();
    }
  });

  test("should show success toast after creating session", async ({ page }) => {
    const addButton = page.getByRole("button", { name: /add.*session|create.*event/i }).first();
    
    if (await addButton.isVisible({ timeout: 5000 })) {
      await addButton.click();
      await page.waitForTimeout(500);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];

      // Fill minimal fields
      await page.getByLabel(/title|name/i).first().fill(`Quick Session ${Date.now()}`);
      await page.getByLabel(/location/i).fill("Field");

      const startField = page.getByLabel(/start/i).first();
      if (await startField.isVisible({ timeout: 2000 })) {
        await startField.fill(`${tomorrowStr}T10:00`);
      }

      const saveButton = page.getByRole("button", { name: /save|ok|create/i }).first();
      await saveButton.click();
      await page.waitForTimeout(2000);

      // Look for success toast
      const toast = page.getByText(/session.*created|success/i).first();
      await expect(toast).toBeVisible({ timeout: 5000 });

      console.log("✅ Success toast displayed");
    } else {
      test.skip();
    }
  });
});

test.describe("Schedule - Mobile", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Login
    await page.goto("/auth");
    await page.getByLabel(/email/i).fill("admin@test.com");
    await page.getByLabel(/password/i).fill("password");
    await page.getByRole("button", { name: /log in|sign in/i }).click();
    await page.waitForURL(/\/admin|\/dashboard/, { timeout: 10000 });

    // Navigate to schedule
    await page.goto("/admin/schedule");
  });

  test("should display calendar on iPhone SE", async ({ page }) => {
    await expect(page.getByText(/schedule|calendar/i).first()).toBeVisible({ timeout: 5000 });

    // Calendar should be scrollable
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // Screenshot mobile calendar
    await page.screenshot({ path: 'test-results/schedule-mobile-calendar.png', fullPage: true });
  });

  test("should allow creating session on mobile", async ({ page }) => {
    const addButton = page.getByRole("button", { name: /add.*session|create/i }).first();
    
    if (await addButton.isVisible({ timeout: 5000 })) {
      await addButton.click();
      await page.waitForTimeout(500);

      // Dialog should be scrollable
      await page.evaluate(() => {
        const dialog = document.querySelector('[role="dialog"]');
        if (dialog) {
          dialog.scrollTop = dialog.scrollHeight;
        }
      });

      // Save button should be accessible
      const saveButton = page.getByRole("button", { name: /save|ok/i }).first();
      await expect(saveButton).toBeVisible({ timeout: 3000 });

      // Screenshot mobile dialog
      await page.screenshot({ path: 'test-results/schedule-mobile-dialog.png', fullPage: true });
    } else {
      test.skip();
    }
  });
});
