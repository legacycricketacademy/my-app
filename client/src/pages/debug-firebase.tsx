import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase-init";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

export default function DebugFirebasePage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firebaseStatus, setFirebaseStatus] = useState<"unknown" | "working" | "error">("unknown");
  const [firebaseError, setFirebaseError] = useState<string | null>(null);
  const [backendStatus, setBackendStatus] = useState<"unknown" | "working" | "error">("unknown");
  const [backendError, setBackendError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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
        firebaseUser: {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          emailVerified: firebaseUser.emailVerified,
        }
      });

      try {
        // Now try to get a token
        const idToken = await firebaseUser.getIdToken();
        if (detailedLogs) console.log("Got Firebase ID token");
        
        // Now try to register with our backend
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
          setBackendStatus("working");
          setResult((prev: any) => ({ ...prev, backendData: data }));
          toast({
            title: "Success",
            description: "Firebase and backend integration working correctly",
          });
        } else {
          const errorData = await response.json().catch(() => ({ message: "Failed to parse error response" }));
          setBackendStatus("error");
          setBackendError(errorData.message || "Backend integration failed");
          toast({
            title: "Backend Error",
            description: errorData.message || "Backend integration failed",
            variant: "destructive"
          });
        }
      } catch (backendError: any) {
        console.error("Backend integration error:", backendError);
        setBackendStatus("error");
        setBackendError(backendError.message || "Unknown backend error");
        toast({
          title: "Backend Error",
          description: backendError.message || "Backend integration failed",
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
            firebaseUser: {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              emailVerified: firebaseUser.emailVerified,
            }
          });
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

  return (
    <div className="container mx-auto py-10 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>Firebase Debug Tool</CardTitle>
          <CardDescription>
            Test Firebase registration and backend integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
              placeholder="•••••••••"
            />
            <p className="text-xs text-muted-foreground">
              Password must be at least 6 characters
            </p>
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
          
          <div className="space-y-2">
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
            
            {firebaseError && (
              <p className="text-xs text-red-600">{firebaseError}</p>
            )}
            
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
            {isLoading ? "Testing..." : "Test Firebase Registration"}
          </Button>
        </CardFooter>
      </Card>
      
      {result && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-slate-100 p-2 rounded-md text-xs overflow-auto max-h-60">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}