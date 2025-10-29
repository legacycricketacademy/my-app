import { test, expect } from "@playwright/test";

test.describe("Schedule opens without crash (Desktop+Mobile)", () => {
  test("Coach → Schedule shows heading and no error overlay", async ({ page }) => {
    await page.goto("/auth");
    await page.getByTestId("input-email").fill("admin@test.com");
    await page.getByTestId("input-password").fill("password");
    await page.getByTestId("btn-login").click();

    // Try sidebar link; if not visible (collapsed), go directly.
    const link = page.getByRole("link", { name: /schedule/i });
    if (await link.isVisible().catch(()=>false)) {
      await link.click();
    } else {
      await page.goto("/dashboard/admin/schedule");
    }

    // No "Something went wrong" crash UI
    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();

    // A schedule heading or calendar landmark exists
    await expect(page.getByRole("heading", { name: /schedule/i })).toBeVisible();
  });
});

