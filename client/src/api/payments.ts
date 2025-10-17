import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const q = (p?:Record<string,any>) =>
  p ? '?' + Object.entries(p).filter(([,v])=>v!=null && v!=='').map(([k,v])=>`${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&') : '';

export function usePayments(params?: { playerId?: string; status?: string; from?: string; to?: string }) {
  return useQuery({
    queryKey: ['payments', params],
    queryFn: async () => {
      const res = await fetch(`/api/payments${q(params)}`, { credentials:'include' });
      return res.json();
    },
    select: (r) => (r?.ok ? r.data : []),
  });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body:any) => {
      const res = await fetch('/api/payments', {
        method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include',
        body: JSON.stringify(body),
      });
      return res.json();
    },
    onSuccess: (r:any) => { if (r?.ok) qc.invalidateQueries({ queryKey:['payments'] }); },
  });
}
