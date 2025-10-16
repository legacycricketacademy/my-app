/**
 * Authentication Page
 * Simple login form using the unified auth client
 */

import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { signIn } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signIn(formData);
      toast({
        title: "Welcome back!",
        description: "You have been successfully signed in.",
      });
      setLocation('/');
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
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
                <div><strong>Parent:</strong> parent / password</div>
                <div><strong>Admin:</strong> admin / password</div>
                <div><strong>Coach:</strong> coach / password</div>
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