import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, RouteComponentProps } from "wouter";
import { UserRole } from "@shared/schema";

type RoleBasedRouteProps = {
  path: string;
  component: React.ComponentType;
  allowedRoles: UserRole[];
  redirectTo?: string;
};

export function RoleBasedRoute({
  path,
  component: Component,
  allowedRoles,
  redirectTo = "/dashboard",
}: RoleBasedRouteProps) {
  const { user, isLoading } = useAuth();
  
  // For testing only - will allow access to parent or admin views
  const urlParams = new URLSearchParams(window.location.search);
  const viewParam = urlParams.get('view');
  const isTestingParentView = viewParam === 'parent';
  const isTestingAdminView = viewParam === 'admin';
  
  return (
    <Route path={path}>
      {(params) => {
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }

        // If no user, redirect to auth
        if (!user) {
          return <Redirect to="/auth" />;
        }

        // Special test case for parent view
        if (isTestingParentView && allowedRoles.includes("parent")) {
          return <Component {...params} />;
        }
        
        // Special test case for admin view
        if (isTestingAdminView && allowedRoles.includes("admin")) {
          return <Component {...params} />;
        }

        // Check user's actual role
        if (!allowedRoles.includes(user.role as UserRole)) {
          return <Redirect to={redirectTo} />;
        }

        // Check if the user is active and approved (for coach/admin roles)
        if ((user.role === 'coach' || user.role === 'admin') && 
            (user.status !== 'active' || user.isActive === false)) {
          return (
            <div className="flex flex-col items-center justify-center min-h-screen max-w-md mx-auto text-center px-4">
              <h1 className="text-2xl font-bold mb-4">Account Pending Approval</h1>
              <p className="mb-4">
                Your {user.role} account is pending approval by an administrator. 
                You'll receive an email once your account has been approved.
              </p>
              <p className="text-sm text-gray-500">
                If you have any questions, please contact the system administrator.
              </p>
              <button 
                onClick={() => window.location.href = '/api/logout'}
                className="mt-6 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
              >
                Logout
              </button>
            </div>
          );
        }

        // Render the component with the params
        return <Component {...params} />;
      }}
    </Route>
  );
}