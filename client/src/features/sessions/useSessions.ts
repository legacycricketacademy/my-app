import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listSessions, createSession } from './api';

export function useListSessions(params?: Record<string,string>) {
  return useQuery({ 
    queryKey: ['sessions', params], 
    queryFn: () => listSessions(params),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createSession,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sessions'] }),
  });
}
