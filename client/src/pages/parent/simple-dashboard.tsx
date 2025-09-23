import React from 'react';
import { MainLayout } from "@/layout/main-layout";
import { getCurrentUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  User, 
  Activity, 
  CalendarCheck, 
  PlusCircle
} from 'lucide-react';
import { TID } from "@/ui/testids";

export default function SimpleParentDashboard() {
  const user = getCurrentUser();
  
  return (
    <MainLayout title="Parent Dashboard">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid={TID.dashboard.title}>
              Welcome, {user?.email?.split('@')[0] || 'Parent'}
            </h1>
            <p className="text-muted-foreground">
              Manage your child's cricket activities and progress
            </p>
          </div>
          <Button 
            className="w-full sm:w-auto"
            onClick={() => window.location.href = '/schedule'}
          >
            <CalendarCheck className="mr-2 h-4 w-4" />
            View Full Calendar
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card data-testid={TID.dashboard.stats}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
          
          <Card data-testid={TID.dashboard.players}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Players</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">Registered</p>
            </CardContent>
          </Card>
          
          <Card data-testid={TID.dashboard.fitness}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fitness Score</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">92/100</div>
              <p className="text-xs text-muted-foreground">Average</p>
            </CardContent>
          </Card>
          
          <Card data-testid={TID.dashboard.announcements}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Announcements</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">New updates</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card data-testid={TID.dashboard.schedule}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Sessions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Batting Practice</span>
                  <span className="text-xs text-muted-foreground">Jan 15, 4:00 PM</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Bowling Session</span>
                  <span className="text-xs text-muted-foreground">Jan 17, 5:00 PM</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Fielding Drills</span>
                  <span className="text-xs text-muted-foreground">Jan 19, 3:30 PM</span>
                </div>
              </div>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => window.location.href = '/schedule'}
              >
                View All Sessions
              </Button>
            </CardContent>
          </Card>

          <Card data-testid={TID.dashboard.meal}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Player Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Active Players</span>
                  <span className="text-sm text-muted-foreground">2</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Pending Approvals</span>
                  <span className="text-sm text-muted-foreground">0</span>
                </div>
              </div>
              <Button 
                size="sm"
                onClick={() => window.location.href = '/players/add'}
                className="w-full"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Player
              </Button>
            </CardContent>
          </Card>

          <Card data-testid={TID.dashboard.payments}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Completed batting practice</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">New personal best in fitness test</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm">Coach feedback received</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
