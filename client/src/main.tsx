import React from "react";
import { createRoot } from "react-dom/client";
import { Switch, Route } from "wouter";
import "./index.css";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import AuthPageLocal from "./pages/auth-page-local";
import AuthCallback from "./pages/auth-callback";

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPageLocal} />
      <Route path="/auth/callback" component={AuthCallback} />
      <Route path="/" component={() => <div>Home Page</div>} />
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
