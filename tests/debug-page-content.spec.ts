import { test, expect } from "@playwright/test";

test("Debug page content - check what's actually rendered", async ({ page }) => {
  await page.goto("/login");
  await page.getByTestId("input-email").fill("admin@test.com");
  await page.getByTestId("input-password").fill("password");
  await page.getByTestId("btn-login").click();
  
  // Wait for login to complete
  await page.waitForURL("/dashboard");
  
  // Navigate to team page
  await page.goto("/dashboard/team");
  await page.waitForLoadState('networkidle');
  
  // Log console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error(`Browser console error: ${msg.text()}`);
    }
  });

  // Get page content
  const content = await page.content();
  console.log("Page content for /dashboard/team:", content.substring(0, 1000));

  // Take a screenshot
  await page.screenshot({ path: 'debug-team-page.png' });

  // Navigate to schedule page
  await page.goto("/dashboard/schedule");
  await page.waitForLoadState('networkidle');

  // Get page content
  const scheduleContent = await page.content();
  console.log("Page content for /dashboard/schedule:", scheduleContent.substring(0, 1000));

  // Take a screenshot
  await page.screenshot({ path: 'debug-schedule-page.png' });

  // Just check that we can see some content
  await expect(page.locator('body')).toBeVisible();
});
