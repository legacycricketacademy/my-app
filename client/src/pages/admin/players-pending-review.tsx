import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MainLayout } from "@/layout/main-layout";

type Player = {
  id: number;
  firstName: string;
  lastName: string;
  ageGroup: string;
  dateOfBirth: string;
  playerType: string | null;
  profileImage: string | null;
  emergencyContact: string | null;
  medicalInformation: string | null;
  parentId: number;
  pendingCoachReview: boolean;
  healthNotes: string | null;
  parentNotes: string | null;
  parentName: string;
  parentEmail: string;
  createdAt: string;
};

export default function PlayersPendingReviewPage() {
  const { toast } = useToast();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  
  const { data: pendingPlayers, isLoading, error } = useQuery<Player[]>({
    queryKey: ["/api/players", { pendingReview: true }],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/players?pendingReview=true");
      return await res.json();
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (playerId: number) => {
      const res = await apiRequest("PUT", `/api/players/${playerId}`, {
        pendingCoachReview: false,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Player approved",
        description: "The player has been successfully approved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/players", { pendingReview: true }] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error approving player",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ playerId, reason }: { playerId: number; reason: string }) => {
      const res = await apiRequest("PUT", `/api/players/${playerId}`, {
        pendingCoachReview: false,
        // We could store the reason in notes or another field,
        // but for now we just remove the pending flag
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Player rejected",
        description: "The player has been rejected.",
        variant: "destructive",
      });
      setIsRejectDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/players", { pendingReview: true }] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error rejecting player",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function handleApprove(player: Player) {
    approveMutation.mutate(player.id);
  }

  function handleReject() {
    if (!selectedPlayer) return;

    rejectMutation.mutate({
      playerId: selectedPlayer.id,
      reason: rejectReason,
    });
  }

  function openRejectDialog(player: Player) {
    setSelectedPlayer(player);
    setRejectReason("");
    setIsRejectDialogOpen(true);
  }

  if (isLoading) {
    return (
      <MainLayout title="Players Pending Review">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading pending players...</span>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Players Pending Review">
        <div className="bg-destructive/10 p-4 rounded-md text-destructive flex items-center">
          <AlertTriangle className="mr-2" />
          <p>Error loading pending players.</p>
        </div>
      </MainLayout>
    );
  }

  if (!pendingPlayers || pendingPlayers.length === 0) {
    return (
      <MainLayout title="Players Pending Review">
        <div className="bg-muted p-8 rounded-lg text-center">
          <h2 className="text-xl font-semibold mb-2">No Pending Players</h2>
          <p className="text-muted-foreground">
            There are no players waiting for coach review at this time.
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Players Pending Review">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Players Pending Review</h2>
            <p className="text-muted-foreground">
              Review and approve player registrations submitted by parents.
            </p>
          </div>
          <Badge className="px-3 py-1 text-sm">
            {pendingPlayers.length} Pending
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pendingPlayers.map((player) => (
            <Card key={player.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12 border">
                      {player.profileImage ? (
                        <AvatarImage src={player.profileImage} alt={`${player.firstName} ${player.lastName}`} />
                      ) : (
                        <AvatarFallback>
                          {player.firstName[0]}
                          {player.lastName[0]}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{`${player.firstName} ${player.lastName}`}</CardTitle>
                      <CardDescription>
                        <span className="block">Age Group: {player.ageGroup}</span>
                        <span className="block">Added by: {player.parentName}</span>
                        <span className="block text-xs">
                          on {format(new Date(player.createdAt), "MMM d, yyyy")}
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date of Birth:</span>
                    <span>
                      {player.dateOfBirth
                        ? format(new Date(player.dateOfBirth), "MMM d, yyyy")
                        : "Not provided"}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Player Type:</span>
                    <span>{player.playerType || "Not specified"}</span>
                  </div>
                  
                  {player.emergencyContact && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Emergency Contact:</span>
                      <span>{player.emergencyContact}</span>
                    </div>
                  )}
                  
                  {player.medicalInformation && (
                    <div className="pt-2">
                      <span className="text-muted-foreground block">Medical Information:</span>
                      <p className="text-xs mt-1 bg-muted p-2 rounded-md">
                        {player.medicalInformation}
                      </p>
                    </div>
                  )}
                  
                  {player.healthNotes && (
                    <div className="pt-2">
                      <span className="text-muted-foreground block">Health Notes:</span>
                      <p className="text-xs mt-1 bg-muted p-2 rounded-md">
                        {player.healthNotes}
                      </p>
                    </div>
                  )}
                  
                  {player.parentNotes && (
                    <div className="pt-2">
                      <span className="text-muted-foreground block">Parent Notes:</span>
                      <p className="text-xs mt-1 bg-muted p-2 rounded-md">
                        {player.parentNotes}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-4">
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => openRejectDialog(player)}
                  disabled={rejectMutation.isPending}
                >
                  {rejectMutation.isPending && selectedPlayer?.id === player.id ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Reject
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => handleApprove(player)}
                  disabled={approveMutation.isPending}
                >
                  {approveMutation.isPending && selectedPlayer?.id === player.id ? (
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
            <DialogTitle>Reject Player Registration</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this player. This will be communicated to the parent.
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