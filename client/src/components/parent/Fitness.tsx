import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Dumbbell, TrendingUp, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

export function Fitness() {
  const { user } = useAuth();
  
  // Fetch fitness data
  const { data: fitnessData, isLoading } = useQuery({
    queryKey: ["/api/fitness/recent"],
    queryFn: () => fetch("/api/fitness/recent").then(res => res.json()),
    enabled: !!user,
  });

  // Sample data for the chart (use real data when API is ready)
  const sampleChartData = [
    { name: 'Week 1', endurance: 65, strength: 55, agility: 70 },
    { name: 'Week 2', endurance: 68, strength: 59, agility: 72 },
    { name: 'Week 3', endurance: 75, strength: 63, agility: 75 },
    { name: 'Week 4', endurance: 73, strength: 67, agility: 78 },
    { name: 'Week 5', endurance: 80, strength: 70, agility: 82 },
    { name: 'Week 6', endurance: 85, strength: 73, agility: 85 },
  ];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fitness Progress</CardTitle>
          <CardDescription>
            Track improvements in strength, agility and endurance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-[200px] w-full" />
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Fitness Progress</CardTitle>
            <CardDescription>
              Track improvements in strength, agility and endurance
            </CardDescription>
          </div>
          <Link href="/parent/fitness">
            <Button variant="outline" size="sm">View Details</Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={fitnessData?.chartData || sampleChartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="endurance" stroke="#8884d8" activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="strength" stroke="#82ca9d" />
                <Line type="monotone" dataKey="agility" stroke="#ffc658" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <Dumbbell className="h-10 w-10 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Strength</p>
                    <p className="text-2xl font-bold">{fitnessData?.metrics?.strength || 70}/100</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <TrendingUp className="h-10 w-10 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Agility</p>
                    <p className="text-2xl font-bold">{fitnessData?.metrics?.agility || 85}/100</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <Activity className="h-10 w-10 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Endurance</p>
                    <p className="text-2xl font-bold">{fitnessData?.metrics?.endurance || 78}/100</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}