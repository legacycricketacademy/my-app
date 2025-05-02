import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import { Link } from "wouter";

export function PaymentCard() {
  const [period, setPeriod] = useState<string>("thisMonth");
  
  const { data: pendingPayments, isLoading } = useQuery<any[]>({
    queryKey: ["/api/payments/pending"],
  });
  
  const { data: stats } = useQuery<any>({
    queryKey: ["/api/dashboard/stats"],
  });
  
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };
  
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    const diffTime = today.getTime() - due.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <Card className="bg-white rounded-lg shadow">
      <CardHeader className="flex items-center justify-between border-b border-gray-200 p-4">
        <CardTitle className="font-semibold text-lg heading">Payment Tracker</CardTitle>
        <Link href="/payments">
          <a className="text-primary text-sm hover:underline">View All</a>
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
                {stats ? Math.round((stats.playerCount - (stats.pendingPaymentsCount || 0)) / stats.playerCount * 100) : 0}%
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
                strokeDasharray={`${stats ? Math.round((stats.playerCount - (stats.pendingPaymentsCount || 0)) / stats.playerCount * 100) : 0}, 100`}
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
          ) : pendingPayments && pendingPayments.length > 0 ? (
            pendingPayments.map((payment) => {
              const daysOverdue = getDaysOverdue(payment.dueDate);
              
              return (
                <div key={payment.id} className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={payment.profileImage} alt={`${payment.playerFirstName} ${payment.playerLastName}`} />
                      <AvatarFallback>{getInitials(payment.playerFirstName, payment.playerLastName)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="text-sm font-medium">{payment.playerFirstName} {payment.playerLastName}</h4>
                      <p className="text-xs text-gray-600">{payment.paymentType}: ${Number(payment.amount).toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className={`text-xs ${getStatusColor(daysOverdue)} px-2 py-1 rounded-full mr-2`}>
                      {getStatusText(daysOverdue)}
                    </span>
                    <Button variant="ghost" size="icon" className="text-primary rounded h-8 w-8 hover:bg-gray-100" title="Send Reminder">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-4 text-gray-500">
              <p>No pending payments</p>
            </div>
          )}
        </div>
        
        <div className="mt-4 flex justify-center">
          <Button className="bg-primary text-white">
            <Send className="h-4 w-4 mr-1" />
            <span>Send All Reminders</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
