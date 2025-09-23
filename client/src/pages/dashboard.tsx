import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/layout/main-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getCurrentUser, signOut } from '@/lib/auth';
import { TID } from '@/ui/testids';

// Mock data for dashboard cards
const mockData = {
  stats: {
    totalUsers: 0,
    activeMembers: 0,
    pendingCoaches: 0,
    trainingSessions: 0,
    revenue: 0,
  },
  players: [],
  fitness: [],
  mealPlans: [],
  payments: [],
  schedule: [],
  announcements: [],
};

// Empty state component
function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-8" data-testid={TID.common.empty}>
      <div className="text-gray-500 text-sm">{message}</div>
    </div>
  );
}

// Skeleton component
function Skeleton() {
  return (
    <div className="animate-pulse" data-testid={TID.common.skeleton}>
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
    </div>
  );
}

// Dashboard card wrapper with error boundary
function DashboardCard({ 
  testId, 
  title, 
  children, 
  isLoading = false 
}: { 
  testId: string; 
  title: string; 
  children: React.ReactNode; 
  isLoading?: boolean;
}) {
  return (
    <Card data-testid={testId}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? <Skeleton /> : children}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const user = getCurrentUser();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Not Authenticated</h1>
          <p className="text-gray-600 mb-4">Please sign in to access the dashboard.</p>
          <Button onClick={() => window.location.href = '/auth'}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  const isAdmin = user.role === 'admin';
  const isParent = user.role === 'parent';

  return (
    <MainLayout title={isAdmin ? "Admin Dashboard" : "Player Dashboard"}>
      <div className="space-y-6">
        {/* Page Title */}
        <h1 data-testid={TID.dashboard.title} className="text-3xl font-bold tracking-tight">
          {isAdmin ? "Admin Dashboard" : "Player Dashboard"}
        </h1>

        {/* Welcome Message */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-2">
            {isAdmin ? "Manage your cricket academy operations" : "Track your child's cricket development and progress"}
          </h2>
          <p className="text-gray-600">
            Welcome back, {user.name}!
          </p>
        </div>

        {/* Stats Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <DashboardCard 
            testId={TID.dashboard.stats} 
            title="Total Users" 
            isLoading={isLoading}
          >
            <p className="text-3xl font-bold text-blue-600">{mockData.stats.totalUsers}</p>
            <p className="text-sm text-gray-600">Active academy members</p>
          </DashboardCard>

          <DashboardCard 
            testId={TID.dashboard.players} 
            title="Pending Coaches" 
            isLoading={isLoading}
          >
            <p className="text-3xl font-bold text-yellow-600">{mockData.stats.pendingCoaches}</p>
            <p className="text-sm text-gray-600">Awaiting approval</p>
          </DashboardCard>

          <DashboardCard 
            testId={TID.dashboard.schedule} 
            title="Training Sessions" 
            isLoading={isLoading}
          >
            <p className="text-3xl font-bold text-green-600">{mockData.stats.trainingSessions}</p>
            <p className="text-sm text-gray-600">This month</p>
          </DashboardCard>

          <DashboardCard 
            testId={TID.dashboard.payments} 
            title="Revenue" 
            isLoading={isLoading}
          >
            <p className="text-3xl font-bold text-purple-600">${mockData.stats.revenue}</p>
            <p className="text-sm text-gray-600">This month</p>
          </DashboardCard>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DashboardCard 
            testId={TID.dashboard.fitness} 
            title={isAdmin ? "Coach Management" : "Overall Progress"} 
            isLoading={isLoading}
          >
            {isAdmin ? (
              <div>
                <p className="text-sm text-gray-600 mb-4">Review and approve new coach applications</p>
                <Button className="w-full" variant="outline">
                  Manage Coaches
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-3xl font-bold text-blue-600">85%</p>
                <p className="text-sm text-gray-600">Skills development score</p>
              </div>
            )}
          </DashboardCard>

          <DashboardCard 
            testId={TID.dashboard.meal} 
            title={isAdmin ? "User Management" : "Attendance"} 
            isLoading={isLoading}
          >
            {isAdmin ? (
              <div>
                <p className="text-sm text-gray-600 mb-4">Manage parents, students, and user accounts</p>
                <Button className="w-full" variant="outline">
                  Manage Users
                </Button>
              </div>
            ) : (
              <div>
                <p className="text-3xl font-bold text-green-600">95%</p>
                <p className="text-sm text-gray-600">12 practices attended</p>
              </div>
            )}
          </DashboardCard>
        </div>

        {/* Additional Cards for Admin */}
        {isAdmin && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DashboardCard 
              testId={TID.dashboard.announcements} 
              title="Training Sessions" 
              isLoading={isLoading}
            >
              <p className="text-sm text-gray-600 mb-4">Manage schedules and training programs</p>
              <Button className="w-full" variant="outline">
                Manage Sessions
              </Button>
            </DashboardCard>

            <DashboardCard 
              testId="financial-management" 
              title="Financial Management" 
              isLoading={isLoading}
            >
              <p className="text-sm text-gray-600 mb-4">Review payments and financial reports</p>
              <Button className="w-full" variant="outline">
                Manage Payments
              </Button>
            </DashboardCard>
          </div>
        )}

        {/* Additional Cards for Parent */}
        {isParent && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DashboardCard 
              testId={TID.dashboard.announcements} 
              title="Fitness Score" 
              isLoading={isLoading}
            >
              <p className="text-3xl font-bold text-orange-600">88/100</p>
              <p className="text-sm text-gray-600">Physical fitness assessment</p>
            </DashboardCard>

            <DashboardCard 
              testId="upcoming-sessions" 
              title="Upcoming Sessions" 
              isLoading={isLoading}
            >
              <p className="text-3xl font-bold text-purple-600">3</p>
              <p className="text-sm text-gray-600">This week</p>
            </DashboardCard>
          </div>
        )}
      </div>
    </MainLayout>
  );
}