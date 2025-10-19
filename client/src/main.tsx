/**
 * Main application entry point
 * Uses the refactored authentication service
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/providers/theme-provider';
import { AuthProvider } from '@/contexts/auth-context';
import App from './App';
import './index.css';
import axios from 'axios';

// Set up axios defaults for credentials
axios.defaults.withCredentials = true;

// Create a new query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Create portal roots for date pickers (so they render above modals)
if (!document.getElementById('app-date-portal')) {
  const portal = document.createElement('div');
  portal.id = 'app-date-portal';
  document.body.appendChild(portal);
}

if (!document.getElementById('calendar-portal')) {
  const calendarPortal = document.createElement('div');
  calendarPortal.id = 'calendar-portal';
  document.body.appendChild(calendarPortal);
}

// Render the app
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <App />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
