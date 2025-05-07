import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ParentLayout } from "@/layout/parent-layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardContent,
  CardFooter 
} from "@/components/ui/card";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Search, Check, Clock, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ConnectChildPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Query to get player search results
  const { 
    data: searchResults, 
    isLoading: isLoadingResults,
    refetch
  } = useQuery({
    queryKey: ['/api/player-search', searchTerm],
    queryFn: async () => {
      if (!searchTerm || searchTerm.length < 3) return [];
      const res = await apiRequest('GET', `/api/player-search?term=${encodeURIComponent(searchTerm)}`);
      return res.json();
    },
    enabled: isSearching && searchTerm.length >= 3
  });

  // Query to get existing connection requests
  const { 
    data: connectionRequests, 
    isLoading: isLoadingRequests 
  } = useQuery({
    queryKey: ['/api/parent/connection-requests'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/parent/connection-requests');
      return res.json();
    }
  });

  // Mutation to request connection to a child
  const requestConnectionMutation = useMutation({
    mutationFn: async (playerId: number) => {
      const res = await apiRequest('POST', '/api/parent/connection-requests', { playerId });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Request Submitted",
        description: "Your connection request has been submitted and is pending coach approval.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/parent/connection-requests'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Request Failed",
        description: error.message || "Failed to submit connection request. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Handle search button click
  const handleSearch = () => {
    if (searchTerm.length < 3) {
      toast({
        title: "Search term too short",
        description: "Please enter at least 3 characters to search",
        variant: "destructive",
      });
      return;
    }
    setIsSearching(true);
    refetch();
  };

  // Handle request connection button click
  const handleRequestConnection = (playerId: number) => {
    requestConnectionMutation.mutate(playerId);
  };

  // Get status of connection request for a player
  const getConnectionStatus = (playerId: number) => {
    if (!connectionRequests) return null;
    return connectionRequests.find((req: any) => req.playerId === playerId);
  };

  return (
    <ParentLayout title="Connect with Your Child">
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h1 className="text-2xl font-bold mb-4">Find and Connect with Your Child</h1>
          <p className="text-gray-700 mb-6">
            Search for your child by name, and request access to view their profile and information.
            Your request will be reviewed by a coach or administrator.
          </p>
          
          {/* Search Form */}
          <div className="flex gap-2 max-w-xl">
            <div className="flex-1">
              <Input 
                placeholder="Enter your child's name..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button 
              onClick={handleSearch}
              disabled={searchTerm.length < 3}
            >
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </div>

        {/* Search Results */}
        {isSearching && (
          <Card>
            <CardHeader>
              <CardTitle>Search Results</CardTitle>
              <CardDescription>
                Found {searchResults?.length || 0} players matching "{searchTerm}"
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingResults ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : searchResults?.length === 0 ? (
                <div className="text-center py-6">
                  <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No players found matching your search.</p>
                  <p className="text-gray-500 text-sm mt-1">
                    Try using your child's full name or ask your coach for help.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Age Group</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {searchResults?.map((player: any) => {
                      const connectionStatus = getConnectionStatus(player.id);
                      return (
                        <TableRow key={player.id}>
                          <TableCell className="font-medium">
                            {player.firstName} {player.lastName}
                          </TableCell>
                          <TableCell>{player.ageGroup}</TableCell>
                          <TableCell>
                            {connectionStatus ? (
                              <div className="flex items-center">
                                {connectionStatus.status === 'pending' ? (
                                  <>
                                    <Clock className="h-4 w-4 text-amber-500 mr-1" />
                                    <span className="text-amber-500">Pending</span>
                                  </>
                                ) : connectionStatus.status === 'approved' ? (
                                  <>
                                    <Check className="h-4 w-4 text-green-500 mr-1" />
                                    <span className="text-green-500">Connected</span>
                                  </>
                                ) : (
                                  <>
                                    <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
                                    <span className="text-red-500">Rejected</span>
                                  </>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-500">Not Connected</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={connectionStatus !== null || requestConnectionMutation.isPending}
                              onClick={() => handleRequestConnection(player.id)}
                            >
                              {requestConnectionMutation.isPending ? "Requesting..." : "Request Connection"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
            <CardFooter className="text-sm text-gray-500">
              Don't see your child? Contact the academy directly for assistance.
            </CardFooter>
          </Card>
        )}

        {/* Existing Connection Requests */}
        <Card>
          <CardHeader>
            <CardTitle>Your Connection Requests</CardTitle>
            <CardDescription>
              View the status of your existing requests to connect with players
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingRequests ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : connectionRequests?.length === 0 ? (
              <div className="text-center py-6">
                <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">You haven't made any connection requests yet.</p>
                <p className="text-gray-500 text-sm mt-1">
                  Search for your child above to get started.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player Name</TableHead>
                    <TableHead>Age Group</TableHead>
                    <TableHead>Requested On</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {connectionRequests?.map((request: any) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">
                        {request.playerFirstName} {request.playerLastName}
                      </TableCell>
                      <TableCell>{request.playerAgeGroup}</TableCell>
                      <TableCell>
                        {new Date(request.createdAt).toLocaleDateString()}
                      </TableCell>
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
                            <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
                            <span className="text-red-500">Rejected</span>
                          </div>
                        )}
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