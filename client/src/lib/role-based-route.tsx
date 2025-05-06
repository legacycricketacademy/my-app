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

        // If user doesn't have the required role, redirect
        if (!allowedRoles.includes(user.role as UserRole)) {
          return <Redirect to={redirectTo} />;
        }

        // Render the component with the params
        return <Component {...params} />;
      }}
    </Route>
  );
}