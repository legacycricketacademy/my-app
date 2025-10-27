import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from '@/shared/toast';
import { useAuth } from "@/auth/session";
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
import AdminFitness from "@/pages/admin/Fitness";
import ParentFitness from "@/pages/parent/Fitness";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ParentAvailability from "@/pages/parent/Availability";
import { flags } from "@/utils/featureFlags";

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
import SettingsPage from "@/pages/settings/SettingsPage";
import ParentProfilePage from "@/pages/parent/profile";
import ParentSettingsPage from "@/pages/parent/SettingsPage";
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
            isParentUser ? (
              <Navigate to="/parent" replace />
            ) : isTestingParentView ? (
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
        <Route path="fitness" element={<AdminFitness />} />
        <Route path="settings" element={<SettingsPage />} />
        
        {/* Remove the catch-all route that was causing issues */}
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
      
      {/* Admin redirect - move outside dashboard routes */}
      <Route path="/admin" element={<Navigate to="/dashboard" replace />} />

      {/* Parent Portal Routes - Single Layout with Outlet */}
      <Route
        path="/parent"
        element={
          <RequireAuth>
            {user?.role === "parent" ? (
              <ParentDashboardLayout />
            ) : (
              <Navigate to="/dashboard" replace />
            )}
          </RequireAuth>
        }
      >
        <Route index element={<EnhancedParentDashboard />} />
        <Route path="schedule" element={<ParentSchedulePage />} />
        <Route path="schedule/full" element={<FullCalendarPage />} />
        <Route path="announcements" element={<ParentAnnouncementsPage />} />
        <Route path="payments" element={<ParentPaymentsPage />} />
        <Route path="payments/transactions" element={<PaymentTransactionsPage />} />
        <Route path="connect-child" element={<ConnectChildPage />} />
        <Route path="profile" element={<ParentProfilePage />} />
        <Route path="settings" element={<ParentSettingsPage />} />
        <Route path="availability" element={<ParentAvailability />} />
      </Route>
      
      {/* Parent dashboard redirect */}
      <Route path="/dashboard/parent" element={<Navigate to="/parent" replace />} />

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

      {/* Auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Catch-all route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          defaultTheme="system"
          storageKey="cricket-academy-theme"
        >
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
          <Toaster />
          <SonnerToaster />
          <OfflineDetector />
          <OnlineStatusIndicator />
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;