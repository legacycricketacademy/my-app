import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";

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

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/players" component={PlayersPage} />
      <ProtectedRoute path="/schedule" component={SchedulePage} />
      <ProtectedRoute path="/fitness" component={FitnessPage} />
      <ProtectedRoute path="/meal-plans" component={MealPlansPage} />
      <ProtectedRoute path="/announcements" component={AnnouncementsPage} />
      <ProtectedRoute path="/payments" component={PaymentsPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <ProtectedRoute path="/import-data" component={ImportDataPage} />
      <Route component={NotFound} />
    </Switch>
  );
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
