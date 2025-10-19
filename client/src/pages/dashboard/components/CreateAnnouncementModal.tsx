import React from 'react';
import { useCreateAnnouncement } from '../../../api/announcements-simple';

export default function CreateAnnouncementModal({ open, onClose }: { open:boolean; onClose:()=>void }) {
  const create = useCreateAnnouncement();
  const [title, setTitle] = React.useState('');
  const [body, setBody] = React.useState('');
  const [audience, setAudience] = React.useState<'all'|'players'|'parents'|'coaches'>('all');
  const [priority, setPriority] = React.useState<'low'|'normal'|'high'>('normal');
  if (!open) return null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await create.mutateAsync({ title, body, audience, priority });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center">
      <form onSubmit={onSubmit} className="bg-white rounded-xl p-6 w-full max-w-xl space-y-4">
        <h3 className="text-xl font-semibold">Create Announcement</h3>

        <div className="space-y-2">
          <label className="text-sm">Title</label>
          <input value={title} onChange={e=>setTitle(e.target.value)} className="w-full border rounded-md px-3 py-2" required />
        </div>
        <div className="space-y-2">
          <label className="text-sm">Message</label>
          <textarea value={body} onChange={e=>setBody(e.target.value)} className="w-full border rounded-md px-3 py-2 h-28" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm">Audience</label>
            <select value={audience} onChange={e=>setAudience(e.target.value as any)} className="w-full border rounded-md px-3 py-2">
              <option value="all">All</option><option value="players">Players</option><option value="parents">Parents</option><option value="coaches">Coaches</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm">Priority</label>
            <select value={priority} onChange={e=>setPriority(e.target.value as any)} className="w-full border rounded-md px-3 py-2">
              <option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border">Cancel</button>
          <button disabled={create.isPending} className="px-4 py-2 rounded-md bg-blue-600 text-white">
            {create.isPending ? 'Creating…' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  );
}