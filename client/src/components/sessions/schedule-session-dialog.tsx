import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Form schema validation
const sessionFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  startTime: z.date({ required_error: "Please select a start date & time" }),
  endTime: z.date({ required_error: "Please select an end date & time" }),
  location: z.string().min(1, "Location is required"),
  ageGroup: z.string().min(1, "Age group is required"),
  sessionType: z.string().min(1, "Session type is required"),
  maxAttendees: z.coerce.number().int().min(1, "Maximum attendees is required")
}).refine(data => data.endTime > data.startTime, {
  message: "End time must be after start time",
  path: ["endTime"]
});

type SessionFormValues = z.infer<typeof sessionFormSchema>;

export function ScheduleSessionDialog() {
  const [open, setOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState<Date | null>(null);
  const [tempEndDate, setTempEndDate] = useState<Date | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Default values for the form
  const defaultValues: Partial<SessionFormValues> = {
    title: "",
    description: "",
    location: "",
    ageGroup: "",
    sessionType: "",
    maxAttendees: 20,
  };

  const form = useForm<SessionFormValues>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues,
  });

  const createSessionMutation = useMutation({
    mutationFn: async (data: SessionFormValues) => {
      // Format the dates to ISO strings for the API
      const formattedData = {
        ...data,
        startTime: data.startTime.toISOString(),
        endTime: data.endTime.toISOString(),
      };
      const response = await apiRequest("POST", "/api/sessions", formattedData);
      return response.json();
    },
    onSuccess: () => {
      // Reset form and close dialog
      form.reset();
      setOpen(false);
      
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/sessions/upcoming"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions/today"] });
      
      toast({
        title: "Session Scheduled",
        description: "The training session has been successfully scheduled.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to Schedule Session",
        description: error.message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: SessionFormValues) {
    createSessionMutation.mutate(data);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4" />
          <span>Schedule New Session</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[550px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule New Training Session</DialogTitle>
          <DialogDescription>
            Create a new training session for your academy.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Session Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Batting Practice" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date & Time</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP HH:mm")
                            ) : (
                              <span>Select date & time</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[85vw] sm:w-auto p-0 relative z-50" align="center" side="bottom" sideOffset={5}>
                        <div className="flex flex-col">
                          <div className="sticky top-0 z-10 bg-background p-2 border-b flex items-center justify-between">
                            <Input
                              type="time"
                              size={10}
                              className="w-24"
                              value={field.value ? format(field.value, "HH:mm") : ""}
                              onChange={(e) => {
                                const timeString = e.target.value;
                                if (timeString) {
                                  const [hours, minutes] = timeString.split(':').map(Number);
                                  const newDate = field.value ? new Date(field.value) : new Date();
                                  newDate.setHours(hours);
                                  newDate.setMinutes(minutes);
                                  setTempStartDate(newDate);
                                }
                              }}
                            />
                            <div className="flex items-center space-x-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // Close the popover without confirmation
                                  const buttonElement = document.activeElement as HTMLElement;
                                  buttonElement?.blur();
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => {
                                  // Make sure we commit any temporary selection
                                  if (tempStartDate) {
                                    field.onChange(tempStartDate);
                                  }
                                  // Close the popover
                                  const buttonElement = document.activeElement as HTMLElement;
                                  buttonElement?.blur();
                                }}
                              >
                                OK
                              </Button>
                            </div>
                          </div>
                          <div className="overflow-auto p-1" style={{ maxHeight: '60vh' }}>
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={(date) => {
                                if (date) {
                                  // Preserve the time if a date was already selected
                                  const newDate = new Date(date);
                                  if (field.value) {
                                    newDate.setHours(field.value.getHours());
                                    newDate.setMinutes(field.value.getMinutes());
                                  } else {
                                    // Default to current time
                                    const now = new Date();
                                    newDate.setHours(now.getHours());
                                    newDate.setMinutes(now.getMinutes());
                                  }
                                  // Only save to temp state, wait for OK button to commit
                                  setTempStartDate(newDate);
                                  
                                  // Auto-close on mobile after selection
                                  if (window.innerWidth < 640) {
                                    field.onChange(newDate); // On mobile, commit directly
                                    const buttonElement = document.activeElement as HTMLElement;
                                    buttonElement?.blur();
                                  }
                                }
                              }}
                              initialFocus
                              className="rounded-md border"
                            />
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date & Time</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP HH:mm")
                            ) : (
                              <span>Select date & time</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[85vw] sm:w-auto p-0 relative z-50" align="center" side="bottom" sideOffset={5}>
                        <div className="flex flex-col">
                          <div className="sticky top-0 z-10 bg-background p-2 border-b flex items-center justify-between">
                            <Input
                              type="time"
                              size={10}
                              className="w-24"
                              value={field.value ? format(field.value, "HH:mm") : ""}
                              onChange={(e) => {
                                const timeString = e.target.value;
                                if (timeString) {
                                  const [hours, minutes] = timeString.split(':').map(Number);
                                  const newDate = field.value ? new Date(field.value) : new Date();
                                  newDate.setHours(hours);
                                  newDate.setMinutes(minutes);
                                  setTempEndDate(newDate);
                                }
                              }}
                            />
                            <div className="flex items-center space-x-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // Close the popover without confirmation
                                  const buttonElement = document.activeElement as HTMLElement;
                                  buttonElement?.blur();
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => {
                                  // Make sure we commit any temporary selection
                                  if (tempEndDate) {
                                    field.onChange(tempEndDate);
                                  }
                                  // Close the popover
                                  const buttonElement = document.activeElement as HTMLElement;
                                  buttonElement?.blur();
                                }}
                              >
                                OK
                              </Button>
                            </div>
                          </div>
                          <div className="overflow-auto p-1" style={{ maxHeight: '60vh' }}>
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={(date) => {
                                if (date) {
                                  // Preserve the time if a date was already selected
                                  const newDate = new Date(date);
                                  if (field.value) {
                                    newDate.setHours(field.value.getHours());
                                    newDate.setMinutes(field.value.getMinutes());
                                  } else if (form.getValues('startTime')) {
                                    // Default to start time + 1 hour if no previous time
                                    const startTime = form.getValues('startTime');
                                    newDate.setHours(startTime.getHours() + 1);
                                    newDate.setMinutes(startTime.getMinutes());
                                  }
                                  // Only save to temp state, wait for OK button to commit
                                  setTempEndDate(newDate);
                                  
                                  // Auto-close on mobile after selection
                                  if (window.innerWidth < 640) {
                                    field.onChange(newDate); // On mobile, commit directly
                                    const buttonElement = document.activeElement as HTMLElement;
                                    buttonElement?.blur();
                                  }
                                }
                              }}
                              initialFocus
                              className="rounded-md border"
                            />
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sessionType"
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
                        <SelectItem value="Training">Training</SelectItem>
                        <SelectItem value="Fitness">Fitness</SelectItem>
                        <SelectItem value="Practice Match">Practice Match</SelectItem>
                        <SelectItem value="Meeting">Meeting</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="maxAttendees"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Attendees</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
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
                onClick={() => setOpen(false)}
                className="mr-2"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createSessionMutation.isPending}
              >
                {createSessionMutation.isPending ? "Scheduling..." : "Schedule Session"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}