import { useQuery } from '@tanstack/react-query';
import { DollarSign, Calendar, CreditCard, ChevronLeft, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

export default function PaymentTransactionsPage() {
  const navigate = useNavigate();

  const { data: payments, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/payments', 'parent', 100],
    queryFn: async () => {
      const response = await fetch('/api/payments?scope=parent&limit=100', {
        credentials: 'include'
      });
      if (!response.ok) {
        // Fallback to general payments endpoint
        const fallbackResponse = await fetch('/api/payments', {
          credentials: 'include'
        });
        if (!fallbackResponse.ok) throw new Error('Failed to fetch payment history');
        return fallbackResponse.json();
      }
      return response.json();
    }
  });

  // Calculate totals
  const totalPaid = payments?.filter((p: any) => p.status === 'paid')
    .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0) || 0;
  const totalPending = payments?.filter((p: any) => p.status === 'pending')
    .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0) || 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payment History</h1>
            <p className="text-gray-600">View all payment transactions.</p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/parent/payments')}
            aria-label="Back to payments"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <LoadingState message="Loading payment history..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Payment History</h1>
            <p className="text-gray-600">View all payment transactions.</p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/parent/payments')}
            aria-label="Back to payments"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <ErrorState 
          title="Failed to load payment history"
          message="Unable to fetch payment transactions. Please try again."
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
            <h1 className="text-2xl font-bold text-gray-900">Payment History</h1>
            <p className="text-gray-600">View all payment transactions.</p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/parent/payments')}
            aria-label="Back to payments"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <EmptyState
              icon={DollarSign}
              title="No payment history"
              description="Payment records will appear here once transactions are made."
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
          <h1 className="text-2xl font-bold text-gray-900">Payment History</h1>
          <p className="text-gray-600">View all payment transactions.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Export to CSV
              const csv = payments.map((p: any) => 
                `${p.date || ''},${p.description || ''},${p.amount || ''},${p.status || ''}`
              ).join('\n');
              const blob = new Blob([`Date,Description,Amount,Status\n${csv}`], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `payment-history-${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            aria-label="Download payment history"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/parent/payments')}
            aria-label="Back to payments"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Paid</p>
                <p className="text-2xl font-bold text-green-600">${totalPaid.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Pending</p>
                <p className="text-2xl font-bold text-red-600">${totalPending.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold">{payments.length}</p>
              </div>
              <CreditCard className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {payments.map((payment: any) => (
              <div 
                key={payment.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      payment.status === 'paid' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <p className="font-medium">{payment.description || 'Payment'}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {payment.date ? new Date(payment.date).toLocaleDateString() : 'No date'}
                        </span>
                        {payment.playerName && (
                          <span>{payment.playerName}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="font-semibold text-lg">${payment.amount || '0.00'}</p>
                    <Badge variant={payment.status === 'paid' ? 'default' : 'destructive'}>
                      {payment.status === 'paid' ? 'Paid' : 'Pending'}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
