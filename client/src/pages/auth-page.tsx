/**
 * Authentication Page
 * Supports multiple authentication providers: Keycloak, Firebase, and Mock
 */

import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { signIn, getAuthProvider, getCurrentUser, onAuthStateChange } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, User } from 'lucide-react';

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const authProvider = getAuthProvider();

  // Redirect if already authenticated
  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      if (user) {
        setLocation('/');
      }
    });

    // Check if already authenticated
    const currentUser = getCurrentUser();
    if (currentUser) {
      setLocation('/');
    }

    return unsubscribe;
  }, [setLocation]);

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

  const handleKeycloakSignIn = async () => {
    setIsLoading(true);
    try {
      await signIn();
      // Keycloak will redirect, so this won't be reached
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message || "Failed to initiate Keycloak sign in.",
        variant: "destructive",
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Legacy Cricket Academy</h1>
          <p className="mt-2 text-sm text-gray-600">Sign in to your account</p>
          <p className="mt-1 text-xs text-gray-500">
            Using {authProvider === 'keycloak' ? 'Keycloak' : authProvider === 'firebase' ? 'Firebase' : 'Mock'} authentication
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {authProvider === 'keycloak' ? (
                <Shield className="h-5 w-5" />
              ) : (
                <User className="h-5 w-5" />
              )}
              Sign In
            </CardTitle>
            <CardDescription>
              {authProvider === 'keycloak' 
                ? 'Sign in with your Keycloak account'
                : 'Enter your credentials to access your account'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {authProvider === 'keycloak' ? (
              <div className="space-y-4">
                <Button 
                  onClick={handleKeycloakSignIn}
                  className="w-full" 
                  disabled={isLoading}
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Redirecting to Keycloak...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Sign in with Keycloak
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  You will be redirected to your Keycloak login page
                </p>
              </div>
            ) : (
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
            )}
            
            {authProvider === 'mock' && (
              <div className="mt-6 p-4 bg-gray-50 rounded-md">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Development Accounts</h3>
                <div className="text-xs text-gray-600 space-y-1">
                  <div><strong>Parent:</strong> parent@test.com / Test1234!</div>
                  <div><strong>Admin:</strong> admin@test.com / Test1234!</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}