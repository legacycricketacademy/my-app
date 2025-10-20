export class HttpError extends Error {
  constructor(public status: number, public body: any) {
    super(body?.message ?? `HTTP ${status}`);
  }
}

export async function http<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, { 
    credentials: "include", 
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init 
  });
  const body = await res.json().catch(() => undefined);
  if (!res.ok) throw new HttpError(res.status, body);
  return body as T;
}

// Backward compatibility - getJson throws on error like old code
export async function getJson<T = any>(url: string, init: RequestInit = {}): Promise<T> {
  return http<T>(url, init);
}