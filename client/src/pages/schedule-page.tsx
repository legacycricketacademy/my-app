import { useState } from "react";
import { MainLayout } from "@/layout/main-layout";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarPlus, Clock, MapPin, Users, User } from "lucide-react";
import { format, isToday, isTomorrow, addDays, startOfDay, endOfDay } from "date-fns";
import { ScheduleSessionDialog } from "@/components/sessions/schedule-session-dialog";

export default function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [ageGroupFilter, setAgeGroupFilter] = useState<string>("all");
  
  const { data: upcomingSessionsData, isLoading } = useQuery<any[]>({
    queryKey: ["/api/sessions/all"], // Fetch ALL sessions regardless of date
    queryFn: () => fetch("/api/sessions/all").then(res => res.json())
  });
  
  // Safe array handling with logging for debugging
  const upcomingSessions = Array.isArray(upcomingSessionsData) ? upcomingSessionsData : [];
  if (!Array.isArray(upcomingSessionsData)) {
    console.log('DEBUG: upcomingSessions data is not an array:', typeof upcomingSessionsData, upcomingSessionsData);
  }
  
  // Filter sessions for the selected date
  const selectedDateSessions = upcomingSessions.filter(session => {
    if (!selectedDate) return false;
    
    const sessionDate = new Date(session.startTime);
    return (
      sessionDate >= startOfDay(selectedDate) && 
      sessionDate <= endOfDay(selectedDate)
    );
  }).filter(session => {
    if (ageGroupFilter === "all") return true;
    return session.ageGroup === ageGroupFilter;
  });
  
  const getTimeDisplay = (dateString: string) => {
    return format(new Date(dateString), "h:mm a");
  };
  
  const getSessionTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'training':
        return "border-primary";
      case 'fitness':
        return "border-secondary";
      case 'meeting':
        return "border-accent";
      case 'practice match':
        return "border-warning";
      default:
        return "border-gray-300";
    }
  };
  
  const getDayLabel = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "EEEE, MMMM d");
  };

  return (
    <MainLayout title="Schedule">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 heading">Schedule</h1>
            <p className="text-gray-600">Manage practice sessions and events</p>
          </div>
          
          <ScheduleSessionDialog />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg heading">Select Date</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
              />
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Age Group</label>
                <Select value={ageGroupFilter} onValueChange={setAgeGroupFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Age Groups" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Age Groups</SelectItem>
                    <SelectItem value="5-8 years">5-8 years</SelectItem>
                    <SelectItem value="8+ years">8+ years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          
          {/* Sessions List */}
          <Card className="lg:col-span-2">
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-lg heading">
                {selectedDate ? getDayLabel(selectedDate) : "Sessions"} Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-gray-500">Loading sessions...</p>
                </div>
              ) : selectedDateSessions && selectedDateSessions.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {selectedDateSessions.map((session) => (
                    <div key={session.id} className={`p-4 ${getSessionTypeColor(session.sessionType)} border-l-4`}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
                        <h3 className="font-medium text-lg">{session.title}</h3>
                        <div className="flex items-center mt-1 sm:mt-0">
                          <Clock className="h-4 w-4 text-gray-500 mr-1" />
                          <span className="text-sm text-gray-600">
                            {getTimeDisplay(session.startTime)} - {getTimeDisplay(session.endTime)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 text-sm text-gray-600 mt-2">
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>{session.location}</span>
                        </div>
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          <span>Coach: {session.coachName}</span>
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          <span>{session.ageGroup}</span>
                        </div>
                        <div className="flex items-center">
                          <div className="h-2 w-2 rounded-full bg-secondary mr-1"></div>
                          <span>{session.sessionType}</span>
                        </div>
                      </div>
                      
                      {session.description && (
                        <p className="mt-2 text-sm text-gray-600 italic">
                          "{session.description}"
                        </p>
                      )}
                      
                      <div className="mt-4 flex justify-end">
                        <Button variant="outline" size="sm" className="mr-2">
                          Take Attendance
                        </Button>
                        <Button size="sm">
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <p>No sessions scheduled for this date</p>
                  <ScheduleSessionDialog />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Weekly Overview */}
        <Card className="bg-white">
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="text-lg heading">Upcoming Week Overview</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-7 divide-y md:divide-y-0 md:divide-x divide-gray-200">
              {Array.from({ length: 7 }).map((_, index) => {
                const date = addDays(new Date(), index);
                const daySessions = upcomingSessions.filter(session => {
                  const sessionDate = new Date(session.startTime);
                  return (
                    sessionDate >= startOfDay(date) && 
                    sessionDate <= endOfDay(date)
                  );
                });
                
                return (
                  <div key={index} className="p-3">
                    <h3 className={`text-sm font-medium ${isToday(date) ? "text-primary" : "text-gray-700"}`}>
                      {format(date, "EEE")}{' '}
                      <span className="text-xs text-gray-500">{format(date, "d")}</span>
                    </h3>
                    
                    <div className="mt-2 space-y-2">
                      {daySessions && daySessions.length > 0 ? (
                        daySessions.slice(0, 3).map((session) => (
                          <div 
                            key={session.id} 
                            className={`text-xs p-1.5 rounded-sm ${getSessionTypeColor(session.sessionType)} border-l-2`}
                          >
                            <p className="font-medium truncate">{session.title}</p>
                            <p className="text-gray-500 truncate">{getTimeDisplay(session.startTime)}</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-gray-400 py-2">No sessions</p>
                      )}
                      
                      {daySessions && daySessions.length > 3 && (
                        <p className="text-xs text-primary">
                          +{daySessions.length - 3} more
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
