import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ThemeProvider } from "@/providers/theme-provider";
import { OfflineDetector, OnlineStatusIndicator } from "@/components/offline-detector";
import ErrorBoundary from "@/components/error-boundary";

// Parent Dashboard and related components
import ParentDashboard from "@/pages/parent-dashboard";
import ParentSchedulePage from "@/pages/parent/parent-schedule";
import ParentAnnouncementsPage from "@/pages/parent/announcements";
import ParentPaymentsPage from "@/pages/parent/payments";

// Admin/Coach Pages
import AuthPage from "@/pages/auth-page";
import AuthPageLocal from "@/pages/auth-page-local";
import Dashboard from "@/pages/dashboard";
import PlayersPage from "@/pages/players-page";
import SchedulePage from "@/pages/schedule-page";
import AnnouncementsPage from "@/pages/announcements-page";
import ProfilePage from "@/pages/profile-page";
import NotFound from "@/pages/not-found";
import ForceLogoutPage from "@/pages/force-logout";
import VerifyEmailPage from "@/pages/verify-email";

function AppRoutes() {
  const { user, isLoading } = useAuth();
  
  // For testing - will display parent view when passing ?view=parent in URL
  const urlParams = new URLSearchParams(window.location.search);
  const viewParam = urlParams.get('view');
  const isTestingParentView = viewParam === 'parent';
  
  // Show loading spinner while authentication is being verified
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        <span className="ml-2">Loading authentication...</span>
      </div>
    );
  }
  
  const isParentUser = user && (user.role === "parent" || isTestingParentView);
  
  return (
    <Routes>
      {/* Auth Route - accessible to non-logged in users */}
      <Route path="/auth" element={
        user ? (
          isParentUser ? <Navigate to="/dashboard/parent" /> : <Navigate to="/" />
        ) : (
          <AuthPageLocal />
        )
      } />
      
      {/* Home Route - redirects based on user role */}
      <Route path="/" element={
        user ? (
          isParentUser ? <Navigate to="/dashboard/parent" /> : <Dashboard />
        ) : (
          <Navigate to="/auth" />
        )
      } />
      
      {/* Parent Dashboard */}
      <Route path="/dashboard/parent" element={
        user ? (
          isParentUser ? <ParentDashboard /> : <Navigate to="/" />
        ) : (
          <Navigate to="/auth" />
        )
      } />
      
      {/* Legacy parent route for backward compatibility */}
      <Route path="/parent" element={<Navigate to="/dashboard/parent" />} />
      
      {/* Parent sub-routes */}
      <Route path="/parent/schedule" element={
        user ? (
          isParentUser ? <ParentSchedulePage /> : <Navigate to="/schedule" />
        ) : (
          <Navigate to="/auth" />
        )
      } />
      
      <Route path="/parent/announcements" element={
        user ? (
          isParentUser ? <ParentAnnouncementsPage /> : <Navigate to="/announcements" />
        ) : (
          <Navigate to="/auth" />
        )
      } />
      
      <Route path="/parent/payments" element={
        user ? (
          isParentUser ? <ParentPaymentsPage /> : <Navigate to="/payments" />
        ) : (
          <Navigate to="/auth" />
        )
      } />
      
      {/* Admin/Coach Routes */}
      <Route path="/players" element={
        user ? (
          !isParentUser ? <PlayersPage /> : <Navigate to="/dashboard/parent" />
        ) : (
          <Navigate to="/auth" />
        )
      } />
      
      <Route path="/schedule" element={
        user ? (
          !isParentUser ? <SchedulePage /> : <Navigate to="/parent/schedule" />
        ) : (
          <Navigate to="/auth" />
        )
      } />
      
      <Route path="/announcements" element={
        user ? (
          !isParentUser ? <AnnouncementsPage /> : <Navigate to="/parent/announcements" />
        ) : (
          <Navigate to="/auth" />
        )
      } />
      
      {/* Common routes for all users */}
      <Route path="/profile" element={
        user ? <ProfilePage /> : <Navigate to="/auth" />
      } />
      
      {/* Public routes */}
      <Route path="/emergency-logout" element={<ForceLogoutPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      
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
          <ThemeProvider defaultTheme="system" storageKey="cricket-academy-theme">
            <Router>
              <AppRoutes />
            </Router>
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