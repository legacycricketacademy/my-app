import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchJson } from '../lib/api';

export function useFitnessSummary() {
  return useQuery({
    queryKey: ['fitness','summary'],
    queryFn: async () => (await fetchJson<{ok:true, items:any[]}>('/api/fitness/summary')).items,
  });
}

export function useLogFitness() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: any) =>
      (await fetchJson<{ok:true, item:any}>('/api/fitness/logs', { method:'POST', body: JSON.stringify(body) })).item,
    onSuccess: () => qc.invalidateQueries({ queryKey:['fitness','summary'] }),
  });
}
