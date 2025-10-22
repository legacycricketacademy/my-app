import axios from "axios";

// Axios: include cookies by default
axios.defaults.withCredentials = true;

// Fetch wrapper that always includes credentials
export async function http<T=any>(input: RequestInfo | URL, init: RequestInit = {}): Promise<T> {
  const res = await fetch(input, { credentials: "include", ...init });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  // try JSON, fallback text
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return await res.json();
  // @ts-ignore
  return await res.text();
}

// Legacy compatibility export
export const getJson = http;

export default axios;