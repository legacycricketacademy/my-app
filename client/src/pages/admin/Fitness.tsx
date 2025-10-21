import { useEffect } from "react";

export default function AdminFitness() {
  useEffect(()=>{ /* init hooks if needed */ },[]);
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4" data-testid="heading-admin-fitness">Fitness Tracking (Admin/Coach)</h1>
      <p className="text-gray-600 mb-6">Manage fitness programs, metrics, and attendance.</p>
      <div className="grid gap-3 max-w-md">
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors" data-testid="btn-new-fitness-plan">New Fitness Plan</button>
        <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors" data-testid="btn-upload-fitness-file">Upload Metrics CSV</button>
      </div>
    </div>
  );
}

