import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useStripe, useElements, PaymentElement, Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ParentLayout } from '@/layout/parent-layout';
import { useToast } from '@/hooks/use-toast';
import { isPendingLike } from '@/shared/pending';
import { sessionDurations, feeAmounts, SessionDuration } from '@shared/schema';
import { 
  Loader2, 
  CheckCircle, 
  AlertTriangle, 
  CreditCard, 
  DollarSign, 
  Send, 
  Copy, 
  Info
} from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

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

// Payment method types
type PaymentMethod = 'stripe' | 'cash' | 'zelle' | 'venmo';

// Manual payment form schema
const manualPaymentSchema = z.object({
  playerId: z.number().positive("Please select a player"),
  amount: z.number().positive("Amount must be greater than zero"),
  paymentType: z.string().min(1, "Please select a payment type"),
  sessionDuration: z.enum(['60min', '90min'], {
    required_error: "Please select a session duration",
  }),
  method: z.enum(['cash', 'zelle', 'venmo'], {
    required_error: "Please select a payment method",
  }),
  transactionId: z.string().optional(),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional(),
});

type ManualPaymentValues = z.infer<typeof manualPaymentSchema>;

// Stripe checkout form component
function CheckoutForm({ 
  paymentId, 
  amount,
  onCancel
}: { 
  paymentId: number, 
  amount: number,
  onCancel: () => void
}) {
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

        <div className="flex gap-3 pt-4">
          <Button 
            type="button" 
            variant="outline"
            className="flex-1" 
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            className="flex-1" 
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

// External payment methods info component
function ExternalPaymentInfo() {
  const [copied, setCopied] = useState<string | null>(null);
  
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-muted/50 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Payment Instructions</h3>
            <p className="text-sm text-muted-foreground">
              Send payment using one of these methods and then complete the form below.
            </p>
          </div>
          <Badge variant="outline" className="mt-2 sm:mt-0 p-2 px-3 text-sm self-start sm:self-auto">
            <Info className="h-4 w-4 mr-1" /> Mark as pending after submission
          </Badge>
        </div>
        
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="zelle">
            <AccordionTrigger className="py-3">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <Send className="h-4 w-4 text-blue-600" />
                </div>
                <span>Zelle</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="p-3 rounded-md bg-white">
                <div className="flex flex-wrap items-center justify-between mb-2">
                  <span className="font-medium">Phone Number:</span>
                  <div className="flex items-center">
                    <span className="text-sm mr-2">440-212-1795</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => copyToClipboard("440-212-1795", "zelle-phone")}
                    >
                      {copied === "zelle-phone" ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Important: Include your child's name and "Cricket Fee" in the memo.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="cash-app">
            <AccordionTrigger className="py-3">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
                  <DollarSign className="h-4 w-4 text-green-600" />
                </div>
                <span>Cash App</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="p-3 rounded-md bg-white">
                <div className="flex flex-wrap items-center justify-between mb-2">
                  <span className="font-medium">Username:</span>
                  <div className="flex items-center">
                    <span className="text-sm mr-2">$MadhukarAshok</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => copyToClipboard("$MadhukarAshok", "cash-app")}
                    >
                      {copied === "cash-app" ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Important: Include your child's name and "Cricket Fee" in the notes section.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
          
          <AccordionItem value="venmo">
            <AccordionTrigger className="py-3">
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                  <Send className="h-4 w-4 text-indigo-600" />
                </div>
                <span>Venmo</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="p-3 rounded-md bg-white">
                <div className="flex flex-wrap items-center justify-between mb-2">
                  <span className="font-medium">Username:</span>
                  <div className="flex items-center">
                    <span className="text-sm mr-2">Madhukar Ashok (2813205541814272673)</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => copyToClipboard("https://venmo.com/code?user_id=2813205541814272673", "venmo")}
                    >
                      {copied === "venmo" ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Important: Include your child's name and "Cricket Fee" in the description.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}

// Manual payment form component
function ManualPaymentForm({
  players,
  onSuccess,
  defaultValues
}: {
  players: any[],
  onSuccess: () => void,
  defaultValues: Partial<ManualPaymentValues>
}) {
  const { toast } = useToast();
  const [selectedDuration, setSelectedDuration] = useState<string>(defaultValues.sessionDuration || '60min');
  
  const form = useForm<ManualPaymentValues>({
    resolver: zodResolver(manualPaymentSchema),
    defaultValues: {
      ...defaultValues,
      sessionDuration: defaultValues.sessionDuration || '60min',
      method: 'cash',
      transactionId: '',
      notes: ''
    }
  });
  
  // Update amount when session duration changes
  const handleDurationChange = (duration: string) => {
    setSelectedDuration(duration);
    form.setValue('sessionDuration', duration as '60min' | '90min');
    
    // Update amount based on duration
    const amount = duration === '90min' ? 120 : 100;
    form.setValue('amount', amount);
  };
  
  const manualPaymentMutation = useMutation({
    mutationFn: async (data: ManualPaymentValues) => {
      const response = await apiRequest('POST', '/api/record-manual-payment', data);
      
      // Create a clone of the response for potential error parsing
      let errorResponse;
      try {
        errorResponse = response.clone();
      } catch (err) {
        console.warn('Could not clone response', err);
      }
      
      if (!response.ok) {
        let errorMessage = 'Failed to record payment';
        try {
          if (errorResponse) {
            const errorData = await errorResponse.json();
            errorMessage = errorData.message || errorMessage;
          }
        } catch (jsonError) {
          console.warn('Error parsing error response', jsonError);
        }
        throw new Error(errorMessage);
      }
      
      try {
        return await response.json();
      } catch (jsonError) {
        console.error('Error parsing payment response', jsonError);
        throw new Error('Error processing payment data from server');
      }
    },
    onSuccess: (data) => {
      if (!data) {
        console.error('No data received from manual payment creation');
        return;
      }
      
      toast({
        title: 'Payment Recorded',
        description: `Your ${data.method} payment has been recorded and is pending approval.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/parent/payments'] });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: 'Payment Recording Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  function onSubmit(data: ManualPaymentValues) {
    manualPaymentMutation.mutate(data);
  }
  
  return (
    <div className="space-y-6">
      <ExternalPaymentInfo />
      
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Confirm Your Payment</CardTitle>
          <CardDescription>
            After sending payment through your chosen method, complete this form to notify us.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Session Duration Dropdown */}
              <FormField
                control={form.control}
                name="sessionDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Session Duration</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        handleDurationChange(value);
                        field.onChange(value);
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select session duration" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="60min">60 Minutes ($100)</SelectItem>
                        <SelectItem value="90min">90 Minutes ($120)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Fees are based on session duration
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Payment Method Radio Buttons */}
              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Payment Method Used</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col sm:flex-row gap-4"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="cash" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Cash
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="zelle" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Zelle
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="venmo" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Venmo
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Transaction ID field - only show for Zelle & Venmo */}
              {(form.watch('method') === 'zelle' || form.watch('method') === 'venmo') && (
                <FormField
                  control={form.control}
                  name="transactionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Transaction ID (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter the transaction ID" {...field} />
                      </FormControl>
                      <FormDescription>
                        If available, the transaction confirmation ID from your payment app
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {/* Notes field */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter any additional information about this payment"
                        className="resize-none min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="pt-2">
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isPendingLike(manualPaymentMutation)}
                >
                  {isPendingLike(manualPaymentMutation) ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Recording Payment...
                    </>
                  ) : (
                    'Record Payment'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

// Parent page component
export default function MakePaymentPage() {
  const params = useParams<{ playerId: string }>();
  // Initialize to 'cash' to avoid duplicate Stripe payment intent creation
  const [activeTab, setActiveTab] = useState<PaymentMethod>('cash');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<number | null>(null);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);
  const [players, setPlayers] = useState<any[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(params.playerId ? parseInt(params.playerId) : null);
  const [paymentDetails, setPaymentDetails] = useState({
    playerId: params.playerId ? parseInt(params.playerId) : 0,
    amount: 100, // Default amount for 60min sessions
    paymentType: 'monthly_fee', // Default payment type
    sessionDuration: '60min' as '60min' | '90min', // Default session duration
    description: 'Monthly cricket academy fee'
  });
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState('');
  const [, navigate] = useLocation();

  // Fetch all parent's players when coming from the "New Payment" button
  useEffect(() => {
    const fetchParentPlayers = async () => {
      setIsLoadingPlayers(true);
      setError(null);
      
      try {
        const response = await apiRequest('GET', '/api/parent/players');
        
        // Create a clone of the response for potential error parsing
        // This prevents "body stream already read" errors
        let errorResponse;
        try {
          errorResponse = response.clone();
        } catch (err) {
          // If cloning fails, we'll handle it gracefully
          console.warn('Could not clone response', err);
        }
        
        if (!response.ok) {
          // Handle non-200 responses with appropriate user-friendly messages
          if (response.status === 403) {
            throw new Error('You need to log in as a parent to access this page.');
          } else if (response.status === 404) {
            setPlayers([]);
            return; // Return early instead of throwing
          } else {
            // Try to parse error message from the cloned response
            let errorMessage = 'Failed to fetch players';
            try {
              if (errorResponse) {
                const errorData = await errorResponse.json();
                errorMessage = errorData.message || errorMessage;
              }
            } catch (jsonError) {
              console.warn('Error parsing error response', jsonError);
            }
            throw new Error(errorMessage);
          }
        }
        
        // Parse the response data safely
        let playersData;
        try {
          playersData = await response.json();
        } catch (jsonError) {
          console.error('Error parsing players data', jsonError);
          throw new Error('Error processing player data from server');
        }
        
        if (!Array.isArray(playersData)) {
          console.error('Expected array of players but got', typeof playersData);
          setPlayers([]);
          return;
        }
        
        setPlayers(playersData);
        
        // Select the first player by default if there are any
        if (playersData.length > 0) {
          const playerId = params.playerId ? parseInt(params.playerId) : playersData[0].id;
          setSelectedPlayerId(playerId);
          setPaymentDetails(prev => ({
            ...prev,
            playerId
          }));
          
          // Find the selected player and set their name
          const player = playersData.find((p: any) => p.id === playerId);
          if (player) {
            setPlayerName(`${player.firstName} ${player.lastName}`);
          }
        } else {
          // No players found - this is not an error, just an empty state
          // We'll handle this in the UI rather than an automatic redirect
          setPlayers([]);
        }
      } catch (error: any) {
        console.error('Error fetching parent players:', error);
        setError(error.message || 'Failed to load your players. Please try again.');
        toast({
          title: 'Error Loading Players',
          description: error.message || 'Could not load your players. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoadingPlayers(false);
      }
    };
    
    fetchParentPlayers();
  }, []);

  const createPaymentIntent = useMutation({
    mutationFn: async (data: typeof paymentDetails) => {
      console.log('Creating payment intent with data:', data);
      const response = await apiRequest('POST', '/api/create-payment-intent', data);
      
      // Create a clone of the response for potential error parsing
      let errorResponse;
      try {
        errorResponse = response.clone();
      } catch (err) {
        console.warn('Could not clone response', err);
      }
      
      if (!response.ok) {
        let errorMessage = 'Failed to create payment intent';
        try {
          if (errorResponse) {
            const errorData = await errorResponse.json();
            errorMessage = errorData.message || errorMessage;
          }
        } catch (jsonError) {
          console.warn('Error parsing error response', jsonError);
        }
        throw new Error(errorMessage);
      }
      
      try {
        return await response.json();
      } catch (jsonError) {
        console.error('Error parsing payment intent response', jsonError);
        throw new Error('Error processing payment data from server');
      }
    },
    onSuccess: (data) => {
      if (!data) {
        console.error('No data received from payment intent creation');
        return;
      }
      
      setClientSecret(data.clientSecret);
      setPaymentId(data.paymentId);
    },
    onError: (error: Error) => {
      setError(error.message);
      toast({
        title: 'Payment Setup Failed',
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
  
  // Handle session duration change
  const handleSessionDurationChange = (duration: string) => {
    const amount = duration === '90min' ? 120 : 100;
    setPaymentDetails(prev => ({
      ...prev,
      sessionDuration: duration as '60min' | '90min',
      amount
    }));
  };

  // Create payment intent when selected player, payment method, or session duration changes
  useEffect(() => {
    if (selectedPlayerId && paymentDetails.playerId > 0 && activeTab === 'stripe') {
      createPaymentIntent.mutate(paymentDetails);
    }
  }, [selectedPlayerId, paymentDetails.playerId, paymentDetails.sessionDuration, paymentDetails.amount, activeTab]);

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value as PaymentMethod);
  };

  // Handle manual payment success
  const handleManualPaymentSuccess = () => {
    setPaymentSuccess(true);
    setTimeout(() => {
      navigate('/parent/dashboard');
    }, 2000);
  };

  // Reset Stripe attempt
  const handleCancelStripe = () => {
    setActiveTab('cash');
  };

  if (paymentSuccess) {
    return (
      <ParentLayout title="Payment Recorded">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <Card className="bg-white shadow-md">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                <h2 className="text-2xl font-bold">Payment Recorded!</h2>
                <p className="mt-2 text-gray-600">Your payment has been recorded and is awaiting approval.</p>
                <p className="mt-1 text-gray-500">You will be redirected to dashboard automatically...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </ParentLayout>
    );
  }

  return (
    <ParentLayout title="Make Payment">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle>Make a Payment</CardTitle>
            <CardDescription>
              {playerName ? `Payment for ${playerName}` : 'Select a player to make a payment'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingPlayers ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading your players...</span>
              </div>
            ) : error ? (
              <div className="py-8 px-4">
                <Alert variant="destructive" className="mb-6">
                  <AlertTriangle className="h-5 w-5" />
                  <AlertTitle>Error Loading Players</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
                <div className="text-center mt-6">
                  <p className="text-gray-600 mb-6">Please try again or connect with a player first.</p>
                  <Button
                    onClick={() => navigate('/parent/connect-child')}
                    className="mr-2"
                  >
                    Connect with a Player
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.location.reload()}
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            ) : players.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <div className="rounded-full bg-amber-100 p-3 w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                </div>
                <h3 className="text-lg font-medium mb-2">No Players Connected</h3>
                <p className="text-gray-600 mb-6">
                  You need to connect with a player before you can make a payment.
                </p>
                <Button
                  onClick={() => navigate('/parent/connect-child')}
                  className="mx-auto"
                >
                  Connect with a Player
                </Button>
              </div>
            ) : players.length > 0 ? (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label className="block text-sm font-medium mb-1">Select Player</Label>
                    <Select 
                      value={selectedPlayerId?.toString() || ''}
                      onValueChange={(value) => handlePlayerChange(Number(value))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a player" />
                      </SelectTrigger>
                      <SelectContent>
                        {players.map(player => (
                          <SelectItem key={player.id} value={player.id.toString()}>
                            {player.firstName} {player.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="block text-sm font-medium mb-1">Payment Type</Label>
                    <Select 
                      value={paymentDetails.paymentType}
                      onValueChange={handlePaymentTypeChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select payment type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly_fee">Monthly Fees</SelectItem>
                        <SelectItem value="equipment_fee">Equipment Fees</SelectItem>
                        <SelectItem value="tournament_fee">Tournament Fees</SelectItem>
                        <SelectItem value="special_training">Special Training</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="block text-sm font-medium mb-1">Session Duration</Label>
                    <Select 
                      value={paymentDetails.sessionDuration}
                      onValueChange={handleSessionDurationChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select session duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="60min">60 Minutes ($100)</SelectItem>
                        <SelectItem value="90min">90 Minutes ($120)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-500 mt-1">
                      Fee amount is calculated based on session duration
                    </p>
                  </div>
                  
                  <div>
                    <Label className="block text-sm font-medium mb-1">Amount (USD)</Label>
                    <Input 
                      type="number"
                      min="1"
                      step="0.01"
                      value={paymentDetails.amount}
                      onChange={(e) => handleAmountChange(Number(e.target.value))}
                      readOnly
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      The amount is automatically set based on session duration
                    </p>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Tabs 
                    defaultValue="cash" 
                    value={activeTab} 
                    onValueChange={handleTabChange}
                    className="w-full"
                  >
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="stripe" className="flex items-center justify-center">
                        <CreditCard className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Credit Card</span>
                      </TabsTrigger>
                      <TabsTrigger value="cash" className="flex items-center justify-center">
                        <DollarSign className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Cash</span>
                      </TabsTrigger>
                      <TabsTrigger value="zelle" className="flex items-center justify-center">
                        <Send className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Zelle</span>
                      </TabsTrigger>
                      <TabsTrigger value="venmo" className="flex items-center justify-center">
                        <Send className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Venmo</span>
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="stripe" className="pt-4">
                      {isPendingLike(createPaymentIntent) ? (
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
                          <CheckoutForm 
                            paymentId={paymentId || 0} 
                            amount={paymentDetails.amount} 
                            onCancel={handleCancelStripe}
                          />
                        </Elements>
                      ) : clientSecret && !stripePromise ? (
                        <Alert variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>Stripe Configuration Error</AlertTitle>
                          <AlertDescription>
                            There appears to be an issue with your Stripe API key configuration.
                            The public key might be missing or incorrect.
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <div className="py-8 text-center text-gray-500">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                          <p>Initializing payment system...</p>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="cash" className="pt-4">
                      <ManualPaymentForm 
                        players={players}
                        onSuccess={handleManualPaymentSuccess}
                        defaultValues={{
                          playerId: selectedPlayerId || 0,
                          amount: 100, // Default to 60min fee
                          paymentType: paymentDetails.paymentType,
                          sessionDuration: '60min',
                          method: 'cash'
                        }}
                      />
                    </TabsContent>
                    
                    <TabsContent value="zelle" className="pt-4">
                      <ManualPaymentForm 
                        players={players}
                        onSuccess={handleManualPaymentSuccess}
                        defaultValues={{
                          playerId: selectedPlayerId || 0,
                          amount: 100, // Default to 60min fee
                          paymentType: paymentDetails.paymentType,
                          sessionDuration: '60min',
                          method: 'zelle'
                        }}
                      />
                    </TabsContent>
                    
                    <TabsContent value="venmo" className="pt-4">
                      <ManualPaymentForm 
                        players={players}
                        onSuccess={handleManualPaymentSuccess}
                        defaultValues={{
                          playerId: selectedPlayerId || 0,
                          amount: 100, // Default to 60min fee
                          paymentType: paymentDetails.paymentType,
                          sessionDuration: '60min',
                          method: 'venmo'
                        }}
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            ) : (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>No Players Found</AlertTitle>
                <AlertDescription>
                  You need to connect with at least one player before making a payment.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="bg-gray-50 border-t px-6 py-4">
            <p className="text-sm text-gray-500">
              All payments are securely processed. For credit card payments, your card details are never stored on our servers.
            </p>
          </CardFooter>
        </Card>
      </div>
    </ParentLayout>
  );
}