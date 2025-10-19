// server/storage/settingsStore.ts
// Minimal store; swap to DB later. Uses memory + optional file snapshot to survive restarts.
import fs from 'fs';
import path from 'path';

type Role = 'admin'|'coach'|'parent';
type SettingsDoc = {
  profile?: { fullName?: string; email?: string; phone?: string };
  notifications?: { email?: boolean; sms?: boolean; push?: boolean };
  payments?: { stripeEnabled?: boolean; currency?: 'INR'|'USD'; receiptEmail?: string };
  support?: { contactEmail?: string; whatsapp?: string; faqUrl?: string };
  // admin-only:
  academy?: { name?: string; timezone?: string; logoUrl?: string };
  access?: { inviteOnly?: boolean; roles?: Record<string,'admin'|'coach'|'parent'> };
  data?: { exportRequestedAt?: string|null; anonymize?: boolean };
};

type Key = string; // userId for parent/coach, 'academy' for org

const SNAP = path.join(process.cwd(), '.data-settings.json');
let DB: Record<Key, SettingsDoc> = {};
try { if (fs.existsSync(SNAP)) DB = JSON.parse(fs.readFileSync(SNAP,'utf8')); } catch {}

function persist() { try { fs.writeFileSync(SNAP, JSON.stringify(DB, null, 2)); } catch {} }

export function getSettings(key: Key): SettingsDoc {
  return DB[key] ?? (DB[key] = {});
}
export function setSettings(key: Key, patch: Partial<SettingsDoc>): SettingsDoc {
  DB[key] = { ...getSettings(key), ...patch };
  persist();
  return DB[key];
}
