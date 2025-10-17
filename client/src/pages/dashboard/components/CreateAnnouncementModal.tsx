import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Megaphone, Users, User, Shield, Globe } from 'lucide-react';

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
import { useCreateAnnouncement } from '@/api/announcements';
import { toast } from '@/hooks/use-toast';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  body: z.string().min(1, 'Body is required').max(5000, 'Body too long'),
  audience: z.enum(['all', 'players', 'parents', 'coaches']).default('all'),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  publishAt: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CreateAnnouncementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateAnnouncementModal({ open, onOpenChange }: CreateAnnouncementModalProps) {
  const createAnnouncement = useCreateAnnouncement();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      body: '',
      audience: 'all',
      priority: 'normal',
      publishAt: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        ...data,
        publishAt: data.publishAt || undefined,
      };

      await createAnnouncement.mutateAsync(payload);

      toast({
        title: 'Success',
        description: 'Announcement created successfully',
      });

      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create announcement',
        variant: 'destructive',
      });
    }
  };

  const getAudienceIcon = (audience: string) => {
    switch (audience) {
      case 'all':
        return <Globe className="h-4 w-4" />;
      case 'players':
        return <Users className="h-4 w-4" />;
      case 'parents':
        return <User className="h-4 w-4" />;
      case 'coaches':
        return <Shield className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'text-green-600 bg-green-100';
      case 'normal':
        return 'text-blue-600 bg-blue-100';
      case 'high':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Create Announcement</DialogTitle>
          <DialogDescription>
            Create a new announcement for your audience.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex-1 overflow-y-auto space-y-6 px-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="md:col-span-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Enter announcement title"
                {...form.register('title')}
              />
              {form.formState.errors.title && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.title.message}</p>
              )}
            </div>

            {/* Audience */}
            <div>
              <Label htmlFor="audience">Audience</Label>
              <Select
                value={form.watch('audience')}
                onValueChange={(value) => form.setValue('audience', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      {getAudienceIcon('all')}
                      Everyone
                    </div>
                  </SelectItem>
                  <SelectItem value="players">
                    <div className="flex items-center gap-2">
                      {getAudienceIcon('players')}
                      Players
                    </div>
                  </SelectItem>
                  <SelectItem value="parents">
                    <div className="flex items-center gap-2">
                      {getAudienceIcon('parents')}
                      Parents
                    </div>
                  </SelectItem>
                  <SelectItem value="coaches">
                    <div className="flex items-center gap-2">
                      {getAudienceIcon('coaches')}
                      Coaches
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.audience && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.audience.message}</p>
              )}
            </div>

            {/* Priority */}
            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={form.watch('priority')}
                onValueChange={(value) => form.setValue('priority', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getPriorityColor('low')}`} />
                      Low
                    </div>
                  </SelectItem>
                  <SelectItem value="normal">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getPriorityColor('normal')}`} />
                      Normal
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getPriorityColor('high')}`} />
                      High
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.priority && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.priority.message}</p>
              )}
            </div>

            {/* Publish At */}
            <div className="md:col-span-2">
              <Label htmlFor="publishAt">Schedule (Optional)</Label>
              <Input
                id="publishAt"
                type="datetime-local"
                {...form.register('publishAt')}
              />
              <p className="text-sm text-gray-500 mt-1">
                Leave empty to publish immediately
              </p>
              {form.formState.errors.publishAt && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.publishAt.message}</p>
              )}
            </div>
          </div>

          {/* Body */}
          <div>
            <Label htmlFor="body">Message *</Label>
            <Textarea
              id="body"
              placeholder="Enter your announcement message..."
              rows={6}
              {...form.register('body')}
            />
            <div className="flex justify-between text-sm text-gray-500 mt-1">
              <span>{form.watch('body')?.length || 0} / 5000 characters</span>
              <span>Required</span>
            </div>
            {form.formState.errors.body && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.body.message}</p>
            )}
          </div>
        </form>

        <DialogFooter className="sticky bottom-0 bg-background border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createAnnouncement.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={form.handleSubmit(onSubmit)}
            disabled={createAnnouncement.isPending}
          >
            {createAnnouncement.isPending ? 'Creating...' : 'Create Announcement'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
