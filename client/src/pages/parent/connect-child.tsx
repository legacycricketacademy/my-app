import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { ParentLayout } from "@/layout/parent-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Search, UserRound, AlertCircle, CheckCircle2, Loader2, PlusCircle, Calendar } from "lucide-react";
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

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

// Schema for the new child form
const addChildFormSchema = z.object({
  firstName: z.string()
    .min(1, { message: "First name is required" })
    .min(2, { message: "First name must be at least 2 characters" })
    .max(50, { message: "First name must be less than 50 characters" }),
  lastName: z.string()
    .min(1, { message: "Last name is required" })
    .min(2, { message: "Last name must be at least 2 characters" })
    .max(50, { message: "Last name must be less than 50 characters" }),
  dateOfBirth: z.string({ required_error: "Date of birth is required" })
    .min(1, { message: "Date of birth is required" })
    .refine(val => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, { message: "Please enter a valid date" }),
  ageGroup: z.string({ required_error: "Age group is required" })
    .min(1, { message: "Please select an age group" }),
  position: z.string().optional(),
  jerseyNumber: z.string()
    .optional()
    .refine(val => !val || /^\d+$/.test(val), { 
      message: "Jersey number must contain only digits" 
    }),
  healthNotes: z.string()
    .max(500, { message: "Health notes must be less than 500 characters" })
    .optional(),
  additionalNotes: z.string()
    .max(500, { message: "Additional notes must be less than 500 characters" })
    .optional(),
});

type AddChildFormValues = z.infer<typeof addChildFormSchema>;

export default function ConnectChildPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PlayerSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Initialize form for adding a new child
  const form = useForm<AddChildFormValues>({
    resolver: zodResolver(addChildFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      ageGroup: "",
      position: "",
      jerseyNumber: "",
      healthNotes: "",
      additionalNotes: "",
    },
  });
  
  // Mutation for adding a new child
  const addChildMutation = useMutation({
    mutationFn: async (data: AddChildFormValues) => {
      try {
        // Format dateOfBirth if needed
        const formattedData = {
          ...data,
          dateOfBirth: data.dateOfBirth // The field is already properly formatted as YYYY-MM-DD from the date input
        };
        
        const res = await apiRequest("POST", "/api/players", formattedData);
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          
          if (res.status === 400) {
            if (errorData.message?.includes("already exists")) {
              throw new Error("A player with this name and date of birth already exists. Please check your information.");
            } else if (errorData.message?.includes("dateOfBirth")) {
              throw new Error("There was an issue with the date of birth. Please make sure it's a valid date.");
            } else {
              throw new Error(errorData.message || "Please check the information and try again.");
            }
          } else {
            throw new Error("Unable to add child at this time. Please try again later.");
          }
        }
        
        return await res.json();
      } catch (error: any) {
        // Handle any unexpected errors during the process
        if (error.name === "ZodError") {
          const errorMessage = error.errors?.[0]?.message || "Invalid form data";
          throw new Error(`Validation error: ${errorMessage}`);
        }
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Child Added Successfully",
        description: "Your child has been added and is now pending coach review.",
      });
      // Force dialog to close
      setDialogOpen(false);
      // Reset form fields
      form.reset();
      // Refresh the lists of players and connection requests
      queryClient.invalidateQueries({ queryKey: ["/api/parent/players"] });
      queryClient.invalidateQueries({ queryKey: ["/api/parent/connection-requests"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Add Child",
        description: error.message,
        variant: "destructive",
      });
      // Keep the dialog open so the user can correct the information
      // but don't reset the form so they don't lose their input
    },
  });
  
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
  
  // Submit handler for the add child form
  const onSubmit = (data: AddChildFormValues) => {
    addChildMutation.mutate(data);
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
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <Button 
                className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white"
                onClick={() => setDialogOpen(true)}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add New Child
              </Button>
              
              <Dialog 
                open={dialogOpen} 
                onOpenChange={(open) => {
                  setDialogOpen(open);
                  if (!open) form.reset();
                }}
              >
                <DialogContent 
                  className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto"
                  onInteractOutside={(e) => {
                    // Prevent closing if a form is being submitted
                    if (addChildMutation.isPending) {
                      e.preventDefault();
                    }
                  }}
                >
                  <DialogHeader>
                    <DialogTitle>Add New Child</DialogTitle>
                    <DialogDescription>
                      Fill in your child's details below. Once added, a coach will review and approve the connection.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input placeholder="First name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Last name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="dateOfBirth"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date of Birth</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                  <Input
                                    type="date"
                                    className="pl-9"
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="ageGroup"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Age Group</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select age group" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="U11">Under 11</SelectItem>
                                  <SelectItem value="U13">Under 13</SelectItem>
                                  <SelectItem value="U15">Under 15</SelectItem>
                                  <SelectItem value="U17">Under 17</SelectItem>
                                  <SelectItem value="U19">Under 19</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="position"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Position (Optional)</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select position" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="batsman">Batsman</SelectItem>
                                  <SelectItem value="bowler">Bowler</SelectItem>
                                  <SelectItem value="all_rounder">All-Rounder</SelectItem>
                                  <SelectItem value="wicket_keeper">Wicket-Keeper</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Your child's primary cricket position
                              </FormDescription>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="jerseyNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Jersey Number (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="Jersey number" {...field} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="healthNotes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Health Notes (Optional)</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Any allergies, medical conditions, or health concerns"
                                className="resize-none min-h-[80px]"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Important health information coaches should know about
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="additionalNotes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Additional Notes (Optional)</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Any other information about your child you'd like to share"
                                className="resize-none min-h-[80px]"
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setDialogOpen(false)}
                          className="mt-2"
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit"
                          disabled={addChildMutation.isPending}
                          className="mt-2"
                        >
                          {addChildMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            "Add Child"
                          )}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
            
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