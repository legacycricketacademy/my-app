export type HttpOk<T> = { ok: true; data: T };
export type HttpErr = { ok: false; error: string; message?: string; status: number };

export async function http<T>(
  input: RequestInfo | URL, 
  init?: RequestInit
): Promise<HttpOk<T> | HttpErr> {
  const res = await fetch(input, {
    credentials: 'include',
    headers: { 
      'Content-Type': 'application/json', 
      ...(init?.headers || {}) 
    },
    ...init,
  });
  
  const body = await res.json().catch(() => ({}));
  
  if (!res.ok) {
    return {
      ok: false,
      error: body?.error ?? 'request_failed',
      message: body?.message ?? res.statusText,
      status: res.status
    };
  }
  
  return { ok: true, data: body as T };
}

// Backward compatibility - getJson throws on error like old code
export async function getJson<T = any>(url: string, init: RequestInit = {}): Promise<T> {
  const res = await http<T>(url, init);
  if (!res.ok) throw new Error(res.message || 'Request failed');
  return res.data;
}