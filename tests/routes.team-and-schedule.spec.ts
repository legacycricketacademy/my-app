import { test, expect } from "@playwright/test";

test("Team Management visible at /dashboard/team", async ({ page }) => {
  await page.goto("/dashboard/team");
  await expect(page.getByTestId("heading-team-management")).toBeVisible();
});

test("Schedule visible at /dashboard/schedule", async ({ page }) => {
  await page.goto("/dashboard/schedule");
  await expect(page.getByTestId("heading-schedule")).toBeVisible();
});