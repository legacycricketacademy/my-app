import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { http, HttpError } from '@/lib/http';

export const useSettingsGet = <T = any>(section: string) =>
  useQuery<T>({ 
    queryKey:['settings', section], 
    queryFn: async () => {
      try {
        const data = await http<T>(`/api/settings/${section}`);
        return data;
      } catch (e) {
        if (e instanceof HttpError && e.status === 401) {
          window.location.assign('/auth');
          return {} as T;
        }
        throw e;
      }
    }
  });

export const useSettingsSave = (section: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body:any) => {
      try {
        const data = await http<any>(`/api/settings/${section}`, { 
          method:'PUT', 
          body: JSON.stringify(body) 
        });
        return data;
      } catch (e) {
        if (e instanceof HttpError && e.status === 401) {
          window.location.assign('/auth');
          return null;
        }
        throw e;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey:['settings', section] })
  });
};
