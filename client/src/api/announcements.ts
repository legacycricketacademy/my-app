import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { 
  Announcement, 
  CreateAnnouncementRequest, 
  ListAnnouncementsParams, 
  AnnouncementResponse, 
  CreateAnnouncementResponse,
  AnnouncementErrorResponse 
} from './announcements';

const API_BASE = import.meta.env.VITE_API_BASE ?? window.location.origin;

function buildQuery(params: Record<string, any> = {}): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });
  return searchParams.toString() ? `?${searchParams.toString()}` : '';
}

export async function listAnnouncements(params: ListAnnouncementsParams = {}): Promise<Announcement[]> {
  const url = `${API_BASE}/api/announcements${buildQuery(params)}`;
  
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error: AnnouncementErrorResponse = await response.json();
    throw new Error(error.message || 'Failed to fetch announcements');
  }

  const data: AnnouncementResponse = await response.json();
  return data.data;
}

export async function createAnnouncement(payload: CreateAnnouncementRequest): Promise<Announcement> {
  const response = await fetch(`${API_BASE}/api/announcements`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error: AnnouncementErrorResponse = await response.json();
    throw new Error(error.message || 'Failed to create announcement');
  }

  const data: CreateAnnouncementResponse = await response.json();
  return data.data;
}

export function useAnnouncements(params: ListAnnouncementsParams = {}) {
  return useQuery({
    queryKey: ['announcements', params],
    queryFn: () => listAnnouncements(params),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAnnouncementRequest) => createAnnouncement(payload),
    onSuccess: () => {
      // Invalidate and refetch announcements list
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });
}