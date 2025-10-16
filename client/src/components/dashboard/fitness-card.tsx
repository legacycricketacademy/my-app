import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export function FitnessCard() {
  const [period, setPeriod] = useState<string>("week");
  
  const { data: fitnessProgress, isLoading } = useQuery<any>({
    queryKey: ["/api/fitness/team-progress", period],
    queryFn: () => fetch(`/api/fitness/team-progress?period=${period}`).then(res => res.json())
  });
  
  const getProgressColor = (metric: string) => {
    if (!fitnessProgress) return "bg-gray-200";
    
    switch (metric) {
      case "runningSpeed": return "bg-secondary";
      case "endurance": return "bg-primary";
      case "strength": return "bg-accent";
      default: return "bg-gray-200";
    }
  };
  
  const getProgressPercentage = (value: number, target: number) => {
    if (!value || !target) return 0;
    const percentage = (value / target) * 100;
    return Math.min(percentage, 100); // Cap at 100%
  };
  
  const getProgressIndicator = (current: number, previous: number) => {
    if (!current || !previous) return null;
    
    const percentChange = ((current - previous) / previous) * 100;
    if (percentChange > 0) {
      return <span className="text-xs font-medium text-secondary">+{percentChange.toFixed(1)}%</span>;
    } else if (percentChange < 0) {
      return <span className="text-xs font-medium text-destructive">{percentChange.toFixed(1)}%</span>;
    }
    return <span className="text-xs font-medium text-gray-500">0%</span>;
  };

  return (
    <Card className="bg-white rounded-lg shadow">
      <CardHeader className="flex items-center justify-between border-b border-gray-200 p-4">
        <CardTitle className="font-semibold text-lg heading">Team Fitness Progress</CardTitle>
        <div className="flex items-center">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="text-sm bg-gray-100 border-0 focus:ring-1 focus:ring-primary h-8 px-2 py-0">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 space-y-4">
        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div>
              <div className="flex justify-between items-center mb-1">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-12"></div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2"></div>
              <div className="flex justify-between mt-1">
                <div className="h-3 bg-gray-100 rounded w-20"></div>
                <div className="h-3 bg-gray-100 rounded w-20"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-12"></div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2"></div>
              <div className="flex justify-between mt-1">
                <div className="h-3 bg-gray-100 rounded w-20"></div>
                <div className="h-3 bg-gray-100 rounded w-20"></div>
              </div>
            </div>
          </div>
        ) : fitnessProgress ? (
          <>
            <div>
              <div className="flex justify-between items-center mb-1">
                <h4 className="text-sm font-medium text-gray-700">Running Speed</h4>
                {getProgressIndicator(fitnessProgress.avgRunningSpeed, fitnessProgress.avgRunningSpeed * 0.96)} {/* Simulating previous value */}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`${getProgressColor('runningSpeed')} h-2 rounded-full`} 
                  style={{ width: `${getProgressPercentage(fitnessProgress.avgRunningSpeed, 16)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Avg. {fitnessProgress.avgRunningSpeed?.toFixed(1) || 0} km/h</span>
                <span>Target: 16.0 km/h</span>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <h4 className="text-sm font-medium text-gray-700">Endurance</h4>
                {getProgressIndicator(fitnessProgress.avgEndurance, fitnessProgress.avgEndurance * 0.97)} {/* Simulating previous value */}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`${getProgressColor('endurance')} h-2 rounded-full`} 
                  style={{ width: `${getProgressPercentage(fitnessProgress.avgEndurance, 30)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Avg. {fitnessProgress.avgEndurance?.toFixed(1) || 0} min</span>
                <span>Target: 30.0 min</span>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <h4 className="text-sm font-medium text-gray-700">Strength</h4>
                {getProgressIndicator(fitnessProgress.avgStrength, fitnessProgress.avgStrength * 1.02)} {/* Simulating previous value */}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`${getProgressColor('strength')} h-2 rounded-full`} 
                  style={{ width: `${getProgressPercentage(fitnessProgress.avgStrength, 15)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Avg. {fitnessProgress.avgStrength?.toFixed(1) || 0} units</span>
                <span>Target: 15.0 units</span>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <p>No fitness data available</p>
          </div>
        )}
        
        <div className="border-t border-gray-100 pt-3">
          <Link to="/fitness" className="text-primary text-sm hover:underline flex items-center justify-center">
            <span>View Detailed Fitness Report</span>
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
