import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, RouteComponentProps } from "wouter";
import { UserRole } from "@shared/schema";
import { Button } from "@/components/ui/button";

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
  const { user, isLoading, logoutMutation } = useAuth();
  
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
            (user.status === 'pending' || user.status === 'rejected' || user.status === 'suspended' || user.isActive === false)) {
          
          // Different messages based on status
          let title = "Account Pending Approval";
          let message = "Your account is pending approval by an administrator. You'll receive an email once your account has been approved.";
          
          if (user.status === 'rejected') {
            title = "Account Not Approved";
            message = "Your account registration was not approved. Please contact the system administrator for more information.";
          } else if (user.status === 'suspended') {
            title = "Account Suspended";
            message = "Your account has been temporarily suspended. Please contact the system administrator for assistance.";
          } else if (user.status === 'pending_verification') {
            title = "Email Verification Required";
            message = "Please verify your email address to activate your account. Check your inbox for a verification email.";
          }
          
          return (
            <div className="flex flex-col items-center justify-center min-h-screen max-w-md mx-auto text-center px-4">
              <h1 className="text-2xl font-bold mb-4">{title}</h1>
              <p className="mb-4">
                {message}
              </p>
              <p className="text-sm text-gray-500 mb-4">
                If you have any questions, please contact the system administrator.
              </p>
              <Button
                onClick={() => logoutMutation.mutate()}
                className="mt-6"
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? "Logging out..." : "Logout"}
              </Button>
            </div>
          );
        }

        // Render the component with the params
        return <Component {...params} />;
      }}
    </Route>
  );
}