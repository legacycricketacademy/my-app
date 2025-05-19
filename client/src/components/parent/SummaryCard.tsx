import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivitySquare, Users, Calendar, Award } from "lucide-react";
import { useState, useEffect } from "react";
import { summaryData } from "@/data";

export function SummaryCard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(summaryData);
  const [loading, setLoading] = useState(true);
  
  // Simulate data loading with a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-white shadow-md rounded-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Children Enrolled
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.childrenEnrolled}</div>
          <p className="text-xs text-muted-foreground">
            Active cricket players
          </p>
        </CardContent>
      </Card>
      
      <Card className="bg-white shadow-md rounded-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Upcoming Sessions
          </CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.upcomingSessions}</div>
          <p className="text-xs text-muted-foreground">
            Next 7 days
          </p>
        </CardContent>
      </Card>
      
      <Card className="bg-white shadow-md rounded-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Completed Sessions
          </CardTitle>
          <ActivitySquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.completedSessions}</div>
          <p className="text-xs text-muted-foreground">
            This month
          </p>
        </CardContent>
      </Card>
      
      <Card className="bg-white shadow-md rounded-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Achievements
          </CardTitle>
          <Award className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.achievements}</div>
          <p className="text-xs text-muted-foreground">
            Badges earned
          </p>
        </CardContent>
      </Card>
    </div>
  );
}