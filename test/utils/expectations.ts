import { Response } from 'supertest';

/**
 * Standardized test expectations for common HTTP responses
 */

export function expectUnauthorized(res: Response) {
  expect(res.status).toBe(401);
  expect(res.body.error).toMatch(/User not authenticated|Authentication required/);
}

export function expectForbidden(res: Response) {
  expect(res.status).toBe(403);
  expect(res.body.error).toMatch(/Insufficient role/);
}

export function expectBadRequest(res: Response) {
  expect(res.status).toBe(400);
  expect(res.body.error).toBeDefined();
}

export function expectNotFound(res: Response) {
  expect(res.status).toBe(404);
  expect(res.body.error).toBeDefined();
}

export function expectServerError(res: Response) {
  expect(res.status).toBe(500);
  expect(res.body.error).toBeDefined();
}

export function expectSuccess(res: Response, expectedStatus: number = 200) {
  expect(res.status).toBe(expectedStatus);
}

export function expectCreated(res: Response) {
  expect(res.status).toBe(201);
}

export function expectNoContent(res: Response) {
  expect(res.status).toBe(204);
}
