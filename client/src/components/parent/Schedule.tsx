import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, MapPin, UserCircle, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { scheduleData } from "@/data";

interface SessionItem {
  id: number;
  date: string;
  time: string;
  location: string;
  coachName: string;
  status: string;
  rsvp?: boolean;
}

export function Schedule() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionItem[]>(scheduleData);
  const [loading, setLoading] = useState(false);
  
  // Function to handle RSVP toggle
  const handleRSVP = (sessionId: number) => {
    setLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      setSessions(sessions.map(session => 
        session.id === sessionId 
          ? { ...session, rsvp: !session.rsvp }
          : session
      ));
      setLoading(false);
    }, 500);
  };

  if (loading && sessions.length === 0) {
    return (
      <Card className="bg-white shadow-md rounded-lg">
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
    <Card className="bg-white shadow-md rounded-lg">
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
          {sessions && sessions.length > 0 ? (
            sessions.map((session) => (
              <div key={session.id} className="p-4 border rounded-md hover:bg-accent hover:border-accent transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-md">Cricket Training</h4>
                      <Badge variant={session.status === "Confirmed" ? "success" : "outline"}>
                        {session.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{session.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{session.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{session.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <UserCircle className="h-3.5 w-3.5" />
                      <span>{session.coachName}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button 
                      variant={session.rsvp ? "default" : "outline"} 
                      size="sm"
                      onClick={() => handleRSVP(session.id)}
                      disabled={loading}
                      className="w-24"
                    >
                      {session.rsvp ? (
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          RSVP'd
                        </span>
                      ) : "RSVP"}
                    </Button>
                    <Button variant="outline" size="sm" className="w-24">
                      Details
                    </Button>
                  </div>
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