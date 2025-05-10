import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, AlertTriangle, Mail, Phone } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MainLayout } from "@/layout/main-layout";

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
  const [selectedCoach, setSelectedCoach] = useState<Coach | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  
  const { data: pendingCoaches, isLoading, error } = useQuery<Coach[]>({
    queryKey: ["/api/users/pending-coaches"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/users/pending-coaches");
      return await res.json();
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (coachId: number) => {
      const res = await apiRequest("PATCH", `/api/users/${coachId}/approval`, {
        approved: true,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Coach approved",
        description: "The coach has been successfully approved and notified via email.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users/pending-coaches"] });
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
    mutationFn: async ({ coachId, reason }: { coachId: number; reason: string }) => {
      const res = await apiRequest("PATCH", `/api/users/${coachId}/approval`, {
        approved: false,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Coach rejected",
        description: "The coach has been rejected and notified via email.",
        variant: "destructive",
      });
      setIsRejectDialogOpen(false);
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

  function handleApprove(coach: Coach) {
    approveMutation.mutate(coach.id);
  }

  function handleReject() {
    if (!selectedCoach) return;

    rejectMutation.mutate({
      coachId: selectedCoach.id,
      reason: rejectReason,
    });
  }

  function openRejectDialog(coach: Coach) {
    setSelectedCoach(coach);
    setRejectReason("");
    setIsRejectDialogOpen(true);
  }

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
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Coaches Pending Approval</h2>
            <p className="text-muted-foreground">
              Review and approve coach registration applications.
            </p>
          </div>
          <Badge className="px-3 py-1 text-sm">
            {pendingCoaches.length} Pending
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pendingCoaches.map((coach) => (
            <Card key={coach.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12 border">
                      {coach.profileImage ? (
                        <AvatarImage src={coach.profileImage} alt={coach.fullName} />
                      ) : (
                        <AvatarFallback>
                          {coach.fullName.split(' ').map(name => name[0]).join('')}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{coach.fullName}</CardTitle>
                      <CardDescription>
                        <span className="block">Username: {coach.username}</span>
                        <span className="block text-xs">
                          Registered on {format(new Date(coach.createdAt), "MMM d, yyyy")}
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{coach.email}</span>
                  </div>
                  
                  {coach.phone && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{coach.phone}</span>
                    </div>
                  )}
                  
                  {coach.address && (
                    <div className="pt-2">
                      <span className="text-muted-foreground block">Address:</span>
                      <p className="text-xs mt-1 bg-muted p-2 rounded-md">
                        {coach.address}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-4">
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => openRejectDialog(coach)}
                  disabled={rejectMutation.isPending}
                >
                  {rejectMutation.isPending && selectedCoach?.id === coach.id ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Reject
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => handleApprove(coach)}
                  disabled={approveMutation.isPending}
                >
                  {approveMutation.isPending && selectedCoach?.id === coach.id ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Approve
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Coach Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this coach application. This information will be sent via email.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection..."
              className="w-full"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRejectDialogOpen(false)}
              disabled={rejectMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive" 
              onClick={handleReject}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                "Confirm Rejection"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}