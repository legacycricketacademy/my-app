import { useState } from 'react';
import { DollarSign, CreditCard, Calendar, AlertCircle, Banknote, Smartphone, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { RecordPaymentModal } from './components/RecordPaymentModal';
import { usePayments } from '@/api/payments';
import { format, parseISO } from 'date-fns';

export default function PaymentsPage() {
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
  const { data: payments, isLoading, error, refetch } = usePayments();

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return <Banknote className="h-4 w-4" />;
      case 'card':
        return <CreditCard className="h-4 w-4" />;
      case 'upi':
        return <Smartphone className="h-4 w-4" />;
      case 'bank':
        return <Building2 className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
          <Button onClick={() => setShowRecordPaymentModal(true)}>
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
                onClick: () => setShowRecordPaymentModal(true)
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
        <Button onClick={() => setShowRecordPaymentModal(true)}>
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
                  {getMethodIcon(payment.method)}
                  <span className="ml-2">{payment.playerName || 'Unknown Player'}</span>
                </span>
                <Badge className={getStatusColor(payment.status)}>
                  {payment.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <span className="text-lg font-semibold">
                    {payment.currency === 'INR' ? '₹' : '$'}{payment.amount.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    {format(parseISO(payment.createdAt), 'MMM d, yyyy')}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 text-gray-400" />
                  <span className="text-sm capitalize">
                    {payment.method}
                  </span>
                </div>
              </div>
              {payment.notes && (
                <div className="mt-3 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-600">{payment.notes}</p>
                </div>
              )}
              {payment.reference && (
                <div className="mt-2">
                  <span className="text-xs text-gray-500">Reference: {payment.reference}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <RecordPaymentModal 
        open={showRecordPaymentModal} 
        onOpenChange={setShowRecordPaymentModal} 
      />
    </div>
  );
}
