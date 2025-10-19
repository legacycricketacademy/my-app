import { http } from '@/lib/http';

export async function listSessions(params?: Record<string,string>) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  const res = await http<any>('/api/sessions' + qs);
  if (!res.ok) throw new Error(res.message || 'Failed to load sessions');
  return res.data;
}

export async function createSession(payload: any) {
  const res = await http<any>('/api/sessions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(res.message || 'Create failed');
  return res.data.session ?? res.data.item ?? res.data;
}
