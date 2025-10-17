import { useQuery } from '@tanstack/react-query';
import { DollarSign, CreditCard, Calendar, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';

export default function PaymentsPage() {
  const { data: paymentsResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/payments'],
    queryFn: async () => {
      const response = await fetch('/api/payments', {
        credentials: 'include'
      });
      if (response.status === 404) {
        return { ok: true, items: [], count: 0 };
      }
      if (!response.ok) throw new Error('Failed to fetch payments');
      return response.json();
    }
  });

  const payments = paymentsResponse?.items ?? paymentsResponse ?? [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600">Manage payments, fees, and billing.</p>
        </div>
        <LoadingState message="Loading payments..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600">Manage payments, fees, and billing.</p>
        </div>
        <ErrorState 
          title="Failed to load payments"
          message="Unable to fetch payment information. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  if (!payments || payments.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
            <p className="text-gray-600">Manage payments, fees, and billing.</p>
          </div>
          <Button>
            <DollarSign className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <EmptyState
              icon={DollarSign}
              title="No payments recorded"
              description="Payment records will appear here once players make payments."
              action={{
                label: "Record Payment",
                onClick: () => console.log("Record payment clicked")
              }}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600">Manage payments, fees, and billing.</p>
        </div>
        <Button>
          <DollarSign className="h-4 w-4 mr-2" />
          Record Payment
        </Button>
      </div>

      <div className="grid gap-6">
        {payments.map((payment: any) => (
          <Card key={payment.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <CreditCard className="h-4 w-4 mr-2" />
                  {payment.description || 'Payment'}
                </span>
                <span className={`text-sm font-medium ${
                  payment.status === 'paid' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {payment.status === 'paid' ? 'Paid' : 'Pending'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span className="text-lg font-semibold">
                    ${payment.amount || '0.00'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    {payment.date ? new Date(payment.date).toLocaleDateString() : 'No date'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    {payment.playerName || 'Unknown Player'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
