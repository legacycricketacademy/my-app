import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/parent/kids/${kidId}/dashboard`],
    queryFn: () => api.get(`/parent/kids/${kidId}/dashboard`),
    enabled: !!kidId,
  });

  const dashboardData: KidDashboardData | null = data?.data || null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
        <div className="flex items-center gap-3">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
          <span className="text-gray-700 font-medium" data-testid="loading-dashboard">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-red-200">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <User className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900" data-testid="error-heading">Error Loading Dashboard</h2>
              <p className="text-gray-600">
                Failed to load kid dashboard. Please try again later.
              </p>
              <Button 
                onClick={() => navigate("/parent/kids")}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Kids List
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { kid, attendance, upcomingSessions, recentNotes, batting, bowling, fielding, discipline } = dashboardData;

  const attendancePercentage = attendance.total > 0
    ? Math.round((attendance.attended / attendance.total) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 px-4 py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <Button 
            variant="outline" 
            onClick={() => navigate("/parent/kids")}
            className="border-gray-300 hover:bg-white"
            data-testid="btn-back-to-kids"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to My Kids
          </Button>
          
          {/* Kid Info Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-4">
              {kid.profileImage ? (
                <img
                  src={kid.profileImage}
                  alt={kid.fullName}
                  className="w-20 h-20 rounded-full object-cover border-4 border-blue-100"
                  data-testid="kid-avatar"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center border-4 border-blue-100">
                  <User className="h-10 w-10 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900" data-testid="kid-name">{kid.fullName}</h1>
                <p className="text-gray-600 text-lg" data-testid="kid-info">
                  Age {kid.age} • {kid.ageGroup} • {kid.location}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics Grid - Simple Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {/* Fitness */}
          <div className="bg-white rounded-xl shadow-md p-6 text-center" data-testid="tile-fitness">
            <Activity className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-sm font-medium text-gray-600 mb-1">Fitness</div>
            <div className="text-2xl font-bold text-gray-900">
              {dashboardData.fitness ? `${Math.round((dashboardData.fitness.speed + dashboardData.fitness.agility + dashboardData.fitness.endurance) / 3 * 20)}%` : 'N/A'}
            </div>
          </div>

          {/* Batting */}
          <div className="bg-white rounded-xl shadow-md p-6 text-center" data-testid="tile-batting">
            <Target className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-sm font-medium text-gray-600 mb-1">Batting</div>
            <div className="text-2xl font-bold text-gray-900">
              {batting ? `${Math.round((batting.footwork + batting.shotSelection + batting.batSwingPath + batting.balancePosture) / 4 * 20)}%` : 'N/A'}
            </div>
          </div>

          {/* Bowling */}
          <div className="bg-white rounded-xl shadow-md p-6 text-center" data-testid="tile-bowling">
            <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="text-sm font-medium text-gray-600 mb-1">Bowling</div>
            <div className="text-2xl font-bold text-gray-900">
              {bowling ? `${Math.round((bowling.runUpRhythm + bowling.loadGather + bowling.releaseConsistency + bowling.lineLength) / 4 * 20)}%` : 'N/A'}
            </div>
          </div>

          {/* Fielding */}
          <div className="bg-white rounded-xl shadow-md p-6 text-center" data-testid="tile-fielding">
            <Activity className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <div className="text-sm font-medium text-gray-600 mb-1">Fielding</div>
            <div className="text-2xl font-bold text-gray-900">
              {fielding ? `${Math.round((fielding.throwingAccuracy + fielding.catching + fielding.groundFielding) / 3 * 20)}%` : 'N/A'}
            </div>
          </div>

          {/* Discipline */}
          <div className="bg-white rounded-xl shadow-md p-6 text-center" data-testid="tile-discipline">
            <CheckCircle2 className="h-8 w-8 text-teal-600 mx-auto mb-2" />
            <div className="text-sm font-medium text-gray-600 mb-1">Discipline</div>
            <div className="text-2xl font-bold text-gray-900">
              {discipline ? `${Math.round((discipline.focus + discipline.teamwork + discipline.coachability) / 3 * 20)}%` : 'N/A'}
            </div>
          </div>
        </div>

        {/* Upcoming Sessions */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Upcoming Sessions</h2>
          </div>
          
          {upcomingSessions.length === 0 ? (
            <p className="text-gray-500 text-center py-8" data-testid="no-sessions">
              No upcoming sessions scheduled
            </p>
          ) : (
            <div className="space-y-4">
              {upcomingSessions.map((session) => {
                const status = session.availabilityStatus;
                return (
                  <div
                    key={session.id}
                    className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-colors"
                    data-testid="session-row"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="space-y-1 flex-1">
                          <div className="font-semibold text-gray-900" data-testid="session-title">{session.title}</div>
                          <div className="text-sm text-gray-600" data-testid="session-time">
                            {format(new Date(session.startTime), "MMM dd, yyyy • h:mm a")}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="h-4 w-4" />
                            {session.location}
                          </div>
                        </div>
                        <Badge 
                          variant="outline" 
                          className="self-start bg-blue-50 text-blue-700 border-blue-200"
                        >
                          {session.sessionType}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-600">Status:</span>
                        {!status && (
                          <Badge variant="secondary" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            Not Answered
                          </Badge>
                        )}
                        {status === "yes" && (
                          <Badge className="text-xs bg-green-600 hover:bg-green-700" data-testid="status-yes">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Coming
                          </Badge>
                        )}
                        {status === "no" && (
                          <Badge variant="destructive" className="text-xs" data-testid="status-no">
                            <XCircle className="h-3 w-3 mr-1" />
                            Can't Attend
                          </Badge>
                        )}
                        {status === "maybe" && (
                          <Badge variant="outline" className="text-xs" data-testid="status-maybe">
                            <Clock className="h-3 w-3 mr-1" />
                            Not Sure
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
