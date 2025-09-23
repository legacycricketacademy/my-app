import React from 'react';

export default function AuthCallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Processing Authentication</h1>
        <p className="text-gray-600">Please wait while we complete your login...</p>
      </div>
    </div>
  );
}