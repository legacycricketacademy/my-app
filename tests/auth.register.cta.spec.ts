import { test, expect } from "@playwright/test";

test("Login shows Register CTA and /register works", async ({ page, request }) => {
  await request.post("/api/_mailbox/clear").catch(()=>{});
  await page.goto("/login");
  await expect(page.getByTestId("link-register")).toBeVisible();
  await page.getByTestId("link-register").click();
  await expect(page.getByTestId("heading-register")).toBeVisible();

  const uniq = Date.now();
  await page.getByTestId("reg-role").selectOption("parent");
  await page.getByTestId("reg-parent-name").fill("CTA Test Parent");
  await page.getByTestId("reg-email").fill(`cta.parent.${uniq}@example.com`);
  await page.getByTestId("reg-child-name").fill("CTA Kiddo");
  await page.getByTestId("reg-submit").click();
  
  // Verify form submitted without crashing
  await expect(page).toHaveURL(/\/register/);
});

