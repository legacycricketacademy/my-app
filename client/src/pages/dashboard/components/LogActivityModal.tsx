import React from 'react';
import { useLogFitness } from '../../../api/fitness';
import { isPendingLike } from '@/shared/pending';

export default function LogActivityModal({ open, onClose }: { open:boolean; onClose:()=>void }) {
  const log = useLogFitness();
  const [date, setDate] = React.useState(() => new Date().toISOString().slice(0,16));
  const [pushups, setPushups] = React.useState(0);
  const [situps, setSitups] = React.useState(0);
  const [squats, setSquats] = React.useState(0);
  const [lunges, setLunges] = React.useState(0);
  const [notes, setNotes] = React.useState('');
  if (!open) return null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await log.mutateAsync({
      date: new Date(date).toISOString(),
      metrics: { pushups:+pushups, situps:+situps, squats:+squats, lunges:+lunges },
      notes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center">
      <form onSubmit={onSubmit} className="bg-white rounded-xl p-6 w-full max-w-xl space-y-4">
        <h3 className="text-xl font-semibold">Log Fitness Activity</h3>
        <div className="space-y-2">
          <label className="text-sm">Date & Time</label>
          <input type="datetime-local" value={date} onChange={e=>setDate(e.target.value)} className="w-full border rounded-md px-3 py-2" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Numeric label="Pushups" val={pushups} set={setPushups} />
          <Numeric label="Situps" val={situps} set={setSitups} />
          <Numeric label="Squats" val={squats} set={setSquats} />
          <Numeric label="Lunges" val={lunges} set={setLunges} />
        </div>
        <div className="space-y-2">
          <label className="text-sm">Notes</label>
          <textarea value={notes} onChange={e=>setNotes(e.target.value)} className="w-full border rounded-md px-3 py-2 h-24" />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border">Cancel</button>
          <button disabled={isPendingLike(log)} className="px-4 py-2 rounded-md bg-blue-600 text-white">
            {isPendingLike(log) ? 'Saving…' : 'Save Log'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Numeric({ label, val, set }:{ label:string; val:number; set:(n:number)=>void }) {
  return (
    <div className="space-y-2">
      <label className="text-sm">{label}</label>
      <input type="number" min={0} value={val} onChange={e=>set(+e.target.value)} className="w-full border rounded-md px-3 py-2" />
    </div>
  );
}
