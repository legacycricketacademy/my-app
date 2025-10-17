import { useState } from 'react';
import { useCreateAnnouncement } from '@/api/announcements';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type Props = { open: boolean; onOpenChange: (open: boolean) => void; };

export default function CreateAnnouncementModal({ open, onOpenChange }: Props) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState<'all'|'players'|'parents'|'coaches'>('all');
  const [priority, setPriority] = useState<'low'|'normal'|'high'>('normal');
  const [publishAt, setPublishAt] = useState('');
  const create = useCreateAnnouncement();
  const { toast } = useToast();

  const submit = async () => {
    if (!title || !body) {
      toast({ title: 'Validation Error', description: 'Title and body are required.', variant: 'destructive' });
      return;
    }
    const res:any = await create.mutateAsync({ title, body, audience, priority, publishAt: publishAt || undefined });
    if (res?.ok) { 
      toast({ title: 'Success', description: 'Announcement created' });
      onOpenChange(false);
      // Reset form
      setTitle('');
      setBody('');
      setAudience('all');
      setPriority('normal');
      setPublishAt('');
    } else {
      toast({ title: 'Error', description: res?.message ?? 'Failed to create announcement', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Announcement</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" placeholder="Enter announcement title" value={title} onChange={e=>setTitle(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="body">Message *</Label>
            <Textarea 
              id="body" 
              placeholder="Enter your message..." 
              value={body} 
              onChange={e=>setBody(e.target.value)} 
              rows={5}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="audience">Audience</Label>
              <Select value={audience} onValueChange={(v)=>setAudience(v as any)}>
                <SelectTrigger id="audience">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="players">Players</SelectItem>
                  <SelectItem value="parents">Parents</SelectItem>
                  <SelectItem value="coaches">Coaches</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(v)=>setPriority(v as any)}>
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="publishAt">Publish At</Label>
              <Input 
                id="publishAt" 
                type="datetime-local" 
                value={publishAt} 
                onChange={e=>setPublishAt(e.target.value)} 
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={create.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={create.isPending}>
            {create.isPending ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
