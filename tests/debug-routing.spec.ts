import { test, expect } from "@playwright/test";

test("Debug routing - check what's actually on the page", async ({ page }) => {
  await page.goto("/login");
  await page.getByTestId("input-email").fill("admin@test.com");
  await page.getByTestId("input-password").fill("password");
  await page.getByTestId("btn-login").click();
  
  // Wait for login to complete
  await page.waitForURL("/dashboard");
  
  // Navigate to team page
  await page.goto("/dashboard/team");
  await page.waitForLoadState('networkidle');
  
  // Take screenshot
  await page.screenshot({ path: 'debug-team-page.png' });
  
  // Log all headings on the page
  const headings = await page.locator('h1, h2, h3').all();
  console.log('Found headings:', await Promise.all(headings.map(h => h.textContent())));
  
  // Log all elements with data-testid
  const testIds = await page.locator('[data-testid]').all();
  console.log('Found testIds:', await Promise.all(testIds.map(el => el.getAttribute('data-testid'))));
  
  // Check if there are any JavaScript errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  // Wait a bit to catch any errors
  await page.waitForTimeout(2000);
  
  if (errors.length > 0) {
    console.log('JavaScript errors:', errors);
  }
  
  // Check page content
  const bodyText = await page.textContent('body');
  console.log('Page body contains "Team Management":', bodyText.includes('Team Management'));
  console.log('Page body contains "heading-team-management":', bodyText.includes('heading-team-management'));
});
