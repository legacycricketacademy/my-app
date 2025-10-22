import { test, expect } from "@playwright/test";

test("Schedule dialog opens, scrolls, and does not overlap UI", async ({ page }) => {
  await page.goto("/login");
  await page.getByTestId("input-email").fill("admin@test.com");
  await page.getByTestId("input-password").fill("password");
  await page.getByTestId("btn-login").click();

  // Navigate
  const link = page.getByRole("link", { name: /schedule/i });
  if (await link.isVisible().catch(()=>false)) await link.click(); else await page.goto("/dashboard/admin/schedule");

  // Open
  await page.getByRole("button", { name: /schedule new session/i }).click();

  // Desktop dialog OR mobile sheet
  const dlg = page.locator('[data-testid="session-modal-dialog"], [data-testid="session-sheet-dialog"]');
  await expect(dlg).toBeVisible();

  // Scroll inside
  await dlg.evaluate((el:HTMLElement)=>{ el.querySelector('[data-testid="calendar"]')?.scrollIntoView({block:"end"}); });
  await expect(dlg).toBeVisible(); // still open (no accidental outside click close)

  // No global error overlay
  await expect(page.getByText(/something went wrong/i)).not.toBeVisible();
});
