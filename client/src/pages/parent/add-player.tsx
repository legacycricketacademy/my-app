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
import { useToast } from '@/shared/toast';
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { CustomDatePicker } from "@/components/ui/custom-date-picker";

// Player form schema
const playerSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  dateOfBirth: z.string().refine(val => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, "Please enter a valid date"),
  ageGroup: z.string().min(1, "Please select an age group"),
  location: z.string().min(1, "Please select a location"),
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
      location: "",
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
      let age = today.getFullYear() - dob.getFullYear();
      
      // Adjust age if birthday hasn't occurred yet this year
      if (
        today.getMonth() < dob.getMonth() || 
        (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())
      ) {
        age--;
      }
      
      // Use the proper age group values matching the schema
      if (age < 8) {
        return "5-8 years";
      } else {
        return "8+ years";
      }
    } catch (error) {
      console.error("Error calculating age group:", error);
      return "";
    }
  };
  
  // No longer needed - handled in CustomDatePicker onChange
  
  // Add player mutation
  const addPlayerMutation = useMutation({
    mutationFn: async (data: PlayerFormValues) => {
      try {
        // Make sure dateOfBirth is properly formatted as a string (YYYY-MM-DD)
        if (data.dateOfBirth) {
          // The dateOfBirth should already be a string at this point
          // Just make sure it's in the right format if needed
          if (data.dateOfBirth.includes('T')) {
            data.dateOfBirth = data.dateOfBirth.split('T')[0];
          }
        }
        
        // IMPORTANT: Clean submission data to match database schema requirements
        const cleanedData = {
          ...data,
          // Ensure ageGroup is one of the valid schema values
          ageGroup: (data.ageGroup === "5-8 years" || data.ageGroup === "8+ years") 
            ? data.ageGroup 
            : calculateAgeGroup(data.dateOfBirth)
        };
        
        // Remove any potentially invalid fields from form data
        const validFields = [
          "firstName", "lastName", "dateOfBirth", "ageGroup", 
          "location", "playerType", "healthNotes", "parentNotes"
        ];
        
        const validData = Object.fromEntries(
          Object.entries(cleanedData).filter(([key]) => validFields.includes(key))
        );
        
        // Log the cleaned data being sent
        console.log("Sending cleaned player data:", validData);
        
        // Make the API request with cleaned data
        const res = await apiRequest("POST", "/api/players", validData);
        
        // Check if the response is ok
        if (!res.ok) {
          // Try to get detailed error message
          const errorData = await res.json().catch(() => null);
          console.error("Server returned error:", errorData);
          if (errorData && errorData.errors) {
            // Format validation errors
            const errorMessages = errorData.errors.map((err: any) => 
              `Field ${err.path}: ${err.message || 'Invalid value'}`
            ).join("; ");
            throw new Error(errorMessages);
          }
          if (errorData && errorData.error) {
            throw new Error(errorData.error);
          }
          throw new Error(`Server returned ${res.status}: ${res.statusText}`);
        }
        
        return await res.json();
      } catch (err) {
        console.error("Error creating player:", err);
        throw err;
      }
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
      console.error("Player creation error:", error);
      toast({
        title: "Failed to Add Player",
        description: error.message || "There was an error creating the player. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Form submission handler
  function onSubmit(data: PlayerFormValues) {
    // Create a new copy of the data for submission
    const submissionData = { ...data };
    
    // Log the original data before any modifications
    console.log("Original player data:", submissionData);
    
    // Fix the dateOfBirth format - ensure it's just YYYY-MM-DD with no time component
    if (submissionData.dateOfBirth && submissionData.dateOfBirth.includes('T')) {
      submissionData.dateOfBirth = submissionData.dateOfBirth.split('T')[0];
      console.log("Fixed dateOfBirth format:", submissionData.dateOfBirth);
    }
    
    // Always calculate the correct age group (enforcing valid values)
    // This is critical - we see "Under 12s" is being used despite our checks
    const calculatedAgeGroup = calculateAgeGroup(submissionData.dateOfBirth);
    submissionData.ageGroup = calculatedAgeGroup;
    
    // Make sure we're using the valid values for our schema
    if (submissionData.ageGroup !== "5-8 years" && submissionData.ageGroup !== "8+ years") {
      // Force to a valid value as a fallback (should never happen with our calculation)
      submissionData.ageGroup = submissionData.ageGroup === "Under 12s" ? "8+ years" : "5-8 years";
    }
    
    console.log("Submitting with corrected ageGroup:", submissionData.ageGroup);
    addPlayerMutation.mutate(submissionData);
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
                          <CustomDatePicker
                            value={field.value ? new Date(field.value) : undefined}
                            onChange={(date) => {
                              if (date) {
                                const formattedDate = date.toISOString().split('T')[0];
                                field.onChange(formattedDate);
                                
                                // Also update age group
                                const ageGroup = calculateAgeGroup(formattedDate);
                                if (ageGroup) {
                                  form.setValue("ageGroup", ageGroup);
                                }
                              }
                            }}
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
                            <SelectItem value="5-8 years">5-8 years</SelectItem>
                            <SelectItem value="8+ years">8+ years</SelectItem>
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
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Strongsville">Strongsville</SelectItem>
                            <SelectItem value="Solon">Solon</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Where your child will primarily attend sessions
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