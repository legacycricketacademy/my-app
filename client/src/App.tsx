import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import { RoleBasedRoute } from "./lib/role-based-route";
import { Redirect } from "wouter";

// Admin/Coach Pages
import AuthPage from "@/pages/auth-page";
import Dashboard from "@/pages/dashboard";
import PlayersPage from "@/pages/players-page";
import SchedulePage from "@/pages/schedule-page";
import FitnessPage from "@/pages/fitness-page";
import MealPlansPage from "@/pages/meal-plans-page";
import AnnouncementsPage from "@/pages/announcements-page";
import PaymentsPage from "@/pages/payments-page";
import SettingsPage from "@/pages/settings-page";
import ImportDataPage from "@/pages/import-data-page";
import NotFound from "@/pages/not-found";

// Parent Pages
import ParentDashboard from "@/pages/parent-dashboard";
import ParentSchedulePage from "@/pages/parent/parent-schedule";

function RouterContent() {
  const { user } = useAuth();
  
  // If user is logged in, redirect based on role
  if (user) {
    if (user.role === "parent") {
      // Redirect admin/coach routes to parent dashboard
      if (
        window.location.pathname === "/" ||
        window.location.pathname === "/players" ||
        window.location.pathname === "/schedule" ||
        window.location.pathname === "/fitness" ||
        window.location.pathname === "/meal-plans" ||
        window.location.pathname === "/announcements" ||
        window.location.pathname === "/payments" ||
        window.location.pathname === "/settings" ||
        window.location.pathname === "/import-data"
      ) {
        return <Redirect to="/parent" />;
      }
    } else {
      // Redirect parent routes to admin dashboard
      if (
        window.location.pathname === "/parent" ||
        window.location.pathname === "/parent/schedule" ||
        window.location.pathname === "/parent/fitness" ||
        window.location.pathname === "/parent/meal-plans" ||
        window.location.pathname === "/parent/announcements"
      ) {
        return <Redirect to="/" />;
      }
    }
  }
  
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      
      {/* Admin and Coach Routes */}
      <RoleBasedRoute 
        path="/" 
        component={Dashboard} 
        allowedRoles={["admin", "coach"]}
        redirectTo="/parent"
      />
      <RoleBasedRoute 
        path="/players" 
        component={PlayersPage} 
        allowedRoles={["admin", "coach"]}
        redirectTo="/parent"
      />
      <RoleBasedRoute 
        path="/schedule" 
        component={SchedulePage} 
        allowedRoles={["admin", "coach"]}
        redirectTo="/parent/schedule"
      />
      <RoleBasedRoute 
        path="/fitness" 
        component={FitnessPage} 
        allowedRoles={["admin", "coach"]}
        redirectTo="/parent/fitness"
      />
      <RoleBasedRoute 
        path="/meal-plans" 
        component={MealPlansPage} 
        allowedRoles={["admin", "coach"]}
        redirectTo="/parent/meal-plans"
      />
      <RoleBasedRoute 
        path="/announcements" 
        component={AnnouncementsPage} 
        allowedRoles={["admin", "coach"]}
        redirectTo="/parent/announcements"
      />
      <RoleBasedRoute 
        path="/payments" 
        component={PaymentsPage} 
        allowedRoles={["admin", "coach"]}
        redirectTo="/parent"
      />
      <RoleBasedRoute 
        path="/settings" 
        component={SettingsPage} 
        allowedRoles={["admin", "coach"]}
        redirectTo="/parent"
      />
      <RoleBasedRoute 
        path="/import-data" 
        component={ImportDataPage} 
        allowedRoles={["admin", "coach"]}
        redirectTo="/parent"
      />
      
      {/* Parent Routes */}
      <RoleBasedRoute 
        path="/parent" 
        component={ParentDashboard} 
        allowedRoles={["parent"]}
        redirectTo="/"
      />
      <RoleBasedRoute 
        path="/parent/schedule" 
        component={ParentSchedulePage} 
        allowedRoles={["parent"]}
        redirectTo="/schedule"
      />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function Router() {
  const { isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  return <RouterContent />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
