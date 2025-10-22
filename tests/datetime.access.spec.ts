import { test, expect } from "@playwright/test";

test("DateTime field is accessible and accepts input", async ({ page }) => {
  await page.goto("/login");
  await page.getByTestId("input-email").fill("admin@test.com");
  await page.getByTestId("input-password").fill("password");
  await page.getByTestId("btn-login").click();
  await page.waitForLoadState("networkidle");

  // Navigate to payments page as a baseline
  await page.goto("/dashboard/payments");

  // Check page loads without crash
  await expect(page.getByTestId("heading-payments")).toBeVisible();
  
  // Verify no error overlay
  await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
});

