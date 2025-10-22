import { test, expect } from "@playwright/test";

test.describe("Admin routing aliases", () => {
  test("Team Management reachable at /dashboard/team", async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("input-email").fill("admin@test.com");
    await page.getByTestId("input-password").fill("password");
    await page.getByTestId("btn-login").click();
    await page.goto("/dashboard/team");
    await expect(page.getByTestId("heading-team-management")).toBeVisible();
  });

  test("Schedule reachable at /dashboard/schedule with heading", async ({ page }) => {
    await page.goto("/login");
    await page.getByTestId("input-email").fill("admin@test.com");
    await page.getByTestId("input-password").fill("password");
    await page.getByTestId("btn-login").click();
    await page.goto("/dashboard/schedule");
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId("heading-schedule")).toBeVisible();
  });
});

