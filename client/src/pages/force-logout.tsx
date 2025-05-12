import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, RefreshCw, Check } from "lucide-react";

export default function ForceLogoutPage() {
  const { toast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [step, setStep] = useState(1);
  const [logs, setLogs] = useState<string[]>([]);

  // Add log entry with timestamp
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  // Force logout function with progress tracking
  const executeForceLogout = async () => {
    setIsLoggingOut(true);
    setStep(1);
    
    try {
      // Step 1: Clear all browser storage
      addLog("Starting emergency logout...");
      setStep(1);
      
      // Clear localStorage
      localStorage.clear();
      addLog("LocalStorage cleared");
      
      // Clear sessionStorage
      sessionStorage.clear();
      addLog("SessionStorage cleared");
      
      // Set emergency flag
      localStorage.setItem('emergency_logout', Date.now().toString());
      addLog("Set emergency logout flag");
      
      // Step 2: Clear all cookies
      setStep(2);
      addLog("Clearing cookies...");
      
      // Method 1: Basic cookie clearing
      document.cookie.split(";").forEach(c => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
      });
      
      // Method 2: More aggressive cookie clearing
      const cookieNames = document.cookie.match(/[^ =;]+(?==)/g) || [];
      cookieNames.forEach(name => {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=${window.location.hostname}`;
      });
      
      addLog("All cookies cleared");
      
      // Step 3: Try server-side logout
      setStep(3);
      addLog("Attempting server-side logout...");
      
      try {
        const res = await fetch("/api/logout", {
          method: "POST",
          credentials: "include",
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" }
        });
        
        if (res.ok) {
          addLog("Server-side logout succeeded");
        } else {
          addLog(`Server-side logout returned status: ${res.status}`);
        }
      } catch (error) {
        addLog(`Server-side logout error: ${error instanceof Error ? error.message : String(error)}`);
      }
      
      // Final step: Success
      setStep(4);
      addLog("Logout process completed");
      setIsSuccess(true);
      setIsLoggingOut(false);
      
      toast({
        title: "Logout successful",
        description: "You have been forcefully logged out of the system",
      });
    } catch (error) {
      addLog(`Error during logout: ${error instanceof Error ? error.message : String(error)}`);
      setIsLoggingOut(false);
      
      toast({
        title: "Logout partially completed",
        description: "There were some errors, but we've cleared most of your session data",
        variant: "destructive"
      });
    }
  };

  // Function to go back to auth page
  const goToAuth = () => {
    window.location.href = `/auth?force_logout=true&t=${Date.now()}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="bg-red-50 border-b border-red-100">
          <CardTitle className="flex items-center text-red-700">
            <LogOut className="mr-2 h-6 w-6" />
            Emergency Logout Tool
          </CardTitle>
          <CardDescription>
            Use this tool if you're unable to log out through normal means
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6 pb-2">
          {!isSuccess ? (
            <>
              <div className="space-y-4">
                <div className="bg-amber-50 p-4 rounded-md border border-amber-200 mb-4">
                  <p className="text-amber-800 text-sm">
                    This tool will forcefully clear all your session data and log you out of the application.
                    You will need to log in again afterward.
                  </p>
                </div>
                
                <div className={`flex items-center ${step >= 1 ? "text-green-600" : "text-gray-400"}`}>
                  {step > 1 ? <Check className="h-5 w-5 mr-2" /> : <div className="h-5 w-5 mr-2 rounded-full border border-current flex items-center justify-center">{step === 1 && isLoggingOut ? <RefreshCw className="h-3 w-3 animate-spin" /> : "1"}</div>}
                  <span>Clear browser storage</span>
                </div>
                
                <div className={`flex items-center ${step >= 2 ? "text-green-600" : "text-gray-400"}`}>
                  {step > 2 ? <Check className="h-5 w-5 mr-2" /> : <div className="h-5 w-5 mr-2 rounded-full border border-current flex items-center justify-center">{step === 2 && isLoggingOut ? <RefreshCw className="h-3 w-3 animate-spin" /> : "2"}</div>}
                  <span>Remove all cookies</span>
                </div>
                
                <div className={`flex items-center ${step >= 3 ? "text-green-600" : "text-gray-400"}`}>
                  {step > 3 ? <Check className="h-5 w-5 mr-2" /> : <div className="h-5 w-5 mr-2 rounded-full border border-current flex items-center justify-center">{step === 3 && isLoggingOut ? <RefreshCw className="h-3 w-3 animate-spin" /> : "3"}</div>}
                  <span>Contact server to terminate session</span>
                </div>
                
                <div className={`flex items-center ${step >= 4 ? "text-green-600" : "text-gray-400"}`}>
                  {step > 3 ? <Check className="h-5 w-5 mr-2" /> : <div className="h-5 w-5 mr-2 rounded-full border border-current flex items-center justify-center">{step === 4 && isLoggingOut ? <RefreshCw className="h-3 w-3 animate-spin" /> : "4"}</div>}
                  <span>Complete logout process</span>
                </div>
              </div>
              
              {logs.length > 0 && (
                <div className="mt-6 border rounded-md">
                  <div className="bg-gray-100 px-4 py-2 border-b text-sm font-medium">Logout Progress</div>
                  <div className="p-2 max-h-32 overflow-y-auto bg-gray-50 text-xs font-mono">
                    {logs.map((log, index) => (
                      <div key={index} className="py-1">{log}</div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-6">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Logout Successful</h3>
              <p className="text-gray-500 mb-4">
                You have been successfully logged out of the application. You can now safely return to the login page.
              </p>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-end gap-2 bg-gray-50 border-t">
          {!isSuccess ? (
            <Button 
              variant="destructive" 
              onClick={executeForceLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Logging Out...
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  Force Logout
                </>
              )}
            </Button>
          ) : (
            <Button onClick={goToAuth}>
              Go to Login
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}