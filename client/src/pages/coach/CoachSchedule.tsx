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
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl" data-testid="coach-schedule-page">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Session Schedule</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
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
      <Card data-testid="upcoming-sessions-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Sessions
          </CardTitle>
          <CardDescription>View all scheduled sessions and availability</CardDescription>
        </CardHeader>
        <CardContent data-testid="upcoming-sessions-list">
          {isLoading ? (
            <div className="text-center py-8" data-testid="loading-sessions">Loading sessions...</div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="no-sessions">
              No upcoming sessions scheduled
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="border rounded-lg p-3 sm:p-4 space-y-3"
                  data-testid={`session-card-${session.id}`}
                >
                  <div className="flex flex-col gap-2">
                    <div className="space-y-1 flex-1">
                      <div className="font-semibold text-base sm:text-lg break-words">{session.title}</div>
                      {session.description && (
                        <p className="text-sm text-muted-foreground break-words">{session.description}</p>
                      )}
                      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 text-xs sm:text-sm text-muted-foreground mt-2">
                        <div className="flex items-center gap-1 min-w-0">
                          <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="truncate">{format(new Date(session.startTime), "MMM dd, yyyy")}</span>
                        </div>
                        <div className="flex items-center gap-1 min-w-0">
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="truncate">{format(new Date(session.startTime), "h:mm a")} - {format(new Date(session.endTime), "h:mm a")}</span>
                        </div>
                        <div className="flex items-center gap-1 min-w-0">
                          <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="truncate">{session.location}</span>
                        </div>
                        <div className="flex items-center gap-1 min-w-0">
                          <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="truncate">{session.ageGroup}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 pt-3 border-t">
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                      <span className="font-medium">Coming:</span>
                      <span className="text-green-600 font-semibold">{session.yesCount}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 flex-shrink-0" />
                      <span className="font-medium">Can't Attend:</span>
                      <span className="text-red-600 font-semibold">{session.noCount}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                      <HelpCircle className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 flex-shrink-0" />
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
