import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/auth/session";
import { RequireAuth, RedirectIfAuthed } from "@/auth/guards";
import { ThemeProvider } from "@/providers/theme-provider";
import {
  OfflineDetector,
  OnlineStatusIndicator,
} from "@/components/offline-detector";
import ErrorBoundary from "@/components/error-boundary";

// Pages
import SimpleReactDashboard from "./pages/simple-react-dashboard";
import DirectParentDashboard from "@/pages/direct-parent-dashboard";
import IndependentDashboard from "@/pages/independent-dashboard";
import EnhancedParentDashboard from "@/pages/parent/enhanced-dashboard";
import ParentSchedulePage from "@/pages/parent/parent-schedule";
import ParentAnnouncementsPage from "@/pages/parent/announcements";
import ParentPaymentsPage from "@/pages/parent/payments";
import AuthPageLocal from "@/pages/auth-page-local";
import AuthPageDev from "@/pages/auth-page-dev";
import Dashboard from "@/pages/dashboard";
import PlayersPage from "@/pages/players-page";
import SchedulePage from "@/pages/schedule-page";
import AnnouncementsPage from "@/pages/announcements-page";
import ProfilePage from "@/pages/profile-page";
import NotFound from "@/pages/not-found";
import ForceLogoutPage from "@/pages/force-logout";
import RegisterDebug from "@/pages/register-debug";

// Admin Pages
import AdminDashboard from "@/pages/admin/admin-dashboard";
import CoachesPendingApprovalPage from "@/pages/admin/coaches-pending-approval";

// Dashboard Pages
import { DashboardLayout } from "@/layout/DashboardLayout";
import { ParentDashboardLayout } from "@/layout/ParentDashboardLayout";
import TeamPage from "@/pages/dashboard/TeamPage";
import DashboardAnnouncementsPage from "@/pages/dashboard/AnnouncementsPage";
import DashboardSchedulePage from "@/pages/dashboard/SchedulePage";
import PaymentsPage from "@/pages/dashboard/PaymentsPage";
import MealPlansPage from "@/pages/dashboard/MealPlansPage";
import FitnessTrackingPage from "@/pages/dashboard/FitnessTrackingPage";
import SectionNotFound from "@/pages/dashboard/SectionNotFound";
import ParentProfilePage from "@/pages/parent/profile";
import ConnectChildPage from "@/pages/parent/connect-child-page";
import FullCalendarPage from "@/pages/parent/FullCalendarPage";
import PaymentTransactionsPage from "@/pages/parent/PaymentTransactionsPage";

function AppRoutes() {
  const { user, isLoading } = useAuth();

  // For testing - will display parent view when passing ?view=parent in URL
  const urlParams = new URLSearchParams(window.location.search);
  const viewParam = urlParams.get("view");
  const isTestingParentView = viewParam === "parent";

  // Show loading spinner while authentication is being verified
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        <span className="ml-2">Loading authentication...</span>
      </div>
    );
  }

  // Check if user is a parent user
  const isParentUser = user?.role === "parent";

  return (
    <Routes>
      {/* Auth route - redirect to dashboard if authenticated */}
      <Route
        path="/auth"
        element={
          <RedirectIfAuthed>
            <AuthPageDev />
          </RedirectIfAuthed>
        }
      />

      {/* Main dashboard route with nested routes - require authentication */}
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <DashboardLayout />
          </RequireAuth>
        }
      >
        {/* Dashboard index route */}
        <Route
          index
          element={
            isTestingParentView ? (
              <EnhancedParentDashboard />
            ) : (
              <Dashboard />
            )
          }
        />
        
        {/* Dashboard section routes */}
        <Route path="team" element={<TeamPage />} />
        <Route path="announcements" element={<DashboardAnnouncementsPage />} />
        <Route path="schedule" element={<DashboardSchedulePage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="meal-plans" element={<MealPlansPage />} />
        <Route path="fitness" element={<FitnessTrackingPage />} />
        
        {/* Dashboard catch-all */}
        <Route path="*" element={<SectionNotFound />} />
      </Route>

      {/* Root path - redirect to auth if not authenticated */}
      <Route
        path="/"
        element={
          <RedirectIfAuthed>
            <Navigate to="/auth" />
          </RedirectIfAuthed>
        }
      />
      <Route path="/admin" element={<Navigate to="/dashboard" />} />

      {/* Parent Portal Routes - Single Layout with Outlet */}
      <Route
        element={
          <RequireAuth>
            {user?.role === "parent" ? (
              <ParentDashboardLayout />
            ) : (
              <Navigate to="/dashboard" />
            )}
          </RequireAuth>
        }
      >
        <Route path="/dashboard/parent" element={<EnhancedParentDashboard />} />
        <Route path="/parent" element={<Navigate to="/dashboard/parent" />} />
        <Route path="/parent/schedule" element={<ParentSchedulePage />} />
        <Route path="/parent/schedule/full" element={<FullCalendarPage />} />
        <Route path="/parent/announcements" element={<ParentAnnouncementsPage />} />
        <Route path="/parent/payments" element={<ParentPaymentsPage />} />
        <Route path="/parent/payments/transactions" element={<PaymentTransactionsPage />} />
        <Route path="/parent/connect-child" element={<ConnectChildPage />} />
        <Route path="/parent/profile" element={<ParentProfilePage />} />
      </Route>

      {/* Test parent routes */}
      <Route path="/simple-parent" element={<SimpleReactDashboard />} />
      <Route path="/independent-parent" element={<IndependentDashboard />} />
      <Route path="/test-enhanced-parent" element={<EnhancedParentDashboard />} />

      {/* Legacy player routes - redirect to dashboard */}
      <Route path="/players" element={<Navigate to="/dashboard/team" />} />
      <Route path="/players/add" element={<Navigate to="/dashboard/team?add=true" />} />

      {/* Settings route (outside dashboard) */}
      <Route
        path="/settings"
        element={
          user ? (
            <div className="p-6">
              <h1 className="text-2xl font-bold mb-4">Settings</h1>
              <p>Settings page is coming soon!</p>
            </div>
          ) : (
            <Navigate to="/auth" />
          )
        }
      />

      {/* Common routes for all users */}
      <Route
        path="/profile"
        element={user ? <ProfilePage /> : <Navigate to="/auth" />}
      />

      {/* Public routes */}
      <Route path="/emergency-logout" element={<ForceLogoutPage />} />
      
      {/* Debug routes - accessible without login */}
      <Route path="/register-debug" element={<RegisterDebug />} />

      {/* Catch-all route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider
            defaultTheme="system"
            storageKey="cricket-academy-theme"
          >
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
            <Toaster />
            <OfflineDetector />
            <OnlineStatusIndicator />
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;