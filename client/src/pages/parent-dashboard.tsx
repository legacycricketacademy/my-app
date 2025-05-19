import React, { useEffect } from "react";
import { 
  scheduleData, 
  performanceData, 
  summaryData,
  fitnessData
} from "../data";

const ParentDashboard = () => {
  useEffect(() => {
    console.log("✅ Enhanced ParentDashboard mounted successfully");
  }, []);

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <h1 className="text-3xl font-bold mb-6">Player Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard 
          title="Overall Progress" 
          value={`${summaryData.skillsScore}%`} 
          description="Skills development score" 
          color="bg-blue-500"
        />
        <StatCard 
          title="Attendance" 
          value={`${summaryData.attendanceRate}%`} 
          description={`${summaryData.practices} practices attended`}
          color="bg-green-500"
        />
        <StatCard 
          title="Fitness Score" 
          value={`${summaryData.fitnessScore}/100`} 
          description="Physical fitness assessment" 
          color="bg-purple-500"
        />
      </div>
      
      {/* Upcoming Sessions Table */}
      <div className="bg-white rounded-lg shadow p-4 mb-8">
        <h2 className="text-xl font-semibold mb-4">Upcoming Sessions</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {scheduleData.slice(0, 3).map((session) => (
                <tr key={session.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{session.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(session.date).toLocaleDateString()} • {session.time}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{session.location}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${session.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                        session.status === 'tentative' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'}`}>
                      {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-right">
          <button className="text-blue-500 hover:text-blue-700 text-sm font-medium">
            View All Sessions →
          </button>
        </div>
      </div>
      
      {/* Performance Overview */}
      <div className="bg-white rounded-lg shadow p-4 mb-8">
        <h2 className="text-xl font-semibold mb-4">Performance Overview</h2>
        <div className="space-y-4">
          {performanceData.map((skill) => (
            <div key={skill.id} className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">{skill.name}</span>
                <span className="text-sm text-gray-500">{skill.score}/{skill.maxScore}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${(skill.score / skill.maxScore) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500">{skill.description}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Fitness Progress */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-xl font-semibold mb-4">Recent Fitness Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fitnessData.slice(0, 3).map((metric) => (
            <div key={metric.id} className="border rounded-lg p-4">
              <h3 className="font-medium">{metric.name}</h3>
              <div className="flex items-end mt-2">
                <span className="text-2xl font-bold">{metric.value}</span>
                <span className="ml-1 text-gray-500">{metric.unit}</span>
                <span className={`ml-auto ${metric.isImprovement ? 'text-green-500' : 'text-red-500'}`}>
                  {metric.isImprovement ? '↑' : '↓'} {Math.abs(metric.change)}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Last updated: {new Date(metric.date).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 text-right">
          <button className="text-blue-500 hover:text-blue-700 text-sm font-medium">
            View All Fitness Data →
          </button>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, description, color }: { 
  title: string;
  value: string;
  description: string;
  color: string;
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-6 relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-1 h-full ${color}`}></div>
      <h3 className="font-semibold text-gray-700">{title}</h3>
      <p className="text-3xl font-bold mt-2">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
    </div>
  );
};

export default ParentDashboard;