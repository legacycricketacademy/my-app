import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchJson } from '../lib/api';

export function useSessions() {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: async () => (await fetchJson<{ok:true, items:any[]}>('/api/sessions')).items,
  });
}

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: any) =>
      (await fetchJson<{ok:true, item:any}>('/api/sessions', { method:'POST', body: JSON.stringify(body) })).item,
    onSuccess: () => { qc.invalidateQueries({ queryKey:['sessions'] }); },
  });
}
