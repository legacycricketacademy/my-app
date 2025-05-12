import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link } from "wouter";

export default function FixFirebaseUser() {
  // Form state
  const [email, setEmail] = useState("bigcoach@getmule.com");
  const [username, setUsername] = useState("bigcoach2");
  const [password, setPassword] = useState("Password123!");

  // Response state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [responseData, setResponseData] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `${new Date().toISOString().substring(11, 23)} - ${message}`]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setResponseData(null);
    
    addLog("Starting to fix Firebase user...");
    
    try {
      // First, check if the user exists
      addLog(`Checking user: ${email}`);
      
      // Create a special endpoint for this fix
      const fixData = {
        email,
        username,
        password
      };
      
      addLog(`Sending data: ${JSON.stringify({...fixData, password: "***"})}`);
      
      const res = await fetch("/api/fix-firebase-user", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-Debug-Mode": "true"
        },
        body: JSON.stringify(fixData),
        credentials: "include",
      });
      
      const rawText = await res.text();
      
      try {
        const jsonData = JSON.parse(rawText);
        setResponseData(jsonData);
        addLog(`Received response: ${JSON.stringify(jsonData)}`);
        
        if (res.ok) {
          setSuccess(`Successfully updated user account for ${email}`);
          addLog("User fix complete!");
        } else {
          setError(jsonData.message || "Failed to update user");
          addLog(`Error: ${jsonData.message || "Unknown error"}`);
        }
      } catch (e) {
        addLog(`Unable to parse response as JSON: ${rawText}`);
        setError(`Invalid response: ${rawText.substring(0, 100)}...`);
      }
    } catch (error: any) {
      setError(`Error: ${error.message}`);
      addLog(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Fix Firebase User</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Add Password to Firebase User</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required
                />
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Processing..." : "Fix User"}
              </Button>
              
              <div className="text-center mt-4">
                <Link href="/register-debug" className="text-sm text-blue-600 hover:underline">
                  Back to debug registration
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
        
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {success && (
                <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}
              
              {responseData && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium mb-2">Response:</h3>
                  <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(responseData, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Debug Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 text-gray-100 p-2 rounded text-xs font-mono overflow-auto max-h-96">
                {logs.length > 0 ? logs.map((log, i) => (
                  <div key={i} className="mb-1">{log}</div>
                )) : (
                  <div className="text-gray-400">No logs yet. Submit the form to see results.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}