import { test, expect } from "@playwright/test";

test("dev login sets cookie and authenticated page loads", async ({ page, request }) => {
  // 1) Hit login UI and perform dev login through form
  await page.goto("/login");
  await page.getByTestId("input-email").fill("admin@test.com");
  await page.getByTestId("input-password").fill("password");
  await page.getByTestId("btn-login").click();

  // 2) Wait for dashboard redirect / cookie to be set
  await page.waitForURL(/\/dashboard(\/.*)?$/,{ timeout: 30000 });

  // 3) Cookie present?
  const cookies = await page.context().cookies();
  const sid = cookies.find(c => c.name === (process.env.SESSION_COOKIE_NAME || "sid"));
  expect(sid, "session cookie not set").toBeTruthy();

  // 4) Whoami returns a user
  const res = await request.get("/api/_whoami");
  expect(res.ok()).toBeTruthy();
  const data = await res.json();
  expect(data.user ?? null).not.toBeNull();

  // 5) Authenticated route loads & shows heading
  await page.goto("/dashboard/team");
  await expect(page.getByTestId("heading-team-management")).toBeVisible({ timeout: 15000 });
});
