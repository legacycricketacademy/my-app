export async function listSessions(params?: Record<string,string>) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  const res = await fetch('/api/sessions' + qs, { credentials: 'include' });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.ok === false) throw new Error(json?.message || 'Failed to load sessions');
  // Return the whole response to preserve the shape { ok: true, sessions: [] }
  return json;
}

export async function createSession(payload: any) {
  const res = await fetch('/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.ok === false) throw new Error(json?.message || 'Create failed');
  return json.session ?? json.data ?? json;
}
