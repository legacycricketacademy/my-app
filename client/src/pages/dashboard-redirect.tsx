import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';

export default function DashboardRedirect() {
  const [, navigate] = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    // If user is a parent, redirect to parent dashboard
    if (user && user.role === 'parent') {
      navigate('/parent');
    } else if (user) {
      // If user is admin or coach, redirect to admin dashboard
      navigate('/');
    } else {
      // If not logged in, redirect to auth page
      navigate('/auth');
    }
  }, [user, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full"></div>
      <p className="mt-4 text-lg">Loading your dashboard...</p>
    </div>
  );
}