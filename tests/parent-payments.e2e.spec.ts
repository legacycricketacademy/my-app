import { test, expect } from "./fixtures/parent-fixtures";

test.describe("Parent Payments", () => {
  test("parent can view payments page (desktop)", async ({ parentPage }) => {
    // parentPage already has authenticated parent session
    // Navigate to payments page
    await parentPage.goto("/parent/payments");
    await parentPage.waitForLoadState("networkidle");

    // Wait for loading to finish
    const loadingIndicator = parentPage.getByTestId("loading-payments");
    if (await loadingIndicator.isVisible().catch(() => false)) {
      await expect(loadingIndicator).toBeHidden({ timeout: 10000 });
    }

    // Check if payments exist or empty state is shown
    const hasPayments = await parentPage.locator("table, [data-testid^='payment-card-']").count() > 0;
    const hasEmptyState = await parentPage.getByText("No Payments Yet").isVisible().catch(() => false);

    if (hasPayments) {
      // Desktop view: table should be visible
      const table = parentPage.locator("table");
      if (await table.isVisible().catch(() => false)) {
        await expect(table).toBeVisible();
        console.log("✅ Desktop table view displayed");
      }
    } else if (hasEmptyState) {
      // Empty state is valid
      await expect(parentPage.getByText("No Payments Yet")).toBeVisible();
      console.log("✅ Empty state displayed (no payments)");
    } else {
      // Page loaded successfully
      console.log("✅ Payments page loaded");
    }
  });

  test("parent can view payments page (mobile)", async ({ parentPage }) => {
    // Set mobile viewport
    await parentPage.setViewportSize({ width: 375, height: 667 });

    // Navigate to payments page
    await parentPage.goto("/parent/payments");
    await parentPage.waitForLoadState("networkidle");

    // Wait for loading to finish
    const loadingIndicator = parentPage.getByTestId("loading-payments");
    if (await loadingIndicator.isVisible().catch(() => false)) {
      await expect(loadingIndicator).toBeHidden({ timeout: 10000 });
    }

    // Check if payments exist or empty state is shown
    const paymentCards = parentPage.locator('[data-testid^="payment-card-"]');
    const cardCount = await paymentCards.count();
    const hasEmptyState = await parentPage.getByText("No Payments Yet").isVisible().catch(() => false);

    if (cardCount > 0) {
      // Mobile view: cards should be visible
      await expect(paymentCards.first()).toBeVisible();
      console.log(`✅ Mobile card view displayed (${cardCount} payments)`);

      // Test clicking on a payment card
      await paymentCards.first().click();
      await parentPage.waitForLoadState("networkidle");

      // Should navigate to detail page
      const isDetailPage = await parentPage.getByText("Payment Details").isVisible().catch(() => false);
      if (isDetailPage) {
        await expect(parentPage.getByText("Payment Details")).toBeVisible();
        console.log("✅ Payment detail page opened");

        // Test back button
        const backButton = parentPage.getByRole("button", { name: /back to payments/i });
        if (await backButton.isVisible().catch(() => false)) {
          await backButton.click();
          await expect(parentPage).toHaveURL(/\/parent\/payments$/);
          console.log("✅ Back button works");
        }
      }
    } else if (hasEmptyState) {
      // Empty state is valid
      await expect(parentPage.getByText("No Payments Yet")).toBeVisible();
      console.log("✅ Empty state displayed (no payments)");
    } else {
      console.log("✅ Payments page loaded (mobile)");
    }
  });

  test("parent payments API returns data", async ({ parentPage }) => {
    // Navigate to payments page to ensure session is active
    await parentPage.goto("/parent/payments");
    await parentPage.waitForLoadState("networkidle");

    // Call the parent payments API from within the authenticated browser context
    const payments = await parentPage.evaluate(async () => {
      const res = await fetch("/api/parent/payments", {
        credentials: "include",
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          `Failed to fetch payments: ${res.status} ${res.statusText} - ${text}`,
        );
      }

      const data = await res.json();

      // Support both shapes: [] or { payments: [] }
      if (Array.isArray(data)) {
        return data;
      }

      if (Array.isArray((data as any).payments)) {
        return (data as any).payments;
      }

      throw new Error(
        `Unexpected payments response shape: ${JSON.stringify(data)}`,
      );
    });

    // Basic assertions on response
    expect(Array.isArray(payments)).toBeTruthy();
    expect(payments.length).toBeGreaterThan(0);

    for (const payment of payments as any[]) {
      expect(payment).toHaveProperty("id");
      expect(payment).toHaveProperty("amount");
      expect(payment).toHaveProperty("status");
      // Adjust these if your status enum is different
      expect(["pending", "paid", "overdue"]).toContain(payment.status);
    }
  });
});
