import React, { useState } from "react";
import { useAuth } from "@/auth/session";
import { useNavigate } from "react-router-dom";

export default function Login(){
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
            <p className="text-gray-600">Sign in to Legacy Cricket Academy</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form
            aria-label="login-form"
            onSubmit={async (e)=>{ 
              e.preventDefault();
              setError("");
              try {
                setSubmitting(true);
                await login(email, password);
                console.log("✅ Login successful, redirecting to /dashboard");
                nav("/dashboard", { replace: true });
                console.log("✅ Navigate called");
              } catch (err) {
                console.error("❌ Login error:", err);
                setError(err instanceof Error ? err.message : "Login failed. Please check your credentials.");
              } finally {
                setSubmitting(false);
              }
            }}
            className="space-y-5"
          >
            {/* Email Field */}
            <div className="space-y-2">
              <label 
                htmlFor="email" 
                className="block text-sm font-medium text-gray-700"
              >
                Email Address
              </label>
              <input 
                id="email" 
                name="email" 
                type="email" 
                placeholder="you@example.com" 
                data-testid="input-email" 
                required
                value={email} 
                onChange={e=>setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-900 placeholder-gray-400"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input 
                id="password" 
                name="password" 
                type="password" 
                placeholder="Enter your password" 
                data-testid="input-password" 
                required
                value={password} 
                onChange={e=>setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-900 placeholder-gray-400"
              />
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              data-testid="btn-login" 
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {submitting ? "Signing in…" : "Sign In"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">New to the academy?</span>
            </div>
          </div>

          {/* Register Links */}
          <div className="space-y-3">
            <a 
              href="/register" 
              className="block w-full text-center px-4 py-3 text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors font-medium"
              data-testid="btn-new-parent-register"
            >
              Register as Parent
            </a>
            <p className="text-center text-sm text-gray-600">
              Already have an account?{" "}
              <a 
                href="/register" 
                className="text-blue-600 hover:text-blue-800 font-medium underline" 
                data-testid="link-register"
              >
                Create one here
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-gray-500">
          © 2024 Legacy Cricket Academy. All rights reserved.
        </p>
      </div>
    </div>
  );
}
