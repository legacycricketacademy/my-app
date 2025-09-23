import { MainLayout } from "@/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, TrendingUp, Download, Calendar, Users, DollarSign, Activity, BarChart3, PieChart } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

// Mock analytics data
const mockAnalytics = {
  revenue: {
    currentMonth: 12500,
    lastMonth: 11200,
    growth: 11.6
  },
  users: {
    total: 156,
    newThisMonth: 23,
    active: 134
  },
  sessions: {
    total: 24,
    attendance: 18.5,
    completionRate: 92.3
  },
  coaches: {
    total: 12,
    active: 10,
    averageRating: 4.7
  }
};

const monthlyRevenue = [
  { month: 'Jan', revenue: 12500 },
  { month: 'Feb', revenue: 11800 },
  { month: 'Mar', revenue: 13200 },
  { month: 'Apr', revenue: 12800 },
  { month: 'May', revenue: 14100 },
  { month: 'Jun', revenue: 13500 }
];

const sessionAttendance = [
  { session: 'Batting Practice', attendance: 22, capacity: 25 },
  { session: 'Bowling Practice', attendance: 18, capacity: 20 },
  { session: 'Fielding Practice', attendance: 15, capacity: 18 },
  { session: 'Match Preparation', attendance: 20, capacity: 22 }
];

const userGrowth = [
  { month: 'Jan', users: 156 },
  { month: 'Feb', users: 142 },
  { month: 'Mar', users: 138 },
  { month: 'Apr', users: 145 },
  { month: 'May', users: 152 },
  { month: 'Jun', users: 156 }
];

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('6months');

  return (
    <MainLayout title="Reports & Analytics">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Link href="/admin">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Admin Dashboard
            </Button>
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
              <p className="text-muted-foreground">
                View performance metrics and insights
              </p>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="1month">Last Month</option>
                <option value="3months">Last 3 Months</option>
                <option value="6months">Last 6 Months</option>
                <option value="1year">Last Year</option>
              </select>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export Report
              </Button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${mockAnalytics.revenue.currentMonth.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+{mockAnalytics.revenue.growth}%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockAnalytics.users.total}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+{mockAnalytics.users.newThisMonth}</span> new this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Training Sessions</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockAnalytics.sessions.total}</div>
              <p className="text-xs text-muted-foreground">
                {mockAnalytics.sessions.completionRate}% completion rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Coaches</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockAnalytics.coaches.active}</div>
              <p className="text-xs text-muted-foreground">
                {mockAnalytics.coaches.averageRating}/5.0 average rating
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Revenue Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyRevenue.map((item, index) => (
                  <div key={item.month} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.month}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(item.revenue / 15000) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-16 text-right">${item.revenue.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* User Growth Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                User Growth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userGrowth.map((item, index) => (
                  <div key={item.month} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.month}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${(item.users / 160) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-16 text-right">{item.users}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Session Attendance */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Session Attendance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sessionAttendance.map((session, index) => (
                <div key={session.session} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{session.session}</span>
                      <span className="text-sm text-gray-600">{session.attendance}/{session.capacity}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full" 
                        style={{ width: `${(session.attendance / session.capacity) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Detailed Reports */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Financial Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Monthly Revenue</span>
                  <span className="font-medium">${mockAnalytics.revenue.currentMonth.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Average Session Fee</span>
                  <span className="font-medium">$125</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Payment Success Rate</span>
                  <span className="font-medium">96.8%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Outstanding Payments</span>
                  <span className="font-medium">$1,250</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Average Session Attendance</span>
                  <span className="font-medium">{mockAnalytics.sessions.attendance}/20</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Coach Utilization</span>
                  <span className="font-medium">83.3%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Parent Satisfaction</span>
                  <span className="font-medium">4.6/5.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Retention Rate</span>
                  <span className="font-medium">89.2%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
