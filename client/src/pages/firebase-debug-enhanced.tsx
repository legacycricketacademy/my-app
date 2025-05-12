import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase-init";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function FirebaseDebugEnhanced() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("parent");
  
  const [firebaseStatus, setFirebaseStatus] = useState<"unknown" | "working" | "error">("unknown");
  const [firebaseError, setFirebaseError] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<"unknown" | "working" | "error">("unknown");
  const [backendError, setBackendError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [detailedLogs, setDetailedLogs] = useState(false);
  const [activeTab, setActiveTab] = useState("test-firebase");
  const { toast } = useToast();

  const renderStatusBadge = (status: "unknown" | "working" | "error") => {
    if (status === "working") {
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" /> Working</Badge>;
    } else if (status === "error") {
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" /> Error</Badge>;
    } else {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><AlertCircle className="w-3 h-3 mr-1" /> Unknown</Badge>;
    }
  };

  // Check Firebase configuration on mount
  useEffect(() => {
    // Log Firebase configuration for debugging
    console.log("Firebase configuration check:", {
      apiKeyExists: !!import.meta.env.VITE_FIREBASE_API_KEY,
      projectIdExists: !!import.meta.env.VITE_FIREBASE_PROJECT_ID,
      appIdExists: !!import.meta.env.VITE_FIREBASE_APP_ID,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID
    });

    // Check if Firebase auth is initialized
    if (auth) {
      setFirebaseStatus("working");
    } else {
      setFirebaseStatus("error");
      setFirebaseError("Firebase auth not initialized");
    }
  }, []);

  // Function to test Firebase registration
  const testFirebaseRegistration = async () => {
    if (!email || !password) {
      toast({
        title: "Missing fields",
        description: "Please provide both email and password",
        variant: "destructive"
      });
      return;
    }
    
    // Generate a username if not provided
    const generatedUsername = username || email.split('@')[0] + Math.floor(Math.random() * 1000);
    const generatedFullName = fullName || email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1);

    setIsLoading(true);
    setResult(null);
    setFirebaseError(null);
    setBackendError(null);

    try {
      if (detailedLogs) console.log("Starting Firebase user creation test");
      
      // Try to create a user in Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      if (detailedLogs) console.log("Firebase user created:", firebaseUser.uid);
      
      setFirebaseStatus("working");
      setResult({
        firebaseData: {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          emailVerified: firebaseUser.emailVerified,
        }
      });

      try {
        // Now try to get a token
        const idToken = await firebaseUser.getIdToken();
        if (detailedLogs) console.log("Got Firebase ID token");
        
        // Create a user in the backend database
        try {
          if (detailedLogs) console.log("Attempting user registration with backend...");
          
          const registerResponse = await fetch("/api/v1/auth/register-firebase", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              firebaseUid: firebaseUser.uid,
              username: generatedUsername,
              email: firebaseUser.email,
              fullName: generatedFullName,
              role: role,
              idToken: idToken,
            }),
            credentials: "include",
          });
          
          if (registerResponse.ok) {
            const userData = await registerResponse.json();
            if (detailedLogs) console.log("User registration successful:", userData);
            
            setBackendStatus("working");
            setResult((prev: any) => ({ 
              ...prev, 
              userRegistration: {
                success: true,
                userData
              }
            }));
            
            toast({
              title: "Success!",
              description: "User created in backend database",
            });
            
            return userData;
          } else {
            const errorData = await registerResponse.json().catch(() => ({ message: "Failed to parse error response" }));
            if (detailedLogs) console.error("Registration failed:", errorData);
            
            setBackendStatus("error");
            setBackendError(errorData.message || "User registration failed");
            
            toast({
              title: "Registration Error",
              description: errorData.message || "Failed to create user in database",
              variant: "destructive"
            });
            
            // Try debug endpoint as fallback
            testDebugEndpoint(firebaseUser, idToken);
          }
        } catch (regError: any) {
          console.error("Error during user registration:", regError);
          setBackendStatus("error");
          setBackendError(regError.message || "User registration error");
          
          toast({
            title: "Registration Error",
            description: regError.message || "Error creating user in database",
            variant: "destructive"
          });
          
          // Try debug endpoint as fallback
          testDebugEndpoint(firebaseUser, idToken);
        }
      } catch (tokenError: any) {
        console.error("Failed to get ID token:", tokenError);
        setBackendStatus("error");
        setBackendError("Failed to get Firebase ID token: " + tokenError.message);
        
        toast({
          title: "Token Error",
          description: "Failed to get Firebase ID token",
          variant: "destructive"
        });
      }
    } catch (firebaseError: any) {
      console.error("Firebase error:", firebaseError);
      setFirebaseStatus("error");
      setFirebaseError(firebaseError.message || "Unknown Firebase error");
      
      // Check for specific Firebase errors
      if (firebaseError.code === 'auth/email-already-in-use') {
        toast({
          title: "Email already in use",
          description: "This email is already registered. Trying to sign in instead...",
          variant: "destructive"
        });
        
        // Try to sign in instead
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const firebaseUser = userCredential.user;
          
          setFirebaseStatus("working");
          setFirebaseError("Email already in use, but sign-in successful");
          setResult({
            firebaseData: {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              emailVerified: firebaseUser.emailVerified,
            }
          });
          
          // Now that we're signed in, try to get a token and test backend
          const idToken = await firebaseUser.getIdToken();
          testDebugEndpoint(firebaseUser, idToken);
        } catch (signInError: any) {
          console.error("Sign-in failed:", signInError);
          setFirebaseError(`${firebaseError.message}, and sign-in failed: ${signInError.message}`);
        }
      } else {
        toast({
          title: "Firebase Error",
          description: firebaseError.message || "Firebase registration failed",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function to test the debug endpoint
  const testDebugEndpoint = async (firebaseUser: any, idToken: string) => {
    try {
      if (detailedLogs) console.log("Testing debug endpoint...");
      const response = await fetch("/api/v1/auth/debug-firebase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idToken,
          firebaseUid: firebaseUser.uid,
          email: firebaseUser.email,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (detailedLogs) console.log("Debug endpoint successful:", data);
        
        setBackendStatus("working");
        setResult((prev: any) => ({ ...prev, debugEndpoint: data }));
        
        toast({
          title: "Debug Success",
          description: "Debug endpoint working correctly",
        });
      } else {
        const errorData = await response.json().catch(() => ({ message: "Failed to parse error response" }));
        if (detailedLogs) console.error("Debug endpoint failed:", errorData);
        
        setBackendStatus("error");
        setBackendError(errorData.message || "Debug endpoint failed");
        
        toast({
          title: "Debug Error",
          description: errorData.message || "Debug endpoint failed",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error("Error testing debug endpoint:", error);
      setBackendStatus("error");
      setBackendError("Error testing debug endpoint: " + error.message);
    }
  };
  
  // Function to send verification email
  const sendVerificationEmail = async (userId: number) => {
    if (!userId) {
      toast({
        title: "Missing User ID",
        description: "User ID is required to send a verification email",
        variant: "destructive"
      });
      return;
    }
    
    setIsSendingEmail(true);
    
    try {
      const response = await fetch("/api/v1/auth/send-verification-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });
      
      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Email Sent",
          description: "Verification email has been sent successfully",
        });
        
        setResult((prev: any) => ({ 
          ...prev, 
          emailVerification: {
            success: true,
            details: data
          }
        }));
      } else {
        const errorData = await response.json().catch(() => ({ message: "Failed to parse error response" }));
        toast({
          title: "Failed to Send Email",
          description: errorData.message || "Could not send verification email",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error sending verification email:", error);
      toast({
        title: "Error",
        description: "Failed to send verification email",
        variant: "destructive"
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Firebase Integration Debug Tool</h1>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="test-firebase">Test Firebase</TabsTrigger>
          <TabsTrigger value="create-user">Create User</TabsTrigger>
        </TabsList>
        
        <TabsContent value="test-firebase">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Firebase Configuration</CardTitle>
                <CardDescription>Status: {renderStatusBadge(firebaseStatus)}</CardDescription>
              </CardHeader>
              <CardContent>
                {firebaseError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md mb-4 text-sm">
                    <p className="font-medium">Error:</p>
                    <p>{firebaseError}</p>
                  </div>
                )}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      placeholder="test@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input 
                      id="password" 
                      type="password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      placeholder="••••••••"
                    />
                    <p className="text-xs text-muted-foreground">Password must be at least 6 characters long</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="detailed-logs" 
                      checked={detailedLogs} 
                      onCheckedChange={(checked) => setDetailedLogs(checked === true)} 
                    />
                    <label
                      htmlFor="detailed-logs"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Show detailed logs in console
                    </label>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={testFirebaseRegistration} disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : "Test Firebase Registration"}
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Backend Integration</CardTitle>
                <CardDescription>Status: {renderStatusBadge(backendStatus)}</CardDescription>
              </CardHeader>
              <CardContent>
                {backendError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md mb-4 text-sm">
                    <p className="font-medium">Error:</p>
                    <p>{backendError}</p>
                  </div>
                )}
                {result && (
                  <div className="mt-4 space-y-4">
                    {result.userRegistration && (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-semibold text-sm">User Registration:</h3>
                          {result.userRegistration.success && result.userRegistration.userData && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => sendVerificationEmail(result.userRegistration.userData.id)}
                              disabled={isSendingEmail}
                            >
                              {isSendingEmail ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Sending...
                                </>
                              ) : "Send Verification Email"}
                            </Button>
                          )}
                        </div>
                        <pre className="bg-slate-50 p-3 rounded-md overflow-auto max-h-40 text-xs">
                          {JSON.stringify(result.userRegistration, null, 2)}
                        </pre>
                      </div>
                    )}
                    
                    {result.firebaseData && (
                      <div>
                        <h3 className="font-semibold text-sm mb-2">Firebase User:</h3>
                        <pre className="bg-slate-50 p-3 rounded-md overflow-auto max-h-40 text-xs">
                          {JSON.stringify(result.firebaseData, null, 2)}
                        </pre>
                      </div>
                    )}
                    
                    {result.debugEndpoint && (
                      <div>
                        <h3 className="font-semibold text-sm mb-2">Debug Endpoint Response:</h3>
                        <pre className="bg-slate-50 p-3 rounded-md overflow-auto max-h-40 text-xs">
                          {JSON.stringify(result.debugEndpoint, null, 2)}
                        </pre>
                      </div>
                    )}
                    
                    {result.emailVerification && (
                      <div>
                        <h3 className="font-semibold text-sm mb-2">Email Verification:</h3>
                        <pre className="bg-slate-50 p-3 rounded-md overflow-auto max-h-40 text-xs">
                          {JSON.stringify(result.emailVerification, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="create-user">
          <Card>
            <CardHeader>
              <CardTitle>Create User Record in Database</CardTitle>
              <CardDescription>Fill in the fields below to register a new user with Firebase and create a corresponding database record</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email</Label>
                  <Input 
                    id="reg-email" 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="test@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Password</Label>
                  <Input 
                    id="reg-password" 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="••••••••"
                  />
                  <p className="text-xs text-muted-foreground">Password must be at least 6 characters long</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username (optional)</Label>
                  <Input 
                    id="username" 
                    type="text" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)} 
                    placeholder="username123"
                  />
                  <p className="text-xs text-muted-foreground">Leave empty to generate from email</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name (optional)</Label>
                  <Input 
                    id="fullName" 
                    type="text" 
                    value={fullName} 
                    onChange={(e) => setFullName(e.target.value)} 
                    placeholder="John Doe"
                  />
                  <p className="text-xs text-muted-foreground">Leave empty to generate from email</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="coach">Coach</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={testFirebaseRegistration} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating User...
                  </>
                ) : "Create User"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}