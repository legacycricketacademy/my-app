import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listSessions, createSession } from './api';
import type { CreateSessionRequest, ListSessionsParams } from './types';

export function useListSessions(params: ListSessionsParams = {}) {
  return useQuery({
    queryKey: ['sessions', params],
    queryFn: () => listSessions(params),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSessionRequest) => createSession(payload),
    onSuccess: () => {
      // Invalidate and refetch sessions list
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
}
