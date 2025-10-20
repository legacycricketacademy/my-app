import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { http } from '@/lib/http';
import { asArray } from '@/lib/arrays';

const q = (p?:Record<string,any>) =>
  p ? '?' + Object.entries(p).filter(([,v])=>v!=null && v!=='').map(([k,v])=>`${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&') : '';

export function usePayments(params?: { playerId?: string; status?: string; from?: string; to?: string }) {
  return useQuery({
    queryKey: ['payments', params],
    queryFn: async () => {
      try {
        const payments = await http<any[]>(`/api/payments${q(params)}`);
        return asArray(payments);
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

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body:any) => {
      try {
        const payment = await http<any>('/api/payments', {
          method:'POST',
          body: JSON.stringify(body),
        });
        return payment;
      } catch (e) {
        if (e instanceof Error && e.message.includes('401')) {
          window.location.assign('/auth');
          return null;
        }
        throw e;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey:['payments'] }),
  });
}
