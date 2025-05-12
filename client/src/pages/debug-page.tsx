import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { useEffect, useState } from "react";

export default function DebugPage() {
  const { user, isLoading, error } = useAuth();
  const [consoleMessages, setConsoleMessages] = useState<string[]>([]);
  const [authState, setAuthState] = useState<string>("Checking...");

  useEffect(() => {
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    
    console.log = function(...args) {
      setConsoleMessages(prev => [...prev, `LOG: ${args.map(arg => JSON.stringify(arg)).join(' ')}`]);
      originalConsoleLog.apply(console, args);
    };
    
    console.error = function(...args) {
      setConsoleMessages(prev => [...prev, `ERROR: ${args.map(arg => JSON.stringify(arg)).join(' ')}`]);
      originalConsoleError.apply(console, args);
    };
    
    console.warn = function(...args) {
      setConsoleMessages(prev => [...prev, `WARN: ${args.map(arg => JSON.stringify(arg)).join(' ')}`]);
      originalConsoleWarn.apply(console, args);
    };
    
    return () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  }, []);

  useEffect(() => {
    if (isLoading) {
      setAuthState("Loading user data...");
    } else if (error) {
      setAuthState(`Error: ${error.message}`);
    } else if (user) {
      setAuthState(`Logged in as ${user.username} (${user.role})`);
    } else {
      setAuthState("Not logged in");
    }
  }, [user, isLoading, error]);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/user");
      const data = await res.json();
      console.log("Auth check result:", data);
    } catch (err) {
      console.error("Auth check error:", err);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Debug Page</h1>
      
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Authentication Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div><strong>Status:</strong> {authState}</div>
            {user && (
              <>
                <div><strong>User ID:</strong> {user.id}</div>
                <div><strong>Username:</strong> {user.username}</div>
                <div><strong>Email:</strong> {user.email}</div>
                <div><strong>Role:</strong> {user.role}</div>
                <div><strong>Status:</strong> {user.status}</div>
                <div><strong>Active:</strong> {user.isActive ? "Yes" : "No"}</div>
                <div><strong>Academy ID:</strong> {user.academyId}</div>
              </>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={checkAuth}>Check Auth Status</Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Console Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-800 text-green-400 p-4 rounded font-mono text-sm h-80 overflow-y-auto">
            {consoleMessages.length > 0 ? (
              consoleMessages.map((msg, i) => (
                <div key={i} className="mb-1">{msg}</div>
              ))
            ) : (
              <div>No console messages captured yet...</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}