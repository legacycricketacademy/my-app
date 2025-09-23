import request from 'supertest';
import { app } from '../../server/index';

/**
 * HTTP test utilities for API testing
 */

// Export the request function with the app
export function httpRequest() {
  return request(app);
}

// Helper functions for adding authentication headers
export function asAdmin(req: any) {
  return req.set('Authorization', 'Bearer mock:1:admin');
}

export function asParent(req: any) {
  return req.set('Authorization', 'Bearer mock:2:parent');
}

// Helper for custom mock tokens
export function asUser(id: string, role: 'admin' | 'parent') {
  return (req: any) => req.set('Authorization', `Bearer mock:${id}:${role}`);
}

// Helper for no authentication
export function asGuest(req: any) {
  return req;
}

// Re-export the app for direct access if needed
export { app };
