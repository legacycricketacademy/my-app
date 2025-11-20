import { test, expect } from "@playwright/test";
import { registerParent, loginAsParent, createKidForParent } from "./fixtures/parent-fixtures";
import { createPaymentForPlayer, createMultiplePaymentsForPlayer, cleanupPayments } from "./fixtures/payment-fixtures";

test.describe("Parent Payments", () => {
  test("parent can view payments list on desktop", async ({ page }) => {
    // Register parent and create kid
    const parent = await registerParent();
    const kid = await createKidForParent(parent.id, {
      firstName: "Test",
      lastName: "Kid",
    });

    // Create test payments
    await createMultiplePaymentsForPlayer(kid.id, 3);

    // Login as parent
    await loginAsParent(page, parent.email);

    // Navigate to payments page
    await page.goto("/parent/payments");

    // Wait for payments to load
    await expect(page.getByTestId("loading-payments")).toBeHidden({ timeout: 10000 });

    // Check that payments are displayed (desktop table view)
    await expect(page.locator("table")).toBeVisible();
    await expect(page.locator("tbody tr")).toHaveCount(3);

    // Verify payment data is shown
    await expect(page.getByText("Test Kid")).toBeVisible();
    await expect(page.getByText("$250.00")).toBeVisible();

    // Cleanup
    await cleanupPayments(kid.id);
  });

  test("parent can view payments list on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Register parent and create kid
    const parent = await registerParent();
    const kid = await createKidForParent(parent.id, {
      firstName: "Mobile",
      lastName: "Kid",
    });

    // Create test payments
    await createMultiplePaymentsForPlayer(kid.id, 2);

    // Login as parent
    await loginAsParent(page, parent.email);

    // Navigate to payments page
    await page.goto("/parent/payments");

    // Wait for payments to load
    await expect(page.getByTestId("loading-payments")).toBeHidden({ timeout: 10000 });

    // Check that payment cards are displayed (mobile view)
    const paymentCards = page.locator('[data-testid^="payment-card-"]');
    await expect(paymentCards).toHaveCount(2);

    // Verify payment data is shown in cards
    await expect(page.getByText("Mobile Kid")).toBeVisible();
    await expect(page.getByText("$250.00")).toBeVisible();

    // Click on a payment card to view details
    await paymentCards.first().click();

    // Verify we're on the detail page
    await expect(page.getByText("Payment Details")).toBeVisible();
    await expect(page.getByText("Mobile Kid")).toBeVisible();

    // Cleanup
    await cleanupPayments(kid.id);
  });

  test("parent sees empty state when no payments exist", async ({ page }) => {
    // Register parent (no kids, no payments)
    const parent = await registerParent();

    // Login as parent
    await loginAsParent(page, parent.email);

    // Navigate to payments page
    await page.goto("/parent/payments");

    // Wait for loading to finish
    await expect(page.getByTestId("loading-payments")).toBeHidden({ timeout: 10000 });

    // Check empty state
    await expect(page.getByText("No Payments Yet")).toBeVisible();
  });

  test("parent can view payment detail", async ({ page }) => {
    // Register parent and create kid
    const parent = await registerParent();
    const kid = await createKidForParent(parent.id, {
      firstName: "Detail",
      lastName: "Test",
    });

    // Create a single payment
    const payment = await createPaymentForPlayer(kid.id, {
      amount: "250.00",
      status: "paid",
      paymentMethod: "credit card",
      notes: "Test payment note",
      paidDate: new Date().toISOString(),
    });

    // Login as parent
    await loginAsParent(page, parent.email);

    // Navigate directly to payment detail
    await page.goto(`/parent/payments/${payment.id}`);

    // Verify payment details are shown
    await expect(page.getByText("Payment Details")).toBeVisible();
    await expect(page.getByText("Detail Test")).toBeVisible();
    await expect(page.getByText("$250.00")).toBeVisible();
    await expect(page.getByText("Paid")).toBeVisible();
    await expect(page.getByText("Credit Card")).toBeVisible();
    await expect(page.getByText("Test payment note")).toBeVisible();

    // Test back button
    await page.getByRole("button", { name: /back to payments/i }).click();
    await expect(page).toHaveURL("/parent/payments");

    // Cleanup
    await cleanupPayments(kid.id);
  });
});
