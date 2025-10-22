import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { useToast } from "@/shared/toast";

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
import Modal from "@/components/Modal";
import { Sheet } from "@/components/Sheet";

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
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if mobile
  const isMobile = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

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
      return await api.post("/sessions", formattedData);
    },
    onSuccess: () => {
      // Reset form and close dialog
      form.reset();
      setOpen(false);
      
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/sessions/upcoming"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions/all"] });
      
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
    <>
      <Button className="flex items-center gap-2" onClick={() => setOpen(true)}>
        <CalendarIcon className="h-4 w-4" />
        <span>Schedule New Session</span>
      </Button>
      
      {isMobile ? (
        <Sheet open={open} onClose={() => setOpen(false)} title="Schedule New Training Session" testId="session-sheet">
          <SessionForm form={form} onSubmit={onSubmit} createSessionMutation={createSessionMutation} setOpen={setOpen} />
        </Sheet>
      ) : (
        <Modal open={open} onClose={() => setOpen(false)} title="Schedule New Training Session" testId="session-modal">
          <SessionForm form={form} onSubmit={onSubmit} createSessionMutation={createSessionMutation} setOpen={setOpen} />
        </Modal>
      )}
    </>
  );
}

function SessionForm({ form, onSubmit, createSessionMutation, setOpen }: {
  form: any;
  onSubmit: (data: SessionFormValues) => void;
  createSessionMutation: any;
  setOpen: (open: boolean) => void;
}) {
  const [startPopoverOpen, setStartPopoverOpen] = useState(false);
  const [endPopoverOpen, setEndPopoverOpen] = useState(false);
  const [isCustomLocation, setIsCustomLocation] = useState(false);
  const [customLocation, setCustomLocation] = useState("");

  // Helper function to create date with time
  const createDateWithTime = (date: Date, hours: number, minutes: number) => {
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);
    return newDate;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                <Popover open={startPopoverOpen} onOpenChange={setStartPopoverOpen}>
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
                  <PopoverContent className="w-auto p-0 max-h-[80vh] overflow-y-auto" align="start">
                    <div className="flex flex-col">
                      {/* Time Selection */}
                      <div className="p-3 border-b">
                        <div className="text-sm font-medium mb-2">Select Time:</div>
                        <div className="flex items-center gap-2">
                          <select 
                            className="flex h-9 w-16 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={field.value ? field.value.getHours() : new Date().getHours()}
                            onChange={(e) => {
                              const hours = parseInt(e.target.value);
                              const currentDate = field.value || new Date();
                              const newDate = createDateWithTime(currentDate, hours, currentDate.getMinutes());
                              field.onChange(newDate);
                            }}
                          >
                            {Array.from({ length: 24 }, (_, i) => (
                              <option key={i} value={i}>
                                {i.toString().padStart(2, '0')}
                              </option>
                            ))}
                          </select>
                          <span className="text-lg font-medium">:</span>
                          <select 
                            className="flex h-9 w-16 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={field.value ? field.value.getMinutes() : new Date().getMinutes()}
                            onChange={(e) => {
                              const minutes = parseInt(e.target.value);
                              const currentDate = field.value || new Date();
                              const newDate = createDateWithTime(currentDate, currentDate.getHours(), minutes);
                              field.onChange(newDate);
                            }}
                          >
                            {Array.from({ length: 60 }, (_, i) => (
                              <option key={i} value={i}>
                                {i.toString().padStart(2, '0')}
                              </option>
                            ))}
                          </select>
                        </div>
                        {field.value && (
                          <div className="text-sm text-muted-foreground mt-1">
                            Current: {format(field.value, "h:mm a")}
                          </div>
                        )}
                      </div>
                      
                      {/* Calendar */}
                      <div className="p-3">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            if (date) {
                              const currentTime = field.value || new Date();
                              const newDate = createDateWithTime(
                                date, 
                                currentTime.getHours(), 
                                currentTime.getMinutes()
                              );
                              field.onChange(newDate);
                            }
                          }}
                          initialFocus
                          className="rounded-md border"
                        />
                      </div>
                      
                      {/* Action Buttons - Fixed at bottom */}
                      <div className="sticky bottom-0 bg-white border-t p-3 flex items-center justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setStartPopoverOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => setStartPopoverOpen(false)}
                        >
                          OK
                        </Button>
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
                <Popover open={endPopoverOpen} onOpenChange={setEndPopoverOpen}>
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
                  <PopoverContent className="w-auto p-0 max-h-[80vh] overflow-y-auto" align="start">
                    <div className="flex flex-col">
                      {/* Time Selection */}
                      <div className="p-3 border-b">
                        <div className="text-sm font-medium mb-2">Select Time:</div>
                        <div className="flex items-center gap-2">
                          <select 
                            className="flex h-9 w-16 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={field.value ? field.value.getHours() : (form.getValues('startTime')?.getHours() || new Date().getHours()) + 1}
                            onChange={(e) => {
                              const hours = parseInt(e.target.value);
                              const currentDate = field.value || new Date();
                              const newDate = createDateWithTime(currentDate, hours, currentDate.getMinutes());
                              field.onChange(newDate);
                            }}
                          >
                            {Array.from({ length: 24 }, (_, i) => (
                              <option key={i} value={i}>
                                {i.toString().padStart(2, '0')}
                              </option>
                            ))}
                          </select>
                          <span className="text-lg font-medium">:</span>
                          <select 
                            className="flex h-9 w-16 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={field.value ? field.value.getMinutes() : form.getValues('startTime')?.getMinutes() || new Date().getMinutes()}
                            onChange={(e) => {
                              const minutes = parseInt(e.target.value);
                              const currentDate = field.value || new Date();
                              const newDate = createDateWithTime(currentDate, currentDate.getHours(), minutes);
                              field.onChange(newDate);
                            }}
                          >
                            {Array.from({ length: 60 }, (_, i) => (
                              <option key={i} value={i}>
                                {i.toString().padStart(2, '0')}
                              </option>
                            ))}
                          </select>
                        </div>
                        {field.value && (
                          <div className="text-sm text-muted-foreground mt-1">
                            Current: {format(field.value, "h:mm a")}
                          </div>
                        )}
                      </div>
                      
                      {/* Calendar */}
                      <div className="p-3">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            if (date) {
                              const startTime = form.getValues('startTime');
                              const currentTime = field.value || new Date();
                              
                              let hours, minutes;
                              if (startTime) {
                                hours = startTime.getHours() + 1;
                                minutes = startTime.getMinutes();
                              } else {
                                hours = currentTime.getHours();
                                minutes = currentTime.getMinutes();
                              }
                              
                              const newDate = createDateWithTime(date, hours, minutes);
                              field.onChange(newDate);
                            }
                          }}
                          initialFocus
                          className="rounded-md border"
                        />
                      </div>
                      
                      {/* Action Buttons - Fixed at bottom */}
                      <div className="sticky bottom-0 bg-white border-t p-3 flex items-center justify-end space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setEndPopoverOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => setEndPopoverOpen(false)}
                        >
                          OK
                        </Button>
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
                {!isCustomLocation ? (
                  <>
                    <Select 
                      onValueChange={(value) => {
                        if (value === "_custom") {
                          setIsCustomLocation(true);
                        } else {
                          field.onChange(value);
                        }
                      }} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Strongsville">Strongsville</SelectItem>
                        <SelectItem value="Solon">Solon</SelectItem>
                        <SelectItem value="Cleveland">Cleveland</SelectItem>
                        <SelectItem value="Westlake">Westlake</SelectItem>
                        <SelectItem value="Parma">Parma</SelectItem>
                        <SelectItem value="_custom">+ Add custom location</SelectItem>
                      </SelectContent>
                    </Select>
                  </>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <FormControl>
                        <Input
                          placeholder="Enter custom location"
                          value={customLocation}
                          onChange={(e) => {
                            setCustomLocation(e.target.value);
                            field.onChange(e.target.value);
                          }}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-1 text-xs"
                        onClick={() => {
                          setIsCustomLocation(false);
                          setCustomLocation("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
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
        
        <div className="flex gap-2 pt-4">
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
        </div>
      </form>
    </Form>
  );
}