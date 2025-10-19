import React from 'react';
import { useSessions } from '../../api/sessions';
import NewSessionModal from './components/NewSessionModal';

export default function SchedulePage() {
  const { data, isError, isLoading, refetch } = useSessions();
  const [open, setOpen] = React.useState(false);

  if (isLoading) return <div className="p-8">Loading schedule…</div>;
  if (isError) return (
    <div className="p-8 text-center">
      <p className="mb-3 text-red-600">Failed to load schedule</p>
      <button onClick={()=>refetch()} className="px-4 py-2 rounded-md bg-amber-500 text-white">Try Again</button>
    </div>
  );

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Schedule</h1>
        <button onClick={()=>setOpen(true)} className="px-4 py-2 rounded-md bg-blue-600 text-white">Add Session</button>
      </div>

      {!data?.length ? (
        <div className="border rounded-xl p-12 text-center text-gray-600">
          No sessions scheduled
          <div><button onClick={()=>setOpen(true)} className="mt-4 px-4 py-2 rounded-md bg-blue-600 text-white">Add Session</button></div>
        </div>
      ) : (
        <div className="space-y-2">
          {data.map((s:any)=>(
            <div key={s.id} className="border rounded-md p-4 flex justify-between">
              <div>
                <div className="font-medium">{s.title}</div>
                <div className="text-sm text-gray-600">
                  {new Date(s.startUtc).toLocaleString()} — {new Date(s.endUtc).toLocaleString()} • {s.ageGroup} • {s.location}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <NewSessionModal open={open} onClose={()=>setOpen(false)} />
    </div>
  );
}
