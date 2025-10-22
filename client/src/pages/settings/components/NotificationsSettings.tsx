// client/src/pages/settings/components/NotificationsSettings.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSettingsGet, useSettingsSave } from '@/api/settings';
import { NotificationsSchema, type NotificationsValues } from '../schemas';
import { SettingsCard } from './SettingsCard';
import { toast } from '@/shared/toast';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export default function NotificationsSettings() {
  const { data, isLoading } = useSettingsGet<NotificationsValues>('notifications');
  const save = useSettingsSave('notifications');

  const form = useForm<NotificationsValues>({
    resolver: zodResolver(NotificationsSchema),
    values: data?.data ?? { email: true, sms: false, push: false },
  });

  if (isLoading) return <div className="animate-pulse h-40 bg-muted rounded"/>;

  const onSubmit = form.handleSubmit(async (vals) => {
    try { 
      await save.mutateAsync(vals); 
      toast.success('Notifications settings saved'); 
    }
    catch (e:any) { 
      toast.error(e?.message ?? 'Failed to save'); 
    }
  });

  return (
    <SettingsCard title="Notifications" onSave={onSubmit} onCancel={()=>form.reset()} saving={save.isPending}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="email">Email notifications</Label>
          <Switch
            id="email"
            checked={form.watch('email')}
            onCheckedChange={(checked) => form.setValue('email', checked)}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="sms">SMS notifications</Label>
          <Switch
            id="sms"
            checked={form.watch('sms')}
            onCheckedChange={(checked) => form.setValue('sms', checked)}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="push">Push notifications</Label>
          <Switch
            id="push"
            checked={form.watch('push')}
            onCheckedChange={(checked) => form.setValue('push', checked)}
          />
        </div>
      </div>
    </SettingsCard>
  );
}