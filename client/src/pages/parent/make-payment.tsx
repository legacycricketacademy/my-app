import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useStripe, useElements, PaymentElement, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { apiRequest } from '@/lib/queryClient';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ParentLayout } from '@/layout/parent-layout';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

// Initialize Stripe with proper error handling
import { Stripe } from '@stripe/stripe-js';
let stripePromise: Promise<Stripe | null> | null = null;
try {
  const publicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY as string;
  if (!publicKey) {
    console.error('VITE_STRIPE_PUBLIC_KEY is not defined');
  } else if (publicKey.startsWith('sk_')) {
    console.error('VITE_STRIPE_PUBLIC_KEY is a secret key, not a publishable key');
  } else {
    stripePromise = loadStripe(publicKey);
  }
} catch (error) {
  console.error('Error initializing Stripe:', error);
}

// Payment form component
function CheckoutForm({ paymentId, amount }: { paymentId: number, amount: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setError(null);

    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + '/parent/payment-success',
      },
      redirect: 'if_required',
    });

    if (submitError) {
      setError(submitError.message || 'An error occurred while processing your payment.');
      toast({
        title: 'Payment failed',
        description: submitError.message || 'An unknown error occurred',
        variant: 'destructive',
      });
      setIsLoading(false);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      setSucceeded(true);
      toast({
        title: 'Payment successful!',
        description: `Your payment of $${(amount).toFixed(2)} has been processed successfully.`,
      });
      setTimeout(() => {
        navigate('/parent/dashboard');
      }, 2000);
    }
  };

  if (succeeded) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
        <h2 className="text-2xl font-bold">Payment Successful!</h2>
        <p className="mt-2 text-gray-600">Your payment of ${amount.toFixed(2)} has been processed.</p>
        <p className="mt-1 text-gray-500">You will be redirected to dashboard automatically...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        <PaymentElement />

        <div className="pt-4">
          <Button 
            type="submit" 
            className="w-full" 
            disabled={!stripe || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay $${amount.toFixed(2)}`
            )}
          </Button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-800 rounded flex items-start">
            <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </form>
  );
}

// Parent page component
export default function MakePaymentPage() {
  const params = useParams<{ playerId: string }>();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<number | null>(null);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);
  const [players, setPlayers] = useState<any[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(params.playerId ? parseInt(params.playerId) : null);
  const [paymentDetails, setPaymentDetails] = useState({
    playerId: params.playerId ? parseInt(params.playerId) : 0,
    amount: 50, // Default amount
    paymentType: 'monthly_fee', // Default payment type
    description: 'Monthly cricket academy fee'
  });
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [, navigate] = useLocation();

  // Fetch all parent's players when coming from the "New Payment" button
  useEffect(() => {
    if (!params.playerId) {
      const fetchParentPlayers = async () => {
        setIsLoadingPlayers(true);
        try {
          const response = await apiRequest('GET', '/api/parent/players');
          if (response.ok) {
            const playersData = await response.json();
            setPlayers(playersData);
            
            // Select the first player by default if there are any
            if (playersData.length > 0) {
              setSelectedPlayerId(playersData[0].id);
              setPaymentDetails(prev => ({
                ...prev,
                playerId: playersData[0].id
              }));
              setPlayerName(`${playersData[0].firstName} ${playersData[0].lastName}`);
            } else {
              toast({
                title: 'No players found',
                description: 'You need to add or connect with a player first before making a payment.',
                variant: 'destructive',
              });
              // Redirect to connect player page if no players are found
              setTimeout(() => {
                navigate('/parent/connect-child');
              }, 2000);
            }
          } else {
            throw new Error('Failed to fetch players');
          }
        } catch (error) {
          console.error('Error fetching parent players:', error);
          toast({
            title: 'Error',
            description: 'Failed to load your players. Please try again.',
            variant: 'destructive',
          });
        } finally {
          setIsLoadingPlayers(false);
        }
      };
      
      fetchParentPlayers();
    }
  }, []);

  const createPaymentIntent = useMutation({
    mutationFn: async (data: typeof paymentDetails) => {
      console.log('Creating payment intent with data:', data);
      const response = await apiRequest('POST', '/api/create-payment-intent', data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create payment intent');
      }
      return response.json();
    },
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
      setPaymentId(data.paymentId);
    },
    onError: (error: Error) => {
      setError(error.message);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Handle player selection when using the dropdown
  const handlePlayerChange = (playerId: number) => {
    setSelectedPlayerId(playerId);
    const player = players.find(p => p.id === playerId);
    if (player) {
      setPlayerName(`${player.firstName} ${player.lastName}`);
      setPaymentDetails(prev => ({
        ...prev,
        playerId
      }));
    }
  };

  // Handle amount change
  const handleAmountChange = (amount: number) => {
    setPaymentDetails(prev => ({
      ...prev,
      amount
    }));
  };

  // Handle payment type change
  const handlePaymentTypeChange = (paymentType: string) => {
    setPaymentDetails(prev => ({
      ...prev,
      paymentType
    }));
  };

  // Fetch player details when component mounts if playerId is provided
  useEffect(() => {
    const fetchPlayerDetails = async () => {
      try {
        const response = await apiRequest('GET', `/api/players/${params.playerId}`);
        if (response.ok) {
          const playerData = await response.json();
          setPlayerName(`${playerData.firstName} ${playerData.lastName}`);
        }
      } catch (error) {
        console.error('Error fetching player details:', error);
      }
    };

    if (params.playerId) {
      fetchPlayerDetails();
    }
  }, [params.playerId]);

  // Create payment intent when player is selected
  useEffect(() => {
    if (selectedPlayerId && paymentDetails.playerId > 0) {
      createPaymentIntent.mutate(paymentDetails);
    }
  }, [selectedPlayerId, paymentDetails.playerId]);

  return (
    <ParentLayout title="Make Payment">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle>Make a Payment</CardTitle>
            <CardDescription>
              {playerName ? `Payment for ${playerName}` : 'Processing payment...'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!params.playerId && isLoadingPlayers ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading your players...</span>
              </div>
            ) : !params.playerId && players.length > 0 ? (
              <div className="mb-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Select Player</label>
                    <select 
                      className="w-full p-2 border rounded-md"
                      value={selectedPlayerId || ''}
                      onChange={(e) => handlePlayerChange(Number(e.target.value))}
                    >
                      {players.map(player => (
                        <option key={player.id} value={player.id}>
                          {player.firstName} {player.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Payment Type</label>
                    <select 
                      className="w-full p-2 border rounded-md"
                      value={paymentDetails.paymentType}
                      onChange={(e) => handlePaymentTypeChange(e.target.value)}
                    >
                      <option value="monthly_fee">Monthly Fees</option>
                      <option value="equipment_fee">Equipment Fees</option>
                      <option value="tournament_fee">Tournament Fees</option>
                      <option value="special_training">Special Training</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Amount (USD)</label>
                    <input 
                      type="number"
                      min="1"
                      step="0.01"
                      className="w-full p-2 border rounded-md"
                      value={paymentDetails.amount}
                      onChange={(e) => handleAmountChange(Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>
            ) : null}
            
            {createPaymentIntent.isPending ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Setting up payment...</span>
              </div>
            ) : error ? (
              <div className="py-8 text-center">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-red-800">Payment Setup Failed</h3>
                <p className="mt-2 text-red-600">{error}</p>
              </div>
            ) : clientSecret && stripePromise ? (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm paymentId={paymentId || 0} amount={paymentDetails.amount} />
              </Elements>
            ) : clientSecret && !stripePromise ? (
              <div className="py-8 text-center">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-red-800">Stripe Configuration Error</h3>
                <p className="mt-2 text-red-600">
                  There appears to be an issue with your Stripe API key configuration.
                  The public key might be missing or incorrect.
                </p>
              </div>
            ) : selectedPlayerId ? (
              <div className="py-8 text-center text-gray-500">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p>Initializing payment system...</p>
              </div>
            ) : null}
          </CardContent>
          <CardFooter className="bg-gray-50 border-t px-6 py-4">
            <p className="text-sm text-gray-500">
              Your payment is securely processed by Stripe. Your card details are never stored on our servers.
            </p>
          </CardFooter>
        </Card>
      </div>
    </ParentLayout>
  );
}