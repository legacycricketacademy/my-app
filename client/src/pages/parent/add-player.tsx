import { useState } from "react";
import { ParentLayout } from "@/layout/parent-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

// Player form schema
const playerSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  dateOfBirth: z.string().refine(val => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, "Please enter a valid date"),
  ageGroup: z.string().min(1, "Please select an age group"),
  playerType: z.string().optional(),
  healthNotes: z.string().optional(),
  parentNotes: z.string().optional(),
});

type PlayerFormValues = z.infer<typeof playerSchema>;

export default function AddPlayerPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Form initialization
  const form = useForm<PlayerFormValues>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      ageGroup: "",
      playerType: "",
      healthNotes: "",
      parentNotes: "",
    }
  });
  
  // Calculate age group based on date of birth
  const calculateAgeGroup = (dateOfBirth: string) => {
    try {
      const dob = new Date(dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      
      // Adjust age if birthday hasn't occurred yet this year
      if (
        today.getMonth() < dob.getMonth() || 
        (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())
      ) {
        const adjustedAge = age - 1;
        
        if (adjustedAge < 10) {
          return "Under 10s";
        } else if (adjustedAge < 12) {
          return "Under 12s";
        } else if (adjustedAge < 14) {
          return "Under 14s";
        } else if (adjustedAge < 16) {
          return "Under 16s";
        } else {
          return "Under 19s";
        }
      }
    } catch (error) {
      return "";
    }
  };
  
  // Handle date of birth change to auto-select age group
  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dob = e.target.value;
    form.setValue("dateOfBirth", dob);
    
    const ageGroup = calculateAgeGroup(dob);
    if (ageGroup) {
      form.setValue("ageGroup", ageGroup);
    }
  };
  
  // Add player mutation
  const addPlayerMutation = useMutation({
    mutationFn: async (data: PlayerFormValues) => {
      const res = await apiRequest("POST", "/api/players", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Player Added",
        description: "Player details have been saved successfully.",
      });
      
      // Invalidate player queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/players/parent"] });
      
      // Navigate to parent dashboard
      setLocation("/parent");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Add Player",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Form submission handler
  function onSubmit(data: PlayerFormValues) {
    addPlayerMutation.mutate(data);
  }
  
  return (
    <ParentLayout title="Add Your Player">
      <div className="max-w-2xl mx-auto p-4">
        <Card className="shadow-sm">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
            <CardTitle className="text-2xl bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">Add Player Details</CardTitle>
            <CardDescription>
              Please provide your child's information to create their player profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            onChange={handleDobChange}
                          />
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
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Will be auto-selected based on date of birth
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="playerType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Player Type (Optional)</FormLabel>
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
                            <SelectItem value="Wicketkeeper">Wicketkeeper</SelectItem>
                            <SelectItem value="Wicketkeeper-Batsman">Wicketkeeper-Batsman</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
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
                        <Input {...field} placeholder="Any allergies, health conditions, or special needs we should know about" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="parentNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Any additional information you'd like to share" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation("/parent")}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={addPlayerMutation.isPending}
                    className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary"
                  >
                    {addPlayerMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Add Player"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </ParentLayout>
  );
}