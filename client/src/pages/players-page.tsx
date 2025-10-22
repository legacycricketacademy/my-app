import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { DobField } from "@/components/DobField";
import { FormProvider } from "react-hook-form";
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
import { http } from "@/lib/http";
import { queryClient } from "../lib/queryClient";
import { useToast, notify } from '@/shared/toast';
import { isPendingLike } from '@/shared/pending';
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
  Save,
  Copy,
  CheckCircle,
  Link,
  Trash2
} from "lucide-react";

// Define the schema for player creation
const playerFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"), // YYYY-MM-DD
  ageGroup: z.enum(['Under 10s','Under 12s','Under 14s','Under 16s','Under 19s','Open']),
  playerType: z.string().min(1, "Player type is required"),
  emergencyContact: z.string().optional(),
  medicalInformation: z.string().optional(),
  parentName: z.string().min(1, "Parent name is required"),
  parentEmail: z.string().email("Invalid email address"),
});

type PlayerFormValues = z.infer<typeof playerFormSchema>;

export default function PlayersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [ageGroup, setAgeGroup] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showAddPlayerDialog, setShowAddPlayerDialog] = useState(false);
  const [showEditPlayerDialog, setShowEditPlayerDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [copiedPlayerId, setCopiedPlayerId] = useState<number | null>(null);
  const [sendingEmailId, setSendingEmailId] = useState<number | null>(null);
  const [playerToDelete, setPlayerToDelete] = useState<any>(null);
  const { toast } = useToast();
  const safeToast = (t: any) => { try { toast(t); } catch { notify(t); } };
  
  // Check for add=true query parameter and open dialog
  useEffect(() => {
    const addParam = searchParams.get('add');
    if (addParam === 'true') {
      setShowAddPlayerDialog(true);
      // Remove the query parameter from URL
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);
  
  // Reset the copied state after 3 seconds
  const resetCopiedState = (playerId: number) => {
    setCopiedPlayerId(playerId);
    setTimeout(() => {
      setCopiedPlayerId(null);
    }, 3000);
  };
  
  const form = useForm<PlayerFormValues>({
    resolver: zodResolver(playerFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      ageGroup: "Under 12s",
      playerType: "Batsman",
      emergencyContact: "",
      medicalInformation: "",
      parentName: "",
      parentEmail: ""
    }
  });
  
  const editForm = useForm<PlayerFormValues>({
    resolver: zodResolver(playerFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      ageGroup: "Under 12s", 
      playerType: "Batsman",
      emergencyContact: "",
      medicalInformation: "",
      parentName: "",
      parentEmail: ""
    }
  });
  
  const { data: playersData, isLoading } = useQuery<any[]>({
    queryKey: ["players", ageGroup],
    queryFn: async () => {
      const res = await http<any[]>(`/api/players${ageGroup !== "all" ? `?ageGroup=${ageGroup}` : ""}`);
      if (!res.ok) {
        throw new Error(res.message || 'Failed to load players');
      }
      return res.data;
    }
  });
  
  // Safe array handling with logging for debugging
  const players = Array.isArray(playersData) ? playersData : [];
  if (!Array.isArray(playersData)) {
    console.log('DEBUG: players data is not an array:', typeof playersData, playersData);
  }
  
  const createPlayerMutation = useMutation({
    mutationFn: async (data: PlayerFormValues) => {
      const payload = { ...data, dateOfBirth: new Date(data.dateOfBirth).toISOString() };
      const res = await http<{ id: string }>('/api/players', { 
        method: 'POST', 
        body: JSON.stringify(payload) 
      });
      if (!res.ok) {
        throw new Error(res.message ?? res.error);
      }
      return res.data;
    },
    onSuccess: () => {
      toast({ title: 'Player added', description: 'New player has been successfully added.' });
      queryClient.invalidateQueries({ queryKey: ["players"] });
      setShowAddPlayerDialog(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create player', description: error.message || 'An unknown error occurred.' });
    }
  });
  
  const updatePlayerMutation = useMutation({
    mutationFn: async ({ playerId, data }: { playerId: number, data: any }) => {
      const res = await apiRequest("PATCH", `/api/players/${playerId}`, data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update player");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Player updated successfully",
        description: "The player information has been updated.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      setShowEditPlayerDialog(false);
      setSelectedPlayer(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update player",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const deletePlayerMutation = useMutation({
    mutationFn: async (playerId: number) => {
      const res = await apiRequest("DELETE", `/api/players/${playerId}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete player");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Player deleted successfully",
        description: "The player and all associated records have been removed.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/players"] });
      setShowDeleteDialog(false);
      setPlayerToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete player",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  function onSubmit(data: PlayerFormValues) {
    createPlayerMutation.mutate(data);
  }
  
  function onEditSubmit(data: PlayerFormValues) {
    if (!selectedPlayer) return;
    
    try {
      // Make sure dateOfBirth is a valid Date before formatting
      if (!(data.dateOfBirth instanceof Date) || isNaN(data.dateOfBirth.getTime())) {
        throw new Error("Invalid date of birth");
      }
      
      // Format the date to ISO string for the API
      const formattedData = {
        ...data,
        dateOfBirth: data.dateOfBirth.toISOString(),
      };
      
      // Debug info
      console.log("Updating player data:", formattedData);
      
      updatePlayerMutation.mutate({ 
        playerId: selectedPlayer.id,
        data: formattedData
      });
    } catch (error) {
      console.error("Error updating player:", error);
      toast({
        title: "Error",
        description: "There was a problem updating the player. Please ensure all fields are correctly filled.",
        variant: "destructive",
      });
    }
  }
  
  function handleEditPlayer(player: any) {
    setSelectedPlayer(player);
    
    // Reset the form with the player's values
    editForm.reset({
      firstName: player.firstName,
      lastName: player.lastName,
      dateOfBirth: new Date(player.dateOfBirth),
      ageGroup: player.ageGroup,
      playerType: player.playerType || "Batsman",
      emergencyContact: player.emergencyContact || "",
      medicalInformation: player.medicalInformation || "",
      parentName: player.parentName || "",
      parentEmail: player.parentEmail || ""
    });
    
    setShowEditPlayerDialog(true);
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
  
  // Function to copy invitation link
  const copyInvitationLink = async (player: any) => {
    try {
      // Debug player data
      console.log("Player data for invitation:", player);
      
      // Make sure we have the required data
      if (!player.id) {
        console.error("Player ID is missing!");
        throw new Error("Player ID is required for generating an invitation");
      }
      
      if (!player.parentEmail) {
        console.error("Parent email is missing!");
        throw new Error("Parent email is required for generating an invitation");
      }
      
      // First try to get a server-generated token
      const response = await apiRequest(
        "POST", 
        "/api/invitations/send", 
        {
          playerId: player.id,
          parentEmail: player.parentEmail,
          parentName: player.parentName || ""
        }
      );
      
      const data = await response.json();
      
      if (response.ok && data.invitationLink) {
        // Use the server-generated link
        await navigator.clipboard.writeText(data.invitationLink);
      } else {
        // Fallback to client-side token generation
        const token = btoa(JSON.stringify({
          email: player.parentEmail,
          playerId: player.id,
          expires: Date.now() + 1000 * 60 * 60 * 24 * 7 // 7 days from now
        }));
        
        // Create the invitation URL with client-side token
        const inviteUrl = `${window.location.origin}/auth?invite=${token}`;
        
        // Copy to clipboard
        await navigator.clipboard.writeText(inviteUrl);
      }
      
      // Set copied state and show toast
      resetCopiedState(player.id);
      
      toast({
        title: "Invitation Link Copied!",
        description: `An invitation link for ${player.parentName} has been copied to your clipboard.`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error copying invitation link:", error);
      toast({
        title: "Error",
        description: "There was a problem creating the invitation link.",
        variant: "destructive",
      });
    }
  };
  
  // Function to send email invitation
  const sendEmailInvitation = async (player: any) => {
    // Debug player data
    console.log("Player data for email invitation:", player);
    
    // Validate player data
    if (!player.id) {
      toast({
        title: "Error",
        description: "Player ID is missing. Cannot send invitation.",
        variant: "destructive",
      });
      return;
    }
    
    if (!player.parentEmail) {
      toast({
        title: "Error",
        description: "This player doesn't have a parent email address.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Set loading state
      setSendingEmailId(player.id);
      
      // Call the API to send the invitation
      const response = await apiRequest(
        "POST", 
        "/api/invitations/send", 
        {
          playerId: player.id,
          parentEmail: player.parentEmail,
          parentName: player.parentName || ""
        }
      );
      
      const data = await response.json();
      
      // Reset loading state
      setSendingEmailId(null);
      
      if (response.ok) {
        toast({
          title: "Invitation Email Sent!",
          description: `An invitation email has been sent to ${player.parentName} at ${player.parentEmail}.`,
          variant: "default",
        });
      } else {
        throw new Error(data.message || "Failed to send invitation email");
      }
    } catch (error) {
      console.error("Error sending invitation email:", error);
      setSendingEmailId(null);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "There was a problem sending the invitation email.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 heading" data-testid="heading-team-management">Team Management</h1>
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
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Edit Player"
                            onClick={() => handleEditPlayer(player)}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-4 w-4"
                            >
                              <path d="M12 20h9"/>
                              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                            </svg>
                          </Button>
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
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Copy Invitation Link"
                            onClick={() => copyInvitationLink(player)}
                            disabled={copiedPlayerId === player.id}
                          >
                            {copiedPlayerId === player.id ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <Link className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Send Email Invitation"
                            onClick={() => sendEmailInvitation(player)}
                            disabled={sendingEmailId === player.id}
                          >
                            {sendingEmailId === player.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="h-4 w-4"
                              >
                                <path d="M22 13V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h8" />
                                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                <path d="M16 19h6" />
                                <path d="M19 16v6" />
                              </svg>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Delete Player"
                            onClick={() => {
                              setPlayerToDelete(player);
                              setShowDeleteDialog(true);
                            }}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <p className="text-gray-500">No players found.</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Add New Player Dialog */}
        <Dialog open={showAddPlayerDialog} onOpenChange={setShowAddPlayerDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Player</DialogTitle>
              <DialogDescription>
                Enter the player's details to add them to the system.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  
                  {/* Date of Birth */}
                  <FormProvider {...form}>
                    <DobField />
                  </FormProvider>
                  
                  <FormField
                    control={form.control}
                    name="ageGroup"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age Group *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select age group" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Under 10s">Under 10s</SelectItem>
                            <SelectItem value="Under 12s">Under 12s</SelectItem>
                            <SelectItem value="Under 14s">Under 14s</SelectItem>
                            <SelectItem value="Under 16s">Under 16s</SelectItem>
                            <SelectItem value="Under 19s">Under 19s</SelectItem>
                            <SelectItem value="Open">Open</SelectItem>
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select player type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Batsman">Batsman</SelectItem>
                            <SelectItem value="Bowler">Bowler</SelectItem>
                            <SelectItem value="All-rounder">All-rounder</SelectItem>
                            <SelectItem value="Wicket-keeper">Wicket-keeper</SelectItem>
                          </SelectContent>
                        </Select>
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
                          <Input placeholder="+1234567890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="medicalInformation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Medical Information</FormLabel>
                          <FormControl>
                            <Input placeholder="Any allergies or conditions" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <hr className="md:col-span-2 border-gray-200" />
                  <h3 className="md:col-span-2 text-lg font-semibold">Parent Information</h3>
                  
                  <FormField
                    control={form.control}
                    name="parentName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parent Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Parent's full name" {...field} />
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
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowAddPlayerDialog(false)}>
                    <span>Cancel</span>
                  </Button>
                  <Button type="submit" disabled={isPendingLike(createPlayerMutation)}>
                    {isPendingLike(createPlayerMutation) ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        <span>Save Player</span>
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit Player Dialog */}
        <Dialog open={showEditPlayerDialog} onOpenChange={setShowEditPlayerDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Player</DialogTitle>
              <DialogDescription>
                Update the player's information.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
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
                    control={editForm.control}
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
                  
                  {/* Date of Birth */}
                  <FormProvider {...editForm}>
                    <DobField />
                  </FormProvider>
                  
                  <FormField
                    control={editForm.control}
                    name="ageGroup"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age Group *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select age group" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Under 10s">Under 10s</SelectItem>
                            <SelectItem value="Under 12s">Under 12s</SelectItem>
                            <SelectItem value="Under 14s">Under 14s</SelectItem>
                            <SelectItem value="Under 16s">Under 16s</SelectItem>
                            <SelectItem value="Under 19s">Under 19s</SelectItem>
                            <SelectItem value="Open">Open</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="playerType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Player Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || "Batsman"}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select player type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Batsman">Batsman</SelectItem>
                            <SelectItem value="Bowler">Bowler</SelectItem>
                            <SelectItem value="All-rounder">All-rounder</SelectItem>
                            <SelectItem value="Wicket-keeper">Wicket-keeper</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="emergencyContact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Emergency Contact</FormLabel>
                        <FormControl>
                          <Input placeholder="+1234567890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="md:col-span-2">
                    <FormField
                      control={editForm.control}
                      name="medicalInformation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Medical Information</FormLabel>
                          <FormControl>
                            <Input placeholder="Any allergies or conditions" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <hr className="md:col-span-2 border-gray-200" />
                  <h3 className="md:col-span-2 text-lg font-semibold">Parent Information</h3>
                  
                  <FormField
                    control={editForm.control}
                    name="parentName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parent Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Parent's full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
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
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => {
                    setShowEditPlayerDialog(false);
                    setSelectedPlayer(null);
                  }}>
                    <X className="mr-2 h-4 w-4" />
                    <span>Cancel</span>
                  </Button>
                  <Button type="submit" disabled={isPendingLike(updatePlayerMutation)}>
                    {isPendingLike(updatePlayerMutation) ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        <span>Update Player</span>
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Player</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this player? This action cannot be undone and will remove all associated data including fitness records, payments, and attendance history.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              {playerToDelete && (
                <div className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
                  <Avatar>
                    <AvatarFallback>{getInitials(playerToDelete.firstName, playerToDelete.lastName)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{playerToDelete.firstName} {playerToDelete.lastName}</p>
                    <p className="text-sm text-gray-500">{playerToDelete.ageGroup}</p>
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter className="gap-2 sm:gap-0">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowDeleteDialog(false);
                  setPlayerToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                variant="destructive"
                onClick={() => playerToDelete && deletePlayerMutation.mutate(playerToDelete.id)}
                disabled={isPendingLike(deletePlayerMutation)}
              >
                {isPendingLike(deletePlayerMutation) ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>Delete Player</span>
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
}