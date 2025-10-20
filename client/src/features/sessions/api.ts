import { http } from '@/lib/http';
import { asArray } from '@/lib/arrays';

export async function listSessions(params?: Record<string,string>) {
  try {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await http<any[]>('/api/sessions' + qs);
    if (!res.ok) {
      throw new Error(res.message || 'Failed to fetch sessions');
    }
    return { sessions: asArray(res.data) };
  } catch (e) {
    if (e instanceof Error && e.message.includes('401')) {
      window.location.assign('/auth');
      return { sessions: [] };
    }
    throw e;
  }
}

export async function createSession(payload: any) {
  try {
    const res = await http<any>('/api/sessions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(res.message || 'Failed to create session');
    }
    return res.data;
  } catch (e) {
    if (e instanceof Error && e.message.includes('401')) {
      window.location.assign('/auth');
      return null;
    }
    throw e;
  }
}
