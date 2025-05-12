import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase-init";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function DebugFirebaseNew() {
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
  const { toast } = useToast();

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
        
        // Create user in backend database
        try {
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
      <h1 className="text-3xl font-bold mb-6">Firebase Debug Tool</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Firebase Configuration</CardTitle>
            <CardDescription>Test authentication and backend integration</CardDescription>
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
                <select 
                  id="role"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="parent">Parent</option>
                  <option value="coach">Coach</option>
                  <option value="admin">Admin</option>
                </select>
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
              
              <div className="flex justify-between text-sm">
                <span>Firebase Status:</span>
                <span className={
                  firebaseStatus === "working" ? "text-green-600" : 
                  firebaseStatus === "error" ? "text-red-600" : 
                  "text-orange-600"
                }>
                  {firebaseStatus === "working" ? "Working" : 
                   firebaseStatus === "error" ? "Error" : 
                   "Unknown"}
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span>Backend Status:</span>
                <span className={
                  backendStatus === "working" ? "text-green-600" : 
                  backendStatus === "error" ? "text-red-600" : 
                  "text-orange-600"
                }>
                  {backendStatus === "working" ? "Working" : 
                   backendStatus === "error" ? "Error" : 
                   "Unknown"}
                </span>
              </div>
              
              {backendError && (
                <p className="text-xs text-red-600">{backendError}</p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={testFirebaseRegistration}
              disabled={isLoading}
            >
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
            <CardTitle>Test Results</CardTitle>
            <CardDescription>Firebase and backend integration status</CardDescription>
          </CardHeader>
          <CardContent>
            {result && (
              <div className="space-y-6">
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
            
            {!result && (
              <div className="text-center py-6 text-muted-foreground">
                No test results yet. Click "Test Firebase Registration" to start.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}