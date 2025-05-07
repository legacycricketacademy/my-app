import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/layout/main-layout";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardContent 
} from "@/components/ui/card";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, Check, X, Search, Filter } from "lucide-react";

export default function ManageParentConnectionsPage() {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Query to get all connection requests
  const { 
    data: connectionRequests, 
    isLoading 
  } = useQuery({
    queryKey: ['/api/admin/connection-requests', statusFilter, searchTerm],
    queryFn: async () => {
      let url = '/api/admin/connection-requests';
      const params = new URLSearchParams();
      
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const res = await apiRequest('GET', url);
      return res.json();
    }
  });

  // Mutation to update connection request status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ requestId, status }: { requestId: number, status: string }) => {
      const res = await apiRequest('PUT', `/api/admin/connection-requests/${requestId}`, { status });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Connection request status has been updated successfully.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/connection-requests'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update status. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Handle approve button click
  const handleApprove = (requestId: number) => {
    updateStatusMutation.mutate({ requestId, status: 'approved' });
  };

  // Handle reject button click
  const handleReject = (requestId: number) => {
    updateStatusMutation.mutate({ requestId, status: 'rejected' });
  };

  // Handle search
  const handleSearch = () => {
    // The query will automatically refetch due to the changed searchTerm in the queryKey
  };

  // Format date to readable format
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <MainLayout title="Manage Parent Connection Requests">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div>
            <h1 className="text-2xl font-bold">Parent Connection Requests</h1>
            <p className="text-gray-500 mt-1">
              Review and manage parent requests to connect with their children
            </p>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="w-full sm:w-auto">
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Requests</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto">
              <Input
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-[200px]"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button variant="outline" onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Connection Requests</CardTitle>
            <CardDescription>
              {statusFilter === 'all' 
                ? 'All connection requests'
                : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} requests`}
              {searchTerm && ` matching "${searchTerm}"`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : connectionRequests?.length === 0 ? (
              <div className="text-center py-6">
                <Filter className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No connection requests found matching your criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Parent</TableHead>
                      <TableHead>Player</TableHead>
                      <TableHead>Age Group</TableHead>
                      <TableHead>Requested On</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {connectionRequests?.map((request: any) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{request.parentName}</div>
                            <div className="text-sm text-gray-500">{request.parentEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {request.playerFirstName} {request.playerLastName}
                        </TableCell>
                        <TableCell>{request.playerAgeGroup}</TableCell>
                        <TableCell>{formatDate(request.createdAt)}</TableCell>
                        <TableCell>
                          {request.status === 'pending' ? (
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 text-amber-500 mr-1" />
                              <span className="text-amber-500">Pending</span>
                            </div>
                          ) : request.status === 'approved' ? (
                            <div className="flex items-center">
                              <Check className="h-4 w-4 text-green-500 mr-1" />
                              <span className="text-green-500">Approved</span>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <X className="h-4 w-4 text-red-500 mr-1" />
                              <span className="text-red-500">Rejected</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {request.status === 'pending' && (
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 border-green-600 hover:bg-green-50"
                                onClick={() => handleApprove(request.id)}
                                disabled={updateStatusMutation.isPending}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-600 hover:bg-red-50"
                                onClick={() => handleReject(request.id)}
                                disabled={updateStatusMutation.isPending}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          )}
                          {request.status === 'approved' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-600 hover:bg-red-50"
                              onClick={() => handleReject(request.id)}
                              disabled={updateStatusMutation.isPending}
                            >
                              Revoke Access
                            </Button>
                          )}
                          {request.status === 'rejected' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-600 border-green-600 hover:bg-green-50"
                              onClick={() => handleApprove(request.id)}
                              disabled={updateStatusMutation.isPending}
                            >
                              Grant Access
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}