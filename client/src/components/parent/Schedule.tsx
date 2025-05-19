import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, MapPin, UserCircle } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";

export function Schedule() {
  const { user } = useAuth();
  
  // Fetch upcoming sessions
  const { data: upcomingSessions, isLoading } = useQuery({
    queryKey: ["/api/sessions/upcoming", 5],
    queryFn: () => fetch("/api/sessions/upcoming?limit=5").then(res => res.json()),
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Sessions</CardTitle>
          <CardDescription>
            Next scheduled cricket training sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 border rounded-md">
                <div className="flex justify-between items-start">
                  <div>
                    <Skeleton className="h-6 w-40 mb-2" />
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-10 w-24" />
                </div>
              </div>
            ))}
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
            <CardTitle>Upcoming Sessions</CardTitle>
            <CardDescription>
              Next scheduled cricket training sessions
            </CardDescription>
          </div>
          <Link href="/parent/schedule">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {upcomingSessions && upcomingSessions.length > 0 ? (
            upcomingSessions.map((session) => (
              <div key={session.id} className="p-4 border rounded-md hover:bg-accent hover:border-accent transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-md">{session.title}</h4>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{format(new Date(session.startTime), "EEEE, MMM d")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{format(new Date(session.startTime), "h:mm a")} - {format(new Date(session.endTime), "h:mm a")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{session.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <UserCircle className="h-3.5 w-3.5" />
                      <span>{session.coach}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Details</Button>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">No upcoming sessions scheduled</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}