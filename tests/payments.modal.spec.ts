import { test, expect } from "@playwright/test";

test("Payments modal opens with role=dialog and is usable", async ({ page }) => {
  await page.goto("/auth");
  await page.getByTestId("input-email").fill("admin@test.com");
  await page.getByTestId("input-password").fill("password");
  await page.getByTestId("btn-login").click();
  await page.waitForLoadState("networkidle");

  // Go to payments (link or direct)
  const nav = page.getByRole("link", { name: /payments/i });
  if (await nav.isVisible().catch(()=>false)) {
    await nav.click();
  } else {
    await page.goto("/dashboard/payments");
  }

  await expect(page.getByTestId("heading-payments")).toBeVisible();
  await page.getByTestId("btn-record-payment").click();

  const dialog = page.getByTestId("modal-new-payment-dialog");
  await expect(dialog).toHaveAttribute("role", "dialog");

  await page.getByTestId("input-kid-name").fill("Aryan");
  await page.getByTestId("input-amount").fill("100");
  await page.getByTestId("btn-save-payment").click();

  // Wait for modal to close and list to update
  await page.waitForTimeout(500);
  await expect(page.getByTestId("list-pending")).toContainText("Aryan");
  await expect(page.getByTestId("list-pending")).toContainText("100");
});

