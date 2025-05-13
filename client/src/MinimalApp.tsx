import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Switch, Route } from "wouter";
import MinimalTest from "./pages/minimal-test";

// Minimal app without auth or other providers
export default function MinimalApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <Switch>
        <Route path="/" component={MinimalTest} />
        <Route path="/minimal-test" component={MinimalTest} />
      </Switch>
    </QueryClientProvider>
  );
}