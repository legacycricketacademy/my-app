// server/lib/keycloak-admin.ts
import fetch from 'node-fetch';

const {
  KEYCLOAK_URL,
  KEYCLOAK_REALM,
  KEYCLOAK_CLIENT_ID,
  KEYCLOAK_CLIENT_SECRET,
  KEYCLOAK_EMAIL_VERIFY_ENABLED = 'true',
} = process.env;

type TokenCache = { token?: string; exp?: number };
const cache: TokenCache = {};

function enabled() {
  return KEYCLOAK_EMAIL_VERIFY_ENABLED !== 'false'
    && KEYCLOAK_URL && KEYCLOAK_REALM && KEYCLOAK_CLIENT_ID && KEYCLOAK_CLIENT_SECRET;
}

export async function getAdminToken(): Promise<string | null> {
  if (!enabled()) return null;
  const now = Math.floor(Date.now() / 1000);
  if (cache.token && cache.exp && cache.exp - 30 > now) return cache.token;

  const url = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect/token`;
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: KEYCLOAK_CLIENT_ID!,
    client_secret: KEYCLOAK_CLIENT_SECRET!,
  });

  const res = await fetch(url, { method: 'POST', body });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    console.error('[KC] token fetch failed', res.status, txt);
    return null;
  }
  const json: any = await res.json();
  cache.token = json.access_token;
  cache.exp = Math.floor(Date.now() / 1000) + (json.expires_in ?? 60);
  return cache.token!;
}

export async function triggerVerifyEmail(userId: string): Promise<{ ok: boolean; status?: number; message?: string }> {
  if (!enabled()) return { ok: false, status: 503, message: 'Keycloak email verify disabled or misconfigured' };
  const token = await getAdminToken();
  if (!token) return { ok: false, status: 503, message: 'Keycloak admin token unavailable' };

  const url = `${KEYCLOAK_URL}/admin/realms/${KEYCLOAK_REALM}/users/${encodeURIComponent(userId)}/execute-actions-email?client_id=${encodeURIComponent(KEYCLOAK_CLIENT_ID!)}&lifespan=86400`;
  const res = await fetch(url, {
    method: 'PUT', // Keycloak accepts PUT here
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(['VERIFY_EMAIL']),
  });

  if (res.ok || res.status === 204) return { ok: true };
  const txt = await res.text().catch(() => '');
  console.error('[KC] verify-email failed', res.status, txt);
  return { ok: false, status: res.status, message: txt || 'verify-email failed' };
}
