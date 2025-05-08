import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { ParentLayout } from '@/layout/parent-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ArrowLeft, Home } from 'lucide-react';

export default function PaymentSuccessPage() {
  const [, navigate] = useLocation();
  const [paymentInfo, setPaymentInfo] = useState<{
    paymentIntentId?: string;
    redirectStatus?: string;
  }>({});

  useEffect(() => {
    // Extract the payment information from the URL (Stripe redirects with query parameters)
    const searchParams = new URLSearchParams(window.location.search);
    const paymentIntentId = searchParams.get('payment_intent') || undefined;
    const redirectStatus = searchParams.get('redirect_status') || undefined;
    
    setPaymentInfo({
      paymentIntentId,
      redirectStatus
    });
  }, []);

  const handleBackToDashboard = () => {
    navigate('/parent/dashboard');
  };

  const handleViewPayments = () => {
    navigate('/parent/payments');
  };

  return (
    <ParentLayout title="Payment Success">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card className="bg-white shadow-md border-green-100 border-2">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-green-700">Payment Successful!</CardTitle>
            <CardDescription className="text-base mt-2">
              Your payment has been processed successfully.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4 text-center">
            <p className="text-gray-600">
              Thank you for your payment to Legacy Cricket Academy. 
              A receipt has been sent to your email address.
            </p>
            
            {paymentInfo.paymentIntentId && (
              <div className="bg-gray-50 rounded-md p-4 text-sm">
                <p className="font-medium text-gray-700">Payment Reference</p>
                <p className="text-gray-500 mt-1 break-all">{paymentInfo.paymentIntentId}</p>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              variant="outline" 
              className="flex items-center gap-2 w-full sm:w-auto"
              onClick={handleViewPayments}
            >
              <ArrowLeft className="h-4 w-4" />
              View Payment History
            </Button>
            
            <Button 
              className="flex items-center gap-2 w-full sm:w-auto"
              onClick={handleBackToDashboard}
            >
              <Home className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    </ParentLayout>
  );
}