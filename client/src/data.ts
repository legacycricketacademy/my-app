// This file contains type definitions and mock data for the parent dashboard
// Used by component imports until we implement proper API endpoints

export interface Schedule {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  status: 'confirmed' | 'tentative' | 'cancelled';
  isAttending?: boolean;
}

export interface Meal {
  id: number;
  day: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  snacks: string;
  completed: boolean;
}

export interface FitnessMetric {
  id: number;
  name: string;
  value: number;
  unit: string; 
  previousValue: number;
  date: string;
  change: number;
  isImprovement: boolean;
}

export interface ChatMessage {
  id: number;
  sender: string;
  message: string;
  timestamp: string;
  isUser: boolean;
}

export interface Performance {
  id: number;
  name: string;
  score: number;
  maxScore: number;
  description: string;
}

export interface BattingStats {
  runs: number;
  balls: number;
  strikeRate: number;
  fours: number;
  sixes: number;
  highestScore: number;
  average: number;
}

export interface BowlingStats {
  overs: number;
  wickets: number;
  economy: number;
  maidens: number;
  bestFigures: string;
  average: number;
}

export interface PlayerStats {
  batting: BattingStats;
  bowling: BowlingStats;
}

export interface Achievement {
  id: number;
  title: string;
  date: string;
  description: string;
  iconType: "trophy" | "medal" | "star" | "certificate";
}

export interface SummaryStats {
  practices: number;
  matches: number;
  achievements: number;
  attendanceRate: number;
  fitnessScore: number;
  skillsScore: number;
}

// Mock data for schedule
export const scheduleData: Schedule[] = [
  {
    id: 1,
    title: 'Team Practice',
    date: '2025-05-20',
    time: '16:00 - 18:00',
    location: 'Main Cricket Ground',
    description: 'Regular weekly team practice focusing on batting technique.',
    status: 'confirmed'
  },
  {
    id: 2,
    title: 'Fitness Training',
    date: '2025-05-22',
    time: '15:30 - 17:00',
    location: 'Academy Training Center',
    description: 'Strength and conditioning session with the fitness coach.',
    status: 'confirmed'
  },
  {
    id: 3,
    title: 'Practice Match',
    date: '2025-05-24',
    time: '09:00 - 12:00',
    location: 'City Cricket Stadium',
    description: 'Practice match against South Delhi Cricket Academy.',
    status: 'tentative'
  },
  {
    id: 4,
    title: 'Video Analysis',
    date: '2025-05-27',
    time: '17:00 - 18:30',
    location: 'Academy Classroom',
    description: 'Individual video analysis session of recent performances.',
    status: 'confirmed'
  },
  {
    id: 5,
    title: 'Tournament Preparation',
    date: '2025-05-29',
    time: '16:00 - 19:00',
    location: 'Main Cricket Ground',
    description: 'Final preparation for the upcoming junior tournament.',
    status: 'confirmed'
  }
];

// Mock data for meals
export const mealData: Meal[] = [
  {
    id: 1,
    day: 'Monday',
    breakfast: 'Oatmeal with fruits, 2 boiled eggs, 1 glass milk',
    lunch: 'Grilled chicken, brown rice, mixed vegetables',
    dinner: 'Fish, sweet potatoes, green salad',
    snacks: 'Protein shake, mixed nuts',
    completed: true
  },
  {
    id: 2,
    day: 'Tuesday',
    breakfast: 'Whole grain toast, 2 egg omelet with vegetables, 1 banana',
    lunch: 'Lean turkey sandwich, yogurt, apple',
    dinner: 'Baked chicken, quinoa, steamed broccoli',
    snacks: 'Fruit smoothie, granola bar',
    completed: true
  },
  {
    id: 3,
    day: 'Wednesday',
    breakfast: 'Protein pancakes, Greek yogurt, berries',
    lunch: 'Chicken and vegetable wrap, vegetable soup',
    dinner: 'Grilled salmon, brown rice, asparagus',
    snacks: 'Cottage cheese with fruits, almonds',
    completed: false
  },
  {
    id: 4,
    day: 'Thursday',
    breakfast: 'Vegetable and cheese omelet, whole grain toast, orange juice',
    lunch: 'Tuna salad, whole grain crackers, carrot sticks',
    dinner: 'Lean beef stir fry with mixed vegetables',
    snacks: 'Protein bar, apple with peanut butter',
    completed: false
  },
  {
    id: 5,
    day: 'Friday',
    breakfast: 'Smoothie bowl with fruits, seeds, and nuts',
    lunch: 'Chicken Caesar salad, whole grain roll',
    dinner: 'Pasta with lean meat sauce, side salad',
    snacks: 'Greek yogurt with honey, mixed berries',
    completed: false
  },
  {
    id: 6,
    day: 'Saturday',
    breakfast: 'Vegetable and egg breakfast burrito, fruit juice',
    lunch: 'Chicken and rice bowl with vegetables',
    dinner: 'Grilled fish tacos with avocado',
    snacks: 'Trail mix, protein shake',
    completed: false
  },
  {
    id: 7,
    day: 'Sunday',
    breakfast: 'Whole grain waffles with fruits, 1 glass milk',
    lunch: 'Quinoa salad with chickpeas and vegetables',
    dinner: 'Baked chicken with sweet potatoes and greens',
    snacks: 'Hummus with vegetable sticks, whole grain crackers',
    completed: false
  }
];

// Mock data for fitness metrics
export const fitnessData: FitnessMetric[] = [
  {
    id: 1,
    name: 'Running Speed',
    value: 13.5,
    unit: 'km/h',
    previousValue: 12.8,
    date: '2025-05-15',
    change: 0.7,
    isImprovement: true
  },
  {
    id: 2,
    name: 'Endurance',
    value: 35,
    unit: 'min',
    previousValue: 30,
    date: '2025-05-15',
    change: 5,
    isImprovement: true
  },
  {
    id: 3,
    name: 'Strength Index',
    value: 72,
    unit: 'points',
    previousValue: 68,
    date: '2025-05-15',
    change: 4,
    isImprovement: true
  },
  {
    id: 4,
    name: 'Flexibility',
    value: 28,
    unit: 'cm',
    previousValue: 26,
    date: '2025-05-15',
    change: 2,
    isImprovement: true
  },
  {
    id: 5,
    name: 'Agility Test',
    value: 11.2,
    unit: 'sec',
    previousValue: 11.6,
    date: '2025-05-15',
    change: -0.4,
    isImprovement: true
  }
];

// Mock data for chat messages
export const chatData: ChatMessage[] = [
  {
    id: 1,
    sender: 'Coach Johnson',
    message: 'Good news! Your child has been selected for the junior tournament team.',
    timestamp: '2025-05-17T14:32:00',
    isUser: false
  },
  {
    id: 2,
    sender: 'You',
    message: 'That\'s wonderful! When is the first match?',
    timestamp: '2025-05-17T14:35:00',
    isUser: true
  },
  {
    id: 3,
    sender: 'Coach Johnson',
    message: 'The tournament starts on June 5th. We\'ll have special practice sessions every Tuesday and Thursday until then.',
    timestamp: '2025-05-17T14:37:00',
    isUser: false
  },
  {
    id: 4,
    sender: 'You',
    message: 'Will there be any transportation arranged?',
    timestamp: '2025-05-17T14:39:00',
    isUser: true
  },
  {
    id: 5,
    sender: 'Coach Johnson',
    message: 'Yes, we\'ll arrange a team bus. I\'ll send you the pickup schedule next week. Also, please ensure your child completes the fitness program.',
    timestamp: '2025-05-17T14:42:00',
    isUser: false
  },
  {
    id: 6,
    sender: 'You',
    message: 'Will do! Thanks for the update.',
    timestamp: '2025-05-17T14:44:00',
    isUser: true
  }
];

// Mock data for player performance
export const performanceData: Performance[] = [
  {
    id: 1,
    name: 'Batting Technique',
    score: 85,
    maxScore: 100,
    description: 'Good progress in batting stance and shot selection'
  },
  {
    id: 2,
    name: 'Bowling Accuracy',
    score: 72,
    maxScore: 100,
    description: 'Improved line and length; needs work on variations'
  },
  {
    id: 3,
    name: 'Fielding',
    score: 80,
    maxScore: 100,
    description: 'Excellent ground fielding and throwing accuracy'
  },
  {
    id: 4,
    name: 'Game Awareness',
    score: 78,
    maxScore: 100,
    description: 'Good understanding of game situations and strategy'
  },
  {
    id: 5,
    name: 'Team Collaboration',
    score: 90,
    maxScore: 100,
    description: 'Excellent communication and support for teammates'
  }
];

// Mock player statistics
export const playerStatsData: PlayerStats = {
  batting: {
    runs: 347,
    balls: 412,
    strikeRate: 84.2,
    fours: 38,
    sixes: 11,
    highestScore: 87,
    average: 34.7
  },
  bowling: {
    overs: 45.2,
    wickets: 18,
    economy: 4.8,
    maidens: 3,
    bestFigures: '4/27',
    average: 22.4
  }
};

// Mock achievements data
export const achievementsData: Achievement[] = [
  {
    id: 1,
    title: 'Player of the Match',
    date: '2025-04-15',
    description: 'Best performance in the match against Royal Cricket Club',
    iconType: 'trophy'
  },
  {
    id: 2,
    title: 'Best Bowler Award',
    date: '2025-03-22',
    description: 'Took 4 wickets in the junior league match',
    iconType: 'medal'
  },
  {
    id: 3,
    title: 'Batting Technique Certificate',
    date: '2025-02-18',
    description: 'Completed advanced batting technique program',
    iconType: 'certificate'
  },
  {
    id: 4,
    title: 'Most Improved Player',
    date: '2025-01-30',
    description: 'Recognized for significant improvement in all aspects of the game',
    iconType: 'star'
  }
];

// Mock summary statistics
export const summaryData: SummaryStats = {
  practices: 24,
  matches: 12,
  achievements: 7,
  attendanceRate: 92,
  fitnessScore: 85,
  skillsScore: 78
};