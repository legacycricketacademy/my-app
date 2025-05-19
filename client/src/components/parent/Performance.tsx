import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Award, TrendingUp, Target, ChevronRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { performanceData } from "@/data";

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
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("skills");
  
  // Use data from data.js
  const performance = performanceData.player;

  // Prepare chart data
  const skillsChartData = [
    { name: 'Batting', value: performance.skills.batting },
    { name: 'Bowling', value: performance.skills.bowling },
    { name: 'Fielding', value: performance.skills.fielding },
    { name: 'Teamwork', value: performance.skills.teamwork }
  ];

  if (loading) {
    return (
      <Card className="bg-white shadow-md rounded-lg">
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

  return (
    <Card className="bg-white shadow-md rounded-lg">
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
        <Tabs defaultValue="skills" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="skills">Skills & Progress</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>
          
          <TabsContent value="skills" className="space-y-6">
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
                    <Progress value={performance.skills.batting} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Bowling</span>
                      <span className="text-sm">{performance.skills.bowling}/100</span>
                    </div>
                    <Progress value={performance.skills.bowling} className="h-2" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Fielding</span>
                      <span className="text-sm">{performance.skills.fielding}/100</span>
                    </div>
                    <Progress value={performance.skills.fielding} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">Teamwork</span>
                      <span className="text-sm">{performance.skills.teamwork}/100</span>
                    </div>
                    <Progress value={performance.skills.teamwork} className="h-2" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 pt-2 text-center">
              <Button variant="ghost" onClick={() => setActiveTab("achievements")} className="text-sm">
                View Achievements <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="achievements" className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              <span>Earned Achievements</span>
            </h3>
            
            <div className="grid grid-cols-1 gap-3">
              {performance.achievements.map(achievement => (
                <div key={achievement.id} className="p-4 border rounded-md flex items-center gap-4 hover:bg-accent hover:border-accent transition-colors">
                  <div className="text-3xl">{achievement.icon}</div>
                  <div>
                    <h4 className="font-medium">{achievement.name}</h4>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">Earned on: {achievement.date}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-2 text-center">
              <Button variant="ghost" onClick={() => setActiveTab("skills")} className="text-sm">
                View Skills Progress <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}