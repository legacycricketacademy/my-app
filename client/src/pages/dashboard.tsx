import { format } from "date-fns";
import { MainLayout } from "@/layout/main-layout";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/dashboard/stats-card";
import { AdminStatsCard } from "@/components/dashboard/admin-stats-card";
import { ScheduleCard } from "@/components/dashboard/schedule-card";
import { FitnessCard } from "@/components/dashboard/fitness-card";
import { PlayersCard } from "@/components/dashboard/players-card";
import { MealPlanCard } from "@/components/dashboard/meal-plan-card";
import { PaymentCard } from "@/components/dashboard/payment-card";
import { AnnouncementsCard } from "@/components/dashboard/announcements-card";
import { NotificationsCard } from "@/components/dashboard/notifications-card";
import { UserPlus, CalendarCheck2, Users, Heart, DollarSign, Megaphone, Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { SimpleScheduleDialog } from "@/components/sessions/simple-schedule-dialog";
import { Link } from "wouter";
import { getRole } from "@/lib/auth";
import { ErrorBoundary, RouteErrorBoundary } from "@/components/ui/ErrorBoundary";

export default function Dashboard() {
  const currentDate = format(new Date(), "EEEE, MMMM d, yyyy");
  const userRole = getRole();
  
  // Only fetch dashboard stats for non-admin users (parents)
  const { data: stats, isLoading } = useQuery<any>({
    queryKey: ["/api/dashboard/stats"],
    queryFn: () => api.get("/dashboard/stats"),
    enabled: userRole !== 'admin', // Only fetch if not admin
    retry: (failureCount, error) => {
      // Don't retry on 401/403 - likely auth issue
      if (error instanceof Error && (error.message.includes('401') || error.message.includes('403'))) {
        return false;
      }
      return failureCount < 2;
    }
  });
  
  return (
    <RouteErrorBoundary>
      <MainLayout title="Dashboard">
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 heading">Dashboard</h1>
            <p className="text-gray-600">{currentDate}</p>
          </div>
          
          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <Link href="/players/add">
              <Button className="flex items-center justify-center space-x-2">
                <UserPlus className="h-4 w-4 mr-1" />
                <span>Add New Player</span>
              </Button>
            </Link>
            <SimpleScheduleDialog />
          </div>
        </div>
        
        {/* Admin Stats - Only show for admin users */}
        {userRole === 'admin' && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Admin Overview</h2>
            <AdminStatsCard />
          </div>
        )}
        
        {/* Parent Stats - Only show for non-admin users */}
        {userRole !== 'admin' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <ErrorBoundary>
              <StatsCard 
                title="Registered Players"
                value={isLoading ? "..." : stats?.playerCount || 0}
                icon={<Users />}
                iconBgColor="bg-primary/10"
                iconColor="text-primary"
                changeText="+4 since last month"
                changeValue={4}
                changeColor="text-secondary"
              />
            </ErrorBoundary>
            
            <ErrorBoundary>
              <StatsCard 
                title="Upcoming Sessions"
                value={isLoading ? "..." : stats?.sessionCount || 0}
                icon={<CalendarCheck2 />}
                iconBgColor="bg-secondary/10"
                iconColor="text-secondary"
                changeText="Next: Today at 4:00 PM"
              />
            </ErrorBoundary>
            
            <ErrorBoundary>
              <StatsCard 
                title="Pending Payments"
                value={isLoading ? "..." : `$${Number(stats?.pendingPaymentsTotal || 0).toFixed(2)}`}
                icon={<DollarSign />}
                iconBgColor="bg-danger/10"
                iconColor="text-danger"
                changeText={`${stats?.pendingPaymentsCount || 0} players with pending fees`}
                changeValue={stats?.pendingPaymentsCount || 0}
                changeColor="text-danger"
              />
            </ErrorBoundary>
            
            <ErrorBoundary>
              <StatsCard 
                title="Recent Announcements"
                value={isLoading ? "..." : stats?.announcementCount || 0}
                icon={<Megaphone />}
                iconBgColor="bg-accent/10"
                iconColor="text-accent"
                changeText={stats?.lastAnnouncementDate ? `Last sent: ${formatDistanceToNow(new Date(stats.lastAnnouncementDate), { addSuffix: true })}` : "No recent announcements"}
              />
            </ErrorBoundary>
          </div>
        )}
      
        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Today's Schedule & Fitness Progress */}
          <div className="space-y-6">
            <ErrorBoundary>
              <ScheduleCard />
            </ErrorBoundary>
            <ErrorBoundary>
              <FitnessCard />
            </ErrorBoundary>
          </div>
          
          {/* Column 2: Players List & Meal Plan */}
          <div className="space-y-6">
            <ErrorBoundary>
              <PlayersCard />
            </ErrorBoundary>
            <ErrorBoundary>
              <MealPlanCard />
            </ErrorBoundary>
          </div>
          
          {/* Column 3: Upcoming Payments, Notifications & Announcements */}
          <div className="space-y-6">
            <ErrorBoundary>
              <PaymentCard />
            </ErrorBoundary>
            <ErrorBoundary>
              <NotificationsCard />
            </ErrorBoundary>
            <ErrorBoundary>
              <AnnouncementsCard />
            </ErrorBoundary>
          </div>
        </div>
      </MainLayout>
    </RouteErrorBoundary>
  );
  
  function formatDistanceToNow(date: Date, options: { addSuffix: boolean }): string {
    const now = new Date();
    const diffDays = Math.round(Math.abs((now.getTime() - date.getTime()) / (24 * 60 * 60 * 1000)));
    
    if (diffDays === 0) return "today";
    if (diffDays === 1) return "yesterday";
    if (diffDays <= 7) return `${diffDays} days ago`;
    if (diffDays <= 30) return `${Math.round(diffDays / 7)} weeks ago`;
    return `${Math.round(diffDays / 30)} months ago`;
  }
}
