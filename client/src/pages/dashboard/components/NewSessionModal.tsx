import React from 'react';
import { useCreateSession } from '../../../api/sessions';

type Props = { open: boolean; onClose: () => void; };

export default function NewSessionModal({ open, onClose }: Props) {
  const create = useCreateSession();
  const [title, setTitle] = React.useState('');
  const [ageGroup, setAgeGroup] = React.useState('Under 12s');
  const [location, setLocation] = React.useState('Main Ground');
  const [start, setStart] = React.useState('');
  const [end, setEnd] = React.useState('');
  const [max, setMax] = React.useState(20);
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  if (!open) return null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await create.mutateAsync({
      title, ageGroup, location,
      startLocal: start, endLocal: end,
      timezone: tz, maxAttendees: max,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center">
      <form onSubmit={onSubmit} className="bg-white rounded-xl p-6 w-full max-w-xl space-y-4">
        <h3 className="text-xl font-semibold">Schedule New Training Session</h3>

        <div className="space-y-2">
          <label className="text-sm">Session Title</label>
          <input value={title} onChange={e=>setTitle(e.target.value)} className="w-full border rounded-md px-3 py-2" placeholder="e.g. Batting Practice" required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm">Start (local)</label>
            <input type="datetime-local" value={start} onChange={e=>setStart(e.target.value)} className="w-full border rounded-md px-3 py-2" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm">End (local)</label>
            <input type="datetime-local" value={end} onChange={e=>setEnd(e.target.value)} className="w-full border rounded-md px-3 py-2" required />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm">Age Group</label>
            <select value={ageGroup} onChange={e=>setAgeGroup(e.target.value)} className="w-full border rounded-md px-3 py-2">
              <option>Under 10s</option><option>Under 12s</option><option>Under 14s</option><option>Under 16s</option><option>Under 19s</option><option>Open</option>
            </select>
          </div>
          <div className="space-y-2 col-span-2">
            <label className="text-sm">Location</label>
            <input value={location} onChange={e=>setLocation(e.target.value)} className="w-full border rounded-md px-3 py-2" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm">Max Attendees</label>
            <input type="number" min={1} max={200} value={max} onChange={e=>setMax(+e.target.value)} className="w-full border rounded-md px-3 py-2" />
          </div>
          <div className="space-y-2">
            <label className="text-sm">Timezone</label>
            <input disabled value={tz} className="w-full border rounded-md px-3 py-2 bg-gray-50" />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border">Cancel</button>
          <button disabled={create.isPending} className="px-4 py-2 rounded-md bg-blue-600 text-white">
            {create.isPending ? 'Scheduling…' : 'Schedule Session'}
          </button>
        </div>
      </form>
    </div>
  );
}
