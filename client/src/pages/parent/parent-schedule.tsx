import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format, addDays, startOfWeek } from "date-fns";

export default function ParentSchedulePage() {
  // Fetch upcoming sessions
  const { data: sessions, isLoading } = useQuery({
    queryKey: ["/api/sessions/upcoming", 20],
    queryFn: () => fetch("/api/sessions/upcoming?limit=20").then(res => res.json()),
  });

  function formatDate(date: string | Date) {
    return format(new Date(date), "EEEE, MMMM d");
  }

  function formatTime(date: string | Date) {
    return format(new Date(date), "h:mm a");
  }
  
  // Group sessions by date
  const groupedSessions: Record<string, any[]> = sessions?.reduce((groups: Record<string, any[]>, session: any) => {
    const date = format(new Date(session.startTime), "yyyy-MM-dd");
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(session);
    return groups;
  }, {}) || {};

  // Get dates for current week
  const today = new Date();
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 });
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(startOfCurrentWeek, i));

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Training Schedule</h1>
          <p className="text-muted-foreground">
            View upcoming training sessions for your child
          </p>
        </div>
        
        {/* Calendar Section */}
        <div className="my-8">
          <h2 className="text-xl font-semibold mb-4">Upcoming Sessions</h2>
          
          {isLoading ? (
            <div className="space-y-4">
              {Array(3).fill(0).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <Skeleton className="h-6 w-48" />
                      <div className="flex gap-4">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : groupedSessions && Object.keys(groupedSessions).length > 0 ? (
            <div className="space-y-8">
              {Object.entries(groupedSessions).map(([date, dateSessions]) => (
                <div key={date} className="space-y-2">
                  <h3 className="text-lg font-medium sticky top-0 bg-background py-2">
                    {formatDate(date)}
                  </h3>
                  <div className="space-y-3">
                    {Array.isArray(dateSessions) && dateSessions.map((session: any) => (
                      <Card key={session.id}>
                        <CardContent className="p-4 md:p-6">
                          <div className="flex flex-col gap-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <h4 className="text-lg font-medium">{session.title}</h4>
                                <Badge variant="outline">{session.ageGroup}</Badge>
                              </div>
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Clock className="h-4 w-4 mr-1" />
                                <span>{formatTime(session.startTime)} - {formatTime(session.endTime)}</span>
                              </div>
                            </div>
                            
                            <div className="flex flex-col gap-2">
                              <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                                <span>{session.location}</span>
                              </div>
                              
                              {session.description && (
                                <p className="text-sm text-muted-foreground ml-6">
                                  {session.description}
                                </p>
                              )}
                              
                              {session.coachName && (
                                <p className="text-sm text-muted-foreground ml-6">
                                  Coach: {session.coachName}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 flex flex-col items-center justify-center text-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground opacity-25 mb-4" />
                <h3 className="text-lg font-medium">No upcoming sessions</h3>
                <p className="text-muted-foreground max-w-md mt-1">
                  There are no scheduled sessions at the moment. Please check back later.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
    </div>
  );
}