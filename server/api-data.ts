/**
 * Mock data for parent dashboard API
 * In a production environment, this would be fetched from the database
 */

// Player schedule data
export const playerSchedule = [
  { 
    id: 1,
    title: "Team Practice",
    date: "Saturday, May 21, 2025",
    time: "10:00 AM - 12:00 PM",
    location: "Indoor Cricket Center",
    status: "confirmed" 
  },
  { 
    id: 2,
    title: "Batting Practice",
    date: "Tuesday, May 24, 2025",
    time: "5:30 PM - 7:00 PM",
    location: "Outdoor Turf",
    status: "confirmed" 
  },
  { 
    id: 3,
    title: "Weekend Training Camp",
    date: "Friday, May 27, 2025",
    time: "9:00 AM - 3:00 PM",
    location: "Legacy Cricket Academy",
    status: "tentative" 
  },
  { 
    id: 4,
    title: "Match vs Westside Eagles",
    date: "Sunday, May 29, 2025",
    time: "10:00 AM - 1:00 PM",
    location: "City Cricket Stadium",
    status: "tentative" 
  }
];

// Player stats data
export const playerStats = {
  overview: {
    progress: "78%",
    attendance: "92%",
    fitness: "85/100",
    practices_attended: 24,
    total_practices: 26
  },
  skills: [
    { name: "Batting Technique", score: 85, notes: "Good progress in stance and shot selection" },
    { name: "Bowling Accuracy", score: 72, notes: "Improving line and length, needs work on variations" },
    { name: "Fielding", score: 80, notes: "Excellent ground fielding and throwing accuracy" },
    { name: "Game Awareness", score: 78, notes: "Good understanding of game situations" },
    { name: "Team Collaboration", score: 90, notes: "Excellent communication with teammates" }
  ]
};

// Player meal plan data
export const mealPlan = {
  breakfast: [
    "Protein oats with banana and honey",
    "Two boiled eggs",
    "Fresh orange juice"
  ],
  lunch: [
    "Brown rice with grilled chicken",
    "Mixed vegetables",
    "Yogurt"
  ],
  pre_training: [
    "Banana or apple",
    "Mixed nuts (almonds, walnuts)",
    "Energy bar"
  ],
  dinner: [
    "Grilled fish or lean meat",
    "Sweet potatoes",
    "Green vegetables",
    "Fresh fruits"
  ],
  hydration: "Drink at least 2-3 liters of water daily. Increase intake on training days."
};

// Payment history data
export const paymentHistory = [
  {
    id: 1,
    description: "Monthly Subscription - May",
    date: "May 01, 2025",
    amount: 120.00,
    status: "paid"
  },
  {
    id: 2,
    description: "Equipment Fee",
    date: "April 15, 2025",
    amount: 45.00,
    status: "paid"
  },
  {
    id: 3,
    description: "Special Training Camp",
    date: "April 10, 2025",
    amount: 75.00,
    status: "paid"
  },
  {
    id: 4,
    description: "Monthly Subscription - April",
    date: "April 01, 2025",
    amount: 120.00,
    status: "paid"
  }
];

// Upcoming payment data
export const upcomingPayment = {
  description: "Monthly Subscription - June",
  dueDate: "June 01, 2025",
  amount: 120.00
};