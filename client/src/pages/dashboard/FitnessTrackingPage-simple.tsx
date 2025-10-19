import React from 'react';
import { useFitnessSummary } from '../../api/fitness';
import LogActivityModal from './components/LogActivityModal';

export default function FitnessTrackingPage() {
  const { data, isLoading, isError, refetch } = useFitnessSummary();
  const [open, setOpen] = React.useState(false);

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Fitness Tracking</h1>
        <button onClick={()=>setOpen(true)} className="px-4 py-2 rounded-md bg-blue-600 text-white">Log Activity</button>
      </div>

      {isLoading ? <div>Loading…</div> :
       isError ? <button onClick={()=>refetch()} className="px-4 py-2 rounded-md bg-amber-500 text-white">Retry</button> :
       !data?.length ? (
        <div className="border rounded-xl p-12 text-center text-gray-600">
          No fitness data recorded
          <div><button onClick={()=>setOpen(true)} className="mt-4 px-4 py-2 rounded-md bg-blue-600 text-white">Log Activity</button></div>
        </div>
      ) : (
        <div className="space-y-2">
          {data.map((l:any)=>(
            <div key={l.id} className="border rounded-md p-4 flex justify-between">
              <div>
                <div className="font-medium">{new Date(l.date).toLocaleString()}</div>
                <div className="text-sm text-gray-600">Pushups {l.metrics?.pushups ?? 0} • Situps {l.metrics?.situps ?? 0} • Squats {l.metrics?.squats ?? 0} • Lunges {l.metrics?.lunges ?? 0}</div>
              </div>
              {l.notes ? <div className="text-sm text-gray-700 max-w-sm">{l.notes}</div> : null}
            </div>
          ))}
        </div>
      )}

      <LogActivityModal open={open} onClose={()=>setOpen(false)} />
    </div>
  );
}
