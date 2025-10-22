import { test, expect } from "@playwright/test";

/**
 * Login Flow Tests
 * Tests user login with seeded test users
 */

// Skip auth setup for these tests
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("User Login", () => {
  const testUsers = [
    { email: "admin@test.com", password: "password", role: "admin", dashboardPattern: /\/admin|\/dashboard/ },
    { email: "parent@test.com", password: "password", role: "parent", dashboardPattern: /\/parent|\/dashboard/ },
    { email: "coach@test.com", password: "password", role: "coach", dashboardPattern: /\/coach|\/dashboard/ },
  ];

  test("should display login form", async ({ page }) => {
    await page.goto("/auth");

    // Verify login page elements
    await expect(page.getByLabel(/email/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /log in|sign in/i })).toBeVisible();

    // Screenshot
    await page.screenshot({ path: 'test-results/login-form.png' });
  });

  test("should reject invalid credentials", async ({ page }) => {
    await page.goto("/auth");

    await page.getByLabel(/email/i).fill("invalid@example.com");
    await page.getByLabel(/password/i).fill("wrongpassword");
    await page.getByRole("button", { name: /log in|sign in/i }).click();

    // Should show error
    await expect(
      page.getByText(/invalid.*credentials|incorrect.*password|login.*failed/i)
    ).toBeVisible({ timeout: 5000 });
  });

  for (const user of testUsers) {
    test(`should login as ${user.role} and redirect to dashboard`, async ({ page }) => {
      await page.goto("/auth");

      // Fill login form
      await page.getByLabel(/email/i).fill(user.email);
      await page.getByLabel(/password/i).fill(user.password);
      await page.getByRole("button", { name: /log in|sign in/i }).click();

      // Wait for redirect to dashboard
      await page.waitForURL(user.dashboardPattern, { timeout: 10000 });

      // Verify on dashboard
      await expect(
        page.getByText(/dashboard|welcome/i).first()
      ).toBeVisible({ timeout: 10000 });

      // Verify session cookie is set
      const cookies = await page.context().cookies();
      const sessionCookie = cookies.find(c => 
        c.name === "connect.sid" || c.name === "legacy.sid" || c.name.includes("sid")
      );
      expect(sessionCookie).toBeDefined();
      expect(sessionCookie?.httpOnly).toBe(true);

      // Screenshot logged-in dashboard
      await page.screenshot({ path: `test-results/dashboard-${user.role}.png` });

      console.log(`✅ ${user.role} login successful`);
    });
  }

  test("should maintain session across page refresh", async ({ page }) => {
    // Login first
    await page.goto("/auth");
    await page.getByLabel(/email/i).fill("admin@test.com");
    await page.getByLabel(/password/i).fill("password");
    await page.getByRole("button", { name: /log in|sign in/i }).click();
    
    await page.waitForURL(/\/admin|\/dashboard/, { timeout: 10000 });

    // Refresh page
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Should still be on dashboard (not redirected to login)
    expect(page.url()).toMatch(/\/admin|\/dashboard/);
    
    // Should still see dashboard content
    await expect(
      page.getByText(/dashboard|welcome/i).first()
    ).toBeVisible({ timeout: 5000 });

    console.log("✅ Session persisted after refresh");
  });

  test("should auto-redirect logged-in users away from login page", async ({ page }) => {
    // Login first
    await page.goto("/auth");
    await page.getByLabel(/email/i).fill("admin@test.com");
    await page.getByLabel(/password/i).fill("password");
    await page.getByRole("button", { name: /log in|sign in/i }).click();
    
    await page.waitForURL(/\/admin|\/dashboard/, { timeout: 10000 });

    // Try to go back to login page
    await page.goto("/auth");
    await page.waitForTimeout(1000);

    // Should be redirected away from login (to dashboard)
    expect(page.url()).toMatch(/\/admin|\/dashboard/);
  });
});

test.describe("Login - Mobile", () => {
  test("should work on iPhone SE (375px)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/auth");

    // Fill and submit
    await page.getByLabel(/email/i).fill("admin@test.com");
    await page.getByLabel(/password/i).fill("password");
    await page.getByRole("button", { name: /log in|sign in/i }).click();

    // Should redirect to dashboard
    await page.waitForURL(/\/admin|\/dashboard/, { timeout: 10000 });

    // Screenshot mobile dashboard
    await page.screenshot({ path: 'test-results/dashboard-mobile-iphone.png', fullPage: true });
  });
});
