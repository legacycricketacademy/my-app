import React from 'react';
import { getCurrentUser } from '@/lib/auth';
import AdminDashboard from '@/pages/admin/admin-dashboard';
import EnhancedParentDashboard from '@/pages/parent/enhanced-dashboard';

export default function RoleBasedDashboard() {
  const user = getCurrentUser();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Not Authenticated</h1>
          <p className="text-gray-600 mb-4">Please sign in to access the dashboard.</p>
          <button 
            onClick={() => window.location.href = '/auth'}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Show role-specific dashboard
  if (user.role === 'admin') {
    return <AdminDashboard />;
  } else if (user.role === 'parent') {
    return <EnhancedParentDashboard />;
  }

  // Fallback to basic dashboard
  return <AdminDashboard />;
}
