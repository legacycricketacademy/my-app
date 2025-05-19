// Dummy data for parent dashboard components

// Schedule data
export const scheduleData = [
  { id: 1, date: "May 20", time: "5:00 PM", location: "Legacy Turf", coachName: "Coach John", status: "Confirmed" },
  { id: 2, date: "May 22", time: "4:30 PM", location: "Central Park", coachName: "Coach Maria", status: "Pending" },
  { id: 3, date: "May 25", time: "6:00 PM", location: "Legacy Turf", coachName: "Coach Smith", status: "Confirmed" },
  { id: 4, date: "May 27", time: "5:30 PM", location: "Sports Complex", coachName: "Coach John", status: "Confirmed" },
  { id: 5, date: "May 29", time: "4:00 PM", location: "Legacy Turf", coachName: "Coach Maria", status: "Pending" }
];

// Fitness tracking data
export const fitnessData = {
  chartData: [
    { name: 'Week 1', endurance: 65, strength: 55, agility: 70 },
    { name: 'Week 2', endurance: 68, strength: 59, agility: 72 },
    { name: 'Week 3', endurance: 75, strength: 63, agility: 75 },
    { name: 'Week 4', endurance: 73, strength: 67, agility: 78 },
    { name: 'Week 5', endurance: 80, strength: 70, agility: 82 },
    { name: 'Week 6', endurance: 85, strength: 73, agility: 85 }
  ],
  metrics: {
    strength: 70,
    agility: 85,
    endurance: 78
  }
};

// Meal plan data
export const mealPlanData = [
  {
    day: "Monday",
    date: "2025-05-19",
    meals: [
      {
        id: "1",
        meal: "Breakfast",
        description: "Oatmeal with fruits and nuts, 1 boiled egg",
        time: "7:00 AM",
        calories: 450,
        proteins: 20,
        carbs: 60
      },
      {
        id: "2",
        meal: "Lunch",
        description: "Grilled chicken salad with quinoa",
        time: "12:30 PM",
        calories: 550,
        proteins: 35,
        carbs: 45
      },
      {
        id: "3",
        meal: "Dinner",
        description: "Baked salmon with steamed vegetables",
        time: "7:00 PM",
        calories: 580,
        proteins: 40,
        carbs: 30
      }
    ]
  },
  {
    day: "Tuesday",
    date: "2025-05-20",
    meals: [
      {
        id: "4",
        meal: "Breakfast",
        description: "Banana smoothie with protein powder",
        time: "7:00 AM",
        calories: 380,
        proteins: 25,
        carbs: 50
      },
      {
        id: "5",
        meal: "Lunch",
        description: "Turkey and avocado wrap with vegetables",
        time: "12:30 PM",
        calories: 520,
        proteins: 30,
        carbs: 40
      },
      {
        id: "6",
        meal: "Dinner",
        description: "Whole grain pasta with lean beef sauce",
        time: "7:00 PM",
        calories: 600,
        proteins: 35,
        carbs: 70
      }
    ]
  }
];

// Performance data
export const performanceData = {
  player: {
    id: "1",
    name: "Arjun Kumar",
    skills: {
      batting: 75,
      bowling: 60,
      fielding: 85,
      teamwork: 90
    },
    recent: [
      {
        date: "2025-05-15",
        type: "Training Match",
        runsScored: 32,
        ballsFaced: 45,
        catches: 1
      },
      {
        date: "2025-05-08",
        type: "Practice Session",
        wickets: 2,
        oversBowled: 3
      },
      {
        date: "2025-05-01",
        type: "Training Match",
        runsScored: 25,
        ballsFaced: 30,
        wickets: 1,
        oversBowled: 2
      }
    ],
    achievements: [
      {
        id: "a1",
        name: "Century Maker",
        description: "Scored 100+ runs in a match",
        date: "2025-04-10",
        icon: "🏆"
      },
      {
        id: "a2",
        name: "Golden Arm",
        description: "Took 5 wickets in a match",
        date: "2025-03-15",
        icon: "🥇"
      }
    ]
  }
};

// Messages data for chat
export const messagesData = [
  {
    id: "1",
    sender: "Coach Smith",
    senderRole: "coach",
    content: "Hi there! Just wanted to let you know that Arjun showed great improvement in batting technique during today's session.",
    timestamp: "2025-05-19T08:30:00Z"
  },
  {
    id: "2",
    sender: "Parent",
    senderRole: "parent",
    content: "That's great to hear! He's been practicing at home too. Any specific areas we should focus on?",
    timestamp: "2025-05-19T09:15:00Z"
  },
  {
    id: "3",
    sender: "Coach Smith",
    senderRole: "coach",
    content: "Yes, I'd recommend working on his forward defensive stroke. I've shared some drills in the app that you can try at home.",
    timestamp: "2025-05-19T09:45:00Z"
  },
  {
    id: "4",
    sender: "Coach Smith",
    senderRole: "coach",
    content: "Also, please make sure he attends Saturday's special session. We'll be working on specific batting techniques.",
    timestamp: "2025-05-19T09:48:00Z"
  }
];

// Summary card stats
export const summaryData = {
  childrenEnrolled: 2,
  upcomingSessions: 3,
  completedSessions: 12,
  achievements: 5
};