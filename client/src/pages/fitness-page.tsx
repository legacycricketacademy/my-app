import { useState } from "react";
import { MainLayout } from "@/layout/main-layout";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { 
  Activity, 
  BarChart, 
  LineChart, 
  PlusCircle, 
  Loader2, 
  TrendingUp, 
  TrendingDown,
  Timer,
  Dumbbell,
  MoveHorizontal,
  StretchVertical
} from "lucide-react";
import { ResponsiveContainer, BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart as RechartsLineChart, Line } from "recharts";

export default function FitnessPage() {
  const [ageGroup, setAgeGroup] = useState<string>("Under 12s");
  const [period, setPeriod] = useState<string>("week");
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>("team");
  
  const { data: players, isLoading: isLoadingPlayers } = useQuery<any[]>({
    queryKey: ["/api/players", ageGroup],
    queryFn: () => fetch(`/api/players?ageGroup=${ageGroup}`).then(res => res.json())
  });
  
  const { data: teamProgress, isLoading: isLoadingTeamProgress } = useQuery<any>({
    queryKey: ["/api/fitness/team-progress", ageGroup, period],
    queryFn: () => fetch(`/api/fitness/team-progress?ageGroup=${ageGroup}&period=${period}`).then(res => res.json())
  });
  
  const { data: playerFitness, isLoading: isLoadingPlayerFitness } = useQuery<any[]>({
    queryKey: ["/api/fitness/player", selectedPlayerId],
    queryFn: () => selectedPlayerId 
      ? fetch(`/api/fitness/player/${selectedPlayerId}`).then(res => res.json()) 
      : null,
    enabled: !!selectedPlayerId
  });
  
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };
  
  const prepareFitnessChartData = () => {
    if (!playerFitness || playerFitness.length === 0) return [];
    
    return playerFitness.slice(0, 10).map(record => ({
      date: format(new Date(record.recordDate), "MMM dd"),
      runningSpeed: record.runningSpeed,
      endurance: record.endurance,
      strength: record.strength,
      agility: record.agility,
      flexibility: record.flexibility
    })).reverse();
  };
  
  const chartData = prepareFitnessChartData();
  
  const getProgressColor = (value: number, target: number) => {
    const percentage = (value / target) * 100;
    if (percentage >= 90) return "text-success";
    if (percentage >= 70) return "text-secondary";
    if (percentage >= 50) return "text-warning";
    return "text-danger";
  };
  
  const getProgressIcon = (current: number, previous: number) => {
    if (current > previous) {
      return <TrendingUp className="h-4 w-4 text-success" />;
    } else if (current < previous) {
      return <TrendingDown className="h-4 w-4 text-danger" />;
    }
    return null;
  };
  
  const getMetricIcon = (metric: string) => {
    switch (metric.toLowerCase()) {
      case 'runningspeed':
        return <Activity className="h-5 w-5 text-primary" />;
      case 'endurance':
        return <Timer className="h-5 w-5 text-secondary" />;
      case 'strength':
        return <Dumbbell className="h-5 w-5 text-accent" />;
      case 'agility':
        return <MoveHorizontal className="h-5 w-5 text-warning" />;
      case 'flexibility':
        return <StretchVertical className="h-5 w-5 text-info" />;
      default:
        return <Activity className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <MainLayout title="Fitness Tracking">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 heading">Fitness Tracking</h1>
            <p className="text-gray-600">Monitor and track player fitness progress</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={ageGroup} onValueChange={setAgeGroup}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Age Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Under 12s">Under 12s</SelectItem>
                <SelectItem value="Under 14s">Under 14s</SelectItem>
                <SelectItem value="Under 16s">Under 16s</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Time Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="lastMonth">Last Month</SelectItem>
              </SelectContent>
            </Select>
            
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Fitness Record
            </Button>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="team">Team Progress</TabsTrigger>
            <TabsTrigger value="individual">Individual Progress</TabsTrigger>
          </TabsList>
          
          <TabsContent value="team" className="space-y-6">
            {/* Team Fitness Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {isLoadingTeamProgress ? (
                Array(5).fill(0).map((_, index) => (
                  <Card key={index} className="animate-pulse">
                    <CardHeader className="pb-2">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-8 bg-gray-200 rounded w-12 mb-2"></div>
                      <div className="h-3 bg-gray-100 rounded w-28"></div>
                    </CardContent>
                  </Card>
                ))
              ) : teamProgress ? (
                <>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-gray-600 flex items-center">
                        <Activity className="h-4 w-4 mr-1" />
                        Running Speed
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <span className={`text-2xl font-bold ${getProgressColor(teamProgress.avgRunningSpeed || 0, 16)}`}>
                          {teamProgress.avgRunningSpeed?.toFixed(1) || 0}
                        </span>
                        <span className="text-lg ml-1">km/h</span>
                      </div>
                      <p className="text-xs text-gray-500">Target: 16.0 km/h</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-gray-600 flex items-center">
                        <Timer className="h-4 w-4 mr-1" />
                        Endurance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <span className={`text-2xl font-bold ${getProgressColor(teamProgress.avgEndurance || 0, 30)}`}>
                          {teamProgress.avgEndurance?.toFixed(1) || 0}
                        </span>
                        <span className="text-lg ml-1">min</span>
                      </div>
                      <p className="text-xs text-gray-500">Target: 30.0 min</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-gray-600 flex items-center">
                        <Dumbbell className="h-4 w-4 mr-1" />
                        Strength
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <span className={`text-2xl font-bold ${getProgressColor(teamProgress.avgStrength || 0, 15)}`}>
                          {teamProgress.avgStrength?.toFixed(1) || 0}
                        </span>
                        <span className="text-lg ml-1">units</span>
                      </div>
                      <p className="text-xs text-gray-500">Target: 15.0 units</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-gray-600 flex items-center">
                        <MoveHorizontal className="h-4 w-4 mr-1" />
                        Agility
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <span className={`text-2xl font-bold ${getProgressColor(teamProgress.avgAgility || 0, 10)}`}>
                          {teamProgress.avgAgility?.toFixed(1) || 0}
                        </span>
                        <span className="text-lg ml-1">units</span>
                      </div>
                      <p className="text-xs text-gray-500">Target: 10.0 units</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-gray-600 flex items-center">
                        <StretchVertical className="h-4 w-4 mr-1" />
                        Flexibility
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <span className={`text-2xl font-bold ${getProgressColor(teamProgress.avgFlexibility || 0, 12)}`}>
                          {teamProgress.avgFlexibility?.toFixed(1) || 0}
                        </span>
                        <span className="text-lg ml-1">units</span>
                      </div>
                      <p className="text-xs text-gray-500">Target: 12.0 units</p>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="col-span-full">
                  <CardContent className="text-center py-6">
                    <p className="text-gray-500">No fitness data available for this age group</p>
                  </CardContent>
                </Card>
              )}
            </div>
            
            {/* Team Progress Chart */}
            <Card>
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-lg heading flex items-center">
                  <BarChart className="h-5 w-5 mr-2" />
                  Team Fitness Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {isLoadingTeamProgress ? (
                  <div className="h-80 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : teamProgress ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart data={[
                        {
                          name: "Running Speed",
                          value: teamProgress.avgRunningSpeed || 0,
                          target: 16,
                          fill: "#3366CC"
                        },
                        {
                          name: "Endurance",
                          value: teamProgress.avgEndurance || 0,
                          target: 30,
                          fill: "#38B27B"
                        },
                        {
                          name: "Strength",
                          value: teamProgress.avgStrength || 0,
                          target: 15,
                          fill: "#FF9933"
                        },
                        {
                          name: "Agility",
                          value: teamProgress.avgAgility || 0,
                          target: 10,
                          fill: "#FFC107"
                        },
                        {
                          name: "Flexibility",
                          value: teamProgress.avgFlexibility || 0,
                          target: 12,
                          fill: "#17A2B8"
                        }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value, name) => [value, name === 'value' ? 'Average' : 'Target']}
                        />
                        <Legend />
                        <Bar dataKey="value" name="Average" fill="#3366CC" />
                        <Bar dataKey="target" name="Target" fill="#E9ECEF" />
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80 flex items-center justify-center">
                    <p className="text-gray-500">No data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="individual" className="space-y-6">
            {/* Player Selection */}
            <Card>
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-lg heading">Select Player</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {isLoadingPlayers ? (
                  <div className="py-4 flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {players?.map(player => (
                      <Button
                        key={player.id}
                        variant={selectedPlayerId === player.id ? "default" : "outline"}
                        className="justify-start"
                        onClick={() => setSelectedPlayerId(player.id)}
                      >
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarImage src={player.profileImage} alt={`${player.firstName} ${player.lastName}`} />
                          <AvatarFallback>{getInitials(player.firstName, player.lastName)}</AvatarFallback>
                        </Avatar>
                        <span>{player.firstName} {player.lastName}</span>
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {selectedPlayerId ? (
              <>
                {/* Player Fitness Chart */}
                <Card>
                  <CardHeader className="border-b border-gray-200">
                    <CardTitle className="text-lg heading flex items-center">
                      <LineChart className="h-5 w-5 mr-2" />
                      Fitness Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    {isLoadingPlayerFitness ? (
                      <div className="h-80 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : chartData.length > 0 ? (
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsLineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line 
                              type="monotone" 
                              dataKey="runningSpeed" 
                              name="Running Speed" 
                              stroke="#3366CC" 
                              activeDot={{ r: 8 }} 
                            />
                            <Line 
                              type="monotone" 
                              dataKey="endurance" 
                              name="Endurance" 
                              stroke="#38B27B" 
                            />
                            <Line 
                              type="monotone" 
                              dataKey="strength" 
                              name="Strength" 
                              stroke="#FF9933" 
                            />
                            <Line 
                              type="monotone" 
                              dataKey="agility" 
                              name="Agility" 
                              stroke="#FFC107" 
                            />
                            <Line 
                              type="monotone" 
                              dataKey="flexibility" 
                              name="Flexibility" 
                              stroke="#17A2B8" 
                            />
                          </RechartsLineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-80 flex items-center justify-center">
                        <p className="text-gray-500">No fitness records available for this player</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Fitness Records Table */}
                <Card>
                  <CardHeader className="border-b border-gray-200">
                    <CardTitle className="text-lg heading">Fitness Records</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Running Speed</TableHead>
                            <TableHead>Endurance</TableHead>
                            <TableHead>Strength</TableHead>
                            <TableHead>Agility</TableHead>
                            <TableHead>Flexibility</TableHead>
                            <TableHead>Notes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {isLoadingPlayerFitness ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-10">
                                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                                <p className="mt-2 text-gray-500">Loading records...</p>
                              </TableCell>
                            </TableRow>
                          ) : playerFitness && playerFitness.length > 0 ? (
                            playerFitness.map((record) => (
                              <TableRow key={record.id}>
                                <TableCell>{format(new Date(record.recordDate), "MMM dd, yyyy")}</TableCell>
                                <TableCell className="font-medium">{record.runningSpeed}</TableCell>
                                <TableCell>{record.endurance}</TableCell>
                                <TableCell>{record.strength}</TableCell>
                                <TableCell>{record.agility}</TableCell>
                                <TableCell>{record.flexibility}</TableCell>
                                <TableCell className="max-w-[200px] truncate">{record.notes || "-"}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-10">
                                <p className="text-gray-500">No fitness records available</p>
                                <Button className="mt-4">
                                  <PlusCircle className="h-4 w-4 mr-2" />
                                  Add First Record
                                </Button>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="py-10 text-center">
                  <p className="text-gray-500">Select a player to view individual fitness progress</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
