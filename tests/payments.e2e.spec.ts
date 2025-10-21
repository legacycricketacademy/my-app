import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Use the authenticated session from setup
test.use({ storageState: 'playwright/.auth/admin.json' });

// These tests assume the fake payments flag is ON in the test env
test.describe("Parent Payment Flows (Phase 1 - Fake)", () => {
  test("record payment -> appears in pending -> mark paid -> appears in paid", async ({ page }) => {
    // Navigate to payments page
    await page.goto(`${BASE_URL}/dashboard/payments`);

    // Wait for page to load
    await expect(page.getByTestId("heading-payments")).toBeVisible();

    // Verify empty state initially
    await expect(page.getByTestId("empty-pending")).toBeVisible();
    await expect(page.getByTestId("empty-paid")).toBeVisible();

    // Open payment form
    await page.getByTestId("btn-record-payment").click();
    await expect(page.getByTestId("modal-new-payment")).toBeVisible();

    // Fill in payment details
    await page.getByTestId("input-kid-name").fill("Aryan");
    await page.getByTestId("input-amount").fill("175");
    await page.getByTestId("select-method").selectOption("stripe");
    await page.getByTestId("input-note").fill("October fees");
    
    // Save payment
    await page.getByTestId("btn-save-payment").click();

    // Verify payment appears in pending list
    await expect(page.getByTestId("modal-new-payment")).not.toBeVisible();
    await expect(page.getByTestId("list-pending")).toContainText("Aryan — $175");
    await expect(page.getByTestId("empty-pending")).not.toBeVisible();

    // Find and click "Mark Paid" button
    const markPaidBtn = page.getByTestId(/btn-mark-paid-/);
    await markPaidBtn.first().click();

    // Verify payment moved to paid list
    await expect(page.getByTestId("list-pending")).not.toContainText("Aryan — $175");
    await expect(page.getByTestId("list-paid")).toContainText("Aryan — $175");
    await expect(page.getByTestId("empty-paid")).not.toBeVisible();
  });

  test("can record multiple payments", async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/payments`);
    await expect(page.getByTestId("heading-payments")).toBeVisible();

    // Add first payment
    await page.getByTestId("btn-record-payment").click();
    await page.getByTestId("input-kid-name").fill("Rohan");
    await page.getByTestId("input-amount").fill("150");
    await page.getByTestId("select-method").selectOption("cash");
    await page.getByTestId("btn-save-payment").click();

    // Verify first payment
    await expect(page.getByTestId("list-pending")).toContainText("Rohan — $150");

    // Add second payment
    await page.getByTestId("btn-record-payment").click();
    await page.getByTestId("input-kid-name").fill("Priya");
    await page.getByTestId("input-amount").fill("200");
    await page.getByTestId("select-method").selectOption("link");
    await page.getByTestId("input-note").fill("November payment");
    await page.getByTestId("btn-save-payment").click();

    // Verify both payments in pending
    await expect(page.getByTestId("list-pending")).toContainText("Rohan — $150");
    await expect(page.getByTestId("list-pending")).toContainText("Priya — $200");
  });

  test("can cancel payment form", async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/payments`);
    await expect(page.getByTestId("heading-payments")).toBeVisible();

    // Open form
    await page.getByTestId("btn-record-payment").click();
    await expect(page.getByTestId("modal-new-payment")).toBeVisible();

    // Fill partial data
    await page.getByTestId("input-kid-name").fill("Test Kid");
    
    // Cancel
    await page.getByTestId("btn-cancel-payment").click();
    
    // Form should be hidden
    await expect(page.getByTestId("modal-new-payment")).not.toBeVisible();
    
    // Open again - should be empty
    await page.getByTestId("btn-record-payment").click();
    await expect(page.getByTestId("input-kid-name")).toHaveValue("");
  });
});
