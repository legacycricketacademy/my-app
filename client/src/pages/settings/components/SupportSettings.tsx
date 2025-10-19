// client/src/pages/settings/components/SupportSettings.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSettingsGet, useSettingsSave } from '@/api/settings';
import { SupportSchema, type SupportValues } from '../schemas';
import { SettingsCard } from './SettingsCard';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function SupportSettings() {
  const { data, isLoading } = useSettingsGet<SupportValues>('support');
  const save = useSettingsSave('support');

  const form = useForm<SupportValues>({
    resolver: zodResolver(SupportSchema),
    values: data?.data ?? { contactEmail: '', whatsapp: '', faqUrl: '' },
  });

  if (isLoading) return <div className="animate-pulse h-40 bg-muted rounded"/>;

  const onSubmit = form.handleSubmit(async (vals) => {
    try { 
      await save.mutateAsync(vals); 
      toast.success('Support settings saved'); 
    }
    catch (e:any) { 
      toast.error(e?.message ?? 'Failed to save'); 
    }
  });

  return (
    <SettingsCard title="Support" onSave={onSubmit} onCancel={()=>form.reset()} saving={save.isPending}>
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="contactEmail">Contact email</Label>
          <Input id="contactEmail" type="email" {...form.register('contactEmail')} />
          {form.formState.errors.contactEmail && (
            <span className="text-red-500 text-sm">{form.formState.errors.contactEmail.message}</span>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="whatsapp">WhatsApp number (optional)</Label>
          <Input id="whatsapp" {...form.register('whatsapp')} placeholder="+91 98765 43210" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="faqUrl">FAQ URL (optional)</Label>
          <Input id="faqUrl" type="url" {...form.register('faqUrl')} placeholder="https://..." />
          {form.formState.errors.faqUrl && (
            <span className="text-red-500 text-sm">{form.formState.errors.faqUrl.message}</span>
          )}
        </div>
      </div>
    </SettingsCard>
  );
}
