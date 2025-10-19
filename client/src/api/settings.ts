// client/src/api/settings.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { http } from '@/lib/http';

export const useSettingsGet = <T = any>(section: string) =>
  useQuery<T>({ 
    queryKey:['settings', section], 
    queryFn: async () => {
      const res = await http<any>(`/api/settings/${section}`);
      if (!res.ok) throw new Error(res.message || 'Failed to load settings');
      return res.data?.data ?? res.data;
    }
  });

export const useSettingsSave = (section: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body:any) => {
      const res = await http<any>(`/api/settings/${section}`, { method:'PUT', body: JSON.stringify(body) });
      if (!res.ok) throw new Error(res.message || 'Failed to save settings');
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey:['settings', section] })
  });
};
