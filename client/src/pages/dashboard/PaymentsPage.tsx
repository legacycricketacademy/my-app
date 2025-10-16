import { MainLayout } from "@/layout/main-layout";

export default function PaymentsPage() {
  return (
    <MainLayout title="Payments">
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Payments</h1>
        <p>Manage payments, fees, and billing.</p>
      </div>
    </MainLayout>
  );
}
