import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { MainLayout } from "@/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { isPendingLike } from "@/shared/pending";
import { 
  Search, 
  UserCheck, 
  UserX, 
  AlertCircle, 
  Loader2,
  UserRound,
  MailIcon,
  CalendarIcon
} from "lucide-react";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ConnectionRequest = {
  id: number;
  playerId: number;
  parentId: number;
  status: "pending" | "approved" | "rejected";
  notes: string;
  createdAt: string;
  updatedAt: string;
  parentName: string;
  parentEmail: string;
  playerFirstName: string;
  playerLastName: string;
  playerAgeGroup: string;
};

export default function ManageParentConnectionsPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [selectedRequest, setSelectedRequest] = useState<ConnectionRequest | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Get all connection requests
  const { 
    data: connectionRequests = [],
    isLoading: isLoadingRequests,
    refetch
  } = useQuery<ConnectionRequest[]>({
    queryKey: ["/api/admin/connection-requests", statusFilter],
    queryFn: async () => {
      const url = `/api/admin/connection-requests?status=${statusFilter}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`;
      const res = await apiRequest("GET", url);
      return await res.json();
    },
  });
  
  // Update connection request status
  const updateRequestMutation = useMutation({
    mutationFn: async ({ 
      requestId, 
      status 
    }: { 
      requestId: number; 
      status: "approved" | "rejected" | "pending";
    }) => {
      const res = await apiRequest("PUT", `/api/admin/connection-requests/${requestId}`, { status });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Request Updated",
        description: "The connection request has been updated successfully.",
      });
      setIsDialogOpen(false);
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Search and filter handling
  const handleSearch = () => {
    refetch();
  };
  
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
  };
  
  // Handle request actions
  const handleViewRequest = (request: ConnectionRequest) => {
    setSelectedRequest(request);
    setIsDialogOpen(true);
  };
  
  const handleApproveRequest = () => {
    if (selectedRequest) {
      updateRequestMutation.mutate({
        requestId: selectedRequest.id,
        status: "approved"
      });
    }
  };
  
  const handleRejectRequest = () => {
    if (selectedRequest) {
      updateRequestMutation.mutate({
        requestId: selectedRequest.id,
        status: "rejected"
      });
    }
  };
  
  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };
  
  // Filtered connection requests
  const filteredRequests = connectionRequests;
  
  return (
    <MainLayout title="Manage Parent Connections">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Parent Connection Requests</CardTitle>
            <CardDescription>
              Manage requests from parents to connect with their children. Approve or reject requests as needed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-6 items-center">
              <div className="flex-1">
                <Input
                  placeholder="Search by parent or player name"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <div className="w-40">
                <Select
                  value={statusFilter}
                  onValueChange={handleStatusFilterChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
            
            {isLoadingRequests ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredRequests.length === 0 ? (
              <Alert variant="default" className="bg-muted">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Connection Requests</AlertTitle>
                <AlertDescription>
                  There are no connection requests matching your current filters.
                </AlertDescription>
              </Alert>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parent</TableHead>
                    <TableHead>Child</TableHead>
                    <TableHead>Date Requested</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="font-medium">{request.parentName}</div>
                          <div className="text-sm text-muted-foreground flex items-center">
                            <MailIcon className="h-3 w-3 mr-1" />
                            {request.parentEmail}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <UserRound className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium">
                              {request.playerFirstName} {request.playerLastName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {request.playerAgeGroup}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <CalendarIcon className="h-3 w-3" />
                          {new Date(request.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(request.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewRequest(request)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Request Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connection Request Details</DialogTitle>
            <DialogDescription>
              Review the details and approve or reject this connection request.
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <h3 className="font-medium text-sm text-muted-foreground">Parent</h3>
                <p className="font-medium">{selectedRequest.parentName}</p>
                <p className="text-sm flex items-center gap-1">
                  <MailIcon className="h-3 w-3" />
                  {selectedRequest.parentEmail}
                </p>
              </div>
              
              <div className="space-y-1">
                <h3 className="font-medium text-sm text-muted-foreground">Child</h3>
                <p className="font-medium">
                  {selectedRequest.playerFirstName} {selectedRequest.playerLastName}
                </p>
                <p className="text-sm">Age Group: {selectedRequest.playerAgeGroup}</p>
              </div>
              
              <div className="space-y-1">
                <h3 className="font-medium text-sm text-muted-foreground">Status</h3>
                <div>{getStatusBadge(selectedRequest.status)}</div>
              </div>
              
              <div className="space-y-1">
                <h3 className="font-medium text-sm text-muted-foreground">Notes</h3>
                <p className="text-sm">{selectedRequest.notes || "No notes provided."}</p>
              </div>
              
              <div className="space-y-1">
                <h3 className="font-medium text-sm text-muted-foreground">Dates</h3>
                <p className="text-sm">
                  <span className="font-medium">Requested:</span>{" "}
                  {new Date(selectedRequest.createdAt).toLocaleString()}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Last Updated:</span>{" "}
                  {new Date(selectedRequest.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex justify-between sm:justify-between">
            {selectedRequest && selectedRequest.status === "pending" && (
              <>
                <Button
                  variant="destructive"
                  onClick={handleRejectRequest}
                  disabled={isPendingLike(updateRequestMutation)}
                >
                  {isPendingLike(updateRequestMutation) ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <UserX className="h-4 w-4 mr-2" />
                  )}
                  Reject
                </Button>
                <Button
                  onClick={handleApproveRequest}
                  disabled={isPendingLike(updateRequestMutation)}
                >
                  {isPendingLike(updateRequestMutation) ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <UserCheck className="h-4 w-4 mr-2" />
                  )}
                  Approve
                </Button>
              </>
            )}
            {selectedRequest && selectedRequest.status !== "pending" && (
              <Button
                variant="secondary"
                onClick={() => setIsDialogOpen(false)}
              >
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}