import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserCheck, Calendar, DollarSign, AlertTriangle, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { TID } from "@/ui/testids";

export default function AdminDashboard() {
  // Fetch basic stats for the dashboard
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/admin/stats");
        if (response.ok) {
          return response.json();
        }
        return null;
      } catch (error) {
        console.error("Failed to fetch admin stats:", error);
        return null;
      }
    },
  });

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
          <span className="ml-2">Loading dashboard...</span>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight" data-testid={TID.dashboard.title}>Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your cricket academy operations
          </p>
        </div>


        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card data-testid={TID.dashboard.stats}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground">
                Active academy members
              </p>
            </CardContent>
          </Card>

          <Card data-testid={TID.dashboard.players}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Coaches</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.pendingCoaches || 0}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting approval
              </p>
            </CardContent>
          </Card>

          <Card data-testid={TID.dashboard.schedule}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Training Sessions</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.trainingSessions || 0}</div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>

          <Card data-testid={TID.dashboard.payments}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats?.revenue || 0}</div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card data-testid={TID.dashboard.fitness}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Coach Management
              </CardTitle>
              <CardDescription>
                Review and approve new coach applications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/admin/coaches">
                <Button className="w-full">
                  Manage Coaches
                </Button>
              </Link>
              {stats?.pendingCoaches > 0 && (
                <div className="flex items-center gap-2 text-sm text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                  {stats.pendingCoaches} coaches pending approval
                </div>
              )}
            </CardContent>
          </Card>

          <Card data-testid={TID.dashboard.meal}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage parents, students, and user accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/users">
                <Button className="w-full">
                  Manage Users
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card data-testid={TID.dashboard.announcements}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Training Sessions
              </CardTitle>
              <CardDescription>
                Manage schedules and training programs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/sessions">
                <Button className="w-full">
                  Manage Sessions
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Financial Management
              </CardTitle>
              <CardDescription>
                Review payments and financial reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/payments">
                <Button className="w-full">
                  Manage Payments
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Reports & Analytics
              </CardTitle>
              <CardDescription>
                View performance metrics and insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/reports">
                <Button className="w-full">
                  View Reports
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                System Settings
              </CardTitle>
              <CardDescription>
                Academy settings and configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/account">
                <Button className="w-full">
                  System Settings
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}