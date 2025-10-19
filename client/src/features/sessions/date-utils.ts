// client/src/features/sessions/date-utils.ts
import { fromZonedTime, toZonedTime } from 'date-fns-tz';

export function toUtcISO(localISO: string, tz: string) {
  // localISO like "2025-11-07T15:35"
  const d = new Date(localISO);
  const utc = fromZonedTime(d, tz);
  return utc.toISOString();
}

export function displayLocal(utcISO: string, tz: string) {
  const d = new Date(utcISO);
  return toZonedTime(d, tz);
}

export function detectTZ(): string {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; }
  catch { return 'UTC'; }
}
