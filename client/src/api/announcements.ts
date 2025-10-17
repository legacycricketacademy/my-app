import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const q = (p?:Record<string,any>) =>
  p ? '?' + Object.entries(p).filter(([,v])=>v!=null && v!=='').map(([k,v])=>`${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&') : '';

export function useAnnouncements(params?: { audience?: string }) {
  return useQuery({
    queryKey: ['announcements', params],
    queryFn: async () => {
      const res = await fetch(`/api/announcements${q(params)}`, { credentials:'include' });
      return res.json();
    },
    select: (r) => (r?.ok ? r.data : []),
  });
}

export function useCreateAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body:any) => {
      const res = await fetch('/api/announcements', {
        method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include',
        body: JSON.stringify(body),
      });
      return res.json();
    },
    onSuccess: (r:any) => { if (r?.ok) qc.invalidateQueries({ queryKey:['announcements'] }); },
  });
}
