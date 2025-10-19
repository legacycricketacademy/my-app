// server/utils/ok.ts
export function okArray<T>(items?: T[] | null) {
  return { ok: true, items: Array.isArray(items) ? items : [] };
}
export function okObject<T extends object>(data: T) {
  return { ok: true, data };
}
export const ok = <T>(data: T) => ({ ok: true, data });
export const okArr = <T>(items: T[] = []) => ({ ok: true, items });
export function err(message = 'Unexpected error', code = 'error') {
  return { ok: false, error: code, message };
}
export const fail = (message = 'Unexpected error', code = 'error', status = 400) =>
  ({ ok: false, error: code, message, status });
