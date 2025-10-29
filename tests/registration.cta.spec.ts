import { test, expect } from "@playwright/test";
test("Login shows Register CTA and registration submits", async ({ page, request }) => {
  await request.post("/api/_mailbox/clear").catch(()=>{});
  await page.goto("/auth");
  await expect(page.getByTestId("link-register")).toBeVisible();
  await page.getByTestId("link-register").click();
  await expect(page.getByTestId("heading-register")).toBeVisible();
  const uniq = Date.now();
  await page.getByTestId("reg-role").selectOption("parent");
  await page.getByTestId("reg-parent-name").fill("Test Parent");
  await page.getByTestId("reg-email").fill(`parent.${uniq}@example.com`);
  await page.getByTestId("reg-child-name").fill("Kiddo");
  await page.getByTestId("reg-submit").click();
  await expect(page.getByTestId("reg-result")).toContainText("Check your email");
});
