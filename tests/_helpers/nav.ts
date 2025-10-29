import { Page, expect } from "@playwright/test";

/** login with the seeded admin user */
export async function loginAsAdmin(page: Page) {
  await page.goto("/auth");
  await page.getByTestId("input-email").fill("admin@test.com");
  await page.getByTestId("input-password").fill("password");
  await page.getByTestId("btn-login").click();
  // handle redirect / cold start
  await page.waitForURL(/\/dashboard(\/.*)?$/, { timeout: 30000 });
}

/** mobile-safe: try clicking a link, else go directly */
export async function openLinkOrGoto(page: Page, linkName: RegExp, fallbackUrl: string) {
  const link = page.getByRole("link", { name: linkName });
  const couldClick = await link.isVisible().catch(() => false);
  if (couldClick) await link.click();
  else await page.goto(fallbackUrl);
}

/** fail fast on client errors; also wait for the app to settle */
export async function waitForAppIdle(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", e => errors.push(e.message || String(e)));
  page.on("console", msg => {
    if (msg.type() === "error") errors.push(msg.text());
  });

  // give the SPA a moment to mount and fetch essential data
  await page.waitForLoadState("networkidle", { timeout: 15000 });

  // if anything fatal happened, surface it with context
  if (errors.length) {
    throw new Error("Client errors detected:\n" + errors.slice(0, 5).join("\n"));
  }
}
