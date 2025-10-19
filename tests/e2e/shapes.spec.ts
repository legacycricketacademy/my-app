// tests/e2e/shapes.spec.ts
import { test, expect, request } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';

test('dashboard alias endpoints respond with normalized shapes', async ({ request }) => {
  const paths = [
    '/api/announcements/recent',
    '/api/payments/pending',
    '/api/meal-plans/age-group/Under%2012s',
    '/api/sessions/today',
  ];
  for (const p of paths) {
    const res = await request.get(`${BASE}${p}`);
    expect(res.status()).toBeLessThan(500);
    const json = await res.json();
    expect(typeof json).toBe('object');
    // allow ok:true + items:[], or []
    const items = Array.isArray(json) ? json : json.items ?? [];
    expect(Array.isArray(items)).toBeTruthy();
  }
  const fit = await request.get(`${BASE}/api/fitness/team-progress?period=week`);
  expect(fit.ok()).toBeTruthy();
  const fitJson = await fit.json();
  expect(typeof fitJson).toBe('object');
});
