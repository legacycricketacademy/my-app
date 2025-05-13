import React from "react";

export default function TestPage() {
  console.log("Test page rendering");
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-4">Test Page</h1>
        <p className="text-gray-700 mb-4">
          This is a simple test page to verify React rendering is working correctly.
        </p>
        <div className="bg-blue-100 p-4 rounded">
          <p className="text-blue-800">
            If you can see this page, React is successfully rendering components.
          </p>
        </div>
      </div>
    </div>
  );
}