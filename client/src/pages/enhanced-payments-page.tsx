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
import { 
  DollarSign, 
  Plus, 
  Search, 
  Filter, 
  ArrowUpDown, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Send,
  Calendar,
  MapPin,
  Users,
  FileText,
  AlertTriangle
} from "lucide-react";
import { format, isAfter, isBefore, parseISO, differenceInDays } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function EnhancedPaymentsPage() {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [ageGroupFilter, setAgeGroupFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), "yyyy-MM"));
  
  // Fetch all payments
  const { data: allPayments, isLoading: isLoadingPayments } = useQuery<any[]>({
    queryKey: ["/api/payments/all"],
    queryFn: () => fetch("/api/payments/all").then(res => res.json()),
  });
  
  // Fetch all players for filtering
  const { data: players, isLoading: isLoadingPlayers } = useQuery<any[]>({
    queryKey: ["/api/players"],
    queryFn: () => fetch("/api/players").then(res => res.json()),
  });

  // Filter payments based on current filters
  const filteredPayments = allPayments?.filter(payment => {
    // Apply status filter
    if (statusFilter !== "all" && payment.status !== statusFilter) {
      return false;
    }
    
    // Apply location filter if player data is available
    if (locationFilter !== "all") {
      const player = players?.find(p => p.id === payment.playerId);
      if (!player || player.location !== locationFilter) {
        return false;
      }
    }
    
    // Apply age group filter if player data is available
    if (ageGroupFilter !== "all") {
      const player = players?.find(p => p.id === payment.playerId);
      if (!player || player.ageGroup !== ageGroupFilter) {
        return false;
      }
    }
    
    // Apply month filter for "By Month View" tab
    if (activeTab === "by-month" && selectedMonth) {
      const paymentMonth = format(new Date(payment.dueDate), "yyyy-MM");
      if (paymentMonth !== selectedMonth) {
        return false;
      }
    }
    
    // Apply search filter
    if (searchQuery) {
      const player = players?.find(p => p.id === payment.playerId);
      if (!player) return false;
      
      const fullName = `${player.firstName} ${player.lastName}`.toLowerCase();
      const searchLower = searchQuery.toLowerCase();
      
      return (
        fullName.includes(searchLower) ||
        payment.paymentType?.toLowerCase().includes(searchLower) ||
        payment.status?.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });
  
  // Get only pending payments
  const pendingPayments = filteredPayments?.filter(p => p.status === "pending" || p.status === "overdue");
  
  // Get payments for history tab (paid ones)
  const paidPayments = filteredPayments?.filter(p => p.status === "paid");
  
  // Get payments that are overdue
  const overduePayments = filteredPayments?.filter(p => {
    const dueDate = new Date(p.dueDate);
    return p.status === "pending" && isAfter(new Date(), dueDate);
  });

  // Calculate summary stats
  const totalPendingAmount = pendingPayments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;
  const totalPaidAmount = paidPayments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;
  const totalDueThisWeek = pendingPayments?.filter(p => {
    const dueDate = new Date(p.dueDate);
    const daysUntilDue = differenceInDays(dueDate, new Date());
    return daysUntilDue >= 0 && daysUntilDue <= 7;
  }).reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;
  
  // Function to get player details
  const getPlayerDetails = (playerId: number) => {
    return players?.find(p => p.id === playerId);
  };
  
  // Function to get initials for avatar
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };
  
  // Function to display status badge
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return <Badge className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />Paid
        </Badge>;
      case "pending":
        const isPastDue = (dueDate: string) => {
          return isAfter(new Date(), new Date(dueDate));
        };
        
        return isPastDue(status) 
          ? <Badge className="bg-red-100 text-red-800 border-red-200">
              <AlertTriangle className="h-3 w-3 mr-1" />Overdue
            </Badge>
          : <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
              <Clock className="h-3 w-3 mr-1" />Pending
            </Badge>;
      case "partial":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">
          <Clock className="h-3 w-3 mr-1" />Partial
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Function to handle the mark as paid action
  const handleMarkAsPaid = async (paymentId: number) => {
    try {
      await fetch(`/api/payments/${paymentId}/update-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          status: 'paid',
          paidDate: new Date().toISOString()
        })
      });
      
      // Refetch payments data
      // This would typically be handled with react-query's invalidateQueries
      window.location.reload();
    } catch (error) {
      console.error("Error updating payment status:", error);
    }
  };
  
  // Function to generate the payment row
  const renderPaymentRow = (payment: any) => {
    const player = getPlayerDetails(payment.playerId);
    if (!player) return null;
    
    return (
      <TableRow key={payment.id}>
        <TableCell>
          <div className="flex items-center gap-2">
            <Avatar>
              <AvatarImage src={player.profileImage} alt={`${player.firstName} ${player.lastName}`} />
              <AvatarFallback>{getInitials(player.firstName, player.lastName)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{player.firstName} {player.lastName}</p>
              <p className="text-xs text-gray-500">{player.ageGroup}</p>
            </div>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-gray-500" /> 
            {player.location || "N/A"}
          </div>
        </TableCell>
        <TableCell>{payment.paymentType}</TableCell>
        <TableCell className="font-medium">${Number(payment.amount).toFixed(2)}</TableCell>
        <TableCell>{format(new Date(payment.dueDate), "MMM d, yyyy")}</TableCell>
        <TableCell>
          {payment.paidDate ? format(new Date(payment.paidDate), "MMM d, yyyy") : "—"}
        </TableCell>
        <TableCell>{getStatusBadge(payment.status)}</TableCell>
        <TableCell>
          {payment.status !== "paid" ? (
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Send className="h-4 w-4 mr-1" />
                Remind
              </Button>
              <Button size="sm" onClick={() => handleMarkAsPaid(payment.id)}>
                <CheckCircle className="h-4 w-4 mr-1" />
                Mark Paid
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-1" />
              Receipt
            </Button>
          )}
        </TableCell>
      </TableRow>
    );
  };

  return (
    <MainLayout title="Payments">
      <div className="space-y-6">
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <div className="bg-green-100 p-3 rounded-full mr-4">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Paid</p>
                  <h3 className="text-2xl font-bold">${totalPaidAmount.toFixed(2)}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-yellow-100 p-3 rounded-full mr-4">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Due This Week</p>
                  <h3 className="text-2xl font-bold">${totalDueThisWeek.toFixed(2)}</h3>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="bg-red-100 p-3 rounded-full mr-4">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Overdue</p>
                  <h3 className="text-2xl font-bold">
                    {isLoadingPayments ? "..." : overduePayments?.length || 0} 
                    <span className="text-base font-normal text-gray-500 ml-1">payments</span>
                  </h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-lg shadow">
            <TabsList className="mb-4 md:mb-0">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="pending-dues">Pending Dues</TabsTrigger>
              <TabsTrigger value="payment-history">Payment History</TabsTrigger>
              <TabsTrigger value="by-month">By Month</TabsTrigger>
            </TabsList>
            
            <div className="flex flex-col md:flex-row gap-2">
              <div className="relative">
                <Input
                  placeholder="Search player or payment type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full md:w-[200px]"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
              </div>
              
              {/* Filters */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    <span>Filters</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 p-4 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Location</label>
                    <Select value={locationFilter} onValueChange={setLocationFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Locations" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Locations</SelectItem>
                        <SelectItem value="Strongsville">Strongsville</SelectItem>
                        <SelectItem value="Solon">Solon</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Age Group</label>
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
                </DropdownMenuContent>
              </DropdownMenu>
              
              {activeTab === "by-month" && (
                <div className="flex gap-2 items-center">
                  <label className="text-sm whitespace-nowrap">Month:</label>
                  <Input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="w-40"
                  />
                </div>
              )}
            </div>
          </div>
          
          {/* Tab Contents */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-lg heading">Recent Payments</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Player</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Payment Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Paid Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingPayments || isLoadingPlayers ? (
                      Array(5).fill(0).map((_, index) => (
                        <TableRow key={index} className="animate-pulse">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-gray-200"></div>
                              <div className="h-4 bg-gray-200 rounded w-24"></div>
                            </div>
                          </TableCell>
                          <TableCell><div className="h-4 bg-gray-200 rounded w-20"></div></TableCell>
                          <TableCell><div className="h-4 bg-gray-200 rounded w-28"></div></TableCell>
                          <TableCell><div className="h-4 bg-gray-200 rounded w-16"></div></TableCell>
                          <TableCell><div className="h-4 bg-gray-200 rounded w-24"></div></TableCell>
                          <TableCell><div className="h-4 bg-gray-200 rounded w-24"></div></TableCell>
                          <TableCell><div className="h-6 bg-gray-200 rounded w-16"></div></TableCell>
                          <TableCell><div className="h-8 bg-gray-200 rounded w-20"></div></TableCell>
                        </TableRow>
                      ))
                    ) : filteredPayments && filteredPayments.length > 0 ? (
                      // Show most recent 10 payments
                      [...filteredPayments]
                        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                        .slice(0, 10)
                        .map(renderPaymentRow)
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-10">
                          <DollarSign className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                          <h3 className="text-lg font-medium text-gray-600 mb-2">No Payments Found</h3>
                          <p className="text-gray-500 mb-4">
                            {searchQuery || statusFilter !== "all" || locationFilter !== "all" || ageGroupFilter !== "all"
                              ? "No payments match your search/filter criteria." 
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
          </TabsContent>
          
          <TabsContent value="pending-dues" className="space-y-4">
            <Card>
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-lg heading">Pending Payments</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Player</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Payment Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Paid Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingPayments || isLoadingPlayers ? (
                      Array(5).fill(0).map((_, index) => (
                        <TableRow key={index} className="animate-pulse">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-gray-200"></div>
                              <div className="h-4 bg-gray-200 rounded w-24"></div>
                            </div>
                          </TableCell>
                          <TableCell><div className="h-4 bg-gray-200 rounded w-20"></div></TableCell>
                          <TableCell><div className="h-4 bg-gray-200 rounded w-28"></div></TableCell>
                          <TableCell><div className="h-4 bg-gray-200 rounded w-16"></div></TableCell>
                          <TableCell><div className="h-4 bg-gray-200 rounded w-24"></div></TableCell>
                          <TableCell><div className="h-4 bg-gray-200 rounded w-24"></div></TableCell>
                          <TableCell><div className="h-6 bg-gray-200 rounded w-16"></div></TableCell>
                          <TableCell><div className="h-8 bg-gray-200 rounded w-20"></div></TableCell>
                        </TableRow>
                      ))
                    ) : pendingPayments && pendingPayments.length > 0 ? (
                      pendingPayments.map(renderPaymentRow)
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-10">
                          <CheckCircle className="h-10 w-10 text-green-300 mx-auto mb-3" />
                          <h3 className="text-lg font-medium text-gray-600 mb-2">No Pending Payments</h3>
                          <p className="text-gray-500 mb-4">
                            All payments have been settled. Great job!
                          </p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="payment-history" className="space-y-4">
            <Card>
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-lg heading">Payment History</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Player</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Payment Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Paid Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingPayments || isLoadingPlayers ? (
                      Array(5).fill(0).map((_, index) => (
                        <TableRow key={index} className="animate-pulse">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-gray-200"></div>
                              <div className="h-4 bg-gray-200 rounded w-24"></div>
                            </div>
                          </TableCell>
                          <TableCell><div className="h-4 bg-gray-200 rounded w-20"></div></TableCell>
                          <TableCell><div className="h-4 bg-gray-200 rounded w-28"></div></TableCell>
                          <TableCell><div className="h-4 bg-gray-200 rounded w-16"></div></TableCell>
                          <TableCell><div className="h-4 bg-gray-200 rounded w-24"></div></TableCell>
                          <TableCell><div className="h-4 bg-gray-200 rounded w-24"></div></TableCell>
                          <TableCell><div className="h-6 bg-gray-200 rounded w-16"></div></TableCell>
                          <TableCell><div className="h-8 bg-gray-200 rounded w-20"></div></TableCell>
                        </TableRow>
                      ))
                    ) : paidPayments && paidPayments.length > 0 ? (
                      paidPayments.map(renderPaymentRow)
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-10">
                          <DollarSign className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                          <h3 className="text-lg font-medium text-gray-600 mb-2">No Payment History</h3>
                          <p className="text-gray-500 mb-4">
                            No completed payments have been recorded yet.
                          </p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="by-month" className="space-y-4">
            <Card>
              <CardHeader className="border-b border-gray-200">
                <CardTitle className="text-lg heading">
                  Monthly Payment Report: {format(new Date(selectedMonth), "MMMM yyyy")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Player</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Payment Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Paid Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingPayments || isLoadingPlayers ? (
                      Array(5).fill(0).map((_, index) => (
                        <TableRow key={index} className="animate-pulse">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-gray-200"></div>
                              <div className="h-4 bg-gray-200 rounded w-24"></div>
                            </div>
                          </TableCell>
                          <TableCell><div className="h-4 bg-gray-200 rounded w-20"></div></TableCell>
                          <TableCell><div className="h-4 bg-gray-200 rounded w-28"></div></TableCell>
                          <TableCell><div className="h-4 bg-gray-200 rounded w-16"></div></TableCell>
                          <TableCell><div className="h-4 bg-gray-200 rounded w-24"></div></TableCell>
                          <TableCell><div className="h-4 bg-gray-200 rounded w-24"></div></TableCell>
                          <TableCell><div className="h-6 bg-gray-200 rounded w-16"></div></TableCell>
                          <TableCell><div className="h-8 bg-gray-200 rounded w-20"></div></TableCell>
                        </TableRow>
                      ))
                    ) : filteredPayments && filteredPayments.length > 0 ? (
                      filteredPayments.map(renderPaymentRow)
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-10">
                          <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                          <h3 className="text-lg font-medium text-gray-600 mb-2">No Payments For This Month</h3>
                          <p className="text-gray-500 mb-4">
                            There are no payment records for {format(new Date(selectedMonth), "MMMM yyyy")}.
                          </p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}