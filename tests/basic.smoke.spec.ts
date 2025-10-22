import { test, expect } from "@playwright/test";

test("Homepage loads without errors", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Legacy Cricket Academy/);
});

test("Login page loads", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByTestId("input-email")).toBeVisible();
  await expect(page.getByTestId("input-password")).toBeVisible();
  await expect(page.getByTestId("btn-login")).toBeVisible();
});
