import React from "react";

export default function SimpleParentDashboard() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Player Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="relative bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
          <h3 className="text-gray-600 dark:text-gray-400 font-medium mb-2">Overall Progress</h3>
          <p className="text-3xl font-bold mb-1">78%</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Skills development score</p>
        </div>
        
        <div className="relative bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
          <h3 className="text-gray-600 dark:text-gray-400 font-medium mb-2">Attendance</h3>
          <p className="text-3xl font-bold mb-1">92%</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">24 practices attended</p>
        </div>
        
        <div className="relative bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
          <h3 className="text-gray-600 dark:text-gray-400 font-medium mb-2">Fitness Score</h3>
          <p className="text-3xl font-bold mb-1">85/100</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Physical fitness assessment</p>
        </div>
      </div>
      
      {/* Upcoming Sessions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Upcoming Sessions</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Title</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Date & Time</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Location</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b dark:border-gray-700">
                <td className="py-4 px-4">Team Practice</td>
                <td className="py-4 px-4">May 20, 2025 • 16:00 - 18:00</td>
                <td className="py-4 px-4">Main Cricket Ground</td>
                <td className="py-4 px-4">
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Confirmed</span>
                </td>
              </tr>
              <tr className="border-b dark:border-gray-700">
                <td className="py-4 px-4">Fitness Training</td>
                <td className="py-4 px-4">May 22, 2025 • 15:30 - 17:00</td>
                <td className="py-4 px-4">Academy Training Center</td>
                <td className="py-4 px-4">
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Confirmed</span>
                </td>
              </tr>
              <tr>
                <td className="py-4 px-4">Practice Match</td>
                <td className="py-4 px-4">May 24, 2025 • 09:00 - 12:00</td>
                <td className="py-4 px-4">City Cricket Stadium</td>
                <td className="py-4 px-4">
                  <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Tentative</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="text-right mt-4">
          <button className="text-blue-500 hover:text-blue-700 font-medium text-sm">
            View All Sessions →
          </button>
        </div>
      </div>
      
      {/* Performance Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Performance Overview</h2>
        
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">Batting Technique</span>
            <span className="text-sm text-gray-500">85/100</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full" style={{ width: '85%' }}></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">Good progress in batting stance and shot selection</p>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">Bowling Accuracy</span>
            <span className="text-sm text-gray-500">72/100</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full" style={{ width: '72%' }}></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">Improved line and length; needs work on variations</p>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">Fielding</span>
            <span className="text-sm text-gray-500">80/100</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full" style={{ width: '80%' }}></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">Excellent ground fielding and throwing accuracy</p>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">Game Awareness</span>
            <span className="text-sm text-gray-500">78/100</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full" style={{ width: '78%' }}></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">Good understanding of game situations and strategy</p>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">Team Collaboration</span>
            <span className="text-sm text-gray-500">90/100</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full" style={{ width: '90%' }}></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">Excellent communication and support for teammates</p>
        </div>
      </div>
      
      {/* Fitness Metrics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Fitness Metrics</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="font-medium mb-2">Running Speed</h3>
            <div className="flex items-end">
              <span className="text-2xl font-bold">13.5</span>
              <span className="text-sm text-gray-500 ml-1">km/h</span>
              <span className="ml-auto text-green-500">↑ 0.7</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">Last updated: May 15, 2025</p>
          </div>
          
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="font-medium mb-2">Endurance</h3>
            <div className="flex items-end">
              <span className="text-2xl font-bold">35</span>
              <span className="text-sm text-gray-500 ml-1">min</span>
              <span className="ml-auto text-green-500">↑ 5</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">Last updated: May 15, 2025</p>
          </div>
          
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="font-medium mb-2">Strength Index</h3>
            <div className="flex items-end">
              <span className="text-2xl font-bold">72</span>
              <span className="text-sm text-gray-500 ml-1">points</span>
              <span className="ml-auto text-green-500">↑ 4</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">Last updated: May 15, 2025</p>
          </div>
        </div>
        
        <div className="text-right mt-4">
          <button className="text-blue-500 hover:text-blue-700 font-medium text-sm">
            View All Fitness Data →
          </button>
        </div>
      </div>
    </div>
  );
}