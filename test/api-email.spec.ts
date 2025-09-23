/**
 * API Email Endpoint Tests
 * Tests the /api/dev/test-email and /api/email/status endpoints
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { httpRequest } from './utils/http';

describe('Email API Endpoints', () => {
  describe('GET /api/email/status', () => {
    it('should return email status', async () => {
      const response = await httpRequest()
        .get('/api/email/status')
        .expect(200);

      expect(response.body).toHaveProperty('emailEnabled');
      expect(response.body).toHaveProperty('fromEmail');
      expect(response.body).toHaveProperty('replyToEmail');
      expect(typeof response.body.emailEnabled).toBe('boolean');
    });
  });

  describe('POST /api/dev/test-email', () => {
    it('should return 200 in development environment', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const response = await httpRequest()
        .post('/api/dev/test-email')
        .send({ to: 'test@example.com' })
        .expect(200);

      expect(response.body).toHaveProperty('sent');
      expect(response.body).toHaveProperty('reason');
      
      // Restore original environment
      process.env.NODE_ENV = originalEnv;
    });

    it('should return 200 with custom recipient', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const response = await httpRequest()
        .post('/api/dev/test-email')
        .send({ to: 'custom@example.com' })
        .expect(200);

      expect(response.body).toHaveProperty('sent');
      expect(response.body).toHaveProperty('reason');
      
      // Restore original environment
      process.env.NODE_ENV = originalEnv;
    });

    it('should return 200 without recipient (uses default)', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const response = await httpRequest()
        .post('/api/dev/test-email')
        .send({})
        .expect(200);

      expect(response.body).toHaveProperty('sent');
      expect(response.body).toHaveProperty('reason');
      
      // Restore original environment
      process.env.NODE_ENV = originalEnv;
    });

    it('should return 404 in production environment', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const response = await httpRequest()
        .post('/api/dev/test-email')
        .send({ to: 'test@example.com' })
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('not available in production');
      
      // Restore original environment
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('GET /api/health', () => {
    it('should include emailEnabled in health check', async () => {
      const response = await httpRequest()
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('emailEnabled');
      expect(typeof response.body.emailEnabled).toBe('boolean');
    });
  });
});
