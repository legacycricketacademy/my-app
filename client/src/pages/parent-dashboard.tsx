import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { MainLayout } from "@/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Calendar, DollarSign, TrendingUp, Users, CreditCard, Clock } from "lucide-react";
import { format, addDays } from "date-fns";

// Sample data for MVP
const sampleSchedule = [
  { id: 1, title: "Cricket Practice", date: new Date(), time: "4:00 PM", location: "Main Field", coach: "Coach Smith" },
  { id: 2, title: "Batting Session", date: addDays(new Date(), 2), time: "3:30 PM", location: "Indoor Nets", coach: "Coach Johnson" },
  { id: 3, title: "Team Match", date: addDays(new Date(), 5), time: "10:00 AM", location: "Stadium A", coach: "Coach Smith" },
];

const sampleStats = {
  attendanceRate: 92,
  skillsScore: 78,
  practicesThisMonth: 12,
  upcomingSessions: 3,
};

const samplePayments = [
  { id: 1, description: "Monthly Coaching Fee", amount: 150, dueDate: addDays(new Date(), 7), status: "pending" },
  { id: 2, description: "Equipment Fee", amount: 75, dueDate: addDays(new Date(), 14), status: "pending" },
];

export default function ParentDashboard() {
  const { toast } = useToast();
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState("");

  // Check if user is authenticated (for demo, we'll show login CTA if no auth)
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/user/profile"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/user/profile");
        return await res.json();
      } catch (error) {
        return null; // Not authenticated
      }
    },
  });

  const handleSchedulePayment = async () => {
    if (!paymentAmount || !paymentDate) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    // Store payment intent in localStorage for MVP
    const paymentIntent = {
      amount: parseFloat(paymentAmount),
      scheduledDate: paymentDate,
      createdAt: new Date().toISOString(),
    };
    
    const existingPayments = JSON.parse(localStorage.getItem("scheduledPayments") || "[]");
    existingPayments.push(paymentIntent);
    localStorage.setItem("scheduledPayments", JSON.stringify(existingPayments));

    // Stub API call
    try {
      const res = await fetch("/api/payments/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-local-admin": "1" },
        body: JSON.stringify(paymentIntent),
      });
      
      if (res.ok) {
        toast({
          title: "Success",
          description: "Payment scheduled successfully",
        });
        setPaymentModalOpen(false);
        setPaymentAmount("");
        setPaymentDate("");
      }
    } catch (error) {
      // For MVP, we'll just show success since it's stored locally
      toast({
        title: "Success",
        description: "Payment scheduled successfully (stored locally)",
      });
      setPaymentModalOpen(false);
      setPaymentAmount("");
      setPaymentDate("");
    }
  };

  if (isLoading) {
    return (
      <MainLayout title="Parent Dashboard">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  // Show login CTA if not authenticated
  if (!user) {
    return (
      <MainLayout title="Parent Dashboard">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="max-w-md mx-auto">
            <h1 className="text-3xl font-bold mb-4">Welcome to Cricket Academy</h1>
            <p className="text-muted-foreground mb-6">
              Please log in to access your parent dashboard and manage your child's cricket training.
            </p>
            <Button size="lg" onClick={() => window.location.href = "/auth"}>
              Log In to Continue
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Parent Dashboard">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Parent Dashboard</h1>
          <p className="text-muted-foreground">
            Track your child's progress and manage cricket training activities.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sampleStats.attendanceRate}%</div>
              <p className="text-xs text-muted-foreground">
                {sampleStats.practicesThisMonth} practices this month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Skills Score</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sampleStats.skillsScore}/100</div>
              <p className="text-xs text-muted-foreground">
                Overall development score
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sampleStats.upcomingSessions}</div>
              <p className="text-xs text-muted-foreground">
                Next 7 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${samplePayments.reduce((sum, p) => sum + p.amount, 0)}</div>
              <p className="text-xs text-muted-foreground">
                {samplePayments.length} payments due
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Schedule</CardTitle>
              <CardDescription>Your child's cricket training sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sampleSchedule.map((session) => (
                  <div key={session.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                    <div className="flex-shrink-0">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{session.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(session.date, "MMM d")} at {session.time} • {session.location}
                      </p>
                      <p className="text-xs text-muted-foreground">Coach: {session.coach}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Payments & Billing</CardTitle>
                <CardDescription>Manage your cricket academy payments</CardDescription>
              </div>
              <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Schedule Payment
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Schedule Payment</DialogTitle>
                    <DialogDescription>
                      Set up a future payment for cricket academy fees.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="amount">Amount ($)</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="150.00"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="date">Payment Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={paymentDate}
                        onChange={(e) => setPaymentDate(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleSchedulePayment} className="w-full">
                      Schedule Payment
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {samplePayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{payment.description}</p>
                      <p className="text-xs text-muted-foreground flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Due {format(payment.dueDate, "MMM d, yyyy")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">${payment.amount}</p>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                        {payment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
