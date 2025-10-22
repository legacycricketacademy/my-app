// client/src/pages/settings/components/DataManagement.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSettingsGet, useSettingsSave } from '@/api/settings';
import { DataSchema, type DataValues } from '../schemas';
import { SettingsCard } from './SettingsCard';
import { toast } from '@/shared/toast';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Download, AlertTriangle } from 'lucide-react';

export default function DataManagement() {
  const { data, isLoading } = useSettingsGet<DataValues>('data');
  const save = useSettingsSave('data');

  const form = useForm<DataValues>({
    resolver: zodResolver(DataSchema),
    values: data?.data ?? { exportRequestedAt: null, anonymize: false },
  });

  if (isLoading) return <div className="animate-pulse h-40 bg-muted rounded"/>;

  const onSubmit = form.handleSubmit(async (vals) => {
    try { 
      await save.mutateAsync(vals); 
      toast.success('Data settings saved'); 
    }
    catch (e:any) { 
      toast.error(e?.message ?? 'Failed to save'); 
    }
  });

  const handleExport = () => {
    form.setValue('exportRequestedAt', new Date().toISOString());
    toast.info('Export requested. You will receive an email when ready.');
  };

  return (
    <SettingsCard title="Data Management" onSave={onSubmit} onCancel={()=>form.reset()} saving={save.isPending}>
      <div className="space-y-6">
        <div>
          <Label className="text-base font-semibold">Export data</Label>
          <p className="text-sm text-gray-500 mb-3">
            Request a complete export of all academy data in JSON format.
          </p>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Request Export
          </Button>
          {form.watch('exportRequestedAt') && (
            <p className="text-sm text-gray-600 mt-2">
              Last requested: {new Date(form.watch('exportRequestedAt')!).toLocaleString()}
            </p>
          )}
        </div>
        
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="anonymize" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Anonymize data on export
              </Label>
              <p className="text-sm text-gray-500">
                Remove personally identifiable information from exports
              </p>
            </div>
            <Switch
              id="anonymize"
              checked={form.watch('anonymize')}
              onCheckedChange={(checked) => form.setValue('anonymize', checked)}
            />
          </div>
        </div>
      </div>
    </SettingsCard>
  );
}
