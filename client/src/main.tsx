import React from "react";
import { createRoot } from "react-dom/client";
import { Switch, Route } from "wouter";
import "./index.css";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import AuthPage from "./pages/auth-page";
import AuthCallback from "./pages/auth-callback";
import Dashboard from "./pages/dashboard";
import SchedulePage from "./pages/schedule";
import AdminSessionsPage from "./pages/admin-sessions";
import AddPlayerPage from "./pages/add-player";
import { RequireAuth, RequireRole } from "./components/auth/ProtectedRoute";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <Route path="/auth/callback" component={AuthCallback} />
      <Route path="/" component={() => (
        <RequireAuth>
          <Dashboard />
        </RequireAuth>
      )} />
      <Route path="/schedule" component={() => (
        <RequireAuth>
          <SchedulePage />
        </RequireAuth>
      )} />
      <Route path="/admin" component={() => (
        <RequireRole role="admin">
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
            <p>Admin-only content goes here</p>
          </div>
        </RequireRole>
      )} />
      <Route path="/admin/sessions" component={() => (
        <RequireRole role="admin">
          <AdminSessionsPage />
        </RequireRole>
      )} />
      <Route path="/players/add" component={() => (
        <RequireAuth>
          <AddPlayerPage />
        </RequireAuth>
      )} />
      <Route component={() => <div>404 Not Found</div>} />
    </Switch>
  );
}

function App() {
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
