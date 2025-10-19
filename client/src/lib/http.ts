// client/src/lib/http.ts
export async function getJson<T = any>(url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Accept': 'application/json' },
    ...init,
  });
  // Treat 401/403/404 as soft-empty for dashboard widgets
  if (!res.ok) {
    // try parse but don't throw
    try { return await res.json(); } catch { return {} as T; }
  }
  try { return await res.json(); } catch { return {} as T; }
}
