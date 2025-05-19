import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Award, TrendingUp, Target } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface PlayerPerformance {
  id: string;
  name: string;
  skills: {
    batting: number;
    bowling: number;
    fielding: number;
    teamwork: number;
  };
  recent: {
    date: string;
    type: string;
    runsScored?: number;
    ballsFaced?: number;
    wickets?: number;
    oversBowled?: number;
    catches?: number;
  }[];
  achievements: {
    id: string;
    name: string;
    description: string;
    date: string;
    icon: string;
  }[];
}

export function Performance() {
  const { user } = useAuth();
  
  // Fetch player performance data
  const { data: playerData, isLoading } = useQuery({
    queryKey: ["/api/players/performance"],
    queryFn: () => fetch("/api/players/performance").then(res => res.json()),
    enabled: !!user,
  });

  // Sample performance data (use real data when API is ready)
  const samplePerformance: PlayerPerformance = {
    id: "1",
    name: "Arjun Kumar",
    skills: {
      batting: 75,
      bowling: 60,
      fielding: 85,
      teamwork: 90
    },
    recent: [
      {
        date: "2025-05-15",
        type: "Training Match",
        runsScored: 32,
        ballsFaced: 45,
        catches: 1
      },
      {
        date: "2025-05-08",
        type: "Practice Session",
        wickets: 2,
        oversBowled: 3
      },
      {
        date: "2025-05-01",
        type: "Training Match",
        runsScored: 25,
        ballsFaced: 30,
        wickets: 1,
        oversBowled: 2
      }
    ],
    achievements: [
      {
        id: "a1",
        name: "Century Maker",
        description: "Scored 100+ runs in a match",
        date: "2025-04-10",
        icon: "🏆"
      },
      {
        id: "a2",
        name: "Golden Arm",
        description: "Took 5 wickets in a match",
        date: "2025-03-15",
        icon: "🥇"
      }
    ]
  };

  // Prepare chart data
  const skillsChartData = [
    { name: 'Batting', value: samplePerformance.skills.batting },
    { name: 'Bowling', value: samplePerformance.skills.bowling },
    { name: 'Fielding', value: samplePerformance.skills.fielding },
    { name: 'Teamwork', value: samplePerformance.skills.teamwork }
  ];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Player Performance</CardTitle>
          <CardDescription>
            Track cricket skills and achievements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-[200px] w-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Use actual data or sample data
  const performance = playerData?.data || samplePerformance;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Player Performance</CardTitle>
            <CardDescription>
              Track cricket skills and achievements for {performance.name}
            </CardDescription>
          </div>
          <Link href="/parent/performance">
            <Button variant="outline" size="sm">View History</Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={skillsChartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" name="Skill Level" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span>Skill Progress</span>
            </h3>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Batting</span>
                    <span className="text-sm">{performance.skills.batting}/100</span>
                  </div>
                  <Progress value={performance.skills.batting} />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Bowling</span>
                    <span className="text-sm">{performance.skills.bowling}/100</span>
                  </div>
                  <Progress value={performance.skills.bowling} />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Fielding</span>
                    <span className="text-sm">{performance.skills.fielding}/100</span>
                  </div>
                  <Progress value={performance.skills.fielding} />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Teamwork</span>
                    <span className="text-sm">{performance.skills.teamwork}/100</span>
                  </div>
                  <Progress value={performance.skills.teamwork} />
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              <span>Recent Achievements</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {performance.achievements.map(achievement => (
                <div key={achievement.id} className="p-3 border rounded-md flex items-center gap-3">
                  <div className="text-2xl">{achievement.icon}</div>
                  <div>
                    <h4 className="font-medium">{achievement.name}</h4>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}