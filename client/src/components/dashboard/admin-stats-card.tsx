import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { StatsCard } from "./stats-card";
import { Users, DollarSign, Calendar, Megaphone } from "lucide-react";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

function AdminStatsCardContent() {
  const { data: stats, isLoading, error } = useQuery<any>({
    queryKey: ["/api/admin/stats"],
    queryFn: () => api.get("/admin/stats"),
    retry: (failureCount, error) => {
      // Don't retry on 403 (Forbidden) - user doesn't have admin role
      if (error instanceof Error && error.message.includes('403')) {
        return false;
      }
      return failureCount < 2;
    }
  });

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-600 mb-2">Couldn't load admin stats</p>
        <p className="text-xs text-gray-500">Access denied or network error</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard 
        title="Total Users"
        value={isLoading ? "..." : stats?.totalUsers || 0}
        icon={<Users />}
        iconBgColor="bg-blue-100"
        iconColor="text-blue-600"
        changeText="Active users"
      />
      
      <StatsCard 
        title="Total Players"
        value={isLoading ? "..." : stats?.totalPlayers || 0}
        icon={<Users />}
        iconBgColor="bg-green-100"
        iconColor="text-green-600"
        changeText="Registered players"
      />
      
      <StatsCard 
        title="Total Revenue"
        value={isLoading ? "..." : `$${Number(stats?.totalRevenue || 0).toFixed(2)}`}
        icon={<DollarSign />}
        iconBgColor="bg-yellow-100"
        iconColor="text-yellow-600"
        changeText="This month"
      />
      
      <StatsCard 
        title="Active Sessions"
        value={isLoading ? "..." : stats?.activeSessions || 0}
        icon={<Calendar />}
        iconBgColor="bg-purple-100"
        iconColor="text-purple-600"
        changeText="Currently running"
      />
    </div>
  );
}

export function AdminStatsCard() {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 mb-2">Couldn't load admin stats</p>
          <p className="text-xs text-gray-500">Something went wrong</p>
        </div>
      }
    >
      <AdminStatsCardContent />
    </ErrorBoundary>
  );
}
