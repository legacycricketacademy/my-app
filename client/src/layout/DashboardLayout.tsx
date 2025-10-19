import { Outlet } from "react-router-dom";
import { Suspense } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { PageLoader } from "@/components/ui/page-loader";
import { useAuth } from "@/auth/session";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { VerifyEmailBanner } from "@/components/VerifyEmailBanner";

export function DashboardLayout() {
  const { user, logoutMutation } = useAuth();
  const shouldShowBanner = user && user.emailVerified === false; // explicit false

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              {user?.role === "parent" ? "Parent Portal" : "Coach Dashboard"}
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {user?.fullName || "User"}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => logoutMutation.mutate()}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </header>
        
        {/* Email Verification Banner */}
        {shouldShowBanner && <VerifyEmailBanner />}
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
}
