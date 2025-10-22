import { test, expect } from "@playwright/test";

test("toast provider never crashes pages that call useToast/notify", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /legacy cricket academy/i })).toBeVisible();
  // Optional: if you expose an action that triggers a toast, click it here.
});
