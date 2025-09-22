import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { User, UserCircle, Users, CalendarCheck2 } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export function ScheduleCard() {
  const { data: sessions, isLoading } = useQuery<any[]>({
    queryKey: ["/api/sessions/today"],
    queryFn: () => api.get("/sessions/today")
  });

  const formatTime = (dateString: string) => {
    if (!dateString) return "Invalid time";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid time";
    return format(date, "h:mm a");
  };

  return (
    <Card className="bg-white rounded-lg shadow">
      <CardHeader className="flex items-center justify-between border-b border-gray-200 p-4">
        <CardTitle className="font-semibold text-lg heading">Today's Schedule</CardTitle>
        <Link href="/schedule" className="text-primary text-sm hover:underline">
          View All
        </Link>
      </CardHeader>
      
      <CardContent className="p-4 space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            <div className="border-l-4 border-gray-200 pl-3 py-1 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-gray-100 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-100 rounded w-1/2"></div>
            </div>
            <div className="border-l-4 border-gray-200 pl-3 py-1 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-4 bg-gray-100 rounded w-1/3 mb-2"></div>
              <div className="h-4 bg-gray-100 rounded w-1/2"></div>
            </div>
          </div>
        ) : (sessions ?? []).length > 0 ? (
          sessions.map((session, index) => {
            let borderColor = "border-primary";
            if (index % 3 === 1) borderColor = "border-secondary";
            if (index % 3 === 2) borderColor = "border-accent";
            
            return (
              <div key={session.id} className={`border-l-4 ${borderColor} pl-3 py-1`}>
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-gray-800">{session.title}</h4>
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    {formatTime(session.startTime)} - {formatTime(session.endTime)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{session.location}</p>
                <div className="flex items-center mt-2 text-xs">
                  {session.maxPlayers && (
                    <span className="flex items-center text-secondary mr-3">
                      <Users className="h-3 w-3 mr-1" /> 
                      {session.maxPlayers} players
                    </span>
                  )}
                  <span className="flex items-center text-gray-600">
                    <UserCircle className="h-3 w-3 mr-1" /> 
                    {session.coachName || "Coach"}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="mb-4">
              <CalendarCheck2 className="h-12 w-12 mx-auto text-gray-300" />
            </div>
            <p className="text-lg font-medium mb-2">No sessions today</p>
            <p className="text-sm mb-4">Schedule your first training session</p>
            <Button size="sm" className="bg-primary text-white">
              <CalendarCheck2 className="h-4 w-4 mr-2" />
              Schedule Session
            </Button>
          </div>
        )}
        
        {(sessions ?? []).length > 0 && (
          <div className="text-center py-2 text-gray-500 text-sm border-t border-gray-100">
            <p>No more sessions scheduled for today</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
