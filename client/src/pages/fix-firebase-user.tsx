import React, { useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const firebaseUserSchema = z.object({
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function FixFirebaseUser() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const form = useForm<z.infer<typeof firebaseUserSchema>>({
    resolver: zodResolver(firebaseUserSchema),
    defaultValues: {
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof firebaseUserSchema>) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      console.log("Submitting firebase fix request:", { 
        email: values.email, 
        username: values.username, 
        password: "***hidden***" 
      });
      
      const response = await apiRequest(
        "POST", 
        "/api/fix-firebase-user", 
        {
          email: values.email,
          username: values.username,
          password: values.password,
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to update user account");
      }
      
      console.log("Fix Firebase user response:", data);
      
      setSuccess("Your account has been updated successfully! You can now log in with your username and password.");
      toast({
        title: "Account updated!",
        description: "You can now log in with your username and password.",
        variant: "default",
      });
      
      // Clear the form
      form.reset();
      
      // After a delay, redirect to the login page
      setTimeout(() => navigate("/auth-simplified"), 3000);
      
    } catch (err: any) {
      console.error("Error updating Firebase user:", err);
      const errorMessage = err?.message || "Failed to update user account. Please try again.";
      setError(errorMessage);
      toast({
        title: "Update failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-100">
      {/* Left side - Form */}
      <div className="w-full md:w-1/2 p-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Add Password to Google Account</CardTitle>
            <CardDescription>
              If you signed up with Google but want to be able to log in directly with a username and password, 
              fill out this form to add password authentication to your account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                {success && (
                  <Alert variant="default" className="bg-green-50 border-green-200 text-green-800">
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Google Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your Google email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Choose a Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Select a username for direct login" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Create a password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Confirm your password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full mt-4" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </span>
                  ) : "Add Password to Account"}
                </Button>
                
                <div className="text-center mt-4">
                  <Button 
                    variant="link" 
                    className="text-sm" 
                    onClick={() => navigate("/auth-simplified")}
                  >
                    Back to Login
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
      
      {/* Right side - Information section */}
      <div className="w-full md:w-1/2 bg-gradient-to-br from-blue-600 to-blue-900 p-8 flex items-center justify-center text-white">
        <div className="max-w-xl">
          <h1 className="text-3xl font-bold mb-6">Why Add a Password?</h1>
          <div className="space-y-6">
            <div className="bg-white/10 p-5 rounded-lg">
              <h2 className="text-xl font-semibold mb-2">Flexibility</h2>
              <p>
                Adding a password gives you the flexibility to log in directly without 
                needing Google authentication each time.
              </p>
            </div>
            
            <div className="bg-white/10 p-5 rounded-lg">
              <h2 className="text-xl font-semibold mb-2">Alternative Access</h2>
              <p>
                If you ever can't access your Google account or prefer not to use it, 
                having a password provides a backup way to sign in.
              </p>
            </div>
            
            <div className="bg-white/10 p-5 rounded-lg">
              <h2 className="text-xl font-semibold mb-2">Same Account, More Options</h2>
              <p>
                This doesn't create a new account - it simply adds direct login to your 
                existing Google-linked account. All your data stays connected!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}