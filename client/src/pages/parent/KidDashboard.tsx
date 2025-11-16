import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Calendar,
  MapPin,
  ArrowLeft,
  Activity,
  Target,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
} from "lucide-react";
import { api } from "@/lib/api";
import { format } from "date-fns";

interface KidDashboardData {
  kid: {
    id: number;
    firstName: string;
    lastName: string;
    fullName: string;
    dateOfBirth: string;
    age: number;
    ageGroup: string;
    location: string;
    profileImage: string | null;
  };
  fitness: any;
  batting: any;
  bowling: any;
  fielding: any;
  discipline: any;
  attendance: {
    total: number;
    attended: number;
    missed: number;
    lastSessionDate: string | null;
  };
  upcomingSessions: Array<{
    id: number;
    title: string;
    description: string | null;
    sessionType: string;
    location: string;
    startTime: string;
    endTime: string;
    coachName: string | null;
    availabilityStatus: "yes" | "no" | "maybe" | null;
  }>;
  recentNotes: Array<{
    id: number;
    content: string;
    noteDate: string;
    category: string | null;
    coachName: string | null;
  }>;
}

export default function KidDashboard() {
  const { kidId } = useParams<{ kidId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/parent/kids/${kidId}/dashboard`],
    queryFn: () => api.get(`/parent/kids/${kidId}/dashboard`),
    enabled: !!kidId,
  });

  const dashboardData: KidDashboardData | null = data?.data || null;

  const updateAvailabilityMutation = useMutation({
    mutationFn: async ({ sessionId, status }: { sessionId: number; status: "yes" | "no" | "maybe" }) => {
      return api.post(`/parent/sessions/${sessionId}/availability`, { 
        status,
        playerId: parseInt(kidId!)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/parent/kids/${kidId}/dashboard`] });
      toast({
        title: "Availability updated",
        description: "Your response has been saved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update availability",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error Loading Dashboard</CardTitle>
            <CardDescription>
              Failed to load kid dashboard. Please try again later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/parent/kids")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Kids List
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { kid, attendance, upcomingSessions, recentNotes, batting, bowling, fielding, discipline } = dashboardData;

  const attendancePercentage = attendance.total > 0
    ? Math.round((attendance.attended / attendance.total) * 100)
    : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <Button variant="outline" onClick={() => navigate("/parent/kids")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to My Kids
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{kid.fullName}</h1>
          <p className="text-muted-foreground">
            Age {kid.age} • {kid.ageGroup} • {kid.location}
          </p>
        </div>
      </div>

      {/* Attendance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Attendance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <div className="text-3xl font-bold text-primary">{attendancePercentage}%</div>
              <div className="text-sm text-muted-foreground mt-1">Attendance Rate</div>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {attendance.attended}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Sessions Attended</div>
            </div>
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                {attendance.missed}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Sessions Missed</div>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {attendance.total}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Total Sessions</div>
            </div>
          </div>
          {attendance.lastSessionDate && (
            <p className="text-sm text-muted-foreground mt-4">
              Last session: {format(new Date(attendance.lastSessionDate), "MMM dd, yyyy")}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Batting Metrics */}
        {batting && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Batting Metrics
              </CardTitle>
              <CardDescription>
                Latest: {format(new Date(batting.recordDate), "MMM dd, yyyy")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <MetricBar label="Footwork" value={batting.footwork} />
              <MetricBar label="Shot Selection" value={batting.shotSelection} />
              <MetricBar label="Bat Swing Path" value={batting.batSwingPath} />
              <MetricBar label="Balance & Posture" value={batting.balancePosture} />
              {batting.notes && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm">{batting.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Bowling Metrics */}
        {bowling && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Bowling Metrics
              </CardTitle>
              <CardDescription>
                Latest: {format(new Date(bowling.recordDate), "MMM dd, yyyy")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <MetricBar label="Run-up Rhythm" value={bowling.runUpRhythm} />
              <MetricBar label="Load & Gather" value={bowling.loadGather} />
              <MetricBar label="Release Consistency" value={bowling.releaseConsistency} />
              <MetricBar label="Line & Length" value={bowling.lineLength} />
              {bowling.notes && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm">{bowling.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Fielding Metrics */}
        {fielding && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Fielding Metrics
              </CardTitle>
              <CardDescription>
                Latest: {format(new Date(fielding.recordDate), "MMM dd, yyyy")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <MetricBar label="Throwing Accuracy" value={fielding.throwingAccuracy} />
              <MetricBar label="Catching" value={fielding.catching} />
              <MetricBar label="Ground Fielding" value={fielding.groundFielding} />
              {fielding.notes && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm">{fielding.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Discipline Metrics */}
        {discipline && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Discipline & Behavior
              </CardTitle>
              <CardDescription>
                Latest: {format(new Date(discipline.recordDate), "MMM dd, yyyy")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <MetricBar label="Focus" value={discipline.focus} />
              <MetricBar label="Teamwork" value={discipline.teamwork} />
              <MetricBar label="Coachability" value={discipline.coachability} />
              {discipline.notes && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm">{discipline.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Upcoming Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Sessions
          </CardTitle>
          <CardDescription>Next scheduled training sessions</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingSessions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No upcoming sessions scheduled
            </p>
          ) : (
            <div className="space-y-4">
              {upcomingSessions.map((session) => {
                const status = session.availabilityStatus || "pending";
                return (
                  <div
                    key={session.id}
                    className="flex flex-col gap-3 p-4 border rounded-lg"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="space-y-1 flex-1">
                        <div className="font-medium">{session.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(session.startTime), "MMM dd, yyyy • h:mm a")}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {session.location}
                        </div>
                        {session.coachName && (
                          <div className="text-sm text-muted-foreground">
                            Coach: {session.coachName}
                          </div>
                        )}
                      </div>
                      <Badge variant="outline">
                        {session.sessionType}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-2 border-t">
                      <div className="flex items-center gap-2">
                        {!status && (
                          <Badge variant="secondary" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            Not Answered
                          </Badge>
                        )}
                        {status === "yes" && (
                          <Badge variant="default" className="text-xs bg-green-600">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Coming
                          </Badge>
                        )}
                        {status === "no" && (
                          <Badge variant="destructive" className="text-xs">
                            <XCircle className="h-3 w-3 mr-1" />
                            Can't Attend
                          </Badge>
                        )}
                        {status === "maybe" && (
                          <Badge variant="outline" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            Not Sure
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2 sm:ml-auto flex-wrap">
                        <Button
                          size="sm"
                          variant={status === "yes" ? "default" : "outline"}
                          onClick={() => updateAvailabilityMutation.mutate({ 
                            sessionId: session.id, 
                            status: "yes" 
                          })}
                          disabled={updateAvailabilityMutation.isPending}
                          className="text-xs"
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Coming
                        </Button>
                        <Button
                          size="sm"
                          variant={status === "no" ? "destructive" : "outline"}
                          onClick={() => updateAvailabilityMutation.mutate({ 
                            sessionId: session.id, 
                            status: "no" 
                          })}
                          disabled={updateAvailabilityMutation.isPending}
                          className="text-xs"
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Can't Attend
                        </Button>
                        <Button
                          size="sm"
                          variant={status === "maybe" ? "secondary" : "outline"}
                          onClick={() => updateAvailabilityMutation.mutate({ 
                            sessionId: session.id, 
                            status: "maybe" 
                          })}
                          disabled={updateAvailabilityMutation.isPending}
                          className="text-xs"
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          Not Sure
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Coach Notes */}
      {recentNotes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Coach Notes
            </CardTitle>
            <CardDescription>Feedback and observations from coaches</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentNotes.map((note) => (
                <div key={note.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {note.category && (
                        <Badge variant="secondary" className="text-xs">
                          {note.category}
                        </Badge>
                      )}
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(note.noteDate), "MMM dd, yyyy")}
                      </span>
                    </div>
                    {note.coachName && (
                      <span className="text-sm text-muted-foreground">
                        {note.coachName}
                      </span>
                    )}
                  </div>
                  <p className="text-sm">{note.content}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper component for metric bars
function MetricBar({ label, value }: { label: string; value: number | null }) {
  if (value === null) return null;

  const percentage = (value / 5) * 100;
  const color =
    value >= 4 ? "bg-green-500" : value >= 3 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-medium">
          {value}/5
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
