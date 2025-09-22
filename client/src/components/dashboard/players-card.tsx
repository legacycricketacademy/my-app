import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Search, User, Heart, Mail, UserPlus } from "lucide-react";
import { Link } from "wouter";
import { api } from "@/lib/api";
import { safeInitials, safeNumber } from "@/lib/strings";

export function PlayersCard() {
  const [ageGroup, setAgeGroup] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  const { data: players, isLoading } = useQuery<any[]>({
    queryKey: ["/api/players", ageGroup],
    queryFn: () => api.get(`/players${ageGroup !== "all" ? `?ageGroup=${ageGroup}` : ""}`)
  });
  
  const filteredPlayers = (players ?? []).filter(player => {
    if (!searchQuery) return true;
    const fullName = `${player.firstName || ''} ${player.lastName || ''}`.toLowerCase();
    return fullName.includes(searchQuery.toLowerCase()) || 
           (player.playerType?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
           (player.ageGroup?.toLowerCase() || '').includes(searchQuery.toLowerCase());
  });
  
  // Removed getInitials - now using safeInitials from strings.ts

  return (
    <Card className="bg-white rounded-lg shadow">
      <CardHeader className="flex items-center justify-between border-b border-gray-200 p-4">
        <CardTitle className="font-semibold text-lg heading">Players</CardTitle>
        <div className="flex space-x-2">
          <Select value={ageGroup} onValueChange={setAgeGroup}>
            <SelectTrigger className="text-sm bg-gray-100 rounded px-2 py-1 border-0 focus:ring-1 focus:ring-primary h-8">
              <SelectValue placeholder="All Age Groups" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Age Groups</SelectItem>
              <SelectItem value="Under 12s">Under 12s</SelectItem>
              <SelectItem value="Under 14s">Under 14s</SelectItem>
              <SelectItem value="Under 16s">Under 16s</SelectItem>
            </SelectContent>
          </Select>
          <Link href="/players" className="text-primary text-sm hover:underline flex items-center">
            View All
          </Link>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        <div className="relative">
          <Input
            placeholder="Search players..."
            className="w-full pl-10 pr-4 py-2"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
        </div>
        
        <div className="mt-4 space-y-3 max-h-80 overflow-y-auto scrollbar-hide">
          {isLoading ? (
            Array(5).fill(0).map((_, index) => (
              <div key={index} className="flex items-center justify-between border-b border-gray-100 pb-3 animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-gray-200"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                    <div className="h-3 bg-gray-100 rounded w-32"></div>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <div className="h-8 w-8 rounded-full bg-gray-100"></div>
                  <div className="h-8 w-8 rounded-full bg-gray-100"></div>
                  <div className="h-8 w-8 rounded-full bg-gray-100"></div>
                </div>
              </div>
            ))
          ) : filteredPlayers && filteredPlayers.length > 0 ? (
            filteredPlayers.map((player) => (
              <div key={player.id} className="flex items-center justify-between border-b border-gray-100 pb-3 group">
                <Link href={`/player/${player.id}`} className="flex items-center space-x-3 flex-1 cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors">
                  <Avatar className={safeNumber(player.id) % 5 === 0 ? "border-2 border-primary" : ""}>
                    <AvatarImage src={player.profileImage} alt={`${player.firstName || ''} ${player.lastName || ''}`} />
                    <AvatarFallback>{safeInitials(`${player.firstName || ''} ${player.lastName || ''}`)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="text-sm font-medium">{player.firstName} {player.lastName}</h4>
                    <p className="text-xs text-gray-600">{player.ageGroup} • {player.playerType || "Player"}</p>
                  </div>
                </Link>
                <div className="flex space-x-1">
                  <Link href={`/player/${player.id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-gray-500 hover:text-primary hover:bg-gray-100" title="View Profile">
                      <User className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href={`/player/${player.id}?tab=fitness`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-gray-500 hover:text-primary hover:bg-gray-100" title="Fitness Data">
                      <Heart className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-gray-500 hover:text-primary hover:bg-gray-100" title="Contact Parents">
                    <Mail className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="mb-4">
                <User className="h-12 w-12 mx-auto text-gray-300" />
              </div>
              <p className="text-lg font-medium mb-2">No players found</p>
              <p className="text-sm mb-4">Get started by adding your first player</p>
              <Link href="/players/add">
                <Button size="sm" className="bg-primary text-white">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Player
                </Button>
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
