import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { isPendingLike } from "@/shared/pending";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  fullName: z.string().min(1, "Full name is required"),
  phone: z.string().min(1, "Phone number is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["parent", "coach"]).default("parent"),
});

export default function AuthPageSimplified() {
  console.log("Rendering AuthPageSimplified");
  const [, navigate] = useLocation();
  const { user, isLoading, loginMutation, registerMutation } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("login");
  
  // Debug logging
  console.log("Auth Page - User:", user);
  console.log("Auth Page - IsLoading:", isLoading);
  
  // Redirect to home if already logged in
  useEffect(() => {
    // Only redirect if we have a definite user object
    // and all loading states are complete
    if (user && !isLoading && !isPendingLike(loginMutation) && !isPendingLike(registerMutation)) {
      console.log("Auth Page - Redirecting to homepage with user:", user);
      navigate("/");
    }
  }, [user, isLoading, isPendingLike(loginMutation), isPendingLike(registerMutation), navigate]);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      fullName: "",
      phone: "",
      username: "",
      password: "",
      role: "parent",
    },
  });

  const onLoginSubmit = (values: z.infer<typeof loginSchema>) => {
    console.log("Attempting to login with:", { ...values, password: "***hidden***" });
    loginMutation.mutate(values, {
      onSuccess: (data) => {
        console.log("Login successful:", data);
        toast({
          title: "Login successful!",
          description: "You are now logged in.",
          variant: "default",
        });
        // After a successful login, redirect to home
        setTimeout(() => navigate("/"), 1500);
      },
      onError: (error) => {
        console.error("Login failed:", error);
        toast({
          title: "Login failed",
          description: error.message || "Invalid username or password. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  const onRegisterSubmit = (values: z.infer<typeof registerSchema>) => {
    console.log("Attempting to register with:", { ...values, password: "***hidden***" });
    registerMutation.mutate(values, {
      onSuccess: (data) => {
        console.log("Registration successful:", data);
        toast({
          title: "Registration successful!",
          description: "Your account has been created. You are now logged in.",
          variant: "default",
        });
        // After a successful registration and login, redirect to home
        setTimeout(() => navigate("/"), 1500);
      },
      onError: (error) => {
        console.error("Registration failed:", error);
        toast({
          title: "Registration failed",
          description: error.message || "There was a problem creating your account. Please try again.",
          variant: "destructive",
        });
      }
    });
  };

  // Enhanced loading state with better user feedback
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <h3 className="text-xl font-medium">Loading authentication state...</h3>
          <p className="text-muted-foreground mt-2">Please wait while we verify your session.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-100">
      {/* Left side - Auth forms */}
      <div className="w-full md:w-1/2 p-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">
              Legacy Cricket Academy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    {loginMutation.error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>
                          {loginMutation.error.message || "Failed to login. Please try again."}
                        </AlertDescription>
                      </Alert>
                    )}
                    <FormField
                      control={loginForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter your password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full mt-4" 
                      disabled={isPendingLike(loginMutation)}
                    >
                      {isPendingLike(loginMutation) ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Logging in...
                        </span>
                      ) : "Login"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    {registerMutation.error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>
                          {registerMutation.error.message || "Failed to register. Please try again."}
                          
                          {/* Special case for Firebase users */}
                          {registerMutation.error.message?.includes("Google") && (
                            <div className="mt-2 pt-2 border-t border-red-200">
                              <p className="font-medium mb-2">This email is already registered with Google.</p>
                              <div className="space-y-2">
                                <Button 
                                  variant="outline" 
                                  className="w-full flex items-center gap-2 mt-1 bg-white border-gray-300 hover:bg-gray-50"
                                  onClick={() => {
                                    // Redirect to main auth page or trigger Google sign-in
                                    navigate("/auth");
                                  }}
                                >
                                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                                    <path
                                      fill="#4285F4"
                                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                      fill="#34A853"
                                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                      fill="#FBBC05"
                                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    />
                                    <path
                                      fill="#EA4335"
                                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                  </svg>
                                  Sign in with Google
                                </Button>
                                
                                <p className="text-xs text-center">or</p>
                                
                                <Button 
                                  variant="outline" 
                                  className="w-full text-sm"
                                  onClick={() => {
                                    // Redirect to fix Firebase user page
                                    navigate("/fix-firebase-user");
                                  }}
                                >
                                  Add password to my Google account
                                </Button>
                              </div>
                            </div>
                          )}
                        </AlertDescription>
                      </Alert>
                    )}
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your phone number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input placeholder="Choose a username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Choose a password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <FormControl>
                            <select 
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                              {...field}
                            >
                              <option value="parent">Parent</option>
                              <option value="coach">Coach (Requires Approval)</option>
                            </select>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full mt-4" 
                      disabled={isPendingLike(registerMutation)}
                    >
                      {isPendingLike(registerMutation) ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Registering...
                        </span>
                      ) : "Register"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      {/* Right side - Hero/description section */}
      <div className="w-full md:w-1/2 bg-gradient-to-br from-blue-600 to-blue-900 p-8 flex items-center justify-center text-white">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold mb-6">Welcome to Legacy Cricket Academy</h1>
          <p className="text-lg mb-8">
            Join our premium cricket training platform for comprehensive player development, coaching, and administrative management.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-white/10 rounded-lg">
              <h2 className="text-xl font-semibold mb-2">Player Development</h2>
              <p>Track progress, fitness records, and personalized training plans.</p>
            </div>
            <div className="p-4 bg-white/10 rounded-lg">
              <h2 className="text-xl font-semibold mb-2">Session Management</h2>
              <p>Schedule training sessions, track attendance, and manage bookings.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}