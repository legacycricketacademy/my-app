import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { nowLocalISO, localMinutesToUtcIso } from '@/lib/datetime';
import { http } from '@/lib/http';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

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

const ageGroups = ['Under 10s', 'Under 12s', 'Under 14s', 'Under 16s', 'Under 19s', 'Open'] as const;

const formSchema = z.object({
  title: z.string().min(3, 'Title is too short'),
  ageGroup: z.enum(ageGroups),
  location: z.string().min(1, 'Location is required'),
  startLocal: z.string().min(1, 'Start is required'),
  endLocal: z.string().min(1, 'End is required'),
  maxAttendees: z.coerce.number().min(1).max(200),
  notes: z.string().optional(),
}).refine(v => new Date(v.endLocal) > new Date(v.startLocal), {
  path: ['endLocal'],
  message: 'End must be after start',
}).refine(v => {
  const start = new Date(v.startLocal).getTime()
  const end = new Date(v.endLocal).getTime()
  return (end - start) <= 8*60*60*1000
}, { path: ['endLocal'], message: 'Max duration is 8 hours' });

type FormData = z.infer<typeof formSchema>;

interface NewSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewSessionModal({ open, onOpenChange }: NewSessionModalProps) {
  const queryClient = useQueryClient();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      ageGroup: 'Under 12s',
      location: '',
      startLocal: nowLocalISO(),
      endLocal: nowLocalISO(),
      maxAttendees: 20,
      notes: '',
    },
  });

  const onSubmit = async (values: FormData) => {
    const payload = {
      title: values.title.trim(),
      ageGroup: values.ageGroup,
      location: values.location.trim(),
      startUtc: localMinutesToUtcIso(values.startLocal),
      endUtc: localMinutesToUtcIso(values.endLocal),
      maxAttendees: values.maxAttendees,
      notes: values.notes?.trim() || undefined,
    };

    const res = await http<{ id: string }>('/api/sessions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return toast.error('Could not schedule session', { description: res.message ?? res.error });
    }

    toast.success('Session scheduled');
    queryClient.invalidateQueries({ queryKey: ['sessions'] });
    form.reset();
    onOpenChange(false);
  };

  // Keep end >= start
  const startLocal = form.watch('startLocal');
  const minEnd = startLocal || nowLocalISO();

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
              <Label htmlFor="startLocal">Start Date & Time *</Label>
              <Input
                id="startLocal"
                type="datetime-local"
                {...form.register('startLocal')}
              />
              {form.formState.errors.startLocal && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.startLocal.message}</p>
              )}
            </div>

            {/* End Date & Time */}
            <div>
              <Label htmlFor="endLocal">End Date & Time *</Label>
              <Input
                id="endLocal"
                type="datetime-local"
                min={minEnd}
                {...form.register('endLocal')}
              />
              {form.formState.errors.endLocal && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.endLocal.message}</p>
              )}
            </div>

            {/* Max Attendees */}
            <div className="md:col-span-2">
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

          <DialogFooter className="sticky bottom-0 bg-background border-t pt-4 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={form.formState.isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? 'Scheduling…' : 'Schedule Session'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
