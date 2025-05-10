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
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen max-w-md mx-auto text-center px-4">
          <h1 className="text-2xl font-bold mb-4">Account Pending Approval</h1>
          <p className="mb-4">
            Your {user.role} account is pending approval by an administrator. 
            You'll receive an email once your account has been approved.
          </p>
          <p className="text-sm text-gray-500">
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
