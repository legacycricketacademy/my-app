import { MainLayout } from "@/layout/main-layout";

export default function SchedulePage() {
  return (
    <MainLayout title="Schedule">
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Schedule</h1>
        <p>Manage training sessions, matches, and events.</p>
      </div>
    </MainLayout>
  );
}
