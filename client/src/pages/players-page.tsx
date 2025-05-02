import { useState } from "react";
import { MainLayout } from "@/layout/main-layout";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, 
  UserPlus, 
  Heart, 
  Mail, 
  Calendar, 
  FileText, 
  DollarSign,
  Loader2 
} from "lucide-react";

export default function PlayersPage() {
  const [ageGroup, setAgeGroup] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  const { data: players, isLoading } = useQuery<any[]>({
    queryKey: ["/api/players", ageGroup],
    queryFn: () => fetch(`/api/players${ageGroup !== "all" ? `?ageGroup=${ageGroup}` : ""}`).then(res => res.json())
  });
  
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
          
          <Button className="flex items-center gap-2">
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
    </MainLayout>
  );
}
