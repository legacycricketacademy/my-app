import { MainLayout } from "@/layout/main-layout";

export default function MealPlansPage() {
  return (
    <MainLayout title="Meal Plans">
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Meal Plans</h1>
        <p>Manage nutrition and meal plans for players.</p>
      </div>
    </MainLayout>
  );
}
