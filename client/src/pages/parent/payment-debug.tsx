import { useState } from 'react';
import { ParentLayout } from '@/layout/parent-layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function PaymentDebugPage() {
  const [debugInfo, setDebugInfo] = useState<{
    secret_key_prefix?: string;
    public_key_prefix?: string;
    error?: string;
  }>({});

  const checkKeys = async () => {
    try {
      const response = await fetch('/api/debug-stripe-keys');
      const data = await response.json();
      setDebugInfo(data);
    } catch (error) {
      setDebugInfo({ error: String(error) });
    }
  };

  return (
    <ParentLayout title="Payment Diagnostics">
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Stripe Payment Debug</CardTitle>
          <CardDescription>This page helps diagnose Stripe payment issues</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={checkKeys}>Check Stripe Keys</Button>
          
          {debugInfo.error && (
            <div className="mt-4 p-4 bg-red-50 text-red-800 rounded">
              <h3 className="font-bold">Error</h3>
              <p>{debugInfo.error}</p>
            </div>
          )}
          
          {debugInfo.secret_key_prefix && (
            <div className="mt-4 p-4 bg-amber-50 text-amber-800 rounded">
              <h3 className="font-bold">Secret Key Information</h3>
              <p>Secret Key Prefix: {debugInfo.secret_key_prefix}</p>
              {debugInfo.secret_key_prefix !== 'sk_' && (
                <p className="text-red-600 font-semibold mt-2">
                  Warning: The secret key does not start with 'sk_'. This is likely the cause of the payment issues.
                </p>
              )}
            </div>
          )}
          
          {debugInfo.public_key_prefix && (
            <div className="mt-4 p-4 bg-blue-50 text-blue-800 rounded">
              <h3 className="font-bold">Public Key Information</h3>
              <p>Public Key Prefix: {debugInfo.public_key_prefix}</p>
              {debugInfo.public_key_prefix !== 'pk_' && (
                <p className="text-red-600 font-semibold mt-2">
                  Warning: The public key does not start with 'pk_'.
                </p>
              )}
            </div>
          )}
          
          <div className="mt-8 border-t pt-4">
            <h3 className="font-semibold text-lg mb-2">How to Fix Issues</h3>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Make sure your <strong>STRIPE_SECRET_KEY</strong> starts with <code>sk_</code></li>
              <li>Make sure your <strong>VITE_STRIPE_PUBLIC_KEY</strong> starts with <code>pk_</code></li>
              <li>Secret keys should be kept private and used only on the server side</li>
              <li>Public keys can be safely used in client-side code</li>
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