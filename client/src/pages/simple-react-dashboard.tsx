import React from "react";

// Simple Stats Card Component
interface StatsCardProps {
  title: string;
  value: string;
  description: string;
  accentColor: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, description, accentColor }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-1 h-full ${accentColor}`}></div>
      <div className="text-gray-600 dark:text-gray-400 font-semibold mb-2">{title}</div>
      <div className="text-3xl font-bold mb-2">{value}</div>
      <div className="text-sm text-gray-500 dark:text-gray-400">{description}</div>
    </div>
  );
};

// Simple Status Badge Component
interface StatusBadgeProps {
  status: "confirmed" | "tentative" | "cancelled";
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const statusStyles = {
    confirmed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    tentative: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
  };
  
  const statusText = {
    confirmed: "Confirmed",
    tentative: "Tentative",
    cancelled: "Cancelled"
  };
  
  return (
    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status]}`}>
      {statusText[status]}
    </span>
  );
};

// Simple React Dashboard
export default function SimpleReactDashboard() {
  // This component is intentionally minimal with no hooks, providers, or complex state
  // It serves as a foundation that we can build upon
  
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 dark:bg-gray-950 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="text-xl font-bold">
            Legacy <span className="text-blue-400">Cricket Academy</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center font-semibold">
              P
            </div>
            <div className="text-sm">Parent Account</div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Player Dashboard</h1>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard 
            title="Overall Progress" 
            value="78%" 
            description="Skills development score" 
            accentColor="bg-blue-500" 
          />
          <StatsCard 
            title="Attendance" 
            value="92%" 
            description="24 practices attended" 
            accentColor="bg-green-500" 
          />
          <StatsCard 
            title="Fitness Score" 
            value="85/100" 
            description="Physical fitness assessment" 
            accentColor="bg-purple-500" 
          />
        </div>
        
        {/* Upcoming Sessions Panel */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Upcoming Sessions</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date & Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                <tr>
                  <td className="px-4 py-4 whitespace-nowrap">Team Practice</td>
                  <td className="px-4 py-4 whitespace-nowrap">May 20, 2025 • 16:00 - 18:00</td>
                  <td className="px-4 py-4 whitespace-nowrap">Main Cricket Ground</td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <StatusBadge status="confirmed" />
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-4 whitespace-nowrap">Fitness Training</td>
                  <td className="px-4 py-4 whitespace-nowrap">May 22, 2025 • 15:30 - 17:00</td>
                  <td className="px-4 py-4 whitespace-nowrap">Academy Training Center</td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <StatusBadge status="confirmed" />
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-4 whitespace-nowrap">Practice Match</td>
                  <td className="px-4 py-4 whitespace-nowrap">May 24, 2025 • 09:00 - 12:00</td>
                  <td className="px-4 py-4 whitespace-nowrap">City Cricket Stadium</td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <StatusBadge status="tentative" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Player Performance Panel - Minimal Version */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Performance Summary</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            This is a simplified performance summary. The full version will include detailed stats and progress tracking.
          </p>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Batting Technique</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">85/100</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: "85%" }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Bowling Accuracy</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">72/100</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: "72%" }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Fielding</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">80/100</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: "80%" }}></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}