import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { ParentLayout } from '@/layout/parent-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Calendar, CircleDollarSign, ArrowRight, Loader2 } from 'lucide-react';
import { useMobile } from '@/hooks/use-mobile';

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  const getVariant = () => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Badge variant="outline" className={`${getVariant()} font-medium capitalize`}>
      {status}
    </Badge>
  );
};

// Payment card component
const PaymentCard = ({ payment, onMakePayment }: { 
  payment: any, 
  onMakePayment: (paymentId: number, playerId: number) => void 
}) => {
  const isMobile = useMobile();
  
  return (
    <Card className="mb-4 overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          <div className="p-4 flex-1">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-semibold">{payment.paymentType.replace(/_/g, ' ')}</h3>
                <p className="text-sm text-gray-500">
                  {payment.playerName}
                </p>
              </div>
              <StatusBadge status={payment.status} />
            </div>
            
            <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
              <div className="flex items-center text-sm">
                <Calendar className="h-4 w-4 mr-1.5 text-gray-500" />
                <span>Due: {format(new Date(payment.dueDate), 'MMM d, yyyy')}</span>
              </div>
              
              <div className="flex items-center font-medium">
                <CircleDollarSign className="h-4 w-4 mr-1.5 text-emerald-600" />
                ${Number(payment.amount).toFixed(2)}
              </div>
            </div>
            
            {payment.notes && (
              <p className="mt-2 text-sm text-gray-600 line-clamp-1">{payment.notes}</p>
            )}
          </div>
          
          {payment.status === 'pending' && (
            <div className={`bg-gray-50 ${isMobile ? 'p-3 border-t' : 'border-l p-4 flex items-center'}`}>
              <Button 
                onClick={() => onMakePayment(payment.id, payment.playerId)}
                size={isMobile ? "sm" : "default"}
                className="w-full whitespace-nowrap"
              >
                Make Payment
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default function PaymentsPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('all');
  
  // Fetch user's children
  const playersQuery = useQuery({
    queryKey: ['/api/parent/players'],
    enabled: !!user
  });
  
  // Fetch payments for all children
  const paymentsQuery = useQuery({
    queryKey: ['/api/parent/payments'],
    enabled: !!user,
  });
  
  const isLoading = playersQuery.isLoading || paymentsQuery.isLoading;
  
  // Filter payments based on active tab
  const filteredPayments = paymentsQuery.data?.filter((payment: any) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return payment.status === 'pending';
    if (activeTab === 'paid') return payment.status === 'paid';
    if (activeTab === 'overdue') return payment.status === 'overdue';
    return true;
  }) || [];
  
  const handleMakePayment = (paymentId: number, playerId: number) => {
    navigate(`/parent/make-payment/${playerId}?payment=${paymentId}`);
  };
  
  return (
    <ParentLayout title="Payments">
      <div className="container px-4 py-6 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Payments</h1>
            <p className="text-gray-500 mt-1">Manage and view payment history</p>
          </div>
          
          <Button 
            className="mt-4 sm:mt-0"
            onClick={() => navigate('/parent/payments/new')}
          >
            <PlusCircle className="mr-2 h-4 w-4" /> New Payment
          </Button>
        </div>
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="paid">Paid</TabsTrigger>
            <TabsTrigger value="overdue">Overdue</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab}>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredPayments.length > 0 ? (
              <div>
                {filteredPayments.map((payment: any) => (
                  <PaymentCard 
                    key={payment.id} 
                    payment={payment} 
                    onMakePayment={handleMakePayment}
                  />
                ))}
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>No Payments Found</CardTitle>
                  <CardDescription>
                    {activeTab === 'all' 
                      ? "You don't have any payments yet"
                      : `You don't have any ${activeTab} payments`
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" onClick={() => navigate('/parent/dashboard')}>
                    Return to Dashboard
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ParentLayout>
  );
}