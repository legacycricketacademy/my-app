/**
 * Authentication Page
 * Simple login form using the unified auth client
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export default function AuthPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: formData.email.trim(), password: formData.password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({} as any));
        const errorMessage = data?.message || 'Login failed. Please check credentials.';
        setError(errorMessage);
        toast({
          title: 'Sign in failed',
          description: errorMessage,
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      const data = await res.json().catch(() => ({} as any));
      if (!data?.success) {
        const errorMessage = data?.message || 'Login failed. Please check credentials.';
        setError(errorMessage);
        toast({
          title: 'Sign in failed',
          description: errorMessage,
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      // ✅ Login succeeded — update query cache and navigate
      setIsLoading(false); // Clear loading state before navigation
      
      // CRITICAL: Set query data directly from login response to update auth state immediately
      // This prevents route guards from redirecting back to /auth
      if (data.user || data.data?.user) {
        const user = data.data?.user || data.user;
        queryClient.setQueryData(['/api/user'], {
          success: true,
          data: { user },
          message: data.message || 'Login successful'
        });
      }
      
      // Also invalidate to trigger refetch (in case we missed any edge cases)
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      
      // Small delay to ensure query state update propagates before navigation
      // This gives React Query time to update and route guards to see the new auth state
      setTimeout(() => {
        try {
          navigate('/dashboard', { replace: true });
        } catch {
          window.location.href = '/dashboard';
        }
      }, 150);

      // 🔁 Fire-and-forget session check, but don't block UI if it 401s
      fetch('/api/session/me', { credentials: 'include' })
        .then(async (r) => {
          if (!r.ok) {
            const t = await r.text();
            console.warn('session/me failed after login (ignored):', r.status, t);
          } else {
            // If session check succeeds, invalidate again to ensure state is fresh
            queryClient.invalidateQueries({ queryKey: ['/api/user'] });
          }
        })
        .catch((err) => console.warn('session/me error (ignored):', err));
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err?.message || 'Network error. Please try again later.';
      setError(errorMessage);
      toast({
        title: 'Sign in failed',
        description: errorMessage,
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-4 px-4 sm:py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-4 sm:space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Legacy Cricket Academy</h1>
          <p className="mt-2 text-sm text-gray-600">Sign in to your account</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                />
              </div>
              
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                />
              </div>
              
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
            
            <div className="mt-6 p-4 bg-gray-50 rounded-md">
              <h3 className="text-sm font-medium text-gray-900 mb-2">Development Accounts</h3>
              <div className="text-xs text-gray-600 space-y-1">
                <div><strong>Parent:</strong> parent@test.com / password</div>
                <div><strong>Admin:</strong> admin@test.com / password</div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={async () => {
                    try {
                      const response = await fetch(`/api/dev/send-test-email?to=${encodeURIComponent(formData.email || 'madhukar.kcc@gmail.com')}`, { 
                        credentials: 'include' 
                      });
                      const data = await response.json();
                      alert(data.ok ? `Email sent to ${data.to}` : `Failed: ${data.error}`);
                    } catch (error) {
                      alert(`Error: ${error}`);
                    }
                  }}
                >
                  Send Test Email
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}