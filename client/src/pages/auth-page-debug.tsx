import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import ErrorBoundary from "@/components/error-boundary";

// Simple debug version of the auth page to isolate rendering issues
export default function AuthPageDebug() {
  console.log("Rendering AuthPageDebug");
  const [, navigate] = useLocation();
  const { user, isLoading } = useAuth();
  const [step, setStep] = useState(1);
  
  // Redirect to home if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // Render different steps to isolate where the error occurs
  const renderStep = () => {
    switch (step) {
      case 1:
        return <div className="p-4 bg-white rounded shadow">Basic rendering test</div>;
      case 2:
        return (
          <div className="p-4 bg-white rounded shadow">
            <h1>Form container test</h1>
            <form onSubmit={(e) => e.preventDefault()}>
              <input 
                type="text" 
                className="w-full p-2 border rounded mb-2" 
                placeholder="Username" 
              />
              <input 
                type="password" 
                className="w-full p-2 border rounded mb-2" 
                placeholder="Password" 
              />
              <button 
                type="submit"
                className="w-full p-2 bg-blue-600 text-white rounded"
              >
                Test Button
              </button>
            </form>
          </div>
        );
      default:
        return <div>Unknown step</div>;
    }
  };

  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="m-auto w-full max-w-md p-4">
        <h1 className="text-2xl font-bold mb-4">Auth Page Debug</h1>
        <p className="mb-4">Current step: {step}</p>
        
        <div className="flex space-x-2 mb-4">
          <button 
            onClick={() => setStep(1)}
            className="px-3 py-1 bg-gray-200 rounded"
          >
            Step 1: Basic
          </button>
          <button 
            onClick={() => setStep(2)}
            className="px-3 py-1 bg-gray-200 rounded"
          >
            Step 2: Form
          </button>
        </div>
        
        <ErrorBoundary>
          {renderStep()}
        </ErrorBoundary>
      </div>
    </div>
  );
}