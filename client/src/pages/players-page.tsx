import { useState } from "react";
import { MainLayout } from "@/layout/main-layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { format, parseISO } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  UserPlus, 
  Heart, 
  Mail, 
  Calendar, 
  FileText, 
  DollarSign,
  Loader2,
  CalendarIcon,
  X,
  Save
} from "lucide-react";

// Define the schema for player creation
const playerFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.date({
    required_error: "Date of birth is required",
  }),
  ageGroup: z.string().min(1, "Age group is required"),
  playerType: z.string().optional(),
  emergencyContact: z.string().optional(),
  medicalInformation: z.string().optional(),
  parentEmail: z.string().email("Invalid email address"),
  parentName: z.string().min(1, "Parent name is required"),
});

type PlayerFormValues = z.infer<typeof playerFormSchema>;

export default function PlayersPage() {
  const [ageGroup, setAgeGroup] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showAddPlayerDialog, setShowAddPlayerDialog] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<PlayerFormValues>({
    resolver: zodResolver(playerFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      ageGroup: "Under 12s",
      playerType: "Batsman",
      emergencyContact: "",
      medicalInformation: "",
      parentName: "",
      parentEmail: ""
    }
  });
  
  const { data: players, isLoading } = useQuery<any[]>({
    queryKey: ["/api/players", ageGroup],
    queryFn: () => fetch(`/api/players${ageGroup !== "all" ? `?ageGroup=${ageGroup}` : ""}`).then(res => res.json())
  });
  
  const createPlayerMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/players", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create player");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Player created successfully",
        description: "The new player has been added to the database.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      setShowAddPlayerDialog(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create player",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  function onSubmit(data: PlayerFormValues) {
    try {
      // Format the date to ISO string for the API
      const formattedData = {
        ...data,
        dateOfBirth: data.dateOfBirth.toISOString(),
      };
      
      createPlayerMutation.mutate(formattedData);
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: "There was a problem with your submission. Please try again.",
        variant: "destructive",
      });
    }
  }
  
  const filteredPlayers = players?.filter(player => {
    if (!searchQuery) return true;
    const fullName = `${player.firstName} ${player.lastName}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) || 
           player.playerType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           player.ageGroup?.toLowerCase().includes(searchQuery.toLowerCase());
  });
  
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };
  
  return (
    <MainLayout title="Team Management">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 heading">Team Management</h1>
            <p className="text-gray-600">Manage your players and teams</p>
          </div>
          
          <Button 
            className="flex items-center gap-2"
            onClick={() => setShowAddPlayerDialog(true)}
          >
            <UserPlus className="h-4 w-4" />
            <span>Add New Player</span>
          </Button>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-lg shadow">
          <div className="relative w-full max-w-md">
            <Input
              placeholder="Search players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Filter by:</span>
            <Select value={ageGroup} onValueChange={setAgeGroup}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Age Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Age Groups</SelectItem>
                <SelectItem value="Under 12s">Under 12s</SelectItem>
                <SelectItem value="Under 14s">Under 14s</SelectItem>
                <SelectItem value="Under 16s">Under 16s</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Players Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold heading">Players List</h2>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead>Age Group</TableHead>
                  <TableHead>Player Type</TableHead>
                  <TableHead>Date of Birth</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <div className="flex justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                      <p className="mt-2 text-gray-500">Loading players...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredPlayers && filteredPlayers.length > 0 ? (
                  filteredPlayers.map((player) => (
                    <TableRow key={player.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={player.profileImage} alt={`${player.firstName} ${player.lastName}`} />
                            <AvatarFallback>{getInitials(player.firstName, player.lastName)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{player.firstName} {player.lastName}</p>
                            <p className="text-sm text-gray-500">ID: #{player.id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{player.ageGroup}</TableCell>
                      <TableCell>{player.playerType || "N/A"}</TableCell>
                      <TableCell>{new Date(player.dateOfBirth).toLocaleDateString()}</TableCell>
                      <TableCell>{player.parentName}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" title="Fitness Data">
                            <Heart className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Attendance">
                            <Calendar className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Records">
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Payments">
                            <DollarSign className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Contact Parent">
                            <Mail className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <p className="text-gray-500">No players found</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      
      {/* Add Player Dialog */}
      <Dialog open={showAddPlayerDialog} onOpenChange={setShowAddPlayerDialog}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Add New Player</DialogTitle>
            <DialogDescription>
              Enter player details below. Fields marked with an asterisk (*) are required.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Player Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-500">Player Information</h3>
                  
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} />
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
                        <FormLabel>Last Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Smith" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date of Birth *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={`w-full pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date > new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="ageGroup"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age Group *</FormLabel>
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
                            <SelectItem value="Under 8s">Under 8s</SelectItem>
                            <SelectItem value="Under 12s">Under 12s</SelectItem>
                            <SelectItem value="Under 14s">Under 14s</SelectItem>
                            <SelectItem value="Under 16s">Under 16s</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="playerType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Player Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select player type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Batsman">Batsman</SelectItem>
                            <SelectItem value="Bowler">Bowler</SelectItem>
                            <SelectItem value="All-Rounder">All-Rounder</SelectItem>
                            <SelectItem value="Wicket-Keeper">Wicket-Keeper</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Parent Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-500">Parent Information</h3>
                  
                  <FormField
                    control={form.control}
                    name="parentName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parent Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Jane Smith" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="parentEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parent Email *</FormLabel>
                        <FormControl>
                          <Input placeholder="parent@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="emergencyContact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Emergency Contact</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 (555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="medicalInformation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Medical Information</FormLabel>
                        <FormControl>
                          <Input placeholder="Any medical conditions or allergies" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddPlayerDialog(false)}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="gap-2"
                  disabled={createPlayerMutation.isPending}
                >
                  {createPlayerMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Create Player
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
