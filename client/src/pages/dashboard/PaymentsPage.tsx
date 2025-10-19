import { useState } from 'react';
import { DollarSign, CreditCard, Calendar, AlertCircle, Banknote, Smartphone, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import RecordPaymentModal from './components/RecordPaymentModal';
import { useQuery } from '@tanstack/react-query';
import { getJson } from '@/lib/http';
import { toItems } from '@/lib/api-shape';
import { format, parseISO } from 'date-fns';

export default function PaymentsPage() {
  const [open, setOpen] = useState(false);
  const { data, isLoading, isError } = useQuery({
    queryKey: ['payments', 'pending'],
    queryFn: () => getJson('/api/payments/pending'),
  });
  
  // Safe array handling
  const payments = toItems<any>(data);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600">Manage payments, fees, and billing.</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <DollarSign className="h-4 w-4 mr-2" />
          Record Payment
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            Loading payments…
          </CardContent>
        </Card>
      ) : isError ? (
        <Card>
          <CardContent className="p-8">
            <p className="mb-3 text-red-600">Failed to load payments.</p>
            <Button variant="outline" onClick={() => window.location.reload()}>Try Again</Button>
          </CardContent>
        </Card>
      ) : payments.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No payments recorded</h3>
            <p className="text-gray-500 mb-4">Payment records will appear here once players make payments.</p>
            <Button onClick={() => setOpen(true)}>Record Payment</Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.map((p:any) => (
                  <tr key={p.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(parseISO(p.createdAt), 'MMM d, yyyy h:mm a')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        {getMethodIcon(p.method)}
                        <span className="ml-2">{p.playerName || p.playerId}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                      {p.currency === 'INR' ? '₹' : '$'}{p.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {p.method}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(p.status)}`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <RecordPaymentModal 
        open={open} 
        onOpenChange={setOpen}
      />
    </div>
  );
}
