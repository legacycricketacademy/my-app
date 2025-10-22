import { test, expect } from "@playwright/test";

/**
 * Sidebar Navigation Tests
 * Verifies that clicking sidebar tabs stays on the page (no redirect loops)
 */

test.describe("Sidebar Navigation", () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto("/auth");
    await page.getByLabel(/email/i).fill("admin@test.com");
    await page.getByLabel(/password/i).fill("password");
    await page.getByRole("button", { name: /log in|sign in/i }).click();
    await page.waitForURL(/\/admin|\/dashboard/, { timeout: 10000 });
  });

  const sidebarTabs = [
    { name: /dashboard|home/i, urlPattern: /\/dashboard|\/admin\/?$/ },
    { name: /schedule/i, urlPattern: /\/schedule/ },
    { name: /settings/i, urlPattern: /\/settings/ },
    { name: /team|players/i, urlPattern: /\/team|\/players/ },
    { name: /announcements/i, urlPattern: /\/announcement/ },
    { name: /payments/i, urlPattern: /\/payment/ },
    { name: /meal.*plan/i, urlPattern: /\/meal/ },
    { name: /fitness/i, urlPattern: /\/fitness/ },
  ];

  for (const tab of sidebarTabs) {
    test(`should navigate to ${tab.name.source} and stay on page`, async ({ page }) => {
      // Find and click the sidebar link
      const tabLink = page.getByRole("link", { name: tab.name }).first();
      
      // Check if tab exists
      const isVisible = await tabLink.isVisible({ timeout: 3000 }).catch(() => false);
      
      if (!isVisible) {
        test.skip();
        return;
      }

      await tabLink.click();

      // Wait for navigation
      await page.waitForTimeout(1000);

      // Verify URL matches expected pattern
      const url = page.url();
      expect(url).toMatch(tab.urlPattern);

      // Wait a bit more to ensure no redirect happens
      await page.waitForTimeout(1000);

      // Verify still on same page (no redirect loop)
      const finalUrl = page.url();
      expect(finalUrl).toMatch(tab.urlPattern);

      // Verify no "loading authentication" flash
      const loadingText = page.getByText(/loading authentication/i);
      await expect(loadingText).not.toBeVisible();

      // Screenshot the page
      const pageName = tab.name.source.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      await page.screenshot({ path: `test-results/sidebar-${pageName}.png` });

      console.log(`✅ Tab "${tab.name.source}" stayed on page: ${finalUrl}`);
    });
  }

  test("should not have redirect loops when clicking tabs multiple times", async ({ page }) => {
    // Navigate between tabs multiple times
    const scheduleTab = page.getByRole("link", { name: /schedule/i }).first();
    const settingsTab = page.getByRole("link", { name: /settings/i }).first();

    if (await scheduleTab.isVisible({ timeout: 3000 })) {
      // Click schedule 3 times
      for (let i = 0; i < 3; i++) {
        await scheduleTab.click();
        await page.waitForTimeout(500);
        expect(page.url()).toMatch(/\/schedule/);
      }

      // Switch to settings
      if (await settingsTab.isVisible({ timeout: 3000 })) {
        await settingsTab.click();
        await page.waitForTimeout(500);
        expect(page.url()).toMatch(/\/settings/);

        // Back to schedule
        await scheduleTab.click();
        await page.waitForTimeout(500);
        expect(page.url()).toMatch(/\/schedule/);
      }

      console.log("✅ No redirect loops detected");
    }
  });

  test("should maintain session while navigating between tabs", async ({ page }) => {
    const tabs = [
      page.getByRole("link", { name: /schedule/i }).first(),
      page.getByRole("link", { name: /settings/i }).first(),
    ];

    for (const tab of tabs) {
      if (await tab.isVisible({ timeout: 2000 })) {
        await tab.click();
        await page.waitForTimeout(1000);

        // Verify still authenticated (no redirect to login)
        expect(page.url()).not.toContain("/auth");
        expect(page.url()).not.toContain("/login");

        // Verify session cookie still exists
        const cookies = await page.context().cookies();
        const sessionCookie = cookies.find(c => c.name.includes("sid"));
        expect(sessionCookie).toBeDefined();
      }
    }

    console.log("✅ Session maintained during navigation");
  });
});

test.describe("Sidebar Navigation - Mobile", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Login
    await page.goto("/auth");
    await page.getByLabel(/email/i).fill("admin@test.com");
    await page.getByLabel(/password/i).fill("password");
    await page.getByRole("button", { name: /log in|sign in/i }).click();
    await page.waitForURL(/\/admin|\/dashboard/, { timeout: 10000 });
  });

  test("should navigate via mobile menu on iPhone SE", async ({ page }) => {
    // On mobile, sidebar might be collapsed - look for hamburger menu
    const hamburger = page.getByRole("button", { name: /menu|navigation/i }).first();
    
    const isHamburgerVisible = await hamburger.isVisible({ timeout: 2000 }).catch(() => false);
    
    if (isHamburgerVisible) {
      await hamburger.click();
      await page.waitForTimeout(500);
    }

    // Try to click schedule
    const scheduleLink = page.getByRole("link", { name: /schedule/i }).first();
    if (await scheduleLink.isVisible({ timeout: 3000 })) {
      await scheduleLink.click();
      await page.waitForTimeout(1000);

      expect(page.url()).toMatch(/\/schedule/);
      
      // Screenshot mobile nav
      await page.screenshot({ path: 'test-results/sidebar-mobile-schedule.png', fullPage: true });
    }
  });
});
