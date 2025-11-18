import { useState, useEffect, useRef } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { isPendingLike } from "@/shared/pending";

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
  location: z.enum(["Strongsville", "Solon"], { 
    required_error: "Please select a location",
    invalid_type_error: "Location must be either Strongsville or Solon"
  }),
  ageGroup: z.string().min(1, "Age group is required"),
  sessionType: z.string().min(1, "Session type is required"),
  maxPlayers: z.coerce.number().int().min(1, "Maximum players is required").optional()
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
    ageGroup: "",
    sessionType: "",
    maxPlayers: undefined,
  };

  const form = useForm<SessionFormValues>({
    resolver: zodResolver(sessionFormSchema),
    defaultValues,
  });

  const createSessionMutation = useMutation({
    mutationFn: async (data: SessionFormValues) => {
      // Format the dates to match backend expectations
      // Backend expects: { date: "YYYY-MM-DD", startTime: "HH:MM", endTime: "HH:MM", location, ageGroup, etc. }
      const startDate = data.startTime;
      const endDate = data.endTime;
      
      const formattedData = {
        title: data.title,
        description: data.description || undefined,
        date: format(startDate, "yyyy-MM-dd"),
        startTime: format(startDate, "HH:mm"),
        endTime: format(endDate, "HH:mm"),
        location: data.location,
        ageGroup: data.ageGroup,
        sessionType: data.sessionType,
        maxPlayers: data.maxPlayers,
      };
      
      return await api.post("/api/coach/sessions", formattedData);
    },
    onSuccess: () => {
      // Reset form and close dialog
      form.reset();
      setOpen(false);
      
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/coach/sessions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions/upcoming"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions/all"] });
      
      toast({
        title: "Success",
        description: "Session created successfully",
      });
    },
    onError: (error: any) => {
      // Extract error message from response
      let errorMessage = "An error occurred. Please try again.";
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Failed to Schedule Session",
        description: errorMessage,
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
  
  // Temporary state for date/time selection (not applied until user clicks OK)
  const [tempStartDate, setTempStartDate] = useState<Date | undefined>(undefined);
  const [tempStartHours, setTempStartHours] = useState<number>(9);
  const [tempStartMinutes, setTempStartMinutes] = useState<number>(0);
  
  const [tempEndDate, setTempEndDate] = useState<Date | undefined>(undefined);
  const [tempEndHours, setTempEndHours] = useState<number>(10);
  const [tempEndMinutes, setTempEndMinutes] = useState<number>(0);

  // Helper function to create date with time
  const createDateWithTime = (date: Date, hours: number, minutes: number) => {
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);
    return newDate;
  };
  
  // Initialize temp state when popover opens
  const handleStartPopoverOpen = (open: boolean, currentValue: Date | undefined) => {
    if (open && currentValue) {
      setTempStartDate(currentValue);
      setTempStartHours(currentValue.getHours());
      setTempStartMinutes(currentValue.getMinutes());
    } else if (open && !currentValue) {
      const now = new Date();
      setTempStartDate(now);
      setTempStartHours(9);
      setTempStartMinutes(0);
    }
    setStartPopoverOpen(open);
  };
  
  const handleEndPopoverOpen = (open: boolean, currentValue: Date | undefined) => {
    if (open && currentValue) {
      setTempEndDate(currentValue);
      setTempEndHours(currentValue.getHours());
      setTempEndMinutes(currentValue.getMinutes());
    } else if (open && !currentValue) {
      const now = new Date();
      setTempEndDate(now);
      setTempEndHours(10);
      setTempEndMinutes(0);
    }
    setEndPopoverOpen(open);
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
                <Popover open={startPopoverOpen} onOpenChange={(open) => handleStartPopoverOpen(open, field.value)}>
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
                  <PopoverContent 
                    align="start"
                    side="bottom"
                    sideOffset={8}
                    className="w-[360px] p-0 z-[10000]"
                  >
                    <div className="flex max-h-[60vh] flex-col bg-white text-slate-900">
                      {/* Scrollable content */}
                      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-3 space-y-3">
                        {/* Time Selection */}
                        <div>
                          <div className="text-sm font-semibold mb-2 text-gray-700">Select Time</div>
                          <div className="flex items-center gap-2">
                            <select 
                              data-testid="start-time-hours"
                              className="flex h-10 w-20 rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                              value={tempStartHours}
                              onChange={(e) => setTempStartHours(parseInt(e.target.value))}
                            >
                              {Array.from({ length: 24 }, (_, i) => (
                                <option key={i} value={i}>
                                  {i.toString().padStart(2, '0')}
                                </option>
                              ))}
                            </select>
                            <span className="text-lg font-medium text-gray-600">:</span>
                            <select 
                              data-testid="start-time-minutes"
                              className="flex h-10 w-20 rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                              value={tempStartMinutes}
                              onChange={(e) => setTempStartMinutes(parseInt(e.target.value))}
                            >
                              {Array.from({ length: 60 }, (_, i) => (
                                <option key={i} value={i}>
                                  {i.toString().padStart(2, '0')}
                                </option>
                              ))}
                            </select>
                          </div>
                          {tempStartDate && (
                            <div className="text-xs text-gray-500 mt-2">
                              Preview: {format(createDateWithTime(tempStartDate, tempStartHours, tempStartMinutes), "PPP 'at' h:mm a")}
                            </div>
                          )}
                        </div>
                        
                        {/* Calendar */}
                        <div className="text-sm font-semibold mb-2 text-gray-700">Select Date</div>
                        <Calendar
                          mode="single"
                          selected={tempStartDate}
                          onSelect={(date) => {
                            if (date) {
                              setTempStartDate(date);
                            }
                          }}
                          initialFocus
                          className="rounded-md border bg-white text-slate-900"
                        />
                      </div>
                      
                      {/* NON-scrolling footer */}
                      <div className="border-t px-4 py-3 flex items-center justify-between gap-2 bg-white">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            field.onChange(undefined);
                            form.setValue('startTime', undefined, { shouldValidate: true, shouldDirty: true });
                            setStartPopoverOpen(false);
                          }}
                        >
                          Clear
                        </Button>
                        <div className="ml-auto flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setStartPopoverOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            className="bg-blue-600 text-white hover:bg-blue-700"
                            onClick={() => {
                              if (tempStartDate) {
                                const newDate = createDateWithTime(tempStartDate, tempStartHours, tempStartMinutes);
                                field.onChange(newDate);
                                form.setValue('startTime', newDate, { shouldValidate: true, shouldDirty: true });
                              }
                              setStartPopoverOpen(false);
                            }}
                          >
                            Apply
                          </Button>
                        </div>
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
                <Popover open={endPopoverOpen} onOpenChange={(open) => handleEndPopoverOpen(open, field.value)}>
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
                  <PopoverContent 
                    align="start"
                    side="bottom"
                    sideOffset={8}
                    className="w-[360px] p-0 z-[10000]"
                  >
                    <div className="flex max-h-[60vh] flex-col bg-white text-slate-900">
                      {/* Scrollable content */}
                      <div className="flex-1 overflow-y-auto px-4 pt-3 pb-3 space-y-3">
                        {/* Time Selection */}
                        <div>
                          <div className="text-sm font-semibold mb-2 text-gray-700">Select Time</div>
                          <div className="flex items-center gap-2">
                            <select 
                              data-testid="end-time-hours"
                              className="flex h-10 w-20 rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                              value={tempEndHours}
                              onChange={(e) => setTempEndHours(parseInt(e.target.value))}
                            >
                              {Array.from({ length: 24 }, (_, i) => (
                                <option key={i} value={i}>
                                  {i.toString().padStart(2, '0')}
                                </option>
                              ))}
                            </select>
                            <span className="text-lg font-medium text-gray-600">:</span>
                            <select 
                              data-testid="end-time-minutes"
                              className="flex h-10 w-20 rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                              value={tempEndMinutes}
                              onChange={(e) => setTempEndMinutes(parseInt(e.target.value))}
                            >
                              {Array.from({ length: 60 }, (_, i) => (
                                <option key={i} value={i}>
                                  {i.toString().padStart(2, '0')}
                                </option>
                              ))}
                            </select>
                          </div>
                          {tempEndDate && (
                            <div className="text-xs text-gray-500 mt-2">
                              Preview: {format(createDateWithTime(tempEndDate, tempEndHours, tempEndMinutes), "PPP 'at' h:mm a")}
                            </div>
                          )}
                        </div>
                        
                        {/* Calendar */}
                        <div className="text-sm font-semibold mb-2 text-gray-700">Select Date</div>
                        <Calendar
                          mode="single"
                          selected={tempEndDate}
                          onSelect={(date) => {
                            if (date) {
                              setTempEndDate(date);
                            }
                          }}
                          initialFocus
                          className="rounded-md border bg-white text-slate-900"
                        />
                      </div>
                      
                      {/* NON-scrolling footer */}
                      <div className="border-t px-4 py-3 flex items-center justify-between gap-2 bg-white">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => {
                            field.onChange(undefined);
                            form.setValue('endTime', undefined, { shouldValidate: true, shouldDirty: true });
                            setEndPopoverOpen(false);
                          }}
                        >
                          Clear
                        </Button>
                        <div className="ml-auto flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setEndPopoverOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            className="bg-blue-600 text-white hover:bg-blue-700"
                            onClick={() => {
                              if (tempEndDate) {
                                const newDate = createDateWithTime(tempEndDate, tempEndHours, tempEndMinutes);
                                field.onChange(newDate);
                                form.setValue('endTime', newDate, { shouldValidate: true, shouldDirty: true });
                              }
                              setEndPopoverOpen(false);
                            }}
                          >
                            Apply
                          </Button>
                        </div>
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
            name="maxPlayers"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum Players (optional)</FormLabel>
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
            disabled={isPendingLike(createSessionMutation)}
          >
            {isPendingLike(createSessionMutation) ? "Scheduling..." : "Schedule Session"}
          </Button>
        </div>
      </form>
    </Form>
  );
}