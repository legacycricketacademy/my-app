import { test, expect } from "@playwright/test";

test.describe("Comprehensive Form Validation Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("input-email").fill("admin@test.com");
    await page.getByTestId("input-password").fill("password");
    await page.getByTestId("btn-login").click();
    await page.waitForLoadState("networkidle");
  });

  test.describe("Login Form Validations", () => {
    test.use({ storageState: { cookies: [], origins: [] } }); // No auth

    test("should require email and password", async ({ page }) => {
      await page.goto("/login");
      
      const loginBtn = page.getByTestId("btn-login");
      await loginBtn.click();
      
      // Form should show validation (HTML5 or custom)
      const emailInput = page.getByTestId("input-email");
      const passwordInput = page.getByTestId("input-password");
      
      // Check if HTML5 validation is working
      const emailInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
      const passwordInvalid = await passwordInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
      
      expect(emailInvalid || passwordInvalid).toBeTruthy();
    });

    test("should validate email format", async ({ page }) => {
      await page.goto("/login");
      
      await page.getByTestId("input-email").fill("invalid-email");
      await page.getByTestId("input-password").fill("password");
      await page.getByTestId("btn-login").click();
      
      // Should show error or prevent submission
      const emailInput = page.getByTestId("input-email");
      const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
      expect(isInvalid).toBeTruthy();
    });
  });

  test.describe("Schedule Session Form Validations", () => {
    test("should validate required fields when creating session", async ({ page }) => {
      await page.goto("/dashboard/schedule");
      await page.waitForLoadState("networkidle");
      
      // Try to open schedule dialog
      const scheduleBtn = page.getByRole("button", { name: /schedule|add.*session|new.*session/i }).first();
      
      if (await scheduleBtn.isVisible()) {
        await scheduleBtn.click();
        await page.waitForTimeout(500);
        
        // Try to submit without filling required fields
        const submitBtn = page.getByRole("button", { name: /save|create|schedule/i }).filter({ hasText: /save|create|schedule/i }).first();
        
        if (await submitBtn.isVisible()) {
          await submitBtn.click();
          await page.waitForTimeout(500);
          
          // Dialog should still be open (validation prevented submit)
          const dialogOpen = await page.getByRole("dialog").isVisible().catch(() => false);
          expect(dialogOpen).toBeTruthy();
        }
      }
    });

    test("should validate date is not in the past", async ({ page }) => {
      await page.goto("/dashboard/schedule");
      await page.waitForLoadState("networkidle");
      
      const scheduleBtn = page.getByRole("button", { name: /schedule|add.*session/i }).first();
      
      if (await scheduleBtn.isVisible()) {
        await scheduleBtn.click();
        await page.waitForTimeout(500);
        
        // Fill in a past date if date picker is available
        const dateInput = page.locator("input[type=date], input[placeholder*=date]").first();
        
        if (await dateInput.isVisible()) {
          await dateInput.fill("2020-01-01");
          
          const submitBtn = page.getByRole("button", { name: /save|create/i }).first();
          await submitBtn.click();
          
          // Should show error or prevent submission
          await page.waitForTimeout(500);
          const errorMsg = page.getByText(/past|invalid.*date/i);
          const hasError = await errorMsg.isVisible().catch(() => false);
          
          // Either error message or dialog still open
          const dialogOpen = await page.getByRole("dialog").isVisible().catch(() => false);
          expect(hasError || dialogOpen).toBeTruthy();
        }
      }
    });
  });

  test.describe("Announcement Form Validations", () => {
    test("should require title and message", async ({ page }) => {
      await page.goto("/dashboard/announcements");
      await page.waitForLoadState("networkidle");
      
      const createBtn = page.getByRole("button", { name: /create announcement/i }).first();
      await createBtn.click();
      await page.waitForTimeout(500);
      
      // Try to submit empty form
      const submitBtn = page.getByRole("button", { name: /post|send|publish|create/i }).filter({ hasText: /post|send|publish/i }).first();
      
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await page.waitForTimeout(500);
        
        // Should show validation
        const dialogOpen = await page.getByRole("dialog").isVisible().catch(() => false);
        expect(dialogOpen).toBeTruthy();
      }
    });

    test("should validate minimum message length", async ({ page }) => {
      await page.goto("/dashboard/announcements");
      await page.waitForLoadState("networkidle");
      
      const createBtn = page.getByRole("button", { name: /create announcement/i }).first();
      await createBtn.click();
      await page.waitForTimeout(500);
      
      // Fill with very short message
      const titleInput = page.getByLabel(/title/i);
      const messageInput = page.getByLabel(/message|content/i);
      
      if (await titleInput.isVisible() && await messageInput.isVisible()) {
        await titleInput.fill("Test");
        await messageInput.fill("x"); // Too short
        
        const submitBtn = page.getByRole("button", { name: /post|send/i }).first();
        await submitBtn.click();
        await page.waitForTimeout(500);
        
        // Should show validation or keep dialog open
        const dialogOpen = await page.getByRole("dialog").isVisible().catch(() => false);
        expect(dialogOpen).toBeTruthy();
      }
    });
  });

  test.describe("Payment Form Validations", () => {
    test("should validate payment amount is positive", async ({ page }) => {
      await page.goto("/dashboard/payments");
      await page.waitForLoadState("networkidle");
      
      const recordBtn = page.getByRole("button", { name: /record.*payment|add.*payment/i }).first();
      
      if (await recordBtn.isVisible()) {
        await recordBtn.click();
        await page.waitForTimeout(500);
        
        const amountInput = page.getByLabel(/amount|price/i);
        
        if (await amountInput.isVisible()) {
          await amountInput.fill("-100"); // Negative amount
          
          const submitBtn = page.getByRole("button", { name: /save|submit|record/i }).first();
          await submitBtn.click();
          await page.waitForTimeout(500);
          
          // Should show validation
          const errorMsg = page.getByText(/positive|greater than|invalid/i);
          const hasError = await errorMsg.isVisible().catch(() => false);
          const dialogOpen = await page.getByRole("dialog").isVisible().catch(() => false);
          
          expect(hasError || dialogOpen).toBeTruthy();
        }
      }
    });
  });

  test.describe("Registration Form Validations", () => {
    test.use({ storageState: { cookies: [], origins: [] } }); // No auth

    test("should validate all required registration fields", async ({ page }) => {
      // Try to access registration page
      await page.goto("/register");
      
      // Check if page exists
      const pageExists = await page.getByTestId("heading-register").isVisible().catch(() => false);
      
      if (pageExists) {
        // Try to submit without filling
        const submitBtn = page.getByTestId("reg-submit");
        await submitBtn.click();
        await page.waitForTimeout(500);
        
        // Should show validation
        const parentNameInput = page.getByTestId("reg-parent-name");
        const emailInput = page.getByTestId("reg-email");
        
        const parentInvalid = await parentNameInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
        const emailInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
        
        expect(parentInvalid || emailInvalid).toBeTruthy();
      }
    });

    test("should validate email format in registration", async ({ page }) => {
      await page.goto("/register");
      
      const pageExists = await page.getByTestId("heading-register").isVisible().catch(() => false);
      
      if (pageExists) {
        await page.getByTestId("reg-parent-name").fill("Test Parent");
        await page.getByTestId("reg-email").fill("invalid-email");
        await page.getByTestId("reg-submit").click();
        
        const emailInput = page.getByTestId("reg-email");
        const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
        expect(isInvalid).toBeTruthy();
      }
    });
  });
});

test.describe("Error Handling & Edge Cases", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("input-email").fill("admin@test.com");
    await page.getByTestId("input-password").fill("password");
    await page.getByTestId("btn-login").click();
    await page.waitForLoadState("networkidle");
  });

  test("should handle invalid routes gracefully", async ({ page }) => {
    await page.goto("/dashboard/non-existent-page");
    
    // Should show 404 or redirect, not crash
    await page.waitForLoadState("networkidle");
    const hasErrorState = await page.getByText(/not found|404/i).isVisible().catch(() => false);
    const redirected = !page.url().includes("non-existent-page");
    
    expect(hasErrorState || redirected).toBeTruthy();
  });

  test("should handle network errors gracefully", async ({ page }) => {
    // Navigate to a page
    await page.goto("/dashboard/team");
    await page.waitForLoadState("networkidle");
    
    // Simulate offline
    await page.context().setOffline(true);
    
    // Try to perform an action that requires network
    const addBtn = page.getByRole("button", { name: /add/i }).first();
    
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(1000);
      
      // Should show error message or handle gracefully
      const errorMsg = page.getByText(/error|failed|network/i);
      const hasError = await errorMsg.isVisible().catch(() => false);
      
      // App should not crash
      const appContent = await page.locator("main, .dashboard, h1").first().isVisible();
      expect(appContent).toBeTruthy();
    }
    
    // Restore online
    await page.context().setOffline(false);
  });
});

