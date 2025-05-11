import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { Button } from "@/components/ui/button";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.ReactElement;
}) {
  const { user, isLoading, logoutMutation } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Check if the user is active and approved (for coach/admin roles)
  if ((user.role === 'coach' || user.role === 'admin') && 
      (user.status !== 'active' || user.isActive === false)) {
    
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
      <Route path={path}>
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
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}
