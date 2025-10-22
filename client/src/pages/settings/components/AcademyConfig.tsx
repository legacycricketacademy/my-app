// client/src/pages/settings/components/AcademyConfig.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSettingsGet, useSettingsSave } from '@/api/settings';
import { AcademySchema, type AcademyValues } from '../schemas';
import { SettingsCard } from './SettingsCard';
import { toast } from '@/shared/toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { isPendingLike } from '@/shared/pending';

export default function AcademyConfig() {
  const { data, isLoading } = useSettingsGet<AcademyValues>('academy');
  const save = useSettingsSave('academy');

  const form = useForm<AcademyValues>({
    resolver: zodResolver(AcademySchema),
    values: data?.data ?? { name: '', timezone: 'Asia/Kolkata', logoUrl: '' },
  });

  if (isLoading) return <div className="animate-pulse h-40 bg-muted rounded"/>;

  const onSubmit = form.handleSubmit(async (vals) => {
    try { 
      await save.mutateAsync(vals); 
      toast.success('Academy config saved'); 
    }
    catch (e:any) { 
      toast.error(e?.message ?? 'Failed to save'); 
    }
  });

  return (
    <SettingsCard title="Academy Configuration" onSave={onSubmit} onCancel={()=>form.reset()} saving={isPendingLike(save)}>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Academy name</Label>
          <Input id="name" {...form.register('name')} />
          {form.formState.errors.name && (
            <span className="text-red-500 text-sm">{form.formState.errors.name.message}</span>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Input id="timezone" {...form.register('timezone')} placeholder="Asia/Kolkata" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="logoUrl">Logo URL (optional)</Label>
          <Input id="logoUrl" type="url" {...form.register('logoUrl')} placeholder="https://..." />
          {form.formState.errors.logoUrl && (
            <span className="text-red-500 text-sm">{form.formState.errors.logoUrl.message}</span>
          )}
        </div>
      </div>
    </SettingsCard>
  );
}
