import { MainLayout } from "@/layout/main-layout";

export default function AnnouncementsPage() {
  return (
    <MainLayout title="Announcements">
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Announcements</h1>
        <p>Manage team announcements and communications.</p>
      </div>
    </MainLayout>
  );
}
