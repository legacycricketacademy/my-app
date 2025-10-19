import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchJson } from '../lib/api';

export function useAnnouncements() {
  return useQuery({
    queryKey: ['announcements'],
    queryFn: async () => (await fetchJson<{ok:true, items:any[]}>('/api/announcements')).items,
  });
}

export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: any) =>
      (await fetchJson<{ok:true, item:any}>('/api/announcements', { method:'POST', body: JSON.stringify(body) })).item,
    onSuccess: () => qc.invalidateQueries({ queryKey:['announcements'] }),
  });
}
