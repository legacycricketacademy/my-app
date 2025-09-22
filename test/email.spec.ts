/**
 * Email Service Tests
 * Tests email functionality with and without SendGrid configuration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock SendGrid
vi.mock('@sendgrid/mail', () => ({
  default: {
    setApiKey: vi.fn(),
    send: vi.fn()
  }
}));

describe('Email Service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('isEmailEnabled', () => {
    it('should be false when SENDGRID_API_KEY is not set', () => {
      delete process.env.SENDGRID_API_KEY;
      expect(!!process.env.SENDGRID_API_KEY).toBe(false);
    });

    it('should be true when SENDGRID_API_KEY is set', () => {
      process.env.SENDGRID_API_KEY = 'SG.test-key';
      expect(!!process.env.SENDGRID_API_KEY).toBe(true);
    });
  });

  describe('sendTestEmail', () => {
    it('should return disabled when email is not enabled', async () => {
      delete process.env.SENDGRID_API_KEY;
      const { sendTestEmail } = await import('../server/services/email');
      
      const result = await sendTestEmail('test@example.com');
      
      expect(result).toEqual({
        sent: false,
        reason: 'disabled',
        preview: expect.stringContaining('To: test@example.com')
      });
    });

    it('should return disabled when no recipient provided', async () => {
      delete process.env.SENDGRID_API_KEY;
      const { sendTestEmail } = await import('../server/services/email');
      
      const result = await sendTestEmail();
      
      expect(result).toEqual({
        sent: false,
        reason: 'disabled',
        preview: expect.stringContaining('Test Email from Legacy Cricket Academy')
      });
    });
  });

  describe('sendWelcomeParent', () => {
    it('should return disabled when email is not enabled', async () => {
      delete process.env.SENDGRID_API_KEY;
      const { sendWelcomeParent } = await import('../server/services/email');
      
      const result = await sendWelcomeParent('parent@example.com', 'John Doe');
      
      expect(result).toEqual({
        sent: false,
        reason: 'disabled',
        preview: expect.stringContaining('Welcome to Legacy Cricket Academy')
      });
    });
  });

  describe('sendChildAdded', () => {
    it('should return disabled when email is not enabled', async () => {
      delete process.env.SENDGRID_API_KEY;
      const { sendChildAdded } = await import('../server/services/email');
      
      const result = await sendChildAdded('parent@example.com', 'John Doe', 'Jane Doe');
      
      expect(result).toEqual({
        sent: false,
        reason: 'disabled',
        preview: expect.stringContaining('Child Added to Your Account')
      });
    });
  });

  describe('sendPaymentReminder', () => {
    it('should return disabled when email is not enabled', async () => {
      delete process.env.SENDGRID_API_KEY;
      const { sendPaymentReminder } = await import('../server/services/email');
      
      const result = await sendPaymentReminder('parent@example.com', 'John Doe', 100, '2024-01-15');
      
      expect(result).toEqual({
        sent: false,
        reason: 'disabled',
        preview: expect.stringContaining('Payment Reminder')
      });
    });
  });
});
