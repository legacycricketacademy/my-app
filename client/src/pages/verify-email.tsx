import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useLocation } from "wouter";

export default function VerifyEmailPage() {
  const [location, setLocation] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email address...");

  // Extract token from URL
  const params = new URLSearchParams(location.split("?")[1]);
  const token = params.get("token");

  useEffect(() => {
    async function verifyEmail() {
      if (!token) {
        setStatus("error");
        setMessage("Invalid verification link. No token was provided.");
        return;
      }

      try {
        // The API is actually a GET endpoint with a query parameter, not a POST with body
        const response = await fetch(`/api/v1/verify-email?token=${encodeURIComponent(token)}`);
        
        if (response.ok) {
          setStatus("success");
          setMessage("Your email has been successfully verified. You can now log in to your account.");
        } else {
          const error = await response.json();
          setStatus("error");
          setMessage(error.message || "Failed to verify your email. The link may have expired or is invalid.");
        }
      } catch (error) {
        console.error("Email verification error:", error);
        setStatus("error");
        setMessage("An unexpected error occurred. Please try again later or contact support.");
      }
    }

    verifyEmail();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Email Verification</CardTitle>
          <CardDescription className="text-center">
            Legacy Cricket Academy
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-6">
          {status === "loading" && (
            <>
              <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
              <p className="text-center text-muted-foreground">{message}</p>
            </>
          )}
          
          {status === "success" && (
            <>
              <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
              <p className="text-center font-medium text-green-600 mb-2">Email Verified!</p>
              <p className="text-center text-muted-foreground">{message}</p>
            </>
          )}
          
          {status === "error" && (
            <>
              <XCircle className="h-16 w-16 text-red-500 mb-4" />
              <p className="text-center font-medium text-red-600 mb-2">Verification Failed</p>
              <p className="text-center text-muted-foreground">{message}</p>
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          {status !== "loading" && (
            <Button onClick={() => setLocation("/auth")}>
              {status === "success" ? "Log In" : "Try Again"}
            </Button>
          )}
          
          {status === "error" && (
            <Button variant="outline" onClick={() => window.location.href = "mailto:madhukar.kcc@gmail.com"}>
              Contact Support
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}