import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ParentLayout } from "@/layout/parent-layout";
import { useAuth } from "@/hooks/use-auth";
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
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, 
  Users, 
  Link2, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Clock
} from "lucide-react";

export default function ConnectChildPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Query to get existing connection requests
  const { 
    data: connectionRequests,
    isLoading: isLoadingConnections,
    refetch: refetchConnections
  } = useQuery({
    queryKey: ['/api/parent/connection-requests'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/parent/connection-requests');
      return res.json();
    }
  });

  // Mutation to create connection request
  const createRequestMutation = useMutation({
    mutationFn: async (playerId: number) => {
      const res = await apiRequest('POST', '/api/parent/connection-requests', { playerId });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Request Sent",
        description: "Your connection request has been sent and is pending approval.",
        variant: "default",
      });
      refetchConnections();
      setDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Request Failed",
        description: error.message || "Failed to send connection request. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Function to handle player search
  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    setSearchResults([]);
    
    try {
      const res = await apiRequest('GET', `/api/parent/search-players?query=${encodeURIComponent(searchTerm)}`);
      const data = await res.json();
      setSearchResults(data);
    } catch (error) {
      toast({
        title: "Search Failed",
        description: "Failed to search for players. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Handle request connection
  const handleRequestConnection = (player: any) => {
    setSelectedPlayer(player);
    setDialogOpen(true);
  };

  // Handle confirm connection request
  const handleConfirmRequest = () => {
    if (selectedPlayer) {
      createRequestMutation.mutate(selectedPlayer.id);
    }
  };

  // Helper to get status badge
  const StatusBadge = ({ status }: { status: string }) => {
    if (status === 'pending') {
      return (
        <div className="flex items-center text-amber-500">
          <Clock className="w-4 h-4 mr-1" />
          <span>Pending Approval</span>
        </div>
      );
    } else if (status === 'approved') {
      return (
        <div className="flex items-center text-green-500">
          <CheckCircle2 className="w-4 h-4 mr-1" />
          <span>Connected</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-red-500">
          <XCircle className="w-4 h-4 mr-1" />
          <span>Rejected</span>
        </div>
      );
    }
  };

  return (
    <ParentLayout title="Connect with Your Child">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Connect with Your Child</h1>
          <p className="text-muted-foreground mt-1">
            Search for your child's profile and send a connection request
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Search for Your Child</CardTitle>
            <CardDescription>
              Enter your child's name to find and connect with their profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Enter child's name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button 
                onClick={handleSearch} 
                disabled={isSearching || !searchTerm.trim()}
              >
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>
            
            {isSearching ? (
              <div className="mt-4 space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="mt-4 border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Age Group</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchResults.map((player) => (
                      <TableRow key={player.id}>
                        <TableCell>
                          {player.firstName} {player.lastName}
                        </TableCell>
                        <TableCell>{player.ageGroup}</TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleRequestConnection(player)}
                          >
                            <Link2 className="w-4 h-4 mr-2" />
                            Request Connection
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : searchTerm && !isSearching ? (
              <div className="mt-4 text-center py-8 border rounded-md">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-lg font-medium">No matching players found</p>
                <p className="text-muted-foreground">
                  Try a different name or contact your academy administrator
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Your Connection Requests</CardTitle>
            <CardDescription>
              Manage your existing connection requests and view their status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingConnections ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : connectionRequests?.length > 0 ? (
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Child Name</TableHead>
                      <TableHead>Age Group</TableHead>
                      <TableHead>Requested On</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {connectionRequests.map((request: any) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          {request.playerFirstName} {request.playerLastName}
                        </TableCell>
                        <TableCell>{request.playerAgeGroup}</TableCell>
                        <TableCell>
                          {new Date(request.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={request.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 border rounded-md">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-lg font-medium">No connection requests yet</p>
                <p className="text-muted-foreground">
                  Search for your child above to create a connection request
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Confirmation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Connection Request</DialogTitle>
            <DialogDescription>
              You're about to request to connect with this player as their parent.
              This request will need to be approved by an administrator.
            </DialogDescription>
          </DialogHeader>
          
          {selectedPlayer && (
            <div className="py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Child's Name</Label>
                  <div className="font-medium">
                    {selectedPlayer.firstName} {selectedPlayer.lastName}
                  </div>
                </div>
                <div>
                  <Label>Age Group</Label>
                  <div className="font-medium">{selectedPlayer.ageGroup}</div>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div>
                <Label>Your Information</Label>
                <div className="font-medium">{user?.fullName}</div>
                <div className="text-sm text-muted-foreground">{user?.email}</div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmRequest}
              disabled={createRequestMutation.isPending}
            >
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ParentLayout>
  );
}