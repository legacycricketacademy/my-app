import React, { useState } from 'react';
import { MainLayout } from "@/layout/main-layout";
import { getCurrentUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Calendar, 
  User, 
  Utensils, 
  MapPin, 
  CreditCard, 
  Activity, 
  CalendarCheck, 
  PlusCircle,
  Award
} from 'lucide-react';
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { format } from "date-fns";
import { TID } from "@/ui/testids";

// TID imported for testids

// Types
interface Session {
  id: number;
  title: string;
  dateTime: Date;
  location: string;
  status: "confirmed" | "tentative" | "cancelled";
}

interface SkillRating {
  skill: string;
  rating: number;
  feedback: string;
}

// Mock data for skills development
const playerSkills: SkillRating[] = [
  { skill: "Batting Technique", rating: 4, feedback: "Good progress on stance and shot selection" },
  { skill: "Bowling Accuracy", rating: 3, feedback: "Improving line and length, work on variations" },
  { skill: "Fielding", rating: 4, feedback: "Excellent ground fielding and throwing accuracy" },
  { skill: "Game Awareness", rating: 3, feedback: "Understanding game situations well" },
  { skill: "Team Collaboration", rating: 5, feedback: "Outstanding teamwork and communication" }
];

export default function EnhancedParentDashboard() {
  const user = getCurrentUser();
  const [activeTab, setActiveTab] = useState("schedule");
  
  // Fetch upcoming sessions - in a real implementation this would use the API
  const { data: sessions, isLoading: isLoadingSessions } = useQuery({
    queryKey: ["/api/parent/sessions"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/parent/sessions");
        return await res.json();
      } catch (error) {
        console.error("Error fetching sessions:", error);
        return [];
      }
    },
    enabled: activeTab === "schedule" // Only fetch when schedule tab is active
  });
  
  // Placeholder for sessions if API is not available yet
  const upcomingSessions: Session[] = sessions?.data || [];
  
  // Render the status badge for a session
  const SessionStatusBadge = ({ status }: { status: string }) => {
    const statusStyles = {
      confirmed: "bg-green-100 text-green-800",
      tentative: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-red-100 text-red-800"
    };
    
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${statusStyles[status as keyof typeof statusStyles]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };
  
  return (
    <MainLayout title="Parent Dashboard">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight" data-testid={TID.dashboard.title}>Welcome, {user?.fullName || 'Parent'}</h1>
            <p className="text-muted-foreground">
              Manage your child's cricket activities and progress
            </p>
          </div>
          <Button 
            className="w-full sm:w-auto"
            onClick={() => window.location.href = '/schedule'}
          >
            <CalendarCheck className="mr-2 h-4 w-4" />
            View Full Calendar
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card data-testid={TID.dashboard.stats}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
          <Card data-testid={TID.dashboard.announcements}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Announcements</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">New updates</p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <TabsTrigger value="schedule" className="flex items-center">
              <Calendar className="mr-2 h-4 w-4" />
              <span>Schedule</span>
            </TabsTrigger>
            <TabsTrigger value="player" className="flex items-center">
              <User className="mr-2 h-4 w-4" />
              <span>Player Profile</span>
            </TabsTrigger>
            <TabsTrigger value="fitness" className="flex items-center">
              <Activity className="mr-2 h-4 w-4" />
              <span>Fitness & Meals</span>
            </TabsTrigger>
            <TabsTrigger value="location" className="flex items-center">
              <MapPin className="mr-2 h-4 w-4" />
              <span>Locations</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center">
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Payments</span>
            </TabsTrigger>
          </TabsList>
          
          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-4">
            <Card data-testid={TID.dashboard.schedule}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="mr-2 h-5 w-5" />
                  Upcoming Sessions
                </CardTitle>
                <CardDescription>
                  View and manage your child's upcoming cricket sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingSessions ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                  </div>
                ) : upcomingSessions.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingSessions.map((session, index) => (
                      <div key={session.id || index} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <div className="font-medium">{session.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(session.dateTime), "MMM dd, yyyy • h:mm a")}
                          </div>
                          <div className="text-sm text-muted-foreground">{session.location}</div>
                        </div>
                        <div className="flex items-center mt-2 sm:mt-0">
                          <SessionStatusBadge status={session.status} />
                          <Button variant="ghost" size="sm" className="ml-2">
                            Add to Calendar
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" className="w-full">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Load More Sessions
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-muted-foreground mb-2">No upcoming sessions found</div>
                    <Button variant="outline">View Past Sessions</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Player Profile Tab */}
          <TabsContent value="player" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card data-testid={TID.dashboard.players}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="mr-2 h-5 w-5" />
                    Player Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Name</p>
                        <p>Arjun Sharma</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Age</p>
                        <p>12 years</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Player ID</p>
                        <p>LCA-2023-078</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Joined</p>
                        <p>March 15, 2023</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Emergency Contact</p>
                      <p>Rajesh Sharma - +91 9876543210</p>
                    </div>
                    <div className="pt-2 flex gap-2">
                      <Button variant="outline" size="sm">Update Information</Button>
                      <Button 
                        size="sm"
                        data-testid="add-player-btn"
                        onClick={() => window.location.href = '/players/add'}
                      >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Player
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card data-testid={TID.dashboard.fitness}>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Award className="mr-2 h-5 w-5" />
                    Skills Development
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {playerSkills.map((skill, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{skill.skill}</span>
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span 
                                key={i}
                                className={`w-4 h-4 rounded-full mx-0.5 ${
                                  i < skill.rating ? 'bg-primary' : 'bg-gray-200'
                                }`} 
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{skill.feedback}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Fitness & Meals Tab */}
          <TabsContent value="fitness" className="space-y-4">
            <Card data-testid={TID.dashboard.meal}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Utensils className="mr-2 h-5 w-5" />
                  Nutrition & Meal Plans
                </CardTitle>
                <CardDescription>
                  Recommended meal plans and nutrition guidelines
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="rounded-lg border p-4">
                    <h3 className="font-semibold mb-2">Weekly Meal Plan</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      A balanced diet optimized for young cricket players
                    </p>
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium">Pre-Training (2 hours before)</h4>
                        <ul className="list-disc pl-5 text-sm">
                          <li>Whole grain sandwich with lean protein</li>
                          <li>Banana or apple</li>
                          <li>Water (500ml)</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium">Post-Training (within 30 minutes)</h4>
                        <ul className="list-disc pl-5 text-sm">
                          <li>Protein shake or milk</li>
                          <li>Fruit and yogurt</li>
                          <li>Water or electrolyte drink</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium">Daily Recommendations</h4>
                        <ul className="list-disc pl-5 text-sm">
                          <li>3 servings of fruits</li>
                          <li>5 servings of vegetables</li>
                          <li>Adequate protein with each meal</li>
                          <li>2-3 liters of water daily</li>
                        </ul>
                      </div>
                    </div>
                    
                    <Button className="mt-4" variant="outline">
                      Download Complete Meal Plan
                    </Button>
                  </div>
                  
                  <div className="rounded-lg border p-4">
                    <h3 className="font-semibold mb-2">Fitness Progress</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-primary/10 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-primary">85%</div>
                        <div className="text-xs text-muted-foreground">Fitness Score</div>
                      </div>
                      <div className="bg-primary/10 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-primary">92%</div>
                        <div className="text-xs text-muted-foreground">Attendance</div>
                      </div>
                      <div className="bg-primary/10 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-primary">12</div>
                        <div className="text-xs text-muted-foreground">Training Hours</div>
                      </div>
                      <div className="bg-primary/10 p-3 rounded-lg text-center">
                        <div className="text-2xl font-bold text-primary">8</div>
                        <div className="text-xs text-muted-foreground">Weekly Goals</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Locations Tab */}
          <TabsContent value="location" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="mr-2 h-5 w-5" />
                  Cricket Academy Locations
                </CardTitle>
                <CardDescription>
                  All venues where training sessions are conducted
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border mb-4 overflow-hidden">
                  <div className="h-64 bg-muted flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">Map will be displayed here</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <h3 className="font-semibold">Main Cricket Ground</h3>
                    <p className="text-sm text-muted-foreground">123 Sports Avenue, New Delhi - 110001</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Button variant="outline" size="sm">Get Directions</Button>
                      <Button variant="outline" size="sm">Facilities Info</Button>
                    </div>
                  </div>
                  
                  <div className="rounded-lg border p-4">
                    <h3 className="font-semibold">Academy Training Center</h3>
                    <p className="text-sm text-muted-foreground">456 Cricket Lane, New Delhi - 110021</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Button variant="outline" size="sm">Get Directions</Button>
                      <Button variant="outline" size="sm">Facilities Info</Button>
                    </div>
                  </div>
                  
                  <div className="rounded-lg border p-4">
                    <h3 className="font-semibold">City Cricket Stadium</h3>
                    <p className="text-sm text-muted-foreground">789 Stadium Road, New Delhi - 110005</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Button variant="outline" size="sm">Get Directions</Button>
                      <Button variant="outline" size="sm">Facilities Info</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-4">
            <Card data-testid={TID.dashboard.payments}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="mr-2 h-5 w-5" />
                  Payment History
                </CardTitle>
                <CardDescription>
                  Track payments and upcoming dues
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border p-4 mb-6 bg-green-50 dark:bg-green-900/20">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-lg">May 2025 Payment Status</h3>
                      <p className="text-sm text-muted-foreground">Regular Training Package</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600 dark:text-green-400">PAID</div>
                      <div className="text-xs text-muted-foreground">Next payment: June 1, 2025</div>
                    </div>
                  </div>
                </div>
                
                <h3 className="font-semibold mb-4">Payment History</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">May 2025</div>
                      <div className="text-sm text-muted-foreground">Regular Training Fee</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">₹8,500</div>
                      <div className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 px-2 py-0.5 rounded">Paid</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">April 2025</div>
                      <div className="text-sm text-muted-foreground">Regular Training Fee</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">₹8,500</div>
                      <div className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 px-2 py-0.5 rounded">Paid</div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">March 2025</div>
                      <div className="text-sm text-muted-foreground">Regular Training Fee</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">₹8,500</div>
                      <div className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 px-2 py-0.5 rounded">Paid</div>
                    </div>
                  </div>
                  
                  <Button variant="outline" className="w-full">
                    View All Transactions
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}