import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MainLayout } from "@/layout/main-layout";
import { Loader2, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
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

type Coach = {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
  isActive: boolean;
  phone: string | null;
  address: string | null;
  profileImage: string | null;
  createdAt: string;
};

export default function CoachesPendingApprovalPage() {
  const { toast } = useToast();
  
  const { data: apiResponse, isLoading, error } = useQuery({
    queryKey: ["/api/users/pending-coaches"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/users/pending-coaches");
      return await res.json();
    },
  });
  
  // Extract the actual coaches array from the API response
  // The API returns { success: true, data: [...coaches], message: "..." }
  const pendingCoaches = apiResponse?.data || [];

  const approveMutation = useMutation({
    mutationFn: async (coachId: number) => {
      // Use the correct endpoint that matches the backend implementation
      const res = await apiRequest("POST", `/api/coaches/${coachId}/approve`);
      return await res.json();
    },
    onSuccess: (data) => {
      // Get the coach's name from the response if available
      const coachName = data?.data?.fullName || data?.data?.username || "Coach";
      
      toast({
        title: "Coach approved",
        description: `${coachName} has been successfully approved and notified via email.`,
      });
      
      // This will refresh the pending coaches list
      queryClient.invalidateQueries({ queryKey: ["/api/users/pending-coaches"] });
      
      // Force immediate refresh to update UI right away - use multiple refresh attempts
      // to ensure database changes are reflected in the UI
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ["/api/users/pending-coaches"] });
        
        // Second refresh after a bit longer in case the first one was too quick
        setTimeout(() => {
          queryClient.refetchQueries({ queryKey: ["/api/users/pending-coaches"] });
        }, 1000);
      }, 500);
    },
    onError: (error: Error) => {
      toast({
        title: "Error approving coach",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (coachId: number) => {
      // Use the correct endpoint that matches the backend implementation
      const res = await apiRequest("POST", `/api/coaches/${coachId}/reject`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Coach rejected",
        description: "The coach has been rejected and notified via email.",
        variant: "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users/pending-coaches"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error rejecting coach",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <MainLayout title="Coaches Pending Approval">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading pending coach applications...</span>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Coaches Pending Approval">
        <div className="bg-destructive/10 p-4 rounded-md text-destructive flex items-center">
          <AlertTriangle className="mr-2" />
          <p>Error loading pending coach applications.</p>
        </div>
      </MainLayout>
    );
  }

  if (!pendingCoaches || pendingCoaches.length === 0) {
    return (
      <MainLayout title="Coaches Pending Approval">
        <div className="bg-muted p-8 rounded-lg text-center">
          <h2 className="text-xl font-semibold mb-2">No Pending Coach Applications</h2>
          <p className="text-muted-foreground">
            There are no coaches waiting for approval at this time.
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Coaches Pending Approval">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-2">Coaches Pending Approval</h2>
          <p className="text-muted-foreground">
            Review and approve coach registration applications.
          </p>
        </div>

        <div className="border rounded-md overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Username</TableHead>
                <TableHead className="w-[300px]">Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingCoaches.map((coach) => (
                <TableRow key={coach.id}>
                  <TableCell className="font-medium">{coach.username}</TableCell>
                  <TableCell>{coach.email}</TableCell>
                  <TableCell>
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                      Pending
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
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
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </MainLayout>
  );
}