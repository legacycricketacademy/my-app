import React from "react";
import { useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";

export default function WorkingParentDashboard() {
  const { user } = useAuth();
  const [currentDate] = useState(new Date());

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Welcome, {user?.fullName || 'Parent'}</h1>
          <p className="text-muted-foreground">
            {format(currentDate, "EEEE, MMMM d, yyyy")} | Academy Dashboard
          </p>
        </header>

        <Separator className="my-6" />
        
        {/* Summary Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Children Enrolled</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">Active cricket players</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">Next 7 days</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Completed Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Achievements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">Badges earned</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Upcoming Sessions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Upcoming Sessions</h2>
          <Card>
            <CardContent className="p-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Date</th>
                    <th className="text-left py-2">Time</th>
                    <th className="text-left py-2">Location</th>
                    <th className="text-left py-2">Coach</th>
                    <th className="text-left py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-3">May 20</td>
                    <td className="py-3">5:00 PM</td>
                    <td className="py-3">Legacy Turf</td>
                    <td className="py-3">Coach John</td>
                    <td className="py-3">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                        Confirmed
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-3">May 22</td>
                    <td className="py-3">4:30 PM</td>
                    <td className="py-3">Central Park</td>
                    <td className="py-3">Coach Maria</td>
                    <td className="py-3">
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                        Pending
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3">May 25</td>
                    <td className="py-3">6:00 PM</td>
                    <td className="py-3">Legacy Turf</td>
                    <td className="py-3">Coach Smith</td>
                    <td className="py-3">
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                        Confirmed
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
        
        {/* Performance Overview */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Performance Overview</h2>
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Key Skills</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Batting</span>
                        <span>75%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: "75%" }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Bowling</span>
                        <span>60%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: "60%" }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span>Fielding</span>
                        <span>85%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: "85%" }}></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-3">Recent Achievements</h3>
                  <div className="space-y-3">
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-2xl mr-3">🏆</span>
                      <div>
                        <h4 className="font-medium">Century Maker</h4>
                        <p className="text-sm text-muted-foreground">April 10, 2025</p>
                      </div>
                    </div>
                    <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-2xl mr-3">🥇</span>
                      <div>
                        <h4 className="font-medium">Golden Arm</h4>
                        <p className="text-sm text-muted-foreground">March 15, 2025</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}