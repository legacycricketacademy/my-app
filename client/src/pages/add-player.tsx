import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

export default function AddPlayerPage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    ageGroup: '',
    playerType: '',
    parentEmail: '',
    parentName: '',
    emergencyContact: '',
    medicalInformation: '',
  });

  const addPlayerMutation = useMutation({
    mutationFn: (data: typeof formData) => api.post('/players', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/players'] });
      toast({
        title: "Player Added",
        description: "The player has been added successfully.",
      });
      setLocation('/');
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add player. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addPlayerMutation.mutate(formData);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
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
        <h1 className="text-3xl font-bold">Add New Player</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Player Information</CardTitle>
        </CardHeader>
        <CardContent>
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

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation('/')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={addPlayerMutation.isPending}
              >
                {addPlayerMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding Player...
                  </>
                ) : (
                  'Add Player'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
