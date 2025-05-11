import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import { RoleBasedRoute } from "./lib/role-based-route";
import { Redirect } from "wouter";
import { OfflineDetector, OnlineStatusIndicator } from "@/components/offline-detector";

// Admin/Coach Pages
import AuthPage from "@/pages/auth-page";
import AuthPageLocal from "@/pages/auth-page-local";
import Dashboard from "@/pages/dashboard";
import PlayersPage from "@/pages/players-page";
import PlayerDetailPage from "@/pages/player-detail-page";
import SchedulePage from "@/pages/schedule-page";
import FitnessPage from "@/pages/fitness-page";
import MealPlansPage from "@/pages/meal-plans-page";
import AnnouncementsPage from "@/pages/announcements-page";
import PaymentsPage from "@/pages/payments-page";
import EnhancedPaymentsPage from "@/pages/enhanced-payments-page";
import SettingsPage from "@/pages/settings-page";
import ImportDataPage from "@/pages/import-data-page";
import ProfilePage from "@/pages/profile-page";
import NotFound from "@/pages/not-found";
import PlayersPendingReviewPage from "@/pages/admin/players-pending-review";
import CoachesPendingApprovalPage from "@/pages/admin/coaches-pending-approval";

// Parent Pages
import ParentDashboard from "@/pages/parent-dashboard";
import ParentSchedulePage from "@/pages/parent/parent-schedule";
import ParentTest from "@/pages/parent-test";
import StripeDebugPage from "@/pages/stripe-debug";
import ConnectChildPage from "@/pages/parent/connect-child";
import ConnectChildSimplePage from "@/pages/parent/connect-child-simple";
import ConnectChildNewPage from "@/pages/parent/connect-child-new";
import ManageParentConnectionsPage from "@/pages/manage-parent-connections";
import ParentPaymentsPage from "@/pages/parent/payments";
import MakePaymentPage from "@/pages/parent/make-payment";
import MakePaymentNewPage from "@/pages/parent/make-payment-new";
import PaymentSuccessPage from "@/pages/parent/payment-success";
import PaymentDebugPage from "@/pages/parent/payment-debug";
import ParentAnnouncementsPage from "@/pages/parent/announcements";

function RouterContent() {
  const { user } = useAuth();
  
  // For testing only - will display parent view when passing ?view=parent in URL
  const urlParams = new URLSearchParams(window.location.search);
  const viewParam = urlParams.get('view');
  const isTestingParentView = viewParam === 'parent';
  
  // If user is logged in, redirect based on role
  if (user) {
    if (user.role === "parent" || isTestingParentView) {
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
    } else if (!isTestingParentView) {
      // Redirect parent routes to admin dashboard
      if (
        window.location.pathname === "/parent" ||
        window.location.pathname === "/parent/schedule" ||
        window.location.pathname === "/parent/fitness" ||
        window.location.pathname === "/parent/meal-plans" ||
        window.location.pathname === "/parent/announcements" ||
        window.location.pathname === "/parent/payments" ||
        window.location.pathname === "/parent/payment-success" ||
        window.location.pathname === "/parent/make-payment-new" ||
        window.location.pathname.startsWith("/parent/make-payment/")
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
        path="/players/add" 
        component={PlayersPage} 
        allowedRoles={["admin", "coach"]}
        redirectTo="/parent"
      />
      <RoleBasedRoute 
        path="/player/:id" 
        component={PlayerDetailPage} 
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
        component={EnhancedPaymentsPage} 
        allowedRoles={["admin", "coach"]}
        redirectTo="/parent"
      />
      <RoleBasedRoute 
        path="/payments-legacy" 
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
      
      <RoleBasedRoute 
        path="/parent/announcements" 
        component={ParentAnnouncementsPage} 
        allowedRoles={["parent"]}
        redirectTo="/announcements"
      />
      
      <RoleBasedRoute 
        path="/parent/connect-child" 
        component={ConnectChildNewPage} 
        allowedRoles={["parent"]}
        redirectTo="/"
      />

      <RoleBasedRoute 
        path="/parent/payments" 
        component={ParentPaymentsPage} 
        allowedRoles={["parent"]}
        redirectTo="/payments"
      />

      <RoleBasedRoute 
        path="/parent/make-payment/:playerId" 
        component={MakePaymentPage} 
        allowedRoles={["parent"]}
        redirectTo="/payments"
      />
      
      {/* Adding this route since parent/payments/new button currently links here */}
      <RoleBasedRoute
        path="/parent/payments/new"
        component={MakePaymentNewPage}
        allowedRoles={["parent"]}
        redirectTo="/payments"
      />
      
      {/* Route for the new make payment page */}
      <RoleBasedRoute
        path="/parent/make-payment-new"
        component={MakePaymentNewPage}
        allowedRoles={["parent", "admin", "coach"]}
        redirectTo="/payments"
      />

      <RoleBasedRoute 
        path="/parent/payment-success" 
        component={PaymentSuccessPage} 
        allowedRoles={["parent"]}
        redirectTo="/payments"
      />

      <RoleBasedRoute 
        path="/parent/payment-debug" 
        component={PaymentDebugPage} 
        allowedRoles={["parent"]}
        redirectTo="/payments"
      />
      
      <RoleBasedRoute 
        path="/manage-connections" 
        component={ManageParentConnectionsPage} 
        allowedRoles={["admin", "coach"]}
        redirectTo="/parent"
      />

      <RoleBasedRoute 
        path="/players-pending-review" 
        component={PlayersPendingReviewPage} 
        allowedRoles={["admin", "coach"]}
        redirectTo="/parent"
      />
      
      <RoleBasedRoute 
        path="/coaches-pending-approval" 
        component={CoachesPendingApprovalPage} 
        allowedRoles={["admin"]}
        redirectTo="/"
      />
      
      {/* Add alternative path for admin/coaches to handle the URL in the email link */}
      <RoleBasedRoute 
        path="/admin/coaches" 
        component={CoachesPendingApprovalPage} 
        allowedRoles={["admin"]}
        redirectTo="/"
      />
      
      {/* Profile page - accessible to all authenticated users */}
      <ProtectedRoute path="/profile" component={ProfilePage} />
      
      {/* Special testing route - accessible to everyone */}
      <Route path="/parent-test" component={ParentTest} />
      
      {/* Public diagnostic routes */}
      <Route path="/stripe-debug" component={StripeDebugPage} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function Router() {
  const { isLoading, user } = useAuth();
  
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
        <OfflineDetector />
        <OnlineStatusIndicator />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
