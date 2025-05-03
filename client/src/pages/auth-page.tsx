import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CricketIcon } from "@/components/ui/cricket-icon";
import { Users, Heart, Bell, DollarSign, LinkIcon, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["parent", "coach", "admin"]),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

// Interface for the decoded invitation token
interface InvitationToken {
  email: string;
  playerId: number;
  expires: number;
}

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [invitationToken, setInvitationToken] = useState<InvitationToken | null>(null);
  const [invitationExpired, setInvitationExpired] = useState<boolean>(false);
  const { user, loginMutation, registerMutation } = useAuth();
  const [location, navigate] = useLocation();
  
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      email: "",
      role: "parent",
    },
  });
  
  // Parse URL for invitation token
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const inviteParam = params.get('invite');
    
    if (inviteParam) {
      try {
        // Decode the token
        const decodedToken = JSON.parse(atob(inviteParam)) as InvitationToken;
        
        // Check if token is expired
        if (decodedToken.expires < Date.now()) {
          setInvitationExpired(true);
        } else {
          setInvitationToken(decodedToken);
          
          // Auto-select the register tab and populate email
          setActiveTab("register");
          registerForm.setValue("email", decodedToken.email);
          registerForm.setValue("role", "parent");
        }
      } catch (error) {
        console.error("Invalid invitation token:", error);
      }
    }
  }, [location, registerForm]);
  
  // Use useEffect for navigation to avoid setState during render
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);
  
  // Early return if user is already logged in
  if (user) {
    return null;
  }
  
  function onLoginSubmit(data: LoginFormValues) {
    loginMutation.mutate(data);
  }
  
  function onRegisterSubmit(data: RegisterFormValues) {
    registerMutation.mutate(data);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left side: Auth forms */}
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="space-y-2 text-center">
            <div className="flex justify-center">
              <CricketIcon className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Legacy Cricket Academy</CardTitle>
            <CardDescription>
              Cricket Academy Management System
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {invitationToken && (
              <Alert className="mb-4 border-primary/20 bg-primary/5">
                <LinkIcon className="h-4 w-4 text-primary" />
                <AlertTitle className="text-primary">Invitation Link Detected</AlertTitle>
                <AlertDescription>
                  You've been invited to register as a parent. Complete the registration form below.
                </AlertDescription>
              </Alert>
            )}
            
            {invitationExpired && (
              <Alert className="mb-4 border-destructive/20 bg-destructive/5">
                <CheckCircle className="h-4 w-4 text-destructive" />
                <AlertTitle className="text-destructive">Invitation Link Expired</AlertTitle>
                <AlertDescription>
                  This invitation link has expired. Please contact the academy for a new invitation.
                </AlertDescription>
              </Alert>
            )}
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
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
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? "Logging in..." : "Login"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              
              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
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
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Enter your email" {...field} />
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
                    {/* Only show role selection if not from an invitation */}
                    {!invitationToken && (
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
                                <option value="coach">Coach</option>
                                <option value="admin">Admin</option>
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    <Button 
                      type="submit" 
                      className="w-full mt-4" 
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? "Registering..." : "Register"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
          
          <CardFooter className="text-center text-sm text-gray-500">
            <p className="w-full">
              {activeTab === "login" ? (
                "Don't have an account? Click Register above."
              ) : (
                "Already have an account? Click Login above."
              )}
            </p>
          </CardFooter>
        </Card>
        
        {/* Right side: Hero section */}
        <div className="hidden md:block p-6 bg-gradient-to-br from-primary to-primary/80 text-white rounded-lg">
          <div className="space-y-6">
            <h1 className="text-3xl font-bold heading">Welcome to Legacy Cricket Academy</h1>
            <p className="text-lg">
              The comprehensive cricket academy management system designed for coaches, parents, and administrators.
            </p>
            
            <div className="space-y-4 mt-8">
              <div className="flex items-start">
                <div className="bg-white/20 p-2 rounded-full mr-3">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Team Management</h3>
                  <p className="text-white/90">Register players, track attendance, and manage teams with ease.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-white/20 p-2 rounded-full mr-3">
                  <Heart className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Fitness Tracking</h3>
                  <p className="text-white/90">Monitor fitness progress with detailed metrics and reports.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-white/20 p-2 rounded-full mr-3">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Parent Communication</h3>
                  <p className="text-white/90">Send announcements, share meal plans, and keep parents updated.</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-white/20 p-2 rounded-full mr-3">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Payment Tracking</h3>
                  <p className="text-white/90">Manage fees, track payments, and send reminders for pending dues.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
