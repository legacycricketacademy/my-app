// client/src/pages/settings/components/PaymentSettings.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSettingsGet, useSettingsSave } from '@/api/settings';
import { PaymentsSchema, type PaymentsValues } from '../schemas';
import { SettingsCard } from './SettingsCard';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function PaymentSettings() {
  const { data, isLoading } = useSettingsGet<PaymentsValues>('payments');
  const save = useSettingsSave('payments');

  const form = useForm<PaymentsValues>({
    resolver: zodResolver(PaymentsSchema),
    values: data?.data ?? { stripeEnabled: false, currency: 'INR', receiptEmail: '' },
  });

  if (isLoading) return <div className="animate-pulse h-40 bg-muted rounded"/>;

  const onSubmit = form.handleSubmit(async (vals) => {
    try { 
      await save.mutateAsync(vals); 
      toast.success('Payment settings saved'); 
    }
    catch (e:any) { 
      toast.error(e?.message ?? 'Failed to save'); 
    }
  });

  return (
    <SettingsCard title="Payment Settings" onSave={onSubmit} onCancel={()=>form.reset()} saving={save.isPending}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="stripeEnabled">Enable Stripe payments</Label>
          <Switch
            id="stripeEnabled"
            checked={form.watch('stripeEnabled')}
            onCheckedChange={(checked) => form.setValue('stripeEnabled', checked)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="currency">Currency</Label>
          <Select
            value={form.watch('currency')}
            onValueChange={(value) => form.setValue('currency', value as 'INR' | 'USD')}
          >
            <SelectTrigger id="currency">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INR">INR (₹)</SelectItem>
              <SelectItem value="USD">USD ($)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="receiptEmail">Receipt email (optional)</Label>
          <Input id="receiptEmail" type="email" {...form.register('receiptEmail')} />
          {form.formState.errors.receiptEmail && (
            <span className="text-red-500 text-sm">{form.formState.errors.receiptEmail.message}</span>
          )}
        </div>
      </div>
    </SettingsCard>
  );
}
