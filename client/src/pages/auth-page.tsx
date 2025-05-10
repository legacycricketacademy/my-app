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
import { Users, Heart, Bell, DollarSign, LinkIcon, CheckCircle, Key, User, Mail, LogIn } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useFirebaseAuth } from "@/lib/firebase";

const loginSchema = z.object({
  email: z.string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z.string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters long"),
});

const registerSchema = z.object({
  username: z.string()
    .min(1, "Username is required")
    .min(3, "Username must be at least 3 characters long")
    .regex(/^[a-zA-Z0-9._-]+$/, "Username can only contain letters, numbers, periods, underscores, and hyphens"),
  password: z.string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters long")
    .max(100, "Password is too long (maximum 100 characters)"),
  fullName: z.string()
    .min(1, "Full name is required")
    .min(2, "Please enter your complete name")
    .max(100, "Name is too long (maximum 100 characters)"),
  email: z.string()
    .min(1, "Email address is required")
    .email("Please enter a valid email address (example: name@example.com)"),
  phone: z.string()
    .optional()
    .refine(val => !val || val.length >= 10, "Phone number must be at least 10 digits")
    .refine(val => !val || /^[0-9+\-\s()]*$/.test(val), "Phone number can only contain digits, +, -, spaces, and parentheses"),
  role: z.enum(["parent", "coach", "admin"], {
    errorMap: () => ({ message: "Please select a valid role" }),
  }),
});

const forgotPasswordSchema = z.object({
  email: z.string()
    .min(1, "Email address is required")
    .email("Please enter a valid email address (example: name@example.com)"),
});

const forgotUsernameSchema = z.object({
  email: z.string()
    .min(1, "Email address is required")
    .email("Please enter a valid email address (example: name@example.com)"),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;
type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
type ForgotUsernameFormValues = z.infer<typeof forgotUsernameSchema>;

// Interface for the decoded invitation token
interface InvitationToken {
  email: string;
  playerId?: number;
  role?: string;
  academyId?: number;
  expires: number;
  isAdminInvitation?: boolean;
}

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [invitationToken, setInvitationToken] = useState<InvitationToken | null>(null);
  const [invitationExpired, setInvitationExpired] = useState<boolean>(false);
  const { user, loginMutation, registerMutation, firebaseRegisterMutation } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { 
    currentUser: firebaseUser, 
    loading: firebaseLoading, 
    login: firebaseLogin,
    signup: firebaseSignup,
    signInWithGoogle,
    resetPassword
  } = useFirebaseAuth();
  
  // State for forgot modals
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isForgotUsernameOpen, setIsForgotUsernameOpen] = useState(false);
  
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
      phone: "",
      role: "parent",
    },
  });
  
  const forgotPasswordForm = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });
  
  const forgotUsernameForm = useForm<ForgotUsernameFormValues>({
    resolver: zodResolver(forgotUsernameSchema),
    defaultValues: {
      email: "",
    },
  });
  
  // State for email verification success message
  const [emailVerified, setEmailVerified] = useState<boolean>(false);
  
  // Parse URL for invitation token and verification success
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    const verifiedParam = params.get('verified');
    
    // Check if the user has just verified their email
    if (verifiedParam === 'true') {
      setEmailVerified(true);
    }
    
    if (tokenParam) {
      try {
        // First try server-side verification
        fetch(`/api/invitations/verify?token=${tokenParam}`)
          .then(res => res.json())
          .then(data => {
            if (data.valid && data.email) {
              setInvitationToken({
                email: data.email,
                playerId: data.playerId,
                expires: Date.now() + 1000 * 60 * 60 * 24 * 7 // Not used but required by interface
              });
              
              // Auto-select the register tab and populate email
              setActiveTab("register");
              registerForm.setValue("email", data.email);
              registerForm.setValue("role", "parent");
            } else {
              setInvitationExpired(true);
            }
          })
          .catch(err => {
            console.error("Error verifying token:", err);
            setInvitationExpired(true);
          });
      } catch (error) {
        console.error("Invalid invitation token:", error);
        setInvitationExpired(true);
      }
    }
    
    // Also support client-side tokens (for backward compatibility)
    const inviteParam = params.get('invite');
    if (inviteParam && !tokenParam) {
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
    try {
      loginMutation.mutate(data, {
        onError: (error) => {
          console.error("Login error:", error);
          
          // Show a more user-friendly error message
          let errorMessage = "Login failed. Please check your credentials and try again.";
          
          if (error.message?.includes("auth/configuration-not-found")) {
            errorMessage = "Authentication system is not properly configured. Please contact support.";
          } else if (error.message?.includes("auth/invalid-api-key")) {
            errorMessage = "Authentication system configuration error. Please contact support.";
          } else if (error.message?.includes("auth/user-not-found") || error.message?.includes("auth/wrong-password")) {
            errorMessage = "Invalid username or password. Please try again.";
          }
          
          toast({
            title: "Login Failed",
            description: errorMessage,
            variant: "destructive",
          });
        }
      });
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  }
  
  function onRegisterSubmit(data: RegisterFormValues) {
    // Use Firebase registration for all new users
    try {
      firebaseRegisterMutation.mutate(data, {
        onError: (error) => {
          console.error("Firebase registration error:", error);
          
          // Show a more user-friendly error message
          let errorMessage = "Registration failed. Please try again.";
          
          if (error.message?.includes("auth/configuration-not-found")) {
            errorMessage = "Firebase authentication is not properly configured. Please contact support.";
          } else if (error.message?.includes("auth/invalid-api-key")) {
            errorMessage = "Authentication system configuration error. Please contact support.";
          } else if (error.message?.includes("auth/email-already-in-use")) {
            errorMessage = "This email is already registered. Try logging in instead.";
          }
          
          toast({
            title: "Registration Failed",
            description: errorMessage,
            variant: "destructive",
          });
        }
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Registration Failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  }
  
  function onForgotPasswordSubmit(data: ForgotPasswordFormValues) {
    // Send password reset request
    fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
      .then(res => {
        if (res.ok) {
          toast({
            title: "Password Reset Email Sent",
            description: "If an account with that email exists, we've sent instructions to reset your password.",
            variant: "default",
          });
          setIsForgotPasswordOpen(false);
          forgotPasswordForm.reset();
        } else {
          throw new Error("Failed to send password reset email");
        }
      })
      .catch(err => {
        toast({
          title: "Error",
          description: "There was a problem sending the password reset email. Please try again.",
          variant: "destructive",
        });
      });
  }
  
  function onForgotUsernameSubmit(data: ForgotUsernameFormValues) {
    // Send username recovery request
    fetch('/api/auth/forgot-username', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
      .then(res => {
        if (res.ok) {
          toast({
            title: "Username Recovery Email Sent",
            description: "If an account with that email exists, we've sent your username to that email address.",
            variant: "default",
          });
          setIsForgotUsernameOpen(false);
          forgotUsernameForm.reset();
        } else {
          throw new Error("Failed to send username recovery email");
        }
      })
      .catch(err => {
        toast({
          title: "Error",
          description: "There was a problem sending the username recovery email. Please try again.",
          variant: "destructive",
        });
      });
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
            
            {emailVerified && (
              <Alert className="mb-4 border-green-600/20 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-600">Email Verified Successfully</AlertTitle>
                <AlertDescription>
                  Your email has been verified. You can now log in to your account.
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
                    
                    <div className="flex justify-between mt-4 text-sm text-muted-foreground">
                      <Dialog open={isForgotUsernameOpen} onOpenChange={setIsForgotUsernameOpen}>
                        <DialogTrigger asChild>
                          <Button variant="link" className="p-0 h-auto" type="button">
                            <User className="h-3.5 w-3.5 mr-1" />
                            Forgot Username?
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>Recover Your Username</DialogTitle>
                            <DialogDescription>
                              Enter your email address and we'll send you your username.
                            </DialogDescription>
                          </DialogHeader>
                          <Form {...forgotUsernameForm}>
                            <form onSubmit={forgotUsernameForm.handleSubmit(onForgotUsernameSubmit)} className="space-y-4">
                              <FormField
                                control={forgotUsernameForm.control}
                                name="email"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Enter your email address" type="email" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <DialogFooter>
                                <Button type="submit" className="w-full">
                                  Send Username Recovery Email
                                </Button>
                              </DialogFooter>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                      
                      <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
                        <DialogTrigger asChild>
                          <Button variant="link" className="p-0 h-auto" type="button">
                            <Key className="h-3.5 w-3.5 mr-1" />
                            Forgot Password?
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>Reset Your Password</DialogTitle>
                            <DialogDescription>
                              Enter your email address and we'll send you a password reset link.
                            </DialogDescription>
                          </DialogHeader>
                          <Form {...forgotPasswordForm}>
                            <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)} className="space-y-4">
                              <FormField
                                control={forgotPasswordForm.control}
                                name="email"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Enter your email address" type="email" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <DialogFooter>
                                <Button type="submit" className="w-full">
                                  Send Password Reset Email
                                </Button>
                              </DialogFooter>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    </div>
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
                          <FormLabel>Your Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your full name (parent name if registering as parent)" {...field} />
                          </FormControl>
                          <div className="text-xs text-gray-500 mt-1">
                            {registerForm.watch("role") === "parent" 
                              ? "Enter your name as a parent. You'll add your child's details later." 
                              : "Enter your full name as it will appear in the system."}
                          </div>
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
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
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
                                <option value="coach">Coach (Requires Approval)</option>
                              </select>
                            </FormControl>
                            <div className="text-xs text-gray-500 mt-1">
                              Admin accounts can only be created by existing administrators for security reasons.
                            </div>
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
                "Don't have an account? Click Register above to create a new account."
              ) : (
                "Already have an account? Click Login above to sign in."
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
