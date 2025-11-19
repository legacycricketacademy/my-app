import { test, expect } from "@playwright/test";

test("dev login authenticates user and whoami returns a user", async ({ page, request }) => {
  // 1) Hit login UI and perform dev login through form
  await page.goto("/login");
  await page.getByTestId("input-email").fill("admin@test.com");
  await page.getByTestId("input-password").fill("password");
  await page.getByTestId("btn-login").click();

  // 2) Wait for dashboard redirect
  await page.waitForURL(/\/dashboard(\/.*)?$/,{ timeout: 30000 });

  // 3) Whoami returns authenticated user
  const res = await request.get("/api/_whoami");
  expect(res.ok()).toBeTruthy();
  const json = await res.json();
  expect(json.data?.email).toBe("admin@test.com");

  // 4) Authenticated route loads & shows heading
  await page.goto("/dashboard/team");
  await expect(page.getByTestId("heading-team-management")).toBeVisible({ timeout: 15000 });
});
