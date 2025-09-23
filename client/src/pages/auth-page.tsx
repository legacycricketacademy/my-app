import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { signIn, isAuthInitialized, getCurrentUser, onAuthStateChange, getAuthProvider } from '@/lib/auth';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [authProvider] = useState(getAuthProvider());

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthInitialized() && getCurrentUser()) {
      window.location.href = '/';
      return;
    }

    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChange((user) => {
      if (user) {
        window.location.href = '/';
      }
    });

    return unsubscribe;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn({ email, password });
      if (result.ok) {
        console.log('Login successful');
        // Redirect will happen via auth state change listener
      } else {
        setError(result.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Legacy Cricket Academy
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
          </CardHeader>
          <CardContent>
            {authProvider === 'mock' ? (
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email address
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1"
                    placeholder="admin@test.com or parent@test.com"
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1"
                    placeholder="password123"
                  />
                </div>
                <div className="text-xs text-gray-500">
                  <p>Test credentials:</p>
                  <p>• Admin: admin@test.com / password123</p>
                  <p>• Parent: parent@test.com / password123</p>
                </div>
                {error && (
                  <div className="text-red-600 text-sm">{error}</div>
                )}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Signing in...' : 'Sign in'}
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <Button
                  className="w-full"
                  onClick={() => {
                    // For Keycloak, redirect to auth URL
                    window.location.href = '/auth/keycloak';
                  }}
                >
                  Sign in with Keycloak
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}