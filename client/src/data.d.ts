// Type definitions for data.js

// Schedule data types
export interface ScheduleItem {
  id: number;
  date: string;
  time: string;
  location: string;
  coachName: string;
  status: "Confirmed" | "Pending" | "Cancelled";
}
export const scheduleData: ScheduleItem[];

// Fitness data types
export interface FitnessChartDataPoint {
  name: string;
  endurance: number;
  strength: number;
  agility: number;
}

export interface FitnessMetrics {
  strength: number;
  agility: number;
  endurance: number;
}

export interface FitnessData {
  chartData: FitnessChartDataPoint[];
  metrics: FitnessMetrics;
}
export const fitnessData: FitnessData;

// Meal plan data types
export interface Meal {
  id: string;
  meal: string;
  description: string;
  time: string;
  calories: number;
  proteins: number;
  carbs: number;
}

export interface DailyMealPlan {
  day: string;
  date: string;
  meals: Meal[];
}
export const mealPlanData: DailyMealPlan[];

// Performance data types
export interface RecentPerformance {
  date: string;
  type: string;
  runsScored?: number;
  ballsFaced?: number;
  catches?: number;
  wickets?: number;
  oversBowled?: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  date: string;
  icon: string;
}

export interface PlayerPerformance {
  id: string;
  name: string;
  skills: {
    batting: number;
    bowling: number;
    fielding: number;
    teamwork: number;
  };
  recent: RecentPerformance[];
  achievements: Achievement[];
}

export interface PerformanceData {
  player: PlayerPerformance;
}
export const performanceData: PerformanceData;

// Chat message types
export interface Message {
  id: string;
  sender: string;
  senderRole: "coach" | "parent" | "system";
  content: string;
  timestamp: string;
}
export const messagesData: Message[];

// Summary card types
export interface SummaryStats {
  childrenEnrolled: number;
  upcomingSessions: number;
  completedSessions: number;
  achievements: number;
}
export const summaryData: SummaryStats;