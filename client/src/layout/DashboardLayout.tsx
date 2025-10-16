import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/ui/sidebar";

export function DashboardLayout() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
