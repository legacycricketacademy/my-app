import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, UserPlus, Search, Filter, Edit, Trash2, Mail, Heart, User, Calendar, MapPin } from 'lucide-react';
import { api } from '@/lib/api';
import { format, parseISO } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { Link } from 'wouter';

interface Player {
  id: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  ageGroup: string;
  playerType: string;
  parentEmail: string;
  parentName: string;
  emergencyContact?: string;
  medicalInformation?: string;
  createdAt: string;
}

export default function PlayersPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [ageGroupFilter, setAgeGroupFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  // Fetch players
  const { data: players = [], isLoading } = useQuery<Player[]>({
    queryKey: ['/api/players'],
    queryFn: () => api.get('/players'),
  });

  // Create player mutation
  const createPlayerMutation = useMutation({
    mutationFn: (data: Partial<Player>) => api.post('/players', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/players'] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Player Added",
        description: "The player has been added successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add player. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update player mutation
  const updatePlayerMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Player> }) => 
      api.patch(`/players/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/players'] });
      setEditingPlayer(null);
      toast({
        title: "Player Updated",
        description: "The player has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update player. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete player mutation
  const deletePlayerMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/players/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/players'] });
      toast({
        title: "Player Deleted",
        description: "The player has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete player. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Filter players based on search and age group
  const filteredPlayers = players.filter(player => {
    const matchesSearch = `${player.firstName} ${player.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         player.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         player.parentEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAgeGroup = ageGroupFilter === 'all' || player.ageGroup === ageGroupFilter;
    return matchesSearch && matchesAgeGroup;
  });

  const getAgeGroupColor = (ageGroup: string) => {
    switch (ageGroup) {
      case 'Under 12s':
        return 'bg-blue-100 text-blue-800';
      case 'Under 14s':
        return 'bg-green-100 text-green-800';
      case 'Under 16s':
        return 'bg-yellow-100 text-yellow-800';
      case 'Under 18s':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlayerTypeColor = (playerType: string) => {
    switch (playerType) {
      case 'Batsman':
        return 'bg-orange-100 text-orange-800';
      case 'Bowler':
        return 'bg-red-100 text-red-800';
      case 'All-rounder':
        return 'bg-indigo-100 text-indigo-800';
      case 'Wicket-keeper':
        return 'bg-teal-100 text-teal-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'MMM d, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    try {
      const birthDate = parseISO(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    } catch {
      return 'Unknown';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLocation('/')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold">Players</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Players</p>
                <p className="text-2xl font-bold">{players.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Under 12s</p>
                <p className="text-2xl font-bold">
                  {players.filter(p => p.ageGroup === 'Under 12s').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Under 14s</p>
                <p className="text-2xl font-bold">
                  {players.filter(p => p.ageGroup === 'Under 14s').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Under 16s+</p>
                <p className="text-2xl font-bold">
                  {players.filter(p => p.ageGroup === 'Under 16s' || p.ageGroup === 'Under 18s').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Select value={ageGroupFilter} onValueChange={setAgeGroupFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Age Groups" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Age Groups</SelectItem>
              <SelectItem value="Under 12s">Under 12s</SelectItem>
              <SelectItem value="Under 14s">Under 14s</SelectItem>
              <SelectItem value="Under 16s">Under 16s</SelectItem>
              <SelectItem value="Under 18s">Under 18s</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Link href="/players/add">
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Add New Player
          </Button>
        </Link>
      </div>

      {/* Players List */}
      <Card>
        <CardHeader>
          <CardTitle>All Players</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          ) : filteredPlayers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No players found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPlayers.map((player) => (
                <Card key={player.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-blue-600">
                            {player.firstName[0]}{player.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold">{player.firstName} {player.lastName}</h3>
                          <p className="text-sm text-gray-600">Age: {calculateAge(player.dateOfBirth)}</p>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingPlayer(player)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deletePlayerMutation.mutate(player.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Badge className={getAgeGroupColor(player.ageGroup)}>
                          {player.ageGroup}
                        </Badge>
                        <Badge className={getPlayerTypeColor(player.playerType)}>
                          {player.playerType}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        <p><strong>Parent:</strong> {player.parentName}</p>
                        <p><strong>Email:</strong> {player.parentEmail}</p>
                        {player.emergencyContact && (
                          <p><strong>Emergency:</strong> {player.emergencyContact}</p>
                        )}
                      </div>
                      
                      {player.medicalInformation && (
                        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                          <strong>Medical Info:</strong> {player.medicalInformation}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Player Dialog */}
      {editingPlayer && (
        <Dialog open={!!editingPlayer} onOpenChange={() => setEditingPlayer(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Player</DialogTitle>
            </DialogHeader>
            <PlayerForm
              initialData={editingPlayer}
              onSubmit={(data) => updatePlayerMutation.mutate({ id: editingPlayer.id, data })}
              isLoading={updatePlayerMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Player Form Component
function PlayerForm({ 
  initialData, 
  onSubmit, 
  isLoading 
}: { 
  initialData?: Player; 
  onSubmit: (data: Partial<Player>) => void; 
  isLoading: boolean; 
}) {
  const [formData, setFormData] = useState({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    dateOfBirth: initialData?.dateOfBirth || '',
    ageGroup: initialData?.ageGroup || '',
    playerType: initialData?.playerType || '',
    parentEmail: initialData?.parentEmail || '',
    parentName: initialData?.parentName || '',
    emergencyContact: initialData?.emergencyContact || '',
    medicalInformation: initialData?.medicalInformation || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="dateOfBirth">Date of Birth</Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => handleChange('dateOfBirth', e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="ageGroup">Age Group</Label>
          <Select value={formData.ageGroup} onValueChange={(value) => handleChange('ageGroup', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select age group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Under 12s">Under 12s</SelectItem>
              <SelectItem value="Under 14s">Under 14s</SelectItem>
              <SelectItem value="Under 16s">Under 16s</SelectItem>
              <SelectItem value="Under 18s">Under 18s</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="playerType">Player Type</Label>
        <Select value={formData.playerType} onValueChange={(value) => handleChange('playerType', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select player type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Batsman">Batsman</SelectItem>
            <SelectItem value="Bowler">Bowler</SelectItem>
            <SelectItem value="All-rounder">All-rounder</SelectItem>
            <SelectItem value="Wicket-keeper">Wicket-keeper</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="parentEmail">Parent Email</Label>
          <Input
            id="parentEmail"
            type="email"
            value={formData.parentEmail}
            onChange={(e) => handleChange('parentEmail', e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="parentName">Parent Name</Label>
          <Input
            id="parentName"
            value={formData.parentName}
            onChange={(e) => handleChange('parentName', e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="emergencyContact">Emergency Contact</Label>
        <Input
          id="emergencyContact"
          value={formData.emergencyContact}
          onChange={(e) => handleChange('emergencyContact', e.target.value)}
          placeholder="Phone number"
        />
      </div>

      <div>
        <Label htmlFor="medicalInformation">Medical Information</Label>
        <Textarea
          id="medicalInformation"
          value={formData.medicalInformation}
          onChange={(e) => handleChange('medicalInformation', e.target.value)}
          placeholder="Any medical conditions or allergies"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Player'}
        </Button>
      </div>
    </form>
  );
}
