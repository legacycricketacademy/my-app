import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, addHours } from 'date-fns';
import { CalendarIcon, ClockIcon, MapPinIcon, UsersIcon, FileTextIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { useCreateSession } from './useSessions';
import { toast } from '@/hooks/use-toast';

const ageGroups = ['Under 10s', 'Under 12s', 'Under 14s', 'Under 16s', 'Under 19s', 'Open'] as const;

const formSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(80, 'Title must be less than 80 characters'),
  ageGroup: z.enum(ageGroups),
  location: z.string().min(1, 'Location is required'),
  startDate: z.date(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  endDate: z.date(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format'),
  maxAttendees: z.number().min(1).max(200),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface NewSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewSessionModal({ open, onOpenChange }: NewSessionModalProps) {
  const [timezone, setTimezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone);
  const createSession = useCreateSession();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      ageGroup: 'Under 12s',
      location: '',
      startDate: new Date(),
      startTime: '16:00',
      endDate: new Date(),
      endTime: '18:00',
      maxAttendees: 20,
      notes: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      // Combine date and time
      const startLocal = `${format(data.startDate, 'yyyy-MM-dd')}T${data.startTime}:00`;
      const endLocal = `${format(data.endDate, 'yyyy-MM-dd')}T${data.endTime}:00`;

      await createSession.mutateAsync({
        title: data.title,
        ageGroup: data.ageGroup,
        location: data.location,
        startLocal,
        endLocal,
        timezone,
        maxAttendees: data.maxAttendees,
        notes: data.notes || undefined,
      });

      toast({
        title: 'Success',
        description: 'Session scheduled successfully',
      });

      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create session',
        variant: 'destructive',
      });
    }
  };

  const detectTimezone = () => {
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Schedule New Session</DialogTitle>
          <DialogDescription>
            Create a new training session for your team.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto space-y-6 px-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="md:col-span-2">
              <Label htmlFor="title">Session Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Batting Practice"
                {...form.register('title')}
              />
              {form.formState.errors.title && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.title.message}</p>
              )}
            </div>

            {/* Age Group */}
            <div>
              <Label htmlFor="ageGroup">Age Group *</Label>
              <Select
                value={form.watch('ageGroup')}
                onValueChange={(value) => form.setValue('ageGroup', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select age group" />
                </SelectTrigger>
                <SelectContent>
                  {ageGroups.map((group) => (
                    <SelectItem key={group} value={group}>
                      {group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.ageGroup && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.ageGroup.message}</p>
              )}
            </div>

            {/* Location */}
            <div>
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                placeholder="e.g., Main Ground"
                {...form.register('location')}
              />
              {form.formState.errors.location && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.location.message}</p>
              )}
            </div>

            {/* Start Date & Time */}
            <div>
              <Label>Start Date & Time *</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !form.watch('startDate') && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.watch('startDate') ? format(form.watch('startDate'), 'PPP') : 'Pick date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverPrimitive.Portal>
                    <PopoverContent className="w-auto p-0 z-[9999]" align="start">
                      <Calendar
                        mode="single"
                        selected={form.watch('startDate')}
                        onSelect={(date) => date && form.setValue('startDate', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </PopoverPrimitive.Portal>
                </Popover>
                <Input
                  type="time"
                  className="w-24"
                  {...form.register('startTime')}
                />
              </div>
              {form.formState.errors.startDate && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.startDate.message}</p>
              )}
            </div>

            {/* End Date & Time */}
            <div>
              <Label>End Date & Time *</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !form.watch('endDate') && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.watch('endDate') ? format(form.watch('endDate'), 'PPP') : 'Pick date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverPrimitive.Portal>
                    <PopoverContent className="w-auto p-0 z-[9999]" align="start">
                      <Calendar
                        mode="single"
                        selected={form.watch('endDate')}
                        onSelect={(date) => date && form.setValue('endDate', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </PopoverPrimitive.Portal>
                </Popover>
                <Input
                  type="time"
                  className="w-24"
                  {...form.register('endTime')}
                />
              </div>
              {form.formState.errors.endDate && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.endDate.message}</p>
              )}
            </div>

            {/* Max Attendees */}
            <div>
              <Label htmlFor="maxAttendees">Max Attendees</Label>
              <Input
                id="maxAttendees"
                type="number"
                min="1"
                max="200"
                {...form.register('maxAttendees', { valueAsNumber: true })}
              />
              {form.formState.errors.maxAttendees && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.maxAttendees.message}</p>
              )}
            </div>

            {/* Timezone */}
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <div className="flex gap-2">
                <Input
                  id="timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={detectTimezone}
                >
                  Detect
                </Button>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Additional information about the session..."
              {...form.register('notes')}
            />
            {form.formState.errors.notes && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.notes.message}</p>
            )}
          </div>
        </form>

        <DialogFooter className="sticky bottom-0 bg-background border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createSession.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={form.handleSubmit(onSubmit)}
            disabled={createSession.isPending}
          >
            {createSession.isPending ? 'Scheduling...' : 'Schedule Session'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
