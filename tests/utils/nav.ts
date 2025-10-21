import { Page, expect } from "@playwright/test";

/**
 * Tries to click a sidebar/topbar link by accessible name.
 * If not visible on mobile (collapsed), falls back to direct navigation.
 */
export async function openLinkOrGoto(page: Page, linkName: RegExp | string, hrefFallback: string) {
  const link = page.getByRole("link", { name: linkName });
  if (await link.isVisible().catch(() => false)) {
    await link.click();
  } else {
    await page.goto(hrefFallback);
  }
  // basic settle
  await expect(page).toHaveURL(new RegExp(hrefFallback.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
}

