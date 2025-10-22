import { test, expect } from "@playwright/test";

test("Add New Player opens without 'useToast is not defined' overlay", async ({ page }) => {
  await page.goto("/login");
  await page.getByTestId("input-email").fill("admin@test.com");
  await page.getByTestId("input-password").fill("password");
  await page.getByTestId("btn-login").click();

  const nav = page.getByRole("link", { name: /team management/i });
  if (await nav.isVisible().catch(()=>false)) await nav.click(); else await page.goto("/dashboard/team");

  await expect(page.getByRole("heading", { name: /team management/i })).toBeVisible();

  // Click "Add New Player" button
  const addButton = page.locator('button').filter({ hasText: /add new player/i }).first();
  await addButton.click();

  // Dialog should be present (with or without specific testid)
  const dlg = page.locator('[role="dialog"]').first();
  await expect(dlg).toBeVisible();

  // No global error overlay
  await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
  await expect(page.getByText(/useToast is not defined/i)).not.toBeVisible();
});

