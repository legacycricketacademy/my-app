import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/shared/toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/dev/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.ok) {
        toast({ title: "Login successful", description: "Redirecting to dashboard..." });
        navigate("/dashboard");
      } else {
        toast({ title: "Login failed", description: data.message || "Invalid credentials" });
      }
    } catch (error) {
      toast({ title: "Login error", description: "Something went wrong. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Sign in to Legacy Cricket Academy</h1>
      <form aria-label="login-form" onSubmit={handleSubmit}>
        <label htmlFor="email">Email</label>
        <input 
          id="email" 
          name="email" 
          type="email" 
          placeholder="Email" 
          data-testid="input-email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required 
        />
        <label htmlFor="password">Password</label>
        <input 
          id="password" 
          name="password" 
          type="password" 
          placeholder="Password" 
          data-testid="input-password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required 
        />
        <button 
          type="submit" 
          data-testid="btn-login" 
          className="btn btn-primary w-full mt-3"
          disabled={isLoading}
        >
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </form>
      <div className="mt-4 text-center">
        <span>Don't have an account? </span>
        <a href="/register" className="link" data-testid="link-register">Register</a>
      </div>
    </div>
  );
}
