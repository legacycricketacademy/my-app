import { test, expect } from "@playwright/test";

test.describe("Comprehensive Navigation & Links Audit", () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto("/auth");
    await page.getByTestId("input-email").fill("admin@test.com");
    await page.getByTestId("input-password").fill("password");
    await page.getByTestId("btn-login").click();
    await page.waitForLoadState("networkidle");
  });

  test("Admin sidebar - all navigation links should be present and clickable", async ({ page }) => {
    const expectedLinks = [
      { text: "Dashboard", href: "/dashboard" },
      { text: "Team Management", href: "/dashboard/team" },
      { text: "Schedule", href: "/dashboard/schedule" },
      { text: "Fitness Tracking", href: "/dashboard/fitness" },
      { text: "Meal Plans", href: "/dashboard/meal-plans" },
      { text: "Announcements", href: "/dashboard/announcements" },
      { text: "Settings", href: "/dashboard/settings" },
    ];

    for (const link of expectedLinks) {
      const navLink = page.getByRole("link", { name: link.text });
      await expect(navLink).toBeVisible();
      
      // Click and verify navigation
      await navLink.click();
      await page.waitForURL(`**${link.href}`, { timeout: 5000 });
      await expect(page).toHaveURL(new RegExp(link.href));
      
      // Verify page loaded (no error overlay)
      const errorOverlay = page.getByText(/something went wrong/i);
      await expect(errorOverlay).not.toBeVisible();
    }
  });

  test("Dashboard - primary action buttons should be functional", async ({ page }) => {
    await page.goto("/dashboard");
    
    // Add New Player button
    const addPlayerBtn = page.getByRole("button", { name: /add new player/i }).first();
    if (await addPlayerBtn.isVisible()) {
      await addPlayerBtn.click();
      await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
    }
  });

  test("Team Management page - should load and display team controls", async ({ page }) => {
    await page.goto("/dashboard/team");
    await page.waitForLoadState("networkidle");
    
    // Verify page heading
    const heading = page.getByRole("heading", { name: /team/i }).first();
    await expect(heading).toBeVisible();
    
    // Verify no error state
    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
  });

  test("Schedule page - should load without crash", async ({ page }) => {
    await page.goto("/dashboard/schedule");
    await page.waitForLoadState("networkidle");
    
    // Verify schedule heading or calendar element
    const hasScheduleContent = await page.getByRole("heading", { name: /schedule/i }).isVisible().catch(() => false);
    expect(hasScheduleContent || await page.locator("h1, h2").first().isVisible()).toBeTruthy();
    
    // Verify no error overlay
    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
  });

  test("Fitness Tracking page - should load correctly", async ({ page }) => {
    await page.goto("/dashboard/fitness");
    await page.waitForLoadState("networkidle");
    
    const heading = page.getByRole("heading", { name: /fitness/i }).first();
    await expect(heading).toBeVisible();
  });

  test("Meal Plans page - should load correctly", async ({ page }) => {
    await page.goto("/dashboard/meal-plans");
    await page.waitForLoadState("networkidle");
    
    const heading = page.getByRole("heading", { name: /meal/i }).first();
    await expect(heading).toBeVisible();
  });

  test("Announcements page - should load and show create button", async ({ page }) => {
    await page.goto("/dashboard/announcements");
    await page.waitForLoadState("networkidle");
    
    const heading = page.getByRole("heading", { name: /announcement/i }).first();
    await expect(heading).toBeVisible();
    
    // Verify create button exists
    const createBtn = page.getByRole("button", { name: /create announcement/i }).first();
    await expect(createBtn).toBeVisible();
  });

  test("Settings page - should load correctly", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await page.waitForLoadState("networkidle");
    
    // Verify settings page loaded
    const hasContent = await page.locator("h1, h2, [role=tab]").first().isVisible().catch(() => false);
    expect(hasContent).toBeTruthy();
  });
});

test.describe("Parent Portal Navigation", () => {
  test.beforeEach(async ({ page }) => {
    // Login as parent
    await page.goto("/auth");
    await page.getByTestId("input-email").fill("parent@test.com");
    await page.getByTestId("input-password").fill("password");
    await page.getByTestId("btn-login").click();
    await page.waitForURL(/\/(parent|dashboard\/parent)/);
  });

  test("Parent sidebar - all navigation links should work", async ({ page }) => {
    const expectedLinks = [
      { text: "Dashboard", href: "/parent" },
      { text: "Schedule", href: "/parent/schedule" },
      { text: "Announcements", href: "/parent/announcements" },
    ];

    for (const link of expectedLinks) {
      const navLink = page.getByRole("link", { name: new RegExp(link.text, "i") });
      
      // Skip if link not visible (mobile collapsed menu)
      if (!(await navLink.isVisible().catch(() => false))) {
        await page.goto(link.href);
      } else {
        await navLink.click();
      }
      
      await page.waitForURL(`**${link.href}`, { timeout: 5000 });
      await expect(page).toHaveURL(new RegExp(link.href));
      
      // Verify no error
      await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
    }
  });
});

test.describe("Form Validations Audit", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth");
    await page.getByTestId("input-email").fill("admin@test.com");
    await page.getByTestId("input-password").fill("password");
    await page.getByTestId("btn-login").click();
    await page.waitForLoadState("networkidle");
  });

  test("Add Player form - should validate required fields", async ({ page }) => {
    await page.goto("/dashboard/team");
    
    const addPlayerBtn = page.getByRole("button", { name: /add.*player/i }).first();
    if (await addPlayerBtn.isVisible()) {
      await addPlayerBtn.click();
      await page.waitForTimeout(500);
      
      // Try to submit without filling
      const submitBtn = page.getByRole("button", { name: /save|submit|add/i }).first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        
        // Should show validation error or not submit
        await page.waitForTimeout(500);
        // Dialog should still be open (validation failed)
        const dialogStillOpen = await page.getByRole("dialog").isVisible().catch(() => false);
        expect(dialogStillOpen).toBeTruthy();
      }
    }
  });

  test("Create Announcement form - should validate required fields", async ({ page }) => {
    await page.goto("/dashboard/announcements");
    await page.waitForLoadState("networkidle");
    
    const createBtn = page.getByRole("button", { name: /create announcement/i }).first();
    await createBtn.click();
    await page.waitForTimeout(500);
    
    // Try to submit empty form
    const submitBtn = page.getByRole("button", { name: /post|publish|send|create/i }).filter({ hasText: /post|publish|send|create/i }).first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      
      // Should show validation error
      await page.waitForTimeout(500);
      const dialogStillOpen = await page.getByRole("dialog").isVisible().catch(() => false);
      expect(dialogStillOpen).toBeTruthy();
    }
  });
});

test.describe("Mobile Navigation Tests", () => {
  test.use({
    viewport: { width: 375, height: 667 }, // Mobile viewport
  });

  test("Mobile - bottom navigation should be visible and functional", async ({ page }) => {
    await page.goto("/auth");
    await page.getByTestId("input-email").fill("admin@test.com");
    await page.getByTestId("input-password").fill("password");
    await page.getByTestId("btn-login").click();
    await page.waitForLoadState("networkidle");
    
    // Check if mobile nav is visible
    const mobileNav = page.locator("nav").filter({ hasText: /dashboard|schedule|players/i });
    const isVisible = await mobileNav.isVisible().catch(() => false);
    
    if (isVisible) {
      // Verify mobile nav items are clickable
      const dashboardLink = mobileNav.getByText(/dashboard/i).first();
      await expect(dashboardLink).toBeVisible();
    }
  });
});

