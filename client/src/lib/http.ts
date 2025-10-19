// Unified fetch wrapper – every request carries cookies and unified error shape
export type HttpOk<T> = { ok: true; data: T };
export type HttpErr = { ok: false; error: string; message?: string };

export async function http<T = unknown>(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<HttpOk<T> | HttpErr> {
  const res = await fetch(input, {
    credentials: 'include', // <-- critical for Render cookie auth
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
    ...init,
  });
  const ct = res.headers.get('content-type') || '';
  const body = ct.includes('application/json') ? await res.json() : await res.text();

  if (!res.ok) {
    // normalize
    const msg = typeof body === 'string' ? body : body?.message || 'Request failed';
    const err = typeof body === 'object' && body?.error ? body.error : 'request_failed';
    return { ok: false, error: err, message: msg };
  }
  return { ok: true, data: (typeof body === 'string' ? (body as unknown as T) : body) as T };
}

// Backward compatibility - getJson throws on error like old code
export async function getJson<T = any>(url: string, init: RequestInit = {}): Promise<T> {
  const res = await http<T>(url, init);
  if (!res.ok) throw new Error(res.message || 'Request failed');
  return res.data;
}