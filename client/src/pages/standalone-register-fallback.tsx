import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export default function StandaloneRegisterFallback() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('admin123admin123');
  const [fullName, setFullName] = useState('Test User');
  const [role, setRole] = useState('coach');
  const [phone, setPhone] = useState('');
  const [success, setSuccess] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Simple validation
      if (!username || !email || !password || !fullName) {
        throw new Error('Please fill in all required fields');
      }
      
      // Try sending directly to the API
      const response = await fetch('/api/debug/direct-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          password,
          fullName,
          role,
          phone: phone || undefined,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      
      // Success
      setSuccess(true);
      toast({
        title: "Registration Successful",
        description: "Account created successfully!",
      });
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // If registration was successful, show success message
  if (success) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader className="bg-green-50">
            <CardTitle className="text-green-700">Registration Successful!</CardTitle>
            <CardDescription className="text-green-600">Your account has been created.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-md">
                <h3 className="text-lg font-medium mb-2">Account Details</h3>
                <div className="grid grid-cols-3 gap-2">
                  <div className="font-medium">Username:</div>
                  <div className="col-span-2">{username}</div>
                  
                  <div className="font-medium">Email:</div>
                  <div className="col-span-2">{email}</div>
                  
                  <div className="font-medium">Role:</div>
                  <div className="col-span-2">{role}</div>
                  
                  <div className="font-medium">Status:</div>
                  <div className="col-span-2">{role === 'coach' ? 'Pending Approval' : 'Active'}</div>
                </div>
              </div>
              
              {role === 'coach' && (
                <div className="text-amber-600 bg-amber-50 p-3 rounded-md text-sm">
                  Note: Coach accounts need to be approved by an administrator before you can log in.
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              onClick={() => {
                setSuccess(false);
                setUsername('');
                setEmail('');
                setPassword('admin123admin123');
                setFullName('Test User');
              }}
            >
              Register Another Account
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Standalone Registration</CardTitle>
          <CardDescription>Create a new account with minimal dependencies</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username*</Label>
              <Input 
                id="username" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email*</Label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password*</Label>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
              <p className="text-sm text-muted-foreground">Pre-filled with a safe default</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name*</Label>
              <Input 
                id="fullName" 
                value={fullName} 
                onChange={(e) => setFullName(e.target.value)} 
                required 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Role*</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="coach">Coach</SelectItem>
                  <SelectItem value="parent">Parent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input 
                id="phone" 
                value={phone} 
                onChange={(e) => setPhone(e.target.value)} 
              />
              <p className="text-sm text-muted-foreground">Leave empty to avoid conflicts</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                  Creating Account...
                </>
              ) : (
                "Register Account"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}