import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

function ensureArray(v) {
  return Array.isArray(v) ? v : [];
}

export function useAnnouncements(params) {
  const qs = params?.audience ? `?audience=${encodeURIComponent(params.audience)}` : '';
  return useQuery({
    queryKey: ['announcements', params],
    queryFn: async () => {
      const res = await fetch(`/api/announcements${qs}`, { credentials: 'include' });
      if (res.status === 401) {
        window.location.assign('/auth');
        return [];
      }
      const data = await res.json().catch(() => ({}));
      return data?.ok ? ensureArray(data.data) : [];
    },
  });
}

export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body) => {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      if (res.status === 401) {
        window.location.assign('/auth');
        return { ok: false };
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['announcements'] }),
  });
}