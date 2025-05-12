import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function RegisterDebug() {
  // Form state
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("parent");

  // Response state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<any>(null);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseText, setResponseText] = useState<string | null>(null);

  // Debug information
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `${new Date().toISOString().substring(11, 23)} - ${message}`]);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResponse(null);
    setResponseStatus(null);
    setResponseText(null);
    
    addLog("Starting registration attempt...");
    
    try {
      // Create the registration payload
      const data = {
        username,
        email,
        password,
        fullName,
        role,
        phone: phone || undefined
      };
      
      addLog(`Sending data: ${JSON.stringify({...data, password: "***"})}`);
      
      // Send the registration request to our backend directly
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      // Set response status for debugging
      setResponseStatus(res.status);
      addLog(`Received response with status: ${res.status}`);
      
      // Try to get response as text first
      const rawText = await res.text();
      setResponseText(rawText);
      addLog(`Raw response: ${rawText}`);
      
      // Then try to parse as JSON
      try {
        const jsonData = JSON.parse(rawText);
        setResponse(jsonData);
        addLog(`Parsed JSON response: ${JSON.stringify(jsonData)}`);
        
        if (!res.ok) {
          // Handle error response
          setError(jsonData.message || `Registration failed with status ${res.status}`);
          addLog(`Error: ${jsonData.message || "Unknown error"}`);
        } else {
          // Handle success
          addLog("Registration successful!");
        }
      } catch (parseError) {
        // Couldn't parse JSON
        addLog(`Failed to parse JSON response: ${parseError}`);
        setError(`Couldn't parse server response: ${rawText.substring(0, 100)}...`);
      }
    } catch (err: any) {
      // Network error
      setError(`Network error: ${err.message}`);
      addLog(`Network error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Registration Debug Tool</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Registration Form</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input 
                  id="fullName" 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
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
                <p className="text-xs text-gray-500">
                  Password must be at least 8 characters with uppercase, lowercase, number, and special character
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input 
                  id="phone" 
                  type="tel" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="coach">Coach</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Registering..." : "Register"}
              </Button>
              
              <div className="text-center mt-4">
                <Link href="/auth" className="text-sm text-blue-600 hover:underline">
                  Back to regular auth page
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
        
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Response</CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {response && !error && (
                <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription>Registration successful!</AlertDescription>
                </Alert>
              )}
              
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Response Status: {responseStatus}</h3>
                {response && (
                  <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(response, null, 2)}
                  </pre>
                )}
                
                {responseText && !response && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Raw Response:</h3>
                    <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
                      {responseText}
                    </pre>
                  </div>
                )}
              </div>
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
                  <div className="text-gray-400">No logs yet. Submit the form to see the process.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}