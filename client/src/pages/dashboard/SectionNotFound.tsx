import { Link } from "react-router-dom";
import { MainLayout } from "@/layout/main-layout";
import { Button } from "@/components/ui/button";

export default function SectionNotFound() {
  return (
    <MainLayout title="Section Not Found">
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Section Not Found</h1>
        <p className="text-gray-600 mb-6">
          The section you're looking for doesn't exist or is under development.
        </p>
        <Link to="/dashboard">
          <Button>Return to Dashboard</Button>
        </Link>
      </div>
    </MainLayout>
  );
}
