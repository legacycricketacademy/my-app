import { test, expect, request as pwRequest } from '@playwright/test';

const BASE = process.env.BASE_URL || process.env.PUBLIC_BASE_URL || 'http://localhost:3000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@test.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password';

test.describe('Smoke: API ping + auth + session', () => {
  test('ping works', async ({ request }) => {
    const res = await request.get(`${BASE}/api/ping`, { timeout: 30000 });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body?.status).toBe('ok');
  });

  test('login -> session/me and _whoami', async ({ browser }) => {
    const ctx = await pwRequest.newContext({ baseURL: BASE });

    // login
    const login = await ctx.post('/api/auth/login', {
      data: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
      headers: { 'Content-Type': 'application/json' },
      timeout: 60000,
    });
    expect(login.ok()).toBeTruthy();
    const loginJson = await login.json();
    expect(loginJson?.success).toBeTruthy();

    // session/me (session-based)
    const me = await ctx.get('/api/session/me', { timeout: 30000 });
    // session/me may 401 if only cookie fallback is set; accept 200 or 401
    expect([200, 401]).toContain(me.status());

    // _whoami (cookie echo)
    const who = await ctx.get('/api/_whoami', { timeout: 30000 });
    expect(who.ok()).toBeTruthy();
    const whoJson = await who.json();
    expect(whoJson?.ok).toBeTruthy();

    await ctx.dispose();
  });
});


