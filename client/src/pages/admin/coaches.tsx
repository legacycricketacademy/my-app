import { MainLayout } from "@/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, UserPlus, CheckCircle, XCircle, Mail, Phone, Calendar, Star } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

// Mock coach data
const mockCoaches = [
  {
    id: '1',
    name: 'Mike Wilson',
    email: 'mike.wilson@email.com',
    status: 'pending',
    joinDate: '2024-01-18',
    experience: '5 years',
    specialization: 'Batting',
    rating: 4.8,
    phone: '+1-555-0125',
    bio: 'Experienced batting coach with 5 years of professional cricket experience.',
    certifications: ['Level 2 Coach', 'First Aid Certified']
  },
  {
    id: '2',
    name: 'David Brown',
    email: 'david.brown@email.com',
    status: 'active',
    joinDate: '2023-12-20',
    experience: '8 years',
    specialization: 'Bowling',
    rating: 4.9,
    phone: '+1-555-0127',
    bio: 'Professional bowling coach specializing in fast bowling techniques.',
    certifications: ['Level 3 Coach', 'Sports Psychology', 'First Aid Certified']
  },
  {
    id: '3',
    name: 'Sarah Miller',
    email: 'sarah.miller@email.com',
    status: 'pending',
    joinDate: '2024-01-22',
    experience: '3 years',
    specialization: 'Fielding',
    rating: 4.6,
    phone: '+1-555-0128',
    bio: 'Former professional cricketer turned fielding specialist.',
    certifications: ['Level 2 Coach', 'Youth Development']
  },
  {
    id: '4',
    name: 'James Taylor',
    email: 'james.taylor@email.com',
    status: 'active',
    joinDate: '2023-11-15',
    experience: '10 years',
    specialization: 'All-rounder',
    rating: 4.9,
    phone: '+1-555-0129',
    bio: 'Former international cricketer with comprehensive coaching experience.',
    certifications: ['Level 4 Coach', 'Performance Analysis', 'Sports Nutrition']
  }
];

export default function CoachesPage() {
  const [coaches, setCoaches] = useState(mockCoaches);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredCoaches = coaches.filter(coach => {
    const matchesSearch = coach.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         coach.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         coach.specialization.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || coach.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case 'pending':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'inactive':
        return <Badge variant="default" className="bg-gray-100 text-gray-800">Inactive</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleApproveCoach = (coachId: string) => {
    setCoaches(coaches.map(coach => 
      coach.id === coachId ? { ...coach, status: 'active' } : coach
    ));
  };

  const handleRejectCoach = (coachId: string) => {
    setCoaches(coaches.map(coach => 
      coach.id === coachId ? { ...coach, status: 'inactive' } : coach
    ));
  };

  return (
    <MainLayout title="Manage Coaches">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Link href="/admin">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Admin Dashboard
            </Button>
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Manage Coaches</h1>
              <p className="text-muted-foreground">
                Review and approve new coach applications
              </p>
            </div>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Coach
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Coaches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{coaches.length}</div>
              <p className="text-xs text-muted-foreground">All coaches</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Coaches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{coaches.filter(c => c.status === 'active').length}</div>
              <p className="text-xs text-muted-foreground">Currently active</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{coaches.filter(c => c.status === 'pending').length}</div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(coaches.reduce((sum, c) => sum + c.rating, 0) / coaches.length).toFixed(1)}
              </div>
              <p className="text-xs text-muted-foreground">Out of 5.0</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search & Filter Coaches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by name, email, or specialization..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coaches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCoaches.map((coach) => (
            <Card key={coach.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{coach.name}</CardTitle>
                    <p className="text-sm text-gray-500">{coach.email}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium">{coach.rating}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  {getStatusBadge(coach.status)}
                  <Badge variant="outline">{coach.specialization}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    {coach.phone}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    Joined {new Date(coach.joinDate).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Experience:</strong> {coach.experience}
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Bio:</strong> {coach.bio}
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Certifications:</strong> {coach.certifications.join(', ')}
                  </div>
                  
                  {coach.status === 'pending' && (
                    <div className="flex gap-2 pt-3">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleApproveCoach(coach.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleRejectCoach(coach.id)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                  
                  {coach.status === 'active' && (
                    <div className="flex gap-2 pt-3">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Mail className="h-4 w-4 mr-1" />
                        Contact
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        View Profile
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {filteredCoaches.length === 0 && (
          <Card>
            <CardContent className="text-center py-8 text-gray-500">
              No coaches found matching your criteria.
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
