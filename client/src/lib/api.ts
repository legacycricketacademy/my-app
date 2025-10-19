export async function fetchJson<T = any>(input: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(input, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init.headers ?? {}) },
    ...init,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.ok === false) {
    const message = data?.message ?? res.statusText;
    throw new Error(message || 'Request failed');
  }
  return data;
}

// Backward compatibility - export api object for existing code
export const api = {
  get: (url: string) => fetchJson(url),
  post: (url: string, data: any) => fetchJson(url, { method: 'POST', body: JSON.stringify(data) }),
  put: (url: string, data: any) => fetchJson(url, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (url: string) => fetchJson(url, { method: 'DELETE' }),
};