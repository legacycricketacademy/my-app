import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ParentLayout } from "@/layout/parent-layout";
import { Calendar, Clock, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

// Special test page for parent dashboard that doesn't require auth
export default function ParentTest() {
  const [currentDate] = useState(new Date());
  
  useEffect(() => {
    console.log('Parent Test Page Loaded');
  }, []);

  // Fetch children (players) for testing - uses special non-auth endpoint
  const { data: children, isLoading: isLoadingChildren } = useQuery({
    queryKey: ["/api/test/parent-dashboard-data"],
    queryFn: () => fetch("/api/test/parent-dashboard-data").then(res => res.json()),
  });

  // Fetch upcoming sessions
  const { data: upcomingSessions, isLoading: isLoadingSessions } = useQuery({
    queryKey: ["/api/sessions/upcoming", 5],
    queryFn: () => fetch("/api/sessions/upcoming?limit=5").then(res => res.json()),
  });

  // Fetch announcements
  const { data: announcements, isLoading: isLoadingAnnouncements } = useQuery({
    queryKey: ["/api/announcements/recent"],
    queryFn: () => fetch("/api/announcements/recent").then(res => res.json()),
  });

  function formatDate(date: string | Date) {
    if (!date) return "";
    return format(new Date(date), "PP");
  }

  function formatTime(date: string | Date) {
    if (!date) return "";
    return format(new Date(date), "p");
  }

  function getInitials(firstName: string, lastName: string) {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  }

  return (
    <ParentLayout title="Parent Dashboard (TEST MODE)">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Parent Dashboard</h1>
            <p className="text-muted-foreground">
              {format(currentDate, "PPPP")}
            </p>
            <Badge variant="outline" className="mt-2 bg-yellow-50 text-yellow-800 border-yellow-300">
              TEST MODE - No Authentication Required
            </Badge>
          </div>
        </div>

        {/* Children Cards */}
        <h2 className="text-xl font-semibold mt-8 mb-4">My Children</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoadingChildren ? (
            Array(2).fill(0).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <Skeleton className="h-6 w-36 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : children && children.length > 0 ? (
            children.map((child: any) => (
              <Card key={child.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle>{child.firstName} {child.lastName}</CardTitle>
                  <CardDescription>#{child.id} • {child.ageGroup}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={child.profileImage} alt={`${child.firstName} ${child.lastName}`} />
                      <AvatarFallback>{getInitials(child.firstName, child.lastName)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{child.playerType || "Player"}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(child.dateOfBirth)}
                      </p>
                    </div>
                  </div>
                  {child.medicalInformation && (
                    <div className="text-sm mt-2">
                      <p className="font-medium">Medical Information:</p>
                      <p className="text-muted-foreground">{child.medicalInformation}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No children found. Please contact an administrator if this is an error.</p>
            </div>
          )}
        </div>

        {/* Upcoming Sessions */}
        <h2 className="text-xl font-semibold mt-8 mb-4">Upcoming Sessions</h2>
        <div className="space-y-4">
          {isLoadingSessions ? (
            Array(3).fill(0).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-4 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : upcomingSessions && upcomingSessions.length > 0 ? (
            upcomingSessions.map((session: any) => (
              <Card key={session.id}>
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-y-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-medium">{session.title}</h3>
                        <Badge variant="outline">{session.ageGroup}</Badge>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(session.startTime)}
                        <Clock className="h-4 w-4 ml-2" />
                        {formatTime(session.startTime)} - {formatTime(session.endTime)}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/10">
                        {session.location}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">No upcoming sessions scheduled.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Announcements */}
        <h2 className="text-xl font-semibold mt-8 mb-4">Recent Announcements</h2>
        <div className="space-y-4">
          {isLoadingAnnouncements ? (
            Array(2).fill(0).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Skeleton className="h-6 w-48" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : announcements && announcements.length > 0 ? (
            announcements.map((announcement: any) => (
              <Card key={announcement.id}>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <h3 className="text-lg font-medium">{announcement.title}</h3>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(announcement.createdAt), "PP")}
                      </span>
                    </div>
                    <p className="text-sm">{announcement.content}</p>
                    {announcement.author && (
                      <p className="text-xs text-muted-foreground text-right">
                        Posted by {announcement.createdByName}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-6 text-center flex flex-col items-center gap-2">
                <Info className="h-12 w-12 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No announcements yet.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ParentLayout>
  );
}