import { MainLayout } from "@/layout/main-layout";

export default function FitnessTrackingPage() {
  return (
    <MainLayout title="Fitness Tracking">
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Fitness Tracking</h1>
        <p>Track player fitness, performance, and progress.</p>
      </div>
    </MainLayout>
  );
}
