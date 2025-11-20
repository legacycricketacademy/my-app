/**
 * Payment Test Fixtures
 * 
 * API-based payment test utilities for Playwright tests.
 * Does NOT import server/db directly - uses HTTP APIs only.
 */

import { test as base, expect, Page, APIRequestContext } from '@playwright/test';

export interface PaymentData {
  id: number;
  kidId: number;
  kidName: string;
  amount: string;
  paymentType: string;
  month: string | null;
  dueDate: string;
  paidDate: string | null;
  status: string;
  paymentMethod: string | null;
}

type PaymentFixtures = {
  paymentsApi: {
    getPayments: () => Promise<PaymentData[]>;
    getPayment: (id: number) => Promise<PaymentData | null>;
  };
};

/**
 * Extended test with payment-specific fixtures
 */
export const test = base.extend<PaymentFixtures>({
  /**
   * Payment API helpers (uses HTTP requests, no direct DB access)
   */
  paymentsApi: async ({ request }, use) => {
    const api = {
      /**
       * Get all payments for the logged-in parent
       */
      async getPayments(): Promise<PaymentData[]> {
        const response = await request.get('/api/parent/payments');
        if (!response.ok()) {
          throw new Error(`Failed to get payments: ${response.status()}`);
        }
        const data = await response.json();
        return data.data || [];
      },

      /**
       * Get a single payment by ID
       */
      async getPayment(id: number): Promise<PaymentData | null> {
        const response = await request.get(`/api/parent/payments/${id}`);
        if (response.status() === 404) {
          return null;
        }
        if (!response.ok()) {
          throw new Error(`Failed to get payment: ${response.status()}`);
        }
        const data = await response.json();
        return data.data || null;
      },
    };

    await use(api);
  },
});

export { expect };
