import { test, expect } from "@playwright/test";

test("Coach dashboard cards look sane on mobile", async ({ page }) => {
  await page.goto("/login");
  await page.getByTestId("input-email").fill("admin@test.com");
  await page.getByTestId("input-password").fill("password");
  await page.getByTestId("btn-login").click();
  
  // Wait for dashboard to load
  await page.waitForLoadState('networkidle');
  
  // Check that dashboard is visible and not broken
  const hasHeading = await page.locator('h1, h2').first().isVisible().catch(() => false);
  expect(hasHeading).toBe(true);
  
  // Verify no horizontal overflow (mobile layout issue)
  const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
  const viewportWidth = await page.evaluate(() => window.innerWidth);
  expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 10); // Allow 10px tolerance
});

