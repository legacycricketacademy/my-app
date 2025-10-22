// client/src/pages/settings/components/ProfileSettings.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSettingsGet, useSettingsSave } from '@/api/settings';
import { ProfileSchema, type ProfileValues } from '../schemas';
import { SettingsCard } from './SettingsCard';
import { toast } from '@/shared/toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ProfileSettings() {
  const { data, isLoading } = useSettingsGet<ProfileValues>('profile');
  const save = useSettingsSave('profile');

  const form = useForm<ProfileValues>({
    resolver: zodResolver(ProfileSchema),
    values: data?.data ?? { fullName: '', email: '', phone: '' },
  });

  if (isLoading) return <div className="animate-pulse h-40 bg-muted rounded"/>;

  const onSubmit = form.handleSubmit(async (vals) => {
    try { 
      await save.mutateAsync(vals); 
      toast.success('Profile saved'); 
    }
    catch (e:any) { 
      toast.error(e?.message ?? 'Failed to save'); 
    }
  });

  return (
    <SettingsCard title="Profile" onSave={onSubmit} onCancel={()=>form.reset()} saving={save.isPending}>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" {...form.register('fullName')} />
          {form.formState.errors.fullName && (
            <span className="text-red-500 text-sm">{form.formState.errors.fullName.message}</span>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" {...form.register('email')} />
          {form.formState.errors.email && (
            <span className="text-red-500 text-sm">{form.formState.errors.email.message}</span>
          )}
        </div>
        <div className="md:col-span-2 grid gap-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" {...form.register('phone')} />
        </div>
      </div>
    </SettingsCard>
  );
}