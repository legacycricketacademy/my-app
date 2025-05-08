import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, HelpCircle, KeyRound } from 'lucide-react';

type DiagnosisResult = {
  diagnosis?: {
    secret_key_type: string;
    public_key_type: string;
    keys_look_swapped: boolean;
  };
  message?: string;
  error?: string;
};

type ClientKeyInfo = {
  type: string;
  prefix: string;
  looks_correct: boolean;
} | null;

export default function StripeDebugPage() {
  const [debugInfo, setDebugInfo] = useState<DiagnosisResult>({});
  const [isLoading, setIsLoading] = useState(false);
  const [clientKey, setClientKey] = useState<ClientKeyInfo>(null);

  useEffect(() => {
    // Get the public key directly from environment
    const publicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || '';
    
    // Skip if empty
    if (!publicKey) return;
    
    // Check if it starts with the right prefix
    const keyType = publicKey.startsWith('pk_') 
      ? 'publishable' 
      : publicKey.startsWith('sk_') 
        ? 'secret' 
        : 'unknown';
    
    const keyInfo: ClientKeyInfo = {
      type: keyType,
      prefix: publicKey.substring(0, Math.min(4, publicKey.length)) + '...',
      looks_correct: keyType === 'publishable'
    };
    
    setClientKey(keyInfo);
  }, []);

  const checkKeys = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/simple-key-check');
      
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
    <div className="container mx-auto p-4 pt-12 max-w-4xl">
      <div className="mb-8 flex items-center gap-4">
        <img 
          src="/cricket-logo.png" 
          alt="Legacy Cricket Academy" 
          className="h-12 w-12" 
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
        <h1 className="text-3xl font-bold">Legacy Cricket Academy</h1>
      </div>
      
      <Card className="w-full mx-auto mb-8">
        <CardHeader className="bg-gray-50">
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" /> 
            Stripe API Keys Diagnostic
          </CardTitle>
          <CardDescription>This tool helps diagnose issues with Stripe payment configuration</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {clientKey && (
            <div className={`p-4 mb-6 rounded flex gap-3 ${
              clientKey.looks_correct ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {clientKey.looks_correct ? (
                <CheckCircle className="h-5 w-5 flex-shrink-0 mt-1" />
              ) : (
                <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-1" />
              )}
              <div>
                <h3 className="font-bold">Client Side Check: VITE_STRIPE_PUBLIC_KEY</h3>
                <p>Type: {clientKey.type}</p>
                <p>Prefix: {clientKey.prefix}</p>
                {!clientKey.looks_correct && (
                  <p className="text-red-600 font-semibold mt-2">
                    Warning: The public key does not look like a valid Stripe publishable key (should start with 'pk_').
                    {clientKey.type === 'secret' && " This appears to be a secret key, which should never be used on the client side!"}
                  </p>
                )}
              </div>
            </div>
          )}
          
          <Button 
            onClick={checkKeys} 
            disabled={isLoading}
          >
            {isLoading ? 'Checking...' : 'Check Server-Side Keys'}
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
          
          {debugInfo.diagnosis && (
            <div className="mt-4 space-y-4">
              <div className={`p-4 rounded flex gap-3 ${
                debugInfo.diagnosis.secret_key_type === 'secret' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                {debugInfo.diagnosis.secret_key_type === 'secret' ? (
                  <CheckCircle className="h-5 w-5 flex-shrink-0 mt-1" />
                ) : (
                  <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-1" />
                )}
                <div>
                  <h3 className="font-bold">Secret Key (STRIPE_SECRET_KEY)</h3>
                  <p>Type: {debugInfo.diagnosis.secret_key_type}</p>
                  {debugInfo.diagnosis.secret_key_type !== 'secret' && (
                    <p className="text-red-600 font-semibold mt-2">
                      Warning: The server-side secret key is not a valid Stripe secret key (should start with 'sk_').
                    </p>
                  )}
                </div>
              </div>
              
              <div className={`p-4 rounded flex gap-3 ${
                debugInfo.diagnosis.public_key_type === 'publishable' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                {debugInfo.diagnosis.public_key_type === 'publishable' ? (
                  <CheckCircle className="h-5 w-5 flex-shrink-0 mt-1" />
                ) : (
                  <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-1" />
                )}
                <div>
                  <h3 className="font-bold">Public Key (VITE_STRIPE_PUBLIC_KEY)</h3>
                  <p>Type: {debugInfo.diagnosis.public_key_type}</p>
                  {debugInfo.diagnosis.public_key_type !== 'publishable' && (
                    <p className="text-red-600 font-semibold mt-2">
                      Warning: The server environment's public key is not a valid Stripe publishable key (should start with 'pk_').
                    </p>
                  )}
                </div>
              </div>
              
              {debugInfo.diagnosis.keys_look_swapped && (
                <div className="p-4 bg-yellow-50 text-yellow-800 rounded flex gap-3">
                  <HelpCircle className="h-5 w-5 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold">Keys are Swapped!</h3>
                    <p>It appears that your Stripe keys are swapped. The secret key should be used on the server (STRIPE_SECRET_KEY), and the publishable key should be used in the client (VITE_STRIPE_PUBLIC_KEY).</p>
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
    </div>
  );
}