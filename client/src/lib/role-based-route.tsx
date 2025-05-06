import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
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

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  // If no user, redirect to auth
  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // If user doesn't have the required role, redirect
  if (!allowedRoles.includes(user.role as UserRole)) {
    return (
      <Route path={path}>
        <Redirect to={redirectTo} />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}