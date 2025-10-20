import { http, HttpError } from '@/lib/http';
import { asArray } from '@/lib/arrays';

export async function listSessions(params?: Record<string,string>) {
  try {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    const sessions = await http<any[]>('/api/sessions' + qs);
    return { sessions: asArray(sessions) };
  } catch (e) {
    if (e instanceof HttpError && e.status === 401) {
      window.location.assign('/auth');
      return { sessions: [] };
    }
    throw e;
  }
}

export async function createSession(payload: any) {
  try {
    const session = await http<any>('/api/sessions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return session;
  } catch (e) {
    if (e instanceof HttpError && e.status === 401) {
      window.location.assign('/auth');
      return null;
    }
    throw e;
  }
}
