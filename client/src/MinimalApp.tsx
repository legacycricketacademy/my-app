import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { queryClient } from "./lib/queryClient";
import { Switch, Route, Link } from "wouter";
import MinimalTest from "./pages/minimal-test";
import TestPage from "./pages/test-page";
import { OfflineDetector, OnlineStatusIndicator } from "@/components/offline-detector";
import ErrorBoundary from "@/components/error-boundary";

// Enhanced minimal app that works without auth dependencies
export default function MinimalApp() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <OfflineDetector />
        <div className="min-h-screen bg-slate-50">
          <nav className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex">
                  <div className="flex-shrink-0 flex items-center">
                    <Link href="/">
                      <span className="text-xl font-bold text-indigo-600">Cricket Academy</span>
                    </Link>
                  </div>
                  <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                    <Link href="/">
                      <span className="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                        Home
                      </span>
                    </Link>
                    <Link href="/test-page">
                      <span className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                        Test Page
                      </span>
                    </Link>
                  </div>
                </div>
                <div className="flex items-center">
                  <OnlineStatusIndicator />
                </div>
              </div>
            </div>
          </nav>
          
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              <Switch>
                <Route path="/" component={MinimalTest} />
                <Route path="/test-page" component={TestPage} />
                <Route path="/minimal-test" component={MinimalTest} />
                <Route>
                  <div className="min-h-[50vh] flex items-center justify-center">
                    <div className="text-center">
                      <h1 className="text-4xl font-bold text-gray-900">404</h1>
                      <p className="mt-2 text-lg text-gray-600">Page not found</p>
                      <div className="mt-6">
                        <Link href="/">
                          <span className="text-indigo-600 hover:text-indigo-500">
                            Go back home
                          </span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </Route>
              </Switch>
            </div>
          </main>
        </div>
        <Toaster />
      </ErrorBoundary>
    </QueryClientProvider>
  );
}