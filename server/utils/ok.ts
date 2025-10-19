// server/utils/ok.ts
export function okArray<T>(items?: T[] | null) {
  return { ok: true, items: Array.isArray(items) ? items : [] };
}
export function okObject<T extends object>(data: T) {
  return { ok: true, data };
}
export function err(message = 'Unexpected error', code = 'error') {
  return { ok: false, error: code, message };
}
