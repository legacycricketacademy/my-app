// client/src/pages/settings/components/AccessRolesSettings.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSettingsGet, useSettingsSave } from '@/api/settings';
import { AccessSchema, type AccessValues } from '../schemas';
import { SettingsCard } from './SettingsCard';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export default function AccessRolesSettings() {
  const { data, isLoading } = useSettingsGet<AccessValues>('access');
  const save = useSettingsSave('access');

  const form = useForm<AccessValues>({
    resolver: zodResolver(AccessSchema),
    values: data?.data ?? { inviteOnly: false },
  });

  if (isLoading) return <div className="animate-pulse h-40 bg-muted rounded"/>;

  const onSubmit = form.handleSubmit(async (vals) => {
    try { 
      await save.mutateAsync(vals); 
      toast.success('Access settings saved'); 
    }
    catch (e:any) { 
      toast.error(e?.message ?? 'Failed to save'); 
    }
  });

  return (
    <SettingsCard title="Access & Roles" onSave={onSubmit} onCancel={()=>form.reset()} saving={save.isPending}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="inviteOnly">Invite-only mode</Label>
            <p className="text-sm text-gray-500">Require admin approval for new registrations</p>
          </div>
          <Switch
            id="inviteOnly"
            checked={form.watch('inviteOnly')}
            onCheckedChange={(checked) => form.setValue('inviteOnly', checked)}
          />
        </div>
      </div>
    </SettingsCard>
  );
}
