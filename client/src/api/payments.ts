import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { 
  Payment, 
  CreatePaymentRequest, 
  ListPaymentsParams, 
  PaymentResponse, 
  CreatePaymentResponse,
  PaymentErrorResponse 
} from './payments';

const API_BASE = import.meta.env.VITE_API_BASE ?? window.location.origin;

function buildQuery(params: Record<string, any> = {}): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });
  return searchParams.toString() ? `?${searchParams.toString()}` : '';
}

export async function listPayments(params: ListPaymentsParams = {}): Promise<Payment[]> {
  const url = `${API_BASE}/api/payments${buildQuery(params)}`;
  
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error: PaymentErrorResponse = await response.json();
    throw new Error(error.message || 'Failed to fetch payments');
  }

  const data: PaymentResponse = await response.json();
  return data.data;
}

export async function createPayment(payload: CreatePaymentRequest): Promise<Payment> {
  const response = await fetch(`${API_BASE}/api/payments`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error: PaymentErrorResponse = await response.json();
    throw new Error(error.message || 'Failed to create payment');
  }

  const data: CreatePaymentResponse = await response.json();
  return data.data;
}

export function usePayments(params: ListPaymentsParams = {}) {
  return useQuery({
    queryKey: ['payments', params],
    queryFn: () => listPayments(params),
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePaymentRequest) => createPayment(payload),
    onSuccess: () => {
      // Invalidate and refetch payments list
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
}