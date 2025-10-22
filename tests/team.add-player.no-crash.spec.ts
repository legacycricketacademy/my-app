import { test, expect } from "@playwright/test";
import { loginAsAdmin, openLinkOrGoto, waitForAppIdle } from "./_helpers/nav";

test("Add New Player opens without 'useToast is not defined' overlay", async ({ page }) => {
  await loginAsAdmin(page);
  await openLinkOrGoto(page, /team management/i, "/dashboard/team");
  await waitForAppIdle(page);

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

