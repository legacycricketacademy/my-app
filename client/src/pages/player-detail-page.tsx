import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { MainLayout } from "@/layout/main-layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Heart, 
  FileText, 
  AlertTriangle,
  Activity, 
  DollarSign, 
  ArrowLeft,
  Loader2 
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { Link } from "wouter";

export default function PlayerDetailPage() {
  // Extract player ID from the route
  const [, params] = useRoute<{ id: string }>("/player/:id");
  const playerId = params?.id;
  
  // Get tab from URL query parameters if any
  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get('tab');
  
  // Fetch player data
  const { 
    data: player, 
    isLoading, 
    error 
  } = useQuery<any>({
    queryKey: [`/api/players/${playerId}`],
    queryFn: () => fetch(`/api/players/${playerId}`).then(res => res.json())
  });
  
  // Fetch fitness records
  const { 
    data: fitnessRecords 
  } = useQuery<any[]>({
    queryKey: [`/api/fitness/player/${playerId}`],
    enabled: !!playerId,
    queryFn: () => fetch(`/api/fitness/player/${playerId}`).then(res => res.json())
  });
  
  // Fetch payment records
  const { 
    data: paymentRecords 
  } = useQuery<any[]>({
    queryKey: [`/api/payments/player/${playerId}`],
    enabled: !!playerId,
    queryFn: () => fetch(`/api/payments/player/${playerId}`).then(res => res.json())
  });
  
  // Fetch attendance records
  const { 
    data: attendanceRecords 
  } = useQuery<any[]>({
    queryKey: [`/api/sessions/attendance/player/${playerId}`],
    enabled: !!playerId,
    queryFn: () => fetch(`/api/sessions/attendance/player/${playerId}`).then(res => res.json())
  });
  
  // Helper function to get initials for the avatar
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "MMMM d, yyyy");
    } catch (e) {
      return dateString;
    }
  };
  
  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string) => {
    try {
      const dob = parseISO(dateOfBirth);
      const now = new Date();
      let age = now.getFullYear() - dob.getFullYear();
      const m = now.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
        age--;
      }
      return age;
    } catch (e) {
      return "N/A";
    }
  };
  
  if (isLoading) {
    return (
      <MainLayout title="Player Details">
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }
  
  if (error || !player) {
    return (
      <MainLayout title="Player Details">
        <div className="flex flex-col items-center justify-center min-h-screen">
          <AlertTriangle className="h-12 w-12 text-danger mb-4" />
          <h2 className="text-2xl font-bold">Player Not Found</h2>
          <p className="text-gray-600 mb-4">The player you're looking for doesn't exist or you don't have permission to view it.</p>
          <Link href="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout title={`${player.firstName} ${player.lastName} | Player Profile`}>
      <div className="space-y-6">
        {/* Back Button */}
        <Link href="/players">
          <Button variant="ghost" className="flex items-center gap-2 mb-4">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Players</span>
          </Button>
        </Link>
        
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <Avatar className="h-24 w-24 border-4 border-white shadow-md">
            <AvatarImage src={player.profileImage} alt={`${player.firstName} ${player.lastName}`} />
            <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
              {getInitials(player.firstName, player.lastName)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h1 className="text-3xl font-bold heading">{player.firstName} {player.lastName}</h1>
            <div className="flex flex-wrap gap-3 mt-2">
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                {player.ageGroup}
              </span>
              {player.playerType && (
                <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm">
                  {player.playerType}
                </span>
              )}
              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                {calculateAge(player.dateOfBirth)} years old
              </span>
              {player.location && (
                <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-sm">
                  {player.location}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span>Contact Parent</span>
            </Button>
            <Button className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Generate Report</span>
            </Button>
          </div>
        </div>
        
        {/* Tabs Interface */}
        <Tabs defaultValue={tabParam || "info"} className="w-full">
          <TabsList className="w-full max-w-md grid grid-cols-4">
            <TabsTrigger value="info">Information</TabsTrigger>
            <TabsTrigger value="fitness">Fitness</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>
          
          {/* Basic Information Tab */}
          <TabsContent value="info" className="pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    <span>Player Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Date of Birth</p>
                      <p className="font-medium">{formatDate(player.dateOfBirth)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Age Group</p>
                      <p className="font-medium">{player.ageGroup}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Player Type</p>
                      <p className="font-medium">{player.playerType || "Not specified"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Location</p>
                      <p className="font-medium">{player.location || "Not specified"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-primary" />
                    <span>Emergency Contact</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Parent Name</p>
                    <p className="font-medium">{player.parentName || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Parent Email</p>
                    <p className="font-medium">{player.parentEmail || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Emergency Contact</p>
                    <p className="font-medium">{player.emergencyContact || "Not specified"}</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-warning" />
                    <span>Medical Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">
                    {player.medicalInformation || "No medical information provided."}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Fitness Tab */}
          <TabsContent value="fitness" className="pt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" />
                  <span>Fitness Records</span>
                </CardTitle>
                <CardDescription>
                  Track player's fitness and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                {fitnessRecords && fitnessRecords.length > 0 ? (
                  <div className="space-y-6">
                    {fitnessRecords.map((record: any) => (
                      <div key={record.id} className="border-b pb-4">
                        <div className="flex justify-between mb-2">
                          <h4 className="font-medium">{formatDate(record.recordDate)}</h4>
                          <span className="text-sm text-gray-500">
                            {format(parseISO(record.recordDate), "h:mm a")}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="text-sm text-gray-500">Running Speed</p>
                            <p className="text-lg font-medium">
                              {record.runningSpeed ? `${record.runningSpeed} km/h` : "Not recorded"}
                            </p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="text-sm text-gray-500">Endurance</p>
                            <p className="text-lg font-medium">
                              {record.endurance ? `${record.endurance} mins` : "Not recorded"}
                            </p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded">
                            <p className="text-sm text-gray-500">Strength</p>
                            <p className="text-lg font-medium">
                              {record.strength ? `${record.strength}/10` : "Not recorded"}
                            </p>
                          </div>
                        </div>
                        {record.notes && (
                          <div className="mt-3">
                            <p className="text-sm text-gray-500">Notes</p>
                            <p className="text-gray-700">{record.notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Activity className="h-12 w-12 text-gray-300 mb-3" />
                    <h3 className="text-lg font-medium">No Fitness Records</h3>
                    <p className="text-gray-500 text-center max-w-md">
                      No fitness data has been recorded for this player yet.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Attendance Tab */}
          <TabsContent value="attendance" className="pt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span>Session Attendance</span>
                </CardTitle>
                <CardDescription>
                  Track player's attendance at practice sessions and events
                </CardDescription>
              </CardHeader>
              <CardContent>
                {attendanceRecords && attendanceRecords.length > 0 ? (
                  <div className="space-y-2">
                    {attendanceRecords.map((record: any) => (
                      <div key={record.id} className="flex justify-between items-center p-3 border rounded hover:bg-gray-50">
                        <div>
                          <h4 className="font-medium">{record.sessionTitle || "Practice Session"}</h4>
                          <p className="text-sm text-gray-500">
                            {formatDate(record.sessionDate)}
                          </p>
                        </div>
                        <div className="flex items-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium
                            ${record.status === 'present' ? 'bg-green-100 text-green-800' : 
                              record.status === 'absent' ? 'bg-red-100 text-red-800' : 
                              'bg-yellow-100 text-yellow-800'}`}>
                            {record.status ? record.status.charAt(0).toUpperCase() + record.status.slice(1) : "Unknown"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Calendar className="h-12 w-12 text-gray-300 mb-3" />
                    <h3 className="text-lg font-medium">No Attendance Records</h3>
                    <p className="text-gray-500 text-center max-w-md">
                      This player has not been marked present or absent for any sessions yet.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Payments Tab */}
          <TabsContent value="payments" className="pt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <span>Payment History</span>
                </CardTitle>
                <CardDescription>
                  View payment history and outstanding fees
                </CardDescription>
              </CardHeader>
              <CardContent>
                {paymentRecords && paymentRecords.length > 0 ? (
                  <div className="space-y-2">
                    {paymentRecords.map((payment: any) => (
                      <div key={payment.id} className="flex justify-between items-center p-3 border rounded hover:bg-gray-50">
                        <div>
                          <h4 className="font-medium">{payment.description || "Session Payment"}</h4>
                          <p className="text-sm text-gray-500">
                            {formatDate(payment.paymentDate || payment.dueDate)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="font-medium">${payment.amount.toFixed(2)}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium
                            ${payment.status === 'paid' ? 'bg-green-100 text-green-800' : 
                              payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                              'bg-red-100 text-red-800'}`}>
                            {payment.status ? payment.status.charAt(0).toUpperCase() + payment.status.slice(1) : "Unknown"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <DollarSign className="h-12 w-12 text-gray-300 mb-3" />
                    <h3 className="text-lg font-medium">No Payment Records</h3>
                    <p className="text-gray-500 text-center max-w-md">
                      No payment records have been created for this player yet.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}