import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, Loader2 } from "lucide-react";

// Form schema validation
const sessionFormSchema = z.object({
  type: z.string().min(1, "Session type is required"),
  teamId: z.coerce.number().int().min(1, "Team ID is required"),
  teamName: z.string().min(1, "Team name is required"),
  start: z.string().min(1, "Start date is required"),
  end: z.string().min(1, "End date is required"),
  location: z.string().min(1, "Location is required"),
  opponent: z.string().optional(),
  notes: z.string().optional(),
}).refine(data => new Date(data.end) > new Date(data.start), {
  message: "End time must be after start time",
  path: ["end"]
});

type SessionFormValues = z.infer<typeof sessionFormSchema>;

export function SimpleScheduleDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Default values for the form
  const defaultValues: Partial<SessionFormValues> = {
    type: "practice",
    teamId: 1,
    teamName: "",
    start: "",
    end: "",
    location: "",
    opponent: "",
    notes: "",
  };

  const form = useForm<SessionFormValues>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues,
  });

  const createSessionMutation = useMutation({
    mutationFn: async (data: SessionFormValues) => {
      return await api.post("/admin/sessions", data);
    },
    onSuccess: () => {
      // Reset form and close dialog
      form.reset();
      setOpen(false);
      
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/schedule/parent"] });
      
      toast({
        title: "Session Created",
        description: "The training session has been successfully created.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Create Session",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: SessionFormValues) {
    createSessionMutation.mutate(data);
  }

  // Helper function to get future date
  const getFutureDate = (daysFromNow: number, hours: number = 10) => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    date.setHours(hours, 0, 0, 0);
    return date.toISOString().slice(0, 16); // Format for datetime-local input
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="create-session" className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4" />
          <span>Create Session</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule New Training Session</DialogTitle>
          <DialogDescription>
            Create a new training session for your academy.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Session Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="practice">Practice</SelectItem>
                        <SelectItem value="game">Game</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="teamId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team ID</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="teamName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Team Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Under 12s A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date & Time</FormLabel>
                    <FormControl>
                      <Input 
                        type="datetime-local" 
                        {...field}
                        defaultValue={getFutureDate(1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="end"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date & Time</FormLabel>
                    <FormControl>
                      <Input 
                        type="datetime-local" 
                        {...field}
                        defaultValue={getFutureDate(1, 12)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Field 1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="opponent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opponent (for games)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Riverside CC" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add any additional details about the session" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  form.reset();
                }}
                className="mr-2"
                disabled={createSessionMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createSessionMutation.isPending}
              >
                {createSessionMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Session"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
