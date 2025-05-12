import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

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
      
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include"
      });
      
      console.log("Response status:", res.status);
      
      const data = await res.json();
      console.log("Response data:", data);
      
      if (!res.ok) {
        setError(data.message || "Registration failed");
        toast({
          title: "Registration failed",
          description: data.message || "Something went wrong",
          variant: "destructive"
        });
      } else {
        setResponse(data);
        toast({
          title: "Registration successful",
          description: "Your account has been created!",
        });
      }
    } catch (err: any) {
      console.error("Registration error:", err);
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
        </CardContent>
      </Card>
    </div>
  );
}