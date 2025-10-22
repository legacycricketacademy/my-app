import { test, expect } from "@playwright/test";

/**
 * Registration Flow Tests
 * Tests new user registration with email verification
 */

// Skip auth setup - registration page is public
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("User Registration", () => {
  const timestamp = Date.now();
  const testUser = {
    fullName: `Test User ${timestamp}`,
    email: `test.${timestamp}@example.com`,
    password: "Test1234!",
    confirmPassword: "Test1234!",
    role: "parent",
  };

  test("should display registration form with all fields", async ({ page }) => {
    await page.goto("/register");

    // Verify page title
    await expect(page.getByText("Create Account")).toBeVisible({ timeout: 10000 });

    // Verify all form fields exist
    await expect(page.getByTestId("reg-role")).toBeVisible();
    await expect(page.getByTestId("reg-full-name")).toBeVisible();
    await expect(page.getByTestId("reg-email")).toBeVisible();
    await expect(page.getByTestId("reg-password")).toBeVisible();
    await expect(page.getByTestId("reg-confirm-password")).toBeVisible();
    await expect(page.getByTestId("reg-submit")).toBeVisible();

    // Screenshot for documentation
    await page.screenshot({ path: 'test-results/registration-form.png' });
  });

  test("should validate password requirements", async ({ page }) => {
    await page.goto("/register");

    await page.getByTestId("reg-full-name").fill("Test User");
    await page.getByTestId("reg-email").fill("test@example.com");
    
    // Weak password
    await page.getByTestId("reg-password").fill("weak");
    await page.getByTestId("reg-confirm-password").fill("weak");
    await page.getByTestId("reg-submit").click();

    // Should show validation error
    await expect(page.getByText(/password must/i)).toBeVisible({ timeout: 5000 });
  });

  test("should successfully register a new parent user", async ({ page }) => {
    await page.goto("/register");

    // Select role
    await page.getByTestId("reg-role").click();
    await page.getByRole("option", { name: "Parent" }).click();

    // Fill form
    await page.getByTestId("reg-full-name").fill(testUser.fullName);
    await page.getByTestId("reg-email").fill(testUser.email);
    await page.getByTestId("reg-password").fill(testUser.password);
    await page.getByTestId("reg-confirm-password").fill(testUser.confirmPassword);

    // Submit
    await page.getByTestId("reg-submit").click();

    // Verify success message
    await expect(
      page.getByText(/registration successful.*check your email/i)
    ).toBeVisible({ timeout: 10000 });

    // Screenshot success
    await page.screenshot({ path: 'test-results/registration-success.png' });

    // Should redirect to login after 3 seconds (or show success screen)
    await page.waitForTimeout(3500);
  });

  test("should prevent duplicate email registration", async ({ page }) => {
    await page.goto("/register");

    // Try to register with existing email
    await page.getByTestId("reg-role").click();
    await page.getByRole("option", { name: "Parent" }).click();
    
    await page.getByTestId("reg-full-name").fill("Duplicate User");
    await page.getByTestId("reg-email").fill("admin@test.com"); // Existing user
    await page.getByTestId("reg-password").fill("Test1234!");
    await page.getByTestId("reg-confirm-password").fill("Test1234!");
    
    await page.getByTestId("reg-submit").click();

    // Should show error
    await expect(
      page.getByText(/email already exists|account.*already exists/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test("should display password strength indicator", async ({ page }) => {
    await page.goto("/register");

    const passwordField = page.getByTestId("reg-password");
    
    // Weak password
    await passwordField.fill("weak");
    await expect(page.getByText(/weak/i)).toBeVisible({ timeout: 2000 });

    // Medium password
    await passwordField.fill("Test123");
    await expect(page.getByText(/medium/i)).toBeVisible({ timeout: 2000 });

    // Strong password
    await passwordField.fill("Test1234!");
    await expect(page.getByText(/strong/i)).toBeVisible({ timeout: 2000 });
  });
});

test.describe("Registration - Mobile", () => {
  test("should be fully accessible on iPhone SE (375px)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/register");

    // Verify form is visible
    await expect(page.getByText("Create Account")).toBeVisible();

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    // Submit button should be accessible
    const submitButton = page.getByTestId("reg-submit");
    await expect(submitButton).toBeVisible();

    // Screenshot mobile view
    await page.screenshot({ path: 'test-results/registration-mobile-iphone.png', fullPage: true });
  });

  test("should be comfortable on iPad (768px)", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/register");

    // Verify layout
    await expect(page.getByText("Create Account")).toBeVisible();

    // All fields should be visible without scroll
    await expect(page.getByTestId("reg-full-name")).toBeVisible();
    await expect(page.getByTestId("reg-email")).toBeVisible();
    await expect(page.getByTestId("reg-password")).toBeVisible();
    await expect(page.getByTestId("reg-submit")).toBeVisible();

    // Screenshot tablet view
    await page.screenshot({ path: 'test-results/registration-tablet-ipad.png', fullPage: true });
  });
});
