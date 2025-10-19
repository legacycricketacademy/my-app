// client/src/api/settings.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const j = async (url:string, init:RequestInit = {}) => {
  const res = await fetch(url, { credentials:'include', headers:{'Content-Type':'application/json'}, ...init });
  const data = await res.json().catch(()=> ({}));
  if (!res.ok) throw Object.assign(new Error(data?.message ?? 'Request failed'), { data, status: res.status });
  return data;
};

export const useSettingsGet = <T = any>(section: string) =>
  useQuery<{ok:true, data:T}>({ queryKey:['settings', section], queryFn:()=> j(`/api/settings/${section}`) });

export const useSettingsSave = (section: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body:any) => j(`/api/settings/${section}`, { method:'PUT', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey:['settings', section] })
  });
};
