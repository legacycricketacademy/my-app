import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/auth/session";
import { useToast } from "@/hooks/use-toast";
import { isPendingLike } from "@/shared/pending";

export default function AuthPageDev() {
  const navigate = useNavigate();
  const { loginMutation } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await loginMutation.mutateAsync(formData);
      // Navigation will be handled by the auth system
      navigate('/dashboard');
    } catch (error) {
      // Error handling is done in the mutation
      console.error('Login error:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleDevAccountClick = (email: string, password: string) => {
    setFormData({ email, password });
  };

  // Check if we're in development (localhost or dev environment variable)
  const isDev = window.location.hostname === 'localhost' || 
                window.location.hostname === '127.0.0.1' ||
                import.meta.env.DEV;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Legacy Cricket Academy</CardTitle>
          <CardDescription>{isDev ? 'Development Login' : 'Sign In'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="Enter your email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                placeholder="Enter your password"
              />
            </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isPendingLike(loginMutation)}
                >
                  {isPendingLike(loginMutation) ? "Signing in..." : "Sign In"}
                </Button>
          </form>
          
          {/* Only show dev accounts in development */}
          {isDev && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Development Accounts</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-blue-700">parent@test.com</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDevAccountClick('parent@test.com', 'password')}
                  >
                    Use
                  </Button>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-700">admin@test.com</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDevAccountClick('admin@test.com', 'password')}
                  >
                    Use
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
