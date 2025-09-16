import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MainLayout } from "@/layout/main-layout";
import { Loader2, AlertTriangle, CheckCircle, XCircle, Search } from "lucide-react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Coach = {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
  isActive?: boolean;
  phone?: string | null;
  address?: string | null;
  profileImage?: string | null;
  createdAt: string;
};

type CoachesResponse = {
  items: Coach[];
  total: number;
  limit: number;
  offset: number;
  nextOffset: number | null;
};

export default function CoachesPendingApprovalPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const limit = 10;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setOffset(0); // Reset pagination on search
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: apiResponse, isLoading, error } = useQuery({
    queryKey: ["/api/coaches", activeTab, debouncedSearch, offset],
    queryFn: async () => {
      const params = new URLSearchParams({
        status: activeTab,
        limit: limit.toString(),
        offset: offset.toString(),
      });
      if (debouncedSearch) {
        params.append("search", debouncedSearch);
      }
      
      const res = await apiRequest("GET", `/api/coaches?${params}`, {
        headers: { "x-local-admin": "1" }
      });
      return await res.json() as CoachesResponse;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (coachId: number) => {
      const res = await apiRequest("POST", `/api/coaches/${coachId}/approve`, {
        headers: { "x-local-admin": "1" }
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coaches"] });
      toast({
        title: "Success",
        description: "Coach approved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve coach",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (coachId: number) => {
      const res = await apiRequest("POST", `/api/coaches/${coachId}/reject`, {
        headers: { "x-local-admin": "1" }
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coaches"] });
      toast({
        title: "Success",
        description: "Coach rejected successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject coach",
        variant: "destructive",
      });
    },
  });

  const coaches = apiResponse?.items || [];
  const hasNextPage = apiResponse?.nextOffset !== null;

  if (isLoading) {
    return (
      <MainLayout title="Coach Management">
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Coach Management">
        <div className="bg-destructive/10 p-4 rounded-md text-destructive flex items-center">
          <AlertTriangle className="mr-2" />
          <p>Error loading coaches.</p>
        </div>
      </MainLayout>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">Pending</span>;
      case "approved":
        return <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">Approved</span>;
      case "rejected":
        return <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">Rejected</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs font-medium">{status}</span>;
    }
  };

  return (
    <MainLayout title="Coach Management">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">Coach Management</h2>
          <p className="text-muted-foreground">
            Review and manage coach applications and status.
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search coaches..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {coaches.length === 0 ? (
              <div className="bg-muted p-8 rounded-lg text-center">
                <h3 className="text-lg font-semibold mb-2">No {activeTab} coaches found</h3>
                <p className="text-muted-foreground">
                  {debouncedSearch ? "Try adjusting your search terms." : `There are no ${activeTab} coaches at this time.`}
                </p>
              </div>
            ) : (
              <>
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Username</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {coaches.map((coach) => (
                        <TableRow key={coach.id}>
                          <TableCell className="font-medium">{coach.fullName}</TableCell>
                          <TableCell>{coach.email}</TableCell>
                          <TableCell>{coach.username}</TableCell>
                          <TableCell>{getStatusBadge(coach.status)}</TableCell>
                          <TableCell>{format(new Date(coach.createdAt), "MMM d, yyyy")}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              {coach.status === "pending" && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-green-600 bg-green-50 hover:bg-green-100 border-green-200"
                                    onClick={() => approveMutation.mutate(coach.id)}
                                    disabled={approveMutation.isPending}
                                  >
                                    {approveMutation.isPending ? (
                                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                    ) : (
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                    )}
                                    Approve
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 bg-red-50 hover:bg-red-100 border-red-200"
                                    onClick={() => rejectMutation.mutate(coach.id)}
                                    disabled={rejectMutation.isPending}
                                  >
                                    {rejectMutation.isPending ? (
                                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                    ) : (
                                      <XCircle className="h-4 w-4 mr-1" />
                                    )}
                                    Reject
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {offset + 1} to {Math.min(offset + limit, apiResponse?.total || 0)} of {apiResponse?.total || 0} coaches
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOffset(Math.max(0, offset - limit))}
                      disabled={offset === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setOffset(offset + limit)}
                      disabled={!hasNextPage}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
