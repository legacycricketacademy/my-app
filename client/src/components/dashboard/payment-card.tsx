import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, DollarSign, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { api } from "@/lib/api";
import { safeInitials, safeNumber, safePercentage } from "@/lib/strings";
import { toast } from "@/hooks/use-toast";

export function PaymentCard() {
  const [period, setPeriod] = useState<string>("thisMonth");
  const queryClient = useQueryClient();
  
  const { data: pendingPayments, isLoading } = useQuery<any[]>({
    queryKey: ["/api/payments/pending"],
    queryFn: () => api.get("/payments/pending")
  });
  
  const { data: stats } = useQuery<any>({
    queryKey: ["/api/dashboard/stats"],
    queryFn: () => api.get("/dashboard/stats")
  });

  // Send individual payment reminder mutation
  const sendReminderMutation = useMutation({
    mutationFn: (paymentId: number) => api.post(`/payments/${paymentId}/remind`),
    onSuccess: () => {
      toast({
        title: "Reminder Sent",
        description: "Payment reminder has been sent successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send reminder. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Send all reminders mutation
  const sendAllRemindersMutation = useMutation({
    mutationFn: () => api.post("/payments/send-all-reminders"),
    onSuccess: (data) => {
      toast({
        title: "Reminders Sent",
        description: data.message || "Payment reminders have been sent successfully.",
      });
      // Refresh notifications to show new reminders
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send reminders. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Removed getInitials - now using safeInitials from strings.ts
  
  const getStatusColor = (daysOverdue: number) => {
    if (daysOverdue > 0) return "bg-danger/10 text-danger";
    if (daysOverdue === 0) return "bg-warning/10 text-warning";
    return "bg-info/10 text-info";
  };
  
  const getStatusText = (daysOverdue: number) => {
    if (daysOverdue > 0) return `${daysOverdue} days overdue`;
    if (daysOverdue === 0) return "Due today";
    return `Due in ${Math.abs(daysOverdue)} days`;
  };
  
  // Calculate days overdue based on due date
  const getDaysOverdue = (dueDate: string) => {
    if (!dueDate) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    if (isNaN(due.getTime())) return 0;
    const diffTime = today.getTime() - due.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <Card className="bg-white rounded-lg shadow">
      <CardHeader className="flex items-center justify-between border-b border-gray-200 p-4">
        <CardTitle className="font-semibold text-lg heading">Payment Tracker</CardTitle>
        <Link href="/payments" className="text-primary text-sm hover:underline">
          View All
        </Link>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-gray-700">Payment Status</h4>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="text-xs bg-gray-100 rounded border-0 focus:ring-1 focus:ring-primary h-7 w-32">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
              <SelectItem value="customRange">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Payment Status Chart */}
        <div className="mb-4 h-40 flex items-center justify-center">
          <div className="relative h-36 w-36">
            <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-2xl font-bold text-primary">
                    {safePercentage(
                      (stats?.playerCount || 0) - (stats?.pendingPaymentsCount || 0),
                      stats?.playerCount || 0
                    )}%
                  </span>
              <span className="text-xs text-gray-500">Paid</span>
            </div>
            {/* Circle chart */}
            <svg className="h-full w-full" viewBox="0 0 36 36">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#E9ECEF" strokeWidth="3" />
              <path 
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                fill="none" 
                stroke="#3366CC" 
                strokeWidth="3" 
                    strokeDasharray={`${safePercentage(
                      (stats?.playerCount || 0) - (stats?.pendingPaymentsCount || 0),
                      stats?.playerCount || 0
                    )}, 100`}
              />
            </svg>
          </div>
        </div>
        
        {/* Pending Payments */}
        <h4 className="text-sm font-medium text-gray-700 mb-3">Pending Payments</h4>
        <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-hide">
          {isLoading ? (
            Array(3).fill(0).map((_, index) => (
              <div key={index} className="flex items-center justify-between border-b border-gray-100 pb-3 animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full bg-gray-200"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                    <div className="h-3 bg-gray-100 rounded w-32"></div>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="h-5 bg-gray-100 rounded w-24 mr-2"></div>
                  <div className="h-6 w-6 rounded-full bg-gray-100"></div>
                </div>
              </div>
            ))
          ) : (pendingPayments ?? []).length > 0 ? (
            pendingPayments.map((payment) => {
              const daysOverdue = getDaysOverdue(payment.dueDate);
              
              return (
                <div key={payment.id} className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={payment.profileImage} alt={`${payment.playerFirstName || ''} ${payment.playerLastName || ''}`} />
                          <AvatarFallback>{safeInitials(`${payment.playerFirstName || ''} ${payment.playerLastName || ''}`)}</AvatarFallback>
                        </Avatar>
                    <div>
                      <h4 className="text-sm font-medium">{payment.playerFirstName} {payment.playerLastName}</h4>
                      <p className="text-xs text-gray-600">{payment.paymentType}: ${safeNumber(payment.amount).toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className={`text-xs ${getStatusColor(daysOverdue)} px-2 py-1 rounded-full mr-2`}>
                      {getStatusText(daysOverdue)}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-primary rounded h-8 w-8 hover:bg-gray-100" 
                      title="Send Reminder"
                      onClick={() => sendReminderMutation.mutate(payment.id)}
                      disabled={sendReminderMutation.isPending}
                    >
                      {sendReminderMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="mb-4">
                <DollarSign className="h-12 w-12 mx-auto text-gray-300" />
              </div>
              <p className="text-lg font-medium mb-2">No pending payments</p>
              <p className="text-sm mb-4">All payments are up to date</p>
              <Button size="sm" className="bg-primary text-white">
                <DollarSign className="h-4 w-4 mr-2" />
                View All Payments
              </Button>
            </div>
          )}
        </div>
        
        <div className="mt-4 flex justify-center">
          <Button 
            className="bg-primary text-white"
            onClick={() => sendAllRemindersMutation.mutate()}
            disabled={sendAllRemindersMutation.isPending}
          >
            {sendAllRemindersMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-1" />
                <span>Send All Reminders</span>
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
