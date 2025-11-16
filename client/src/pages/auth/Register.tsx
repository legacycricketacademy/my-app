import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const [f, setF] = useState({ 
    parentName: "", 
    email: "", 
    password: "",
    confirmPassword: "",
    phone: "", 
    childName: "", 
    ageGroup: "U11", 
    role: "parent" 
  });
  const [msg, setMsg] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  function validateForm() {
    const newErrors: Record<string, string> = {};
    
    if (!f.parentName.trim()) newErrors.parentName = "Name is required";
    if (!f.email.trim()) newErrors.email = "Email is required";
    if (!f.password) newErrors.password = "Password is required";
    if (!f.confirmPassword) newErrors.confirmPassword = "Please confirm password";
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (f.email && !emailRegex.test(f.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (f.password && f.confirmPassword && f.password !== f.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    if (f.password && f.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function onSubmit(e: React.FormEvent) { 
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSubmitting(true);
    setMsg(null);
    
    try {
      const r = await fetch("/api/registration", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(f),
        credentials: "include"
      });
      
      if (r.ok) {
        setMsg("Thank you! We received your registration. Check your email to verify.");
        setF({ parentName: "", email: "", password: "", confirmPassword: "", phone: "", childName: "", ageGroup: "U11", role: "parent" });
        setTimeout(() => navigate("/login"), 2000);
      } else {
        const errorData = await r.json().catch(() => ({}));
        setMsg(errorData.message || "Something went wrong. Please try again.");
      }
    } catch (error) {
      setMsg("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4" data-testid="heading-register">Register for Legacy Cricket Academy</h1>
      <p className="text-sm text-gray-600 mb-6">Create your parent account to get started</p>
      
      <form onSubmit={onSubmit} className="space-y-4" data-testid="form-register">
        <div>
          <label htmlFor="role" className="block text-sm font-medium mb-1">I am a:</label>
          <select 
            id="role"
            value={f.role} 
            onChange={e => setF({...f, role: e.target.value})} 
            data-testid="reg-role"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="parent">Parent</option>
            <option value="coach">Coach</option>
          </select>
        </div>

        <div>
          <label htmlFor="parentName" className="block text-sm font-medium mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input 
            id="parentName"
            placeholder="Enter your full name" 
            value={f.parentName} 
            onChange={e => setF({...f, parentName: e.target.value})} 
            data-testid="reg-parent-name" 
            className={`w-full px-3 py-2 border rounded-md ${errors.parentName ? 'border-red-500' : 'border-gray-300'}`}
            required
          />
          {errors.parentName && <p className="text-red-500 text-xs mt-1">{errors.parentName}</p>}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input 
            id="email"
            placeholder="your.email@example.com" 
            type="email" 
            value={f.email} 
            onChange={e => setF({...f, email: e.target.value})} 
            data-testid="reg-email" 
            className={`w-full px-3 py-2 border rounded-md ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
            required
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Password <span className="text-red-500">*</span>
          </label>
          <input 
            id="password"
            placeholder="Create a password" 
            type="password" 
            value={f.password} 
            onChange={e => setF({...f, password: e.target.value})} 
            data-testid="reg-password" 
            className={`w-full px-3 py-2 border rounded-md ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
            required
          />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
            Confirm Password <span className="text-red-500">*</span>
          </label>
          <input 
            id="confirmPassword"
            placeholder="Re-enter your password" 
            type="password" 
            value={f.confirmPassword} 
            onChange={e => setF({...f, confirmPassword: e.target.value})} 
            data-testid="reg-confirm-password" 
            className={`w-full px-3 py-2 border rounded-md ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
            required
          />
          {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium mb-1">Phone (optional)</label>
          <input 
            id="phone"
            placeholder="(555) 123-4567" 
            value={f.phone} 
            onChange={e => setF({...f, phone: e.target.value})} 
            data-testid="reg-phone"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label htmlFor="childName" className="block text-sm font-medium mb-1">Child's Name (optional)</label>
          <input 
            id="childName"
            placeholder="Enter child's name" 
            value={f.childName} 
            onChange={e => setF({...f, childName: e.target.value})} 
            data-testid="reg-child-name"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label htmlFor="ageGroup" className="block text-sm font-medium mb-1">Age Group (optional)</label>
          <select 
            id="ageGroup"
            value={f.ageGroup} 
            onChange={e => setF({...f, ageGroup: e.target.value})} 
            data-testid="reg-age-group"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="U7">U7</option>
            <option value="U11">U11</option>
            <option value="U13">U13</option>
            <option value="U15">U15</option>
          </select>
        </div>

        <button 
          type="submit"
          className="w-full btn btn-primary py-2 px-4 rounded-md font-medium disabled:opacity-50" 
          data-testid="reg-submit"
          disabled={submitting}
        >
          {submitting ? "Submitting..." : "Register"}
        </button>
      </form>

      {msg && (
        <div className={`mt-4 p-3 rounded-md ${msg.includes("Thank you") ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`} data-testid="reg-result">
          {msg}
        </div>
      )}

      <div className="mt-6 text-center text-sm">
        <span className="text-gray-600">Already have an account? </span>
        <a href="/login" className="text-blue-600 hover:text-blue-800 font-medium" data-testid="link-login">
          Sign in here
        </a>
      </div>
    </div>
  );
}
