import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Save, X } from 'lucide-react';

export function NotificationsSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/settings/notifications'],
    queryFn: async () => {
      const response = await fetch('/api/settings/notifications', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch notification settings');
      return response.json();
    }
  });

  const [formData, setFormData] = useState({
    emailNotifications: settings?.emailNotifications ?? true,
    sessionReminders: settings?.sessionReminders ?? true,
    paymentReminders: settings?.paymentReminders ?? true,
    announcementAlerts: settings?.announcementAlerts ?? true,
    weeklyDigest: settings?.weeklyDigest ?? false
  });

  const [hasChanges, setHasChanges] = useState(false);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update notification settings');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Settings Updated',
        description: 'Your notification preferences have been saved.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/settings/notifications'] });
      setHasChanges(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleToggle = (field: string, value: boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateSettingsMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData({
      emailNotifications: settings?.emailNotifications ?? true,
      sessionReminders: settings?.sessionReminders ?? true,
      paymentReminders: settings?.paymentReminders ?? true,
      announcementAlerts: settings?.announcementAlerts ?? true,
      weeklyDigest: settings?.weeklyDigest ?? false
    });
    setHasChanges(false);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>Manage how you receive notifications and updates</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="emailNotifications">Email Notifications</Label>
            <p className="text-sm text-gray-500">Receive notifications via email</p>
          </div>
          <Switch
            id="emailNotifications"
            checked={formData.emailNotifications}
            onCheckedChange={(checked) => handleToggle('emailNotifications', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="sessionReminders">Session Reminders</Label>
            <p className="text-sm text-gray-500">Get reminded about upcoming training sessions</p>
          </div>
          <Switch
            id="sessionReminders"
            checked={formData.sessionReminders}
            onCheckedChange={(checked) => handleToggle('sessionReminders', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="paymentReminders">Payment Reminders</Label>
            <p className="text-sm text-gray-500">Notifications for upcoming payments and dues</p>
          </div>
          <Switch
            id="paymentReminders"
            checked={formData.paymentReminders}
            onCheckedChange={(checked) => handleToggle('paymentReminders', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="announcementAlerts">Announcement Alerts</Label>
            <p className="text-sm text-gray-500">Instant alerts for important announcements</p>
          </div>
          <Switch
            id="announcementAlerts"
            checked={formData.announcementAlerts}
            onCheckedChange={(checked) => handleToggle('announcementAlerts', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="weeklyDigest">Weekly Digest</Label>
            <p className="text-sm text-gray-500">Receive a weekly summary email</p>
          </div>
          <Switch
            id="weeklyDigest"
            checked={formData.weeklyDigest}
            onCheckedChange={(checked) => handleToggle('weeklyDigest', checked)}
          />
        </div>

        {hasChanges && (
          <div className="flex items-center gap-2 pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={updateSettingsMutation.isPending}
            >
              {updateSettingsMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={updateSettingsMutation.isPending}
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
