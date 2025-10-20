// client/src/lib/api-shape.ts
import { asArray } from './arrays';

export function toItems<T>(resp: any): T[] {
  if (!resp) return [];
  if (Array.isArray(resp)) return resp;
  if (Array.isArray(resp.items)) return resp.items;
  return asArray<T>(resp);
}

export function toData<T>(resp: any, fallback: T): T {
  if (resp && resp.data && typeof resp.data === 'object') return resp.data as T;
  return fallback;
}
