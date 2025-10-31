import { test as setup, expect, request } from '@playwright/test';

const BASE_URL =
  process.env.BASE_URL || 'https://cricket-academy-app.onrender.com';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@test.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password';

setup('bootstrap auth and save storage state', async ({ page, context }) => {
  console.log('🔵 Auth setup starting…');
  console.log('➡️ BASE_URL =', BASE_URL);
  console.log('➡️ ADMIN_EMAIL =', ADMIN_EMAIL);

  // 1) call API directly (most reliable in CI)
  const api = await request.newContext({
    baseURL: BASE_URL,
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
    },
  });

  // Try /api/auth/login first
  let resp = await api.post('/api/auth/login', {
    data: {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    },
  });

  let status = resp.status();
  let body = await resp.json().catch(() => ({} as any));
  console.log('🔎 [AUTH SETUP] /api/auth/login - status:', status);
  console.log('🔎 [AUTH SETUP] /api/auth/login - body:', JSON.stringify(body, null, 2));

  // If main login fails, try /api/dev/login as fallback
  if (status !== 200 || !body?.success) {
    console.log('⚠️ [AUTH SETUP] Main login failed, trying /api/dev/login...');
    resp = await api.post('/api/dev/login', {
      data: {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      },
    });

    status = resp.status();
    body = await resp.json().catch(() => ({} as any));
    console.log('🔎 [AUTH SETUP] /api/dev/login - status:', status);
    console.log('🔎 [AUTH SETUP] /api/dev/login - body:', JSON.stringify(body, null, 2));

    if (status !== 200 || !body?.success) {
      throw new Error(
        `❌ Both login endpoints failed.\nMain: ${status}\nDev: ${status}\nLast body: ${JSON.stringify(
          body,
          null,
          2
        )}`
      );
    }
    console.log('✅ [AUTH SETUP] Dev login succeeded');
  } else {
    console.log('✅ [AUTH SETUP] Main login succeeded');
  }

  // 2) attach cookies to browser context
  const cookies = await api.storageState();
  await context.addCookies(cookies.cookies ?? []);

  // 3) verify with /api/whoami
  const who = await api.get('/api/whoami');
  const whoJson = await who.json().catch(() => ({} as any));
  console.log('🟢 whoami =', whoJson);

  // 4) also do UI nav once so downstream tests have storage
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.context().storageState({ path: 'storageState.json' });
  console.log('✅ storageState.json written');
});