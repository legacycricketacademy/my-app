import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, MapPin, Users, CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { ScheduleSessionDialog } from "@/components/sessions/schedule-session-dialog";

interface Session {
  id: number;
  title: string;
  description: string | null;
  sessionType: string;
  ageGroup: string;
  location: string;
  startTime: string;
  endTime: string;
  coachName: string;
  maxPlayers: number | null;
  yesCount: number;
  noCount: number;
  maybeCount: number;
}

export default function CoachSchedule() {
  const { data, isLoading } = useQuery({
    queryKey: ["/api/coach/sessions"],
    queryFn: () => api.get("/api/coach/sessions"),
  });

  const sessions: Session[] = data?.data || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Session Schedule</h1>
        <p className="text-muted-foreground mt-1">
          Create and manage training sessions
        </p>
      </div>

      {/* Create Session Button - Uses unified dialog */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Session</CardTitle>
          <CardDescription>Add a new training session to the schedule</CardDescription>
        </CardHeader>
        <CardContent>
          <ScheduleSessionDialog />
        </CardContent>
      </Card>

      {/* Upcoming Sessions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Sessions
          </CardTitle>
          <CardDescription>View all scheduled sessions and availability</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading sessions...</div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No upcoming sessions scheduled
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div className="space-y-1 flex-1">
                      <div className="font-semibold text-lg">{session.title}</div>
                      {session.description && (
                        <p className="text-sm text-muted-foreground">{session.description}</p>
                      )}
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(session.startTime), "MMM dd, yyyy")}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {format(new Date(session.startTime), "h:mm a")} - {format(new Date(session.endTime), "h:mm a")}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {session.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {session.ageGroup}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-3 border-t">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Coming:</span>
                      <span className="text-green-600 font-semibold">{session.yesCount}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="font-medium">Can't Attend:</span>
                      <span className="text-red-600 font-semibold">{session.noCount}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <HelpCircle className="h-4 w-4 text-gray-600" />
                      <span className="font-medium">Not Sure:</span>
                      <span className="text-gray-600 font-semibold">{session.maybeCount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
