// This file provides the data interface for parent dashboard components

export interface ScheduleItem {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  coach: string;
  rsvp: boolean;
}

export interface FitnessItem {
  id: number;
  skill: string;
  current: number;
  total: number;
  progress: number;
}

export interface Achievement {
  id: number;
  title: string;
  description: string;
  icon: string;
  dateEarned: string;
}

export interface MealItem {
  id: number;
  type: string;
  time: string;
  description: string;
  consumed: boolean;
  icon: string;
}

export interface Message {
  id: number;
  sender: string;
  senderInitials: string;
  text: string;
  time: string;
  isParent: boolean;
}

// Sample data for dashboard
export const schedule: ScheduleItem[] = [
  {
    id: 1,
    title: "Cricket Training",
    date: "May 20, 2025",
    time: "5:00 PM",
    location: "Legacy Turf",
    coach: "John Smith",
    rsvp: false
  },
  {
    id: 2,
    title: "Cricket Training",
    date: "May 22, 2025",
    time: "4:30 PM",
    location: "Central Park",
    coach: "Maria Johnson",
    rsvp: false
  },
  {
    id: 3,
    title: "Weekend Match",
    date: "May 25, 2025",
    time: "10:00 AM",
    location: "Legacy Stadium",
    coach: "John Smith",
    rsvp: false
  }
];

export const fitness: FitnessItem[] = [
  {
    id: 1,
    skill: "Batting",
    current: 75,
    total: 100,
    progress: 75
  },
  {
    id: 2,
    skill: "Bowling",
    current: 60,
    total: 100,
    progress: 60
  },
  {
    id: 3,
    skill: "Fielding",
    current: 85,
    total: 100,
    progress: 85
  }
];

export const achievements: Achievement[] = [
  {
    id: 1,
    title: "Century Maker",
    description: "Scored 100+ runs in a match",
    icon: "🏆",
    dateEarned: "May 12, 2025"
  },
  {
    id: 2,
    title: "Golden Arm",
    description: "Took 5 wickets in a match",
    icon: "🥇",
    dateEarned: "May 5, 2025"
  },
  {
    id: 3,
    title: "Perfect Attendance",
    description: "Attended all sessions for a month",
    icon: "🌟",
    dateEarned: "April 30, 2025"
  }
];

export const meals: MealItem[] = [
  {
    id: 1,
    type: "Breakfast",
    time: "7:00 AM",
    description: "Oatmeal with fruits and nuts, 1 boiled egg",
    consumed: false,
    icon: "☕"
  },
  {
    id: 2,
    type: "Lunch",
    time: "12:30 PM",
    description: "Grilled chicken salad with quinoa",
    consumed: false,
    icon: "🍽️"
  },
  {
    id: 3,
    type: "Snack",
    time: "3:30 PM",
    description: "Greek yogurt with honey and berries",
    consumed: false,
    icon: "🥤"
  }
];

export const messages: Message[] = [
  {
    id: 1,
    sender: "Coach Smith",
    senderInitials: "CS",
    text: "Hi there! Just wanted to let you know that Arjun showed great improvement in batting technique today.",
    time: "8:30 AM",
    isParent: false
  },
  {
    id: 2,
    sender: "Parent",
    senderInitials: "PA",
    text: "That's great to hear! He's been practicing at home too. Any specific areas we should focus on?",
    time: "9:15 AM",
    isParent: true
  },
  {
    id: 3,
    sender: "Coach Smith",
    senderInitials: "CS",
    text: "Yes, I noticed his footwork is improving. Maybe work on his cover drives - I'll send some practice drills.",
    time: "9:30 AM",
    isParent: false
  }
];

// Summary stats for dashboard
export const summaryStats = {
  childrenEnrolled: 2,
  upcomingSessions: 3,
  completedSessions: 12,
  achievementsEarned: 5
};