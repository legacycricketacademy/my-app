import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { ActivitySquare, Users, Calendar, Award } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function SummaryCard() {
  const { user } = useAuth();
  
  // Fetch children (players) for the parent
  const { data: children, isLoading: isLoadingChildren } = useQuery({
    queryKey: ["/api/players/parent"],
    queryFn: () => fetch("/api/players/parent").then(res => res.json()),
    enabled: !!user,
  });

  // Fetch upcoming sessions count
  const { data: sessionStats, isLoading: isLoadingSessionStats } = useQuery({
    queryKey: ["/api/sessions/stats"],
    queryFn: () => fetch("/api/sessions/stats").then(res => res.json()),
    enabled: !!user,
  });

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Children Enrolled
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoadingChildren ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <>
              <div className="text-2xl font-bold">{children?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Active cricket players
              </p>
            </>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Upcoming Sessions
          </CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoadingSessionStats ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <>
              <div className="text-2xl font-bold">{sessionStats?.upcoming || 0}</div>
              <p className="text-xs text-muted-foreground">
                Next 7 days
              </p>
            </>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Completed Sessions
          </CardTitle>
          <ActivitySquare className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoadingSessionStats ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <>
              <div className="text-2xl font-bold">{sessionStats?.completed || 0}</div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Achievements
          </CardTitle>
          <Award className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isLoadingChildren ? (
            <Skeleton className="h-8 w-20" />
          ) : (
            <>
              <div className="text-2xl font-bold">{sessionStats?.achievements || 0}</div>
              <p className="text-xs text-muted-foreground">
                Badges earned
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}