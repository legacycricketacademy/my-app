import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { SimpleLogoutButton } from "@/components/ui/simple-logout-button";
import { Separator } from "@/components/ui/separator";

export default function TestRegister() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    fullName: "",
    role: "parent",
    phone: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResponse(null);
    
    try {
      console.log("Sending registration data:", {...formData, password: "[REDACTED]"});
      
      // Step 1: Clear any existing session first to avoid conflicts
      try {
        await fetch("/api/force-logout", {
          method: "POST",
          credentials: "include"
        });
        console.log("Cleared existing session first");
      } catch (logoutErr) {
        console.log("Logout before registration failed (not critical):", logoutErr);
      }
      
      // Step 2: Attempt the registration with better error handling and tracing
      let res;
      try {
        console.log("Starting registration API call...");
        res = await fetch("/api/register", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "X-Debug-Mode": "true" // Custom header for debug routes
          },
          body: JSON.stringify(formData),
          credentials: "include"
        });
        console.log("Registration API call completed with status:", res.status);
      } catch (fetchErr: any) {
        console.error("Network error during registration fetch:", fetchErr);
        throw new Error(`Network error: ${fetchErr.message}`);
      }
      
      // Step 3: Parse the response data with error handling
      let data;
      try {
        const textResponse = await res.text();
        console.log("Raw response:", textResponse);
        
        try {
          data = JSON.parse(textResponse);
          console.log("Parsed response data:", data);
        } catch (jsonErr) {
          console.error("Error parsing JSON:", jsonErr);
          throw new Error(`Server returned invalid JSON: ${textResponse}`);
        }
      } catch (responseErr: any) {
        console.error("Error reading response:", responseErr);
        throw new Error(`Error processing response: ${responseErr.message}`);
      }
      
      // Step 4: Handle the response based on status
      if (!res.ok) {
        const errorMsg = data.message || "Registration failed";
        console.error("Registration API returned error:", errorMsg, data);
        setError(errorMsg);
        toast({
          title: "Registration failed",
          description: errorMsg,
          variant: "destructive"
        });
      } else {
        console.log("Registration successful:", data);
        setResponse(data);
        toast({
          title: "Registration successful",
          description: "Your account has been created!",
        });
      }
    } catch (err: any) {
      console.error("Registration process error:", err);
      setError(err.message || "Registration failed");
      toast({
        title: "Registration failed",
        description: err.message || "Something went wrong",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container max-w-md mx-auto py-8">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Test Registration</CardTitle>
          <CardDescription>Create a new account with direct API access</CardDescription>
          <div className="mt-2 p-2 bg-blue-50 text-blue-800 text-sm rounded border border-blue-200">
            <p className="font-medium">Firebase Admin is now properly configured! 🎉</p>
            <p className="text-xs mt-1">The missing FIREBASE_PROJECT_ID environment variable has been added.</p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input 
                id="username" 
                name="username" 
                value={formData.username}
                onChange={handleChange}
                placeholder="johndoe"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Username must be at least 6 characters and unique in the system.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                name="password" 
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Password must be at least 8 characters long. Try "Password123!".
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                name="email" 
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john.doe@example.com"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input 
                id="fullName" 
                name="fullName" 
                value={formData.fullName}
                onChange={handleChange}
                placeholder="John Doe"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input 
                id="phone" 
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="1234567890"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select 
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              >
                <option value="parent">Parent</option>
                <option value="coach">Coach</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Registering..." : "Register"}
            </Button>
          </form>
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-800 rounded">
              <strong>Error:</strong> {error}
              <div className="mt-2 text-xs text-gray-600">
                Please check the browser console (F12) for more detailed error information.
              </div>
            </div>
          )}
          
          {response && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-800 rounded">
              <strong>Success!</strong> User created.
              <pre className="mt-2 text-xs overflow-auto">
                {JSON.stringify(response, null, 2)}
              </pre>
            </div>
          )}
          
          <Separator className="my-6" />
          
          <div className="space-y-4">
            <h3 className="font-medium">Logout Testing</h3>
            <p className="text-sm text-muted-foreground">If you're experiencing logout issues, try this force logout button:</p>
            <SimpleLogoutButton />
            
            <h3 className="font-medium mt-4">Alternative Force Logout</h3>
            <p className="text-sm text-muted-foreground">This uses a different method calling our server API endpoint:</p>
            <Button 
              variant="destructive"
              className="w-full"
              onClick={async () => {
                try {
                  const res = await fetch("/api/force-logout", {
                    method: "POST",
                    credentials: "include"
                  });
                  const data = await res.json();
                  
                  if (res.ok) {
                    toast({
                      title: "Logout successful",
                      description: data.message,
                    });
                    
                    // Clear frontend state
                    localStorage.clear();
                    sessionStorage.clear();
                    
                    // Force redirect
                    window.location.href = "/auth?force-logout=" + Date.now();
                  } else {
                    toast({
                      title: "Logout failed",
                      description: data.message,
                      variant: "destructive"
                    });
                  }
                } catch (err: any) {
                  console.error("Force logout error:", err);
                  toast({
                    title: "Logout error",
                    description: err.message || "Failed to contact server",
                    variant: "destructive"
                  });
                }
              }}
            >
              Server-Side Force Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}