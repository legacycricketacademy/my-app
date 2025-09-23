import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Switch, Route, useLocation } from "wouter";
import "./index.css";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { initAuth } from "./lib/auth";
import { Toaster } from "@/components/ui/toaster";
import { RedirectSentry } from "./lib/router";
import AuthPage from "./pages/auth-page";
import AuthCallback from "./pages/auth-callback";
import RoleBasedDashboard from "./components/RoleBasedDashboard";
import SchedulePage from "./pages/schedule";
import AdminSessionsPage from "./pages/admin-sessions";
import AdminDashboard from "./pages/admin/admin-dashboard";
import CoachesPage from "./pages/admin/coaches";
import AdminPaymentsPage from "./pages/admin/payments";
import ReportsPage from "./pages/admin/reports";
import UsersPage from "./pages/admin/users";
import EnhancedParentDashboard from "./pages/parent/enhanced-dashboard";
import AddPlayerPage from "./pages/add-player";
import PlayersPage from "./pages/players";
import PaymentsPage from "./pages/payments";
import ConnectionRequestsPage from "./pages/connection-requests";
import AccountPage from "./pages/account";
import { RequireAuth, RequireRole } from "./components/auth/ProtectedRoute";
import { getCurrentUser } from "./lib/auth";


// Role-based redirect component
function RoleRedirect() {
  const user = getCurrentUser();
  const [location, setLocation] = useLocation();
  
  React.useEffect(() => {
    // Only redirect if we're on the root path
    if (location === '/') {
      if (user?.role === 'admin') {
        setLocation('/admin', { replace: true });
      } else if (user?.role === 'parent') {
        setLocation('/dashboard/parent', { replace: true });
      } else {
        setLocation('/auth', { replace: true });
      }
    }
  }, [user, setLocation, location]);
  
  return <div>Redirecting...</div>;
}

function Router() {
  return (
    <>
      <RedirectSentry />
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <Route path="/auth/callback" component={AuthCallback} />
        
        {/* Admin routes - specific before generic */}
        <Route path="/admin/sessions">
          <RequireRole role="admin">
            <AdminSessionsPage />
          </RequireRole>
        </Route>
        <Route path="/admin/coaches">
          <RequireRole role="admin">
            <CoachesPage />
          </RequireRole>
        </Route>
        <Route path="/admin/payments">
          <RequireRole role="admin">
            <AdminPaymentsPage />
          </RequireRole>
        </Route>
        <Route path="/admin/reports">
          <RequireRole role="admin">
            <ReportsPage />
          </RequireRole>
        </Route>
        <Route path="/admin/users">
          <RequireRole role="admin">
            <UsersPage />
          </RequireRole>
        </Route>
        <Route path="/admin">
          <RequireRole role="admin">
            <AdminDashboard />
          </RequireRole>
        </Route>
        
        {/* Parent routes */}
        <Route path="/dashboard/parent" component={() => (
          <RequireAuth>
            <EnhancedParentDashboard />
          </RequireAuth>
        )} />
        
        {/* Other protected routes */}
        <Route path="/schedule" component={() => (
          <RequireAuth>
            <SchedulePage />
          </RequireAuth>
        )} />
        <Route path="/players/add" component={() => (
          <RequireAuth>
            <AddPlayerPage />
          </RequireAuth>
        )} />
        <Route path="/players" component={() => (
          <RequireAuth>
            <PlayersPage />
          </RequireAuth>
        )} />
        <Route path="/payments" component={() => (
          <RequireAuth>
            <PaymentsPage />
          </RequireAuth>
        )} />
        <Route path="/connection-requests" component={() => (
          <RequireRole role="admin">
            <ConnectionRequestsPage />
          </RequireRole>
        )} />
        <Route path="/account" component={() => (
          <RequireAuth>
            <AccountPage />
          </RequireAuth>
        )} />
        
        {/* Root route with role-based redirect */}
        <Route path="/" component={() => (
          <RequireAuth>
            <RoleRedirect />
          </RequireAuth>
        )} />
        
        {/* 404 fallback */}
        <Route component={() => <div>404 Not Found</div>} />
      </Switch>
    </>
  );
}

function App() {
  // Initialize authentication on app bootstrap
  useEffect(() => {
    initAuth().catch((error) => {
      console.error('Failed to initialize authentication:', error);
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

const container = document.getElementById("root");
if (!container) throw new Error("Root element not found");

const root = createRoot(container);
root.render(<App />);
