import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CreditCard, CheckCircle, XCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

interface StripePaymentProps {
  amount: number;
  currency?: string;
  playerId: string;
  description?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

interface PaymentFormProps {
  clientSecret: string;
  amount: number;
  currency: string;
  onSuccess: () => void;
  onCancel: () => void;
}

function PaymentForm({ clientSecret, amount, currency, onSuccess, onCancel }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'succeeded' | 'failed'>('idle');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/dashboard/payments',
        },
        redirect: 'if_required',
      });

      if (error) {
        console.error('Payment failed:', error);
        setPaymentStatus('failed');
        toast({
          title: 'Payment Failed',
          description: error.message || 'Payment could not be processed',
          variant: 'destructive',
        });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        setPaymentStatus('succeeded');
        toast({
          title: 'Payment Successful',
          description: `Payment of ${currency} ${amount.toFixed(2)} completed successfully`,
        });
        onSuccess();
      } else {
        setPaymentStatus('failed');
        toast({
          title: 'Payment Failed',
          description: 'Payment was not completed',
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Payment error:', err);
      setPaymentStatus('failed');
      toast({
        title: 'Payment Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (paymentStatus === 'succeeded') {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2 text-green-700">
            <CheckCircle className="h-6 w-6" />
            <span className="font-medium">Payment Successful!</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (paymentStatus === 'failed') {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2 text-red-700">
            <XCircle className="h-6 w-6" />
            <span className="font-medium">Payment Failed</span>
          </div>
          <div className="mt-4 flex justify-center space-x-2">
            <Button variant="outline" onClick={onCancel}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Payment Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="text-sm text-gray-600">Amount</div>
              <div className="text-lg font-semibold">
                {currency} {amount.toFixed(2)}
              </div>
            </div>
            
            <div className="border rounded-md p-4">
              <PaymentElement 
                options={{
                  layout: 'tabs'
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!stripe || !elements || isProcessing}
          className="min-w-[120px]"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay ${currency} ${amount.toFixed(2)}`
          )}
        </Button>
      </div>
    </form>
  );
}

export function StripePayment({ amount, currency = 'INR', playerId, description, onSuccess, onCancel }: StripePaymentProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/stripe/payment-intents', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            amount,
            currency: currency.toLowerCase(),
            playerId,
            description,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to create payment intent');
        }

        setClientSecret(data.clientSecret);
      } catch (err) {
        console.error('Error creating payment intent:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize payment');
      } finally {
        setIsLoading(false);
      }
    };

    createPaymentIntent();
  }, [amount, currency, playerId, description]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Initializing payment...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2 text-red-700">
            <XCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
          <div className="mt-4 flex justify-center">
            <Button variant="outline" onClick={onCancel}>
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!clientSecret) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2 text-red-700">
            <XCircle className="h-5 w-5" />
            <span>Failed to initialize payment</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#2563eb',
      },
    },
  };

  return (
    <Elements options={options} stripe={stripePromise}>
      <PaymentForm
        clientSecret={clientSecret}
        amount={amount}
        currency={currency}
        onSuccess={onSuccess}
        onCancel={onCancel}
      />
    </Elements>
  );
}
