import { test, expect } from "@playwright/test";
import { loginAsAdmin, openLinkOrGoto, waitForAppIdle } from "./_helpers/nav";

test.describe("Admin routing aliases", () => {
  test("Team Management reachable at /dashboard/team", async ({ page }) => {
    await loginAsAdmin(page);
    await openLinkOrGoto(page, /team management/i, "/dashboard/team");
    await waitForAppIdle(page);
    await expect(page.getByTestId("heading-team-management")).toBeVisible({ timeout: 15000 });
  });

  test("Schedule reachable at /dashboard/schedule with heading", async ({ page }) => {
    await loginAsAdmin(page);
    await openLinkOrGoto(page, /schedule/i, "/dashboard/schedule");
    await waitForAppIdle(page);
    await expect(page.getByTestId("heading-schedule")).toBeVisible({ timeout: 15000 });
  });
});

