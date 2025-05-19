import React from "react";

// Type definitions for our data
interface SessionData {
  title: string;
  dateTime: string;
  location: string;
  status: 'confirmed' | 'tentative' | 'cancelled';
}

interface SkillData {
  name: string;
  score: number;
  description: string;
}

interface FitnessMetric {
  name: string;
  value: number;
  unit: string;
  change: number;
  lastUpdated: string;
}

// Main dashboard component
export default function ParentDashboard() {
  // Mock data - would be replaced with API calls in a real implementation
  const playerStats = {
    overallProgress: 78,
    attendance: 92,
    practicesAttended: 24,
    fitnessScore: 85
  };
  
  const upcomingSessions: SessionData[] = [
    {
      title: "Team Practice",
      dateTime: "May 20, 2025 • 16:00 - 18:00",
      location: "Main Cricket Ground",
      status: "confirmed"
    },
    {
      title: "Fitness Training",
      dateTime: "May 22, 2025 • 15:30 - 17:00",
      location: "Academy Training Center",
      status: "confirmed"
    },
    {
      title: "Practice Match",
      dateTime: "May 24, 2025 • 09:00 - 12:00",
      location: "City Cricket Stadium",
      status: "tentative"
    }
  ];
  
  const skills: SkillData[] = [
    {
      name: "Batting Technique",
      score: 85,
      description: "Good progress in batting stance and shot selection"
    },
    {
      name: "Bowling Accuracy",
      score: 72,
      description: "Improved line and length; needs work on variations"
    },
    {
      name: "Fielding",
      score: 80,
      description: "Excellent ground fielding and throwing accuracy"
    },
    {
      name: "Game Awareness",
      score: 78,
      description: "Good understanding of game situations and strategy"
    },
    {
      name: "Team Collaboration",
      score: 90,
      description: "Excellent communication and support for teammates"
    }
  ];
  
  const fitnessMetrics: FitnessMetric[] = [
    {
      name: "Running Speed",
      value: 13.5,
      unit: "km/h",
      change: 0.7,
      lastUpdated: "May 15, 2025"
    },
    {
      name: "Endurance",
      value: 35,
      unit: "min",
      change: 5,
      lastUpdated: "May 15, 2025"
    },
    {
      name: "Strength Index",
      value: 72,
      unit: "points",
      change: 4,
      lastUpdated: "May 15, 2025"
    }
  ];
  
  // Reusable Card component for stats
  const StatCard = ({ 
    title, 
    value, 
    description, 
    accentColor 
  }: { 
    title: string; 
    value: string; 
    description: string; 
    accentColor: "blue" | "green" | "purple" 
  }) => (
    <div className="relative bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md overflow-hidden">
      <div className={`absolute top-0 left-0 w-1 h-full bg-${accentColor}-500`}></div>
      <h3 className="text-gray-600 dark:text-gray-400 font-medium mb-2">{title}</h3>
      <p className="text-3xl font-bold mb-1">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
    </div>
  );
  
  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const statusClasses = {
      confirmed: "bg-green-100 text-green-800",
      tentative: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-red-100 text-red-800"
    };
    
    const statusClass = statusClasses[status as keyof typeof statusClasses] || "";
    
    return (
      <span className={`${statusClass} text-xs px-2 py-1 rounded-full`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };
  
  // Progress bar component
  const ProgressBar = ({ percentage }: { percentage: number }) => (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div 
        className="bg-blue-500 h-2 rounded-full" 
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );
  
  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="bg-gray-800 dark:bg-gray-950 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="text-xl font-bold">
              Legacy <span className="text-blue-500">Cricket Academy</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center font-semibold">
                P
              </div>
              <span className="ml-2">Parent Account</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold mb-8">Player Dashboard</h1>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard 
            title="Overall Progress" 
            value={`${playerStats.overallProgress}%`} 
            description="Skills development score" 
            accentColor="blue" 
          />
          
          <StatCard 
            title="Attendance" 
            value={`${playerStats.attendance}%`} 
            description={`${playerStats.practicesAttended} practices attended`} 
            accentColor="green" 
          />
          
          <StatCard 
            title="Fitness Score" 
            value={`${playerStats.fitnessScore}/100`} 
            description="Physical fitness assessment" 
            accentColor="purple" 
          />
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
                {upcomingSessions.map((session, index) => (
                  <tr key={index} className="border-b dark:border-gray-700">
                    <td className="py-4 px-4">{session.title}</td>
                    <td className="py-4 px-4">{session.dateTime}</td>
                    <td className="py-4 px-4">{session.location}</td>
                    <td className="py-4 px-4">
                      <StatusBadge status={session.status} />
                    </td>
                  </tr>
                ))}
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
          
          {skills.map((skill, index) => (
            <div key={index} className="mb-4">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">{skill.name}</span>
                <span className="text-sm text-gray-500">{skill.score}/100</span>
              </div>
              <ProgressBar percentage={skill.score} />
              <p className="text-xs text-gray-500 mt-1">{skill.description}</p>
            </div>
          ))}
        </div>
        
        {/* Fitness Metrics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Fitness Metrics</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {fitnessMetrics.map((metric, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="font-medium mb-2">{metric.name}</h3>
                <div className="flex items-end">
                  <span className="text-2xl font-bold">{metric.value}</span>
                  <span className="text-sm text-gray-500 ml-1">{metric.unit}</span>
                  <span className="ml-auto text-green-500">↑ {metric.change}</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">Last updated: {metric.lastUpdated}</p>
              </div>
            ))}
          </div>
          
          <div className="text-right mt-4">
            <button className="text-blue-500 hover:text-blue-700 font-medium text-sm">
              View All Fitness Data →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}