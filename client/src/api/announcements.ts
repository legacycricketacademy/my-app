import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { http } from '@/lib/http';

function ensureArray(v: any) {
  return Array.isArray(v) ? v : [];
}

export function useAnnouncements(params?: { audience?: string }) {
  const qs = params?.audience ? `?audience=${encodeURIComponent(params.audience)}` : '';
  return useQuery({
    queryKey: ['announcements', params],
    queryFn: async () => {
      const res = await http<any>(`/api/announcements${qs}`);
      if (!res.ok) {
        if (res.error === 'unauthorized') {
          window.location.assign('/auth');
          return [];
        }
        throw new Error(res.message || 'Failed to load announcements');
      }
      return ensureArray(res.data?.items ?? res.data?.data ?? res.data);
    },
  });
}

export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: any) => {
      const res = await http<any>('/api/announcements', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        if (res.error === 'unauthorized') {
          window.location.assign('/auth');
          return { ok: false };
        }
        throw new Error(res.message || 'Failed to create announcement');
      }
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['announcements'] }),
  });
}