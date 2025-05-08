import { useState } from 'react';
import { ParentLayout } from '@/layout/parent-layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, HelpCircle, KeyRound } from 'lucide-react';

type DiagnosisResult = {
  secret_key_type?: string;
  public_key_type?: string;
  secret_key_prefix?: string;
  public_key_prefix?: string;
  diagnoses?: {
    is_public_key_correct: boolean;
    is_secret_key_correct: boolean;
    are_keys_swapped: boolean;
  };
  message?: string;
  error?: string;
};

export default function PaymentDebugPage() {
  const [debugInfo, setDebugInfo] = useState<DiagnosisResult>({});
  const [isLoading, setIsLoading] = useState(false);

  const checkKeys = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/debug-stripe-keys');
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      
      const data = await response.json();
      setDebugInfo(data);
    } catch (error) {
      setDebugInfo({ error: String(error) });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ParentLayout title="Payment Diagnostics">
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" /> 
            Stripe API Keys Diagnostic
          </CardTitle>
          <CardDescription>This tool helps diagnose issues with Stripe payment configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={checkKeys} 
            disabled={isLoading} 
            className="mb-6"
          >
            {isLoading ? 'Checking...' : 'Check Stripe Keys'}
          </Button>
          
          {debugInfo.error && (
            <div className="mt-4 p-4 bg-red-50 text-red-800 rounded flex gap-3">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold">Error</h3>
                <p>{debugInfo.error}</p>
              </div>
            </div>
          )}
          
          {debugInfo.diagnoses && (
            <div className="space-y-4">
              <div className={`p-4 rounded flex gap-3 ${debugInfo.diagnoses.is_secret_key_correct ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                {debugInfo.diagnoses.is_secret_key_correct ? (
                  <CheckCircle className="h-5 w-5 flex-shrink-0 mt-1" />
                ) : (
                  <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-1" />
                )}
                <div>
                  <h3 className="font-bold">Secret Key (STRIPE_SECRET_KEY)</h3>
                  <p>Type: {debugInfo.secret_key_type}</p>
                  <p>Prefix: {debugInfo.secret_key_prefix}</p>
                  {!debugInfo.diagnoses.is_secret_key_correct && (
                    <p className="text-red-600 font-semibold mt-2">
                      Warning: The secret key is not a valid Stripe secret key (should start with 'sk_').
                    </p>
                  )}
                </div>
              </div>
              
              <div className={`p-4 rounded flex gap-3 ${debugInfo.diagnoses.is_public_key_correct ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                {debugInfo.diagnoses.is_public_key_correct ? (
                  <CheckCircle className="h-5 w-5 flex-shrink-0 mt-1" />
                ) : (
                  <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-1" />
                )}
                <div>
                  <h3 className="font-bold">Public Key (VITE_STRIPE_PUBLIC_KEY)</h3>
                  <p>Type: {debugInfo.public_key_type}</p>
                  <p>Prefix: {debugInfo.public_key_prefix}</p>
                  {!debugInfo.diagnoses.is_public_key_correct && (
                    <p className="text-red-600 font-semibold mt-2">
                      Warning: The public key is not a valid Stripe publishable key (should start with 'pk_').
                    </p>
                  )}
                </div>
              </div>
              
              {debugInfo.diagnoses.are_keys_swapped && (
                <div className="p-4 bg-yellow-50 text-yellow-800 rounded flex gap-3">
                  <HelpCircle className="h-5 w-5 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold">Keys are Swapped!</h3>
                    <p>It appears that your Stripe keys are swapped. The secret key should be used on the server, and the publishable key should be used in the client.</p>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="mt-8 border-t pt-4">
            <h3 className="font-semibold text-lg mb-2">How to Fix API Key Issues</h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Make sure your <strong>STRIPE_SECRET_KEY</strong> environment variable starts with <code>sk_</code></li>
              <li>Make sure your <strong>VITE_STRIPE_PUBLIC_KEY</strong> environment variable starts with <code>pk_</code></li>
              <li>If the keys are swapped, you'll need to update them both to the correct values</li>
              <li>Never use the secret key on the client side - it's a security risk</li>
              <li>The public key is safe to use in client-side code</li>
            </ol>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 border-t px-6 py-4">
          <p className="text-sm text-gray-500">
            Stripe payment processing requires proper API keys. If you're having issues, please contact your administrator.
          </p>
        </CardFooter>
      </Card>
    </ParentLayout>
  );
}