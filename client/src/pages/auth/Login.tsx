import React, { useState } from "react";
import { useAuth } from "@/auth/session";
import { useNavigate } from "react-router-dom";

export default function Login(){
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  return (
    <div className="max-w-sm mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Sign in to Legacy Cricket Academy</h1>
      <form
        aria-label="login-form"
        onSubmit={async (e)=>{ e.preventDefault();
          try {
            setSubmitting(true);
            await login(email, password);
            console.log("✅ Login successful, redirecting to /dashboard");
            nav("/dashboard", { replace: true });
            console.log("✅ Navigate called");
          } catch (err) {
            console.error("❌ Login error:", err);
            alert("Login failed: " + (err instanceof Error ? err.message : "Unknown error"));
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" placeholder="Email" data-testid="input-email" required
               value={email} onChange={e=>setEmail(e.target.value)} />
        <label htmlFor="password">Password</label>
        <input id="password" name="password" type="password" placeholder="Password" data-testid="input-password" required
               value={password} onChange={e=>setPassword(e.target.value)} />
        <button type="submit" data-testid="btn-login" className="btn btn-primary w-full mt-3" disabled={submitting}>
          {submitting ? "Signing in…" : "Login"}
        </button>
      </form>
      <div className="mt-6 text-center space-y-3">
        <div className="text-sm text-gray-600">
          <span>Don't have an account? </span>
          <a href="/register" className="link text-blue-600 hover:text-blue-800 font-medium" data-testid="link-register">
            Register here
          </a>
        </div>
        <div className="pt-3 border-t border-gray-200">
          <a 
            href="/register" 
            className="inline-block w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
            data-testid="btn-new-parent-register"
          >
            New parent? Register
          </a>
        </div>
      </div>
    </div>
  );
}
