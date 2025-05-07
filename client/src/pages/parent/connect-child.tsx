import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { ParentLayout } from "@/layout/parent-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Search, UserRound, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
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

type PlayerSearchResult = {
  id: number;
  firstName: string;
  lastName: string;
  ageGroup: string;
};

type ConnectionRequest = {
  id: number;
  playerId: number;
  parentId: number;
  status: "pending" | "approved" | "rejected";
  playerFirstName: string;
  playerLastName: string;
  playerAgeGroup: string;
  createdAt: string;
  updatedAt: string;
};

export default function ConnectChildPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PlayerSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  
  // Get existing connection requests
  const { 
    data: connectionRequests = [],
    isLoading: isLoadingRequests
  } = useQuery<ConnectionRequest[]>({
    queryKey: ["/api/parent/connection-requests"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/parent/connection-requests");
      return await res.json();
    },
    enabled: !!user,
  });
  
  // Create a new connection request
  const createRequestMutation = useMutation({
    mutationFn: async (playerId: number) => {
      const res = await apiRequest("POST", "/api/parent/connection-requests", { playerId });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Connection Request Sent",
        description: "Your request has been sent and is awaiting approval.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/parent/connection-requests"] });
      setSearchResults([]);
      setSearchQuery("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Send Request",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Search for players
  const handleSearch = async () => {
    if (!searchQuery || searchQuery.length < 2) {
      toast({
        title: "Search Query Too Short",
        description: "Please enter at least 2 characters to search.",
        variant: "destructive",
      });
      return;
    }
    
    setSearching(true);
    try {
      const res = await apiRequest("GET", `/api/parent/search-players?query=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data);
      
      if (data.length === 0) {
        toast({
          title: "No Results Found",
          description: "No players match your search query.",
        });
      }
    } catch (error) {
      toast({
        title: "Search Failed",
        description: "Failed to search for players. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };
  
  const handleRequestConnection = (playerId: number) => {
    createRequestMutation.mutate(playerId);
  };
  
  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };
  
  return (
    <ParentLayout title="Connect with Your Child">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Search for Your Child</CardTitle>
            <CardDescription>
              Enter your child's name to find and connect with them. Once you submit a connection request,
              it will need to be approved by an administrator.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Search by child's name"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button 
                onClick={handleSearch} 
                disabled={searching || searchQuery.length < 2}
              >
                {searching ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Search
              </Button>
            </div>
            
            {searchResults.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">Search Results</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Age Group</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchResults.map((player) => (
                      <TableRow key={player.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <UserRound className="h-5 w-5 text-muted-foreground" />
                            {player.firstName} {player.lastName}
                          </div>
                        </TableCell>
                        <TableCell>{player.ageGroup}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="secondary" 
                            size="sm"
                            onClick={() => handleRequestConnection(player.id)}
                            disabled={createRequestMutation.isPending}
                          >
                            {createRequestMutation.isPending && createRequestMutation.variables === player.id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              "Request Connection"
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Your Connection Requests</CardTitle>
            <CardDescription>
              View the status of your connection requests.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingRequests ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : connectionRequests.length === 0 ? (
              <Alert variant="default" className="bg-muted">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Connection Requests</AlertTitle>
                <AlertDescription>
                  You haven't made any connection requests yet. Search for your child above to get started.
                </AlertDescription>
              </Alert>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Child</TableHead>
                    <TableHead>Age Group</TableHead>
                    <TableHead>Request Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {connectionRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <UserRound className="h-5 w-5 text-muted-foreground" />
                          {request.playerFirstName} {request.playerLastName}
                        </div>
                      </TableCell>
                      <TableCell>{request.playerAgeGroup}</TableCell>
                      <TableCell>
                        {new Date(request.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(request.status)}
                          {request.status === "approved" && (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </ParentLayout>
  );
}