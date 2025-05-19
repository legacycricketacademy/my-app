import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ThemeProvider } from "@/providers/theme-provider";
import { OfflineDetector, OnlineStatusIndicator } from "@/components/offline-detector";
import ErrorBoundary from "@/components/error-boundary";

// Pages
import ParentDashboard from "@/pages/simple-react-dashboard";
import DirectParentDashboard from "@/pages/direct-parent-dashboard";
import ParentSchedulePage from "@/pages/parent/parent-schedule";
import ParentAnnouncementsPage from "@/pages/parent/announcements";
import ParentPaymentsPage from "@/pages/parent/payments";
import AuthPageLocal from "@/pages/auth-page-local";
import Dashboard from "@/pages/dashboard";
import PlayersPage from "@/pages/players-page";
import SchedulePage from "@/pages/schedule-page";
import AnnouncementsPage from "@/pages/announcements-page";
import ProfilePage from "@/pages/profile-page";
import NotFound from "@/pages/not-found";
import ForceLogoutPage from "@/pages/force-logout";

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
  
  // Check if user is a parent or testing parent view
  const isParentUser = user && (user.role === "parent" || isTestingParentView);
  
  // Debug logging to help troubleshoot routing
  console.log("App Routing - User:", user);
  console.log("App Routing - Is Parent View:", isParentUser);
  
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
      
      {/* Home Route - show simple parent dashboard for testing */}
      <Route path="/" element={<ParentDashboard />} />
      
      {/* Parent Dashboard Routes */}
      <Route path="/dashboard/parent" element={
        user ? (
          isParentUser ? <ParentDashboard /> : <Navigate to="/" />
        ) : (
          <Navigate to="/auth" />
        )
      } />
      
      {/* Enhanced parent route with the full React dashboard component */}
      <Route path="/parent" element={<DirectParentDashboard />} />
      
      {/* Simple React parent dashboard with minimal dependencies */}
      <Route path="/simple-parent" element={<SimpleReactDashboard />} />
      
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
          isParentUser ? <ParentPaymentsPage /> : <Navigate to="/" />
        ) : (
          <Navigate to="/auth" />
        )
      } />
      
      {/* Legacy parent route for backward compatibility */}
      <Route path="/parent" element={<Navigate to="/dashboard/parent" />} />
      
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