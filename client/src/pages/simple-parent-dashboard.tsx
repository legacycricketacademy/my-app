import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SimpleParentDashboard() {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <header className="bg-white p-4 rounded-lg shadow mb-6">
          <h1 className="text-2xl font-bold">Parent Dashboard</h1>
          <p className="text-gray-500">Welcome, {user?.fullName || 'Parent'}</p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Children</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Here you can view information about your registered children.</p>
              <Button className="mt-4">View Details</Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Check your child's upcoming cricket training sessions.</p>
              <Button className="mt-4">View Schedule</Button>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p>View performance metrics and progress reports.</p>
              <Button className="mt-4">View Performance</Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Meal Plans</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Access recommended meal plans and nutrition advice.</p>
              <Button className="mt-4">View Meal Plans</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}