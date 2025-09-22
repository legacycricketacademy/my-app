import { useState } from "react";
import { MainLayout } from "@/layout/main-layout";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Plus, Search, Filter, ArrowUpDown, CheckCircle, XCircle, Clock, Send } from "lucide-react";
import { format } from "date-fns";
import { EmailStatusBanner } from "@/components/ui/email-status-banner";

export default function PaymentsPage() {
  const [status, setStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  const { data: pendingPayments, isLoading } = useQuery<any[]>({
    queryKey: ["/api/payments/pending"],
  });
  
  const filteredPayments = pendingPayments?.filter(payment => {
    // Apply status filter
    if (status !== "all" && payment.status !== status) {
      return false;
    }
    
    // Apply search filter
    if (searchQuery) {
      const fullName = `${payment.playerFirstName} ${payment.playerLastName}`.toLowerCase();
      return (
        fullName.includes(searchQuery.toLowerCase()) ||
        payment.paymentType?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return true;
  });
  
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-success text-white">Paid</Badge>;
      case "pending":
        return <Badge className="bg-warning text-white">Pending</Badge>;
      case "overdue":
        return <Badge className="bg-danger text-white">Overdue</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };
  
  // Calculate days overdue based on due date
  const getDaysOverdue = (dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    const diffTime = today.getTime() - due.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  
  const getStatusInfo = (payment: any) => {
    const daysOverdue = getDaysOverdue(payment.dueDate);
    
    if (payment.status === "paid") {
      return {
        icon: <CheckCircle className="h-5 w-5 text-success" />,
        text: payment.paidDate ? `Paid on ${format(new Date(payment.paidDate), "MMM d, yyyy")}` : "Paid"
      };
    }
    
    if (payment.status === "pending") {
      if (daysOverdue > 0) {
        return {
          icon: <XCircle className="h-5 w-5 text-danger" />,
          text: `${daysOverdue} days overdue`
        };
      }
      if (daysOverdue === 0) {
        return {
          icon: <Clock className="h-5 w-5 text-warning" />,
          text: "Due today"
        };
      }
      return {
        icon: <Clock className="h-5 w-5 text-info" />,
        text: `Due in ${Math.abs(daysOverdue)} days`
      };
    }
    
    return {
      icon: <XCircle className="h-5 w-5 text-danger" />,
      text: `${daysOverdue} days overdue`
    };
  };
  
  const totalPendingAmount = filteredPayments?.reduce((sum, payment) => {
    if (payment.status === "pending" || payment.status === "overdue") {
      return sum + Number(payment.amount);
    }
    return sum;
  }, 0) || 0;

  return (
    <MainLayout title="Payments">
      <div className="space-y-6">
        <EmailStatusBanner />
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 heading">Payments</h1>
            <p className="text-gray-600">Manage payments and track dues</p>
          </div>
          
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>Create Payment</span>
          </Button>
        </div>
        
        {/* Payment Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-primary/10 p-3 rounded-full mr-4">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Pending</p>
                  <h3 className="text-2xl font-bold">${totalPendingAmount.toFixed(2)}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-warning/10 p-3 rounded-full mr-4">
                  <Clock className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Due This Week</p>
                  <h3 className="text-2xl font-bold">
                    {isLoading ? "..." : filteredPayments?.filter(p => {
                      const daysOverdue = getDaysOverdue(p.dueDate);
                      return daysOverdue <= 0 && daysOverdue > -7 && p.status !== "paid";
                    }).length || 0}
                  </h3>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-danger/10 p-3 rounded-full mr-4">
                  <XCircle className="h-6 w-6 text-danger" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Overdue</p>
                  <h3 className="text-2xl font-bold">
                    {isLoading ? "..." : filteredPayments?.filter(p => {
                      const daysOverdue = getDaysOverdue(p.dueDate);
                      return daysOverdue > 0 && p.status !== "paid";
                    }).length || 0}
                  </h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 bg-white p-4 rounded-lg shadow">
          <div className="relative flex-1">
            <Input
              placeholder="Search player or payment type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
          </div>
          
          <Tabs value={status} onValueChange={setStatus} className="w-full md:w-auto">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="paid">Paid</TabsTrigger>
              <TabsTrigger value="overdue">Overdue</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {/* Payments Table */}
        <Card>
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="text-lg heading">Payment Records</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead>Payment Type</TableHead>
                  <TableHead>
                    <div className="flex items-center">
                      Amount
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center">
                      Due Date
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(5).fill(0).map((_, index) => (
                    <TableRow key={index} className="animate-pulse">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-gray-200"></div>
                          <div className="h-4 bg-gray-200 rounded w-24"></div>
                        </div>
                      </TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded w-28"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded w-16"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded w-24"></div></TableCell>
                      <TableCell><div className="h-6 bg-gray-200 rounded w-16"></div></TableCell>
                      <TableCell><div className="h-8 bg-gray-200 rounded w-20"></div></TableCell>
                    </TableRow>
                  ))
                ) : filteredPayments && filteredPayments.length > 0 ? (
                  filteredPayments.map((payment) => {
                    const statusInfo = getStatusInfo(payment);
                    
                    return (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar>
                              <AvatarImage src={payment.profileImage} alt={`${payment.playerFirstName} ${payment.playerLastName}`} />
                              <AvatarFallback>{getInitials(payment.playerFirstName, payment.playerLastName)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{payment.playerFirstName} {payment.playerLastName}</p>
                              <p className="text-xs text-gray-500">{payment.ageGroup || "Player"}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{payment.paymentType}</TableCell>
                        <TableCell className="font-medium">${Number(payment.amount).toFixed(2)}</TableCell>
                        <TableCell>{format(new Date(payment.dueDate), "MMM d, yyyy")}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(payment.status)}
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              {statusInfo.icon}
                              {statusInfo.text}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {payment.status === "paid" ? (
                            <Button variant="outline" size="sm">
                              <CheckCircle className="h-4 w-4 mr-1 text-success" />
                              View Receipt
                            </Button>
                          ) : (
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <Send className="h-4 w-4 mr-1" />
                                Remind
                              </Button>
                              <Button size="sm">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Mark Paid
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <DollarSign className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-600 mb-2">No Payments Found</h3>
                      <p className="text-gray-500 mb-4">
                        {searchQuery 
                          ? "No payments match your search criteria." 
                          : "There are no payment records yet."}
                      </p>
                      <Button>
                        <Plus className="h-4 w-4 mr-1" />
                        Create Payment
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
