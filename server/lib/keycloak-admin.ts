// server/lib/keycloak-admin.ts
import fetch from 'node-fetch';

interface KeycloakAdminToken {
  access_token: string;
  expires_at: number;
}

let cachedToken: KeycloakAdminToken | null = null;

async function getAdminToken(): Promise<string | null> {
  const keycloakUrl = process.env.KEYCLOAK_URL;
  const realm = process.env.KEYCLOAK_REALM;
  const clientId = process.env.KEYCLOAK_CLIENT_ID;
  const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET;

  if (!keycloakUrl || !realm || !clientId || !clientSecret) {
    console.warn('[keycloak-admin] Missing Keycloak config for admin operations');
    return null;
  }

  // Check if cached token is still valid (with 60s buffer)
  if (cachedToken && cachedToken.expires_at > Date.now() + 60000) {
    return cachedToken.access_token;
  }

  try {
    const tokenUrl = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/token`;
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) {
      console.error('[keycloak-admin] Failed to get admin token:', response.status);
      return null;
    }

    const data: any = await response.json();
    cachedToken = {
      access_token: data.access_token,
      expires_at: Date.now() + (data.expires_in * 1000),
    };

    console.log('[keycloak-admin] Admin token obtained');
    return cachedToken.access_token;
  } catch (error) {
    console.error('[keycloak-admin] Error getting admin token:', error);
    return null;
  }
}

export async function sendVerificationEmail(userId: string): Promise<{ ok: boolean; error?: string; message?: string }> {
  const keycloakUrl = process.env.KEYCLOAK_URL;
  const realm = process.env.KEYCLOAK_REALM;
  const clientId = process.env.KEYCLOAK_CLIENT_ID;

  if (!keycloakUrl || !realm || !clientId) {
    return { ok: false, error: 'keycloak_not_configured', message: 'Keycloak is not configured' };
  }

  const token = await getAdminToken();
  if (!token) {
    return { ok: false, error: 'admin_token_failed', message: 'Failed to obtain admin token' };
  }

  try {
    const url = `${keycloakUrl}/admin/realms/${realm}/users/${userId}/execute-actions-email`;
    const params = new URLSearchParams({
      client_id: clientId,
      lifespan: '86400', // 24 hours
    });

    const response = await fetch(`${url}?${params.toString()}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(['VERIFY_EMAIL']),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[keycloak-admin] Failed to send verification email:', response.status, errorText);
      return { 
        ok: false, 
        error: 'verification_email_failed', 
        message: `Failed to send verification email: ${response.status}` 
      };
    }

    console.log('[keycloak-admin] Verification email sent for user:', userId);
    return { ok: true };
  } catch (error) {
    console.error('[keycloak-admin] Error sending verification email:', error);
    return { 
      ok: false, 
      error: 'server_error', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
