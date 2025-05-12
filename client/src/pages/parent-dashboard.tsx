import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";

export default function ParentDashboard() {
  const { user } = useAuth();
  const [currentDate] = useState(new Date());

  // Fetch children (players) for the parent
  const { data: children, isLoading: isLoadingChildren } = useQuery({
    queryKey: ["/api/players/parent"],
    queryFn: () => fetch("/api/players/parent").then(res => res.json()),
    enabled: !!user,
  });

  // Fetch upcoming sessions
  const { data: upcomingSessions, isLoading: isLoadingSessions } = useQuery({
    queryKey: ["/api/sessions/upcoming", 5],
    queryFn: () => fetch("/api/sessions/upcoming?limit=5").then(res => res.json()),
  });

  // Fetch announcements
  const { data: announcements, isLoading: isLoadingAnnouncements } = useQuery({
    queryKey: ["/api/announcements/recent"],
    queryFn: () => fetch("/api/announcements/recent").then(res => res.json()),
  });

  // First, render just a basic component to check if the issue is with the data loading or layout
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold">Parent Dashboard (Simple Version)</h1>
      <p className="text-gray-600">Testing direct rendering without complex layout</p>
      
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <p><strong>Username:</strong> {user?.username}</p>
        <p><strong>Role:</strong> {user?.role}</p>
        <p><strong>Date:</strong> {format(currentDate, "PPPP")}</p>
      </div>
      
      <button 
        onClick={() => console.log("Debug user:", user)} 
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
      >
        Log User Data
      </button>
      
      <div className="mt-4">
        <a href="/debug" className="text-blue-500 hover:underline">Go to Debug Page</a>
      </div>

      {/* Data loading status */}
      <div className="mt-6">
        <h2 className="text-xl font-bold">Data Loading Status:</h2>
        <ul className="list-disc pl-8 mt-2">
          <li>Children: {isLoadingChildren ? "Loading..." : (children ? `${children.length} loaded` : "No data")}</li>
          <li>Sessions: {isLoadingSessions ? "Loading..." : (upcomingSessions ? `${upcomingSessions.length} loaded` : "No data")}</li>
          <li>Announcements: {isLoadingAnnouncements ? "Loading..." : (announcements ? `${announcements.length} loaded` : "No data")}</li>
        </ul>
      </div>
    </div>
  );
}