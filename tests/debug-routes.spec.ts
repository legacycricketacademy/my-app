import { test, expect } from "@playwright/test";

test("Debug dashboard routes", async ({ page }) => {
  // Test if we can access the dashboard at all
  await page.goto("/dashboard");
  await page.waitForLoadState("networkidle");
  
  // Check if we're redirected or if there's an error
  const currentUrl = page.url();
  console.log("Current URL:", currentUrl);
  
  // Check for any error messages
  const errorElements = await page.locator('[data-testid*="error"], .error, [class*="error"]').count();
  console.log("Error elements found:", errorElements);
  
  // Check page title
  const title = await page.title();
  console.log("Page title:", title);
  
  // Check if we can see any content
  const bodyText = await page.textContent('body');
  console.log("Body text preview:", bodyText?.substring(0, 200));
});

test("Debug team route specifically", async ({ page }) => {
  await page.goto("/dashboard/team");
  await page.waitForLoadState("networkidle");
  
  const currentUrl = page.url();
  console.log("Team route URL:", currentUrl);
  
  // Check if the page loaded
  const h1Elements = await page.locator('h1').count();
  console.log("H1 elements found:", h1Elements);
  
  // Check for the specific test ID
  const teamHeading = await page.locator('[data-testid="heading-team-management"]').count();
  console.log("Team heading test ID found:", teamHeading);
  
  // Take a screenshot for debugging
  await page.screenshot({ path: 'debug-team-route.png' });
});
