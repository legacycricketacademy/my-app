import type { 
  CreateSessionRequest, 
  CreateSessionResponse, 
  ListSessionsParams, 
  ListSessionsResponse,
  SessionErrorResponse 
} from './types';

const API_BASE = import.meta.env.VITE_API_BASE ?? window.location.origin;

export async function listSessions(params: ListSessionsParams = {}): Promise<ListSessionsResponse> {
  const searchParams = new URLSearchParams();
  if (params.from) searchParams.set('from', params.from);
  if (params.to) searchParams.set('to', params.to);
  if (params.ageGroup) searchParams.set('ageGroup', params.ageGroup);

  const url = `${API_BASE}/api/sessions${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error: SessionErrorResponse = await response.json();
    throw new Error(error.message || 'Failed to fetch sessions');
  }

  return response.json();
}

export async function createSession(payload: CreateSessionRequest): Promise<CreateSessionResponse> {
  const response = await fetch(`${API_BASE}/api/sessions`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error: SessionErrorResponse = await response.json();
    throw new Error(error.message || 'Failed to create session');
  }

  return response.json();
}
