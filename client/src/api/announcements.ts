import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { http } from '@/lib/http';
import { asArray } from '@/lib/arrays';

export function useAnnouncements(params?: { audience?: string }) {
  const qs = params?.audience ? `?audience=${encodeURIComponent(params.audience)}` : '';
  return useQuery({
    queryKey: ['announcements', params],
    queryFn: async () => {
      try {
        const announcements = await http<any[]>(`/api/announcements${qs}`);
        return asArray(announcements);
      } catch (e) {
        if (e instanceof Error && e.message.includes('401')) {
          window.location.assign('/auth');
          return [];
        }
        throw e;
      }
    },
  });
}

export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: any) => {
      try {
        const announcement = await http<any>('/api/announcements', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        return announcement;
      } catch (e) {
        if (e instanceof Error && e.message.includes('401')) {
          window.location.assign('/auth');
          return null;
        }
        throw e;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['announcements'] }),
  });
}