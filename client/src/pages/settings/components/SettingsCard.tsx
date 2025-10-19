// client/src/pages/settings/components/SettingsCard.tsx
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function SettingsCard(props: React.PropsWithChildren<{ 
  title: string; 
  onSave?: ()=>void; 
  onCancel?: ()=>void; 
  saving?: boolean; 
}>) {
  const { title, children, onSave, onCancel, saving } = props;
  return (
    <Card className="p-6 space-y-6">
      <div className="text-xl font-semibold">{title}</div>
      <div>{children}</div>
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={onSave} disabled={!!saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </Card>
  );
}
