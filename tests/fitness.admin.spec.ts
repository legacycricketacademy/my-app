import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Use the authenticated session from setup
test.use({ storageState: 'playwright/.auth/admin.json' });

test("Admin fitness page renders", async ({ page }) => {
  await page.goto(`${BASE_URL}/dashboard/fitness`);
  await expect(page.getByTestId("heading-admin-fitness")).toBeVisible();
  await expect(page.getByTestId("btn-new-fitness-plan")).toBeVisible();
  await expect(page.getByTestId("btn-upload-fitness-file")).toBeVisible();
});

