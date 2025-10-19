import React from 'react';
import { useAnnouncements } from '../../api/announcements-simple';
import CreateAnnouncementModal from './components/CreateAnnouncementModal';

export default function AnnouncementsPage() {
  const { data, isLoading, isError, refetch } = useAnnouncements();
  const [open, setOpen] = React.useState(false);

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Announcements</h1>
        <button onClick={()=>setOpen(true)} className="px-4 py-2 rounded-md bg-blue-600 text-white">Create Announcement</button>
      </div>

      {isLoading ? <div>Loading…</div> :
       isError ? <button onClick={()=>refetch()} className="px-4 py-2 rounded-md bg-amber-500 text-white">Retry</button> :
       !data?.length ? (
        <div className="border rounded-xl p-12 text-center text-gray-600">
          No announcements yet
          <div><button onClick={()=>setOpen(true)} className="mt-4 px-4 py-2 rounded-md bg-blue-600 text-white">Create Announcement</button></div>
        </div>
      ) : (
        <div className="space-y-2">
          {data.map((a:any)=>(
            <div key={a.id} className="border rounded-md p-4">
              <div className="font-medium">{a.title}</div>
              <div className="text-sm text-gray-700">{a.body}</div>
              <div className="text-xs text-gray-500 mt-1">{a.audience} • {a.priority} • {new Date(a.createdAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}

      <CreateAnnouncementModal open={open} onClose={()=>setOpen(false)} />
    </div>
  );
}
