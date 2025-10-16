import { db } from "./index.js";
import * as schema from "@shared/schema.js";
import { hashSync, genSaltSync } from "bcrypt";

async function seed() {
  try {
    // Create default academy if it doesn't exist
    let defaultAcademy;
    const academyExists = await db.query.academies.findFirst({
      where: (academies, { eq }) => eq(academies.name, "Legacy Cricket Academy")
    });

    if (!academyExists) {
      const [academy] = await db.insert(schema.academies).values({
        name: "Legacy Cricket Academy",
        slug: "legacy-cricket-academy", // Added required slug field
        description: "The main cricket academy for player development",
        address: "123 Cricket Lane, Sports City",
        phone: "+1234567890",
        email: "info@legacycricket.com",
        logoUrl: "/assets/logo.png",
        primaryColor: "#1e40af", // Blue
        secondaryColor: "#60a5fa", // Light blue
        stripeAccountId: null,
        subscriptionTier: "pro",
        maxPlayers: 200,
        maxCoaches: 10,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      defaultAcademy = academy;
      console.log("Default academy created with ID:", academy.id);
    } else {
      defaultAcademy = academyExists;
      console.log("Default academy already exists with ID:", academyExists.id);
    }

    const academyId = defaultAcademy.id;
    // Create admin user
    const adminExists = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.username, "admin")
    });

    if (!adminExists) {
      const salt = genSaltSync(10);
      await db.insert(schema.users).values({
        username: "admin",
        password: hashSync("password", salt),
        email: "admin@cricketacademy.com",
        fullName: "Admin User",
        role: "admin",
        academyId: academyId,
      });
      console.log("Admin user created");
    }

    // Create coach
    const coachExists = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.username, "coach")
    });

    if (!coachExists) {
      const salt = genSaltSync(10);
      await db.insert(schema.users).values({
        username: "coach",
        password: hashSync("password", salt),
        email: "coach@cricketacademy.com",
        fullName: "Robert Johnson",
        role: "coach",
        academyId: academyId,
        profileImage: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80"
      });
      console.log("Coach user created");
    }

    // Create some parent users
    const parentsData = [
      {
        username: "parent1",
        password: hashSync("password", genSaltSync(10)),
        email: "parent1@example.com",
        fullName: "John Williams",
        role: "parent" as const,
        academyId: academyId
      },
      {
        username: "parent2",
        password: hashSync("password", genSaltSync(10)),
        email: "parent2@example.com",
        fullName: "Sarah Chen",
        role: "parent" as const,
        academyId: academyId
      },
      {
        username: "parent3",
        password: hashSync("password", genSaltSync(10)),
        email: "parent3@example.com",
        fullName: "Michael Harrison",
        role: "parent" as const,
        academyId: academyId
      },
      {
        username: "parent4",
        password: hashSync("password", genSaltSync(10)),
        email: "parent4@example.com",
        fullName: "Lisa Rodriguez",
        role: "parent" as const,
        academyId: academyId
      }
    ];

    for (const parentData of parentsData) {
      const parentExists = await db.query.users.findFirst({
        where: (users, { eq }) => eq(users.username, parentData.username)
      });

      if (!parentExists) {
        await db.insert(schema.users).values(parentData);
      }
    }

    // Get parent IDs for reference
    const parents = await db.query.users.findMany({
      where: (users, { eq }) => eq(users.role, "parent")
    });

    if (parents.length === 0) {
      console.log("No parents found, cannot create players");
      return;
    }

    // Create sample players
    const playersData = [
      {
        firstName: "Aiden",
        lastName: "Parker",
        dateOfBirth: "2012-05-15", // Convert to string format
        ageGroup: "8+ years" as const, // Use correct enum value
        playerType: "Batsman",
        parentId: parents[0].id,
        academyId: academyId,
        profileImage: "https://images.unsplash.com/photo-1531251445707-1f000e1e87d0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80"
      },
      {
        firstName: "Maya",
        lastName: "Williams",
        dateOfBirth: "2010-02-28", // Convert to string format
        ageGroup: "8+ years" as const, // Use correct enum value
        playerType: "All-rounder",
        parentId: parents[0].id,
        academyId: academyId,
        profileImage: "https://images.unsplash.com/photo-1534614971-6be99a7a3ffd?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80"
      },
      {
        firstName: "Ethan",
        lastName: "Chen",
        dateOfBirth: "2012-09-10",
        ageGroup: "8+ years" as const,
        playerType: "Bowler",
        parentId: parents[1].id,
        academyId: academyId,
        profileImage: "https://images.unsplash.com/photo-1610088441520-4352457e7095?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80"
      },
      {
        firstName: "Jake",
        lastName: "Harrison",
        dateOfBirth: "2010-11-22",
        ageGroup: "8+ years" as const,
        playerType: "Wicket Keeper",
        parentId: parents[2].id,
        academyId: academyId,
        profileImage: "https://images.unsplash.com/photo-1601412436009-d964bd02edbc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80"
      },
      {
        firstName: "Sophia",
        lastName: "Rodriguez",
        dateOfBirth: "2008-07-15",
        ageGroup: "8+ years" as const,
        playerType: "All-rounder",
        parentId: parents[3].id,
        academyId: academyId,
        profileImage: "https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=256&q=80"
      }
    ];

    for (const playerData of playersData) {
      const playerExists = await db.query.players.findFirst({
        where: (players, { and, eq }) => and(
          eq(players.firstName, playerData.firstName),
          eq(players.lastName, playerData.lastName)
        )
      });

      if (!playerExists) {
        await db.insert(schema.players).values(playerData);
      }
    }

    // Get coach ID
    const coach = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.role, "coach")
    });

    if (!coach) {
      console.log("No coach found, cannot create sessions");
      return;
    }

    // Create sample sessions
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sessionsData = [
      {
        title: "Under 12s Training",
        description: "Basic batting and bowling techniques",
        sessionType: "Training",
        ageGroup: "8+ years" as const,
        location: "Strongsville" as const, // Use correct enum value
        startTime: new Date(today.getTime() + 16 * 60 * 60 * 1000), // 4:00 PM today
        endTime: new Date(today.getTime() + 17.5 * 60 * 60 * 1000), // 5:30 PM today
        coachId: coach.id,
        maxPlayers: 20,
        academyId: academyId
      },
      {
        title: "Under 14s Fitness",
        description: "Strength and conditioning training",
        sessionType: "Fitness",
        ageGroup: "8+ years" as const,
        location: "Solon" as const, // Use correct enum value
        startTime: new Date(today.getTime() + 18 * 60 * 60 * 1000), // 6:00 PM today
        endTime: new Date(today.getTime() + 19 * 60 * 60 * 1000), // 7:00 PM today
        coachId: coach.id,
        maxPlayers: 20,
        academyId: academyId
      },
      {
        title: "Parent Meeting",
        description: "Discussion: Tournament Preparation",
        sessionType: "Meeting",
        ageGroup: "8+ years" as const,
        location: "Strongsville" as const, // Use correct enum value
        startTime: new Date(today.getTime() + 19.5 * 60 * 60 * 1000), // 7:30 PM today
        endTime: new Date(today.getTime() + 20.5 * 60 * 60 * 1000), // 8:30 PM today
        coachId: coach.id,
        academyId: academyId
      },
      {
        title: "Under 16s Match Practice",
        description: "Simulated match scenarios",
        sessionType: "Practice Match",
        ageGroup: "8+ years" as const,
        location: "Strongsville" as const, // Use correct enum value
        startTime: new Date(today.getTime() + 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000), // 3:00 PM tomorrow
        endTime: new Date(today.getTime() + 24 * 60 * 60 * 1000 + 17 * 60 * 60 * 1000), // 5:00 PM tomorrow
        coachId: coach.id,
        maxPlayers: 22,
        academyId: academyId
      }
    ];

    for (const sessionData of sessionsData) {
      const sessionExists = await db.query.sessions.findFirst({
        where: (sessions, { and, eq }) => and(
          eq(sessions.title, sessionData.title),
          eq(sessions.startTime, sessionData.startTime)
        )
      });

      if (!sessionExists) {
        await db.insert(schema.sessions).values(sessionData);
      }
    }

    // Add sample fitness records
    const players = await db.query.players.findMany();
    
    if (players.length > 0) {
      const today = new Date();
      const lastWeek = new Date(today);
      lastWeek.setDate(today.getDate() - 7);
      
      for (const player of players) {
        const fitnessExists = await db.query.fitnessRecords.findFirst({
          where: (records, { and, eq }) => and(
            eq(records.playerId, player.id),
            eq(records.recordDate, today.toISOString().split('T')[0]) // Convert to date string
          )
        });
        
        if (!fitnessExists) {
          // Current fitness record
          await db.insert(schema.fitnessRecords).values({
            playerId: player.id,
            recordDate: today.toISOString().split('T')[0], // Convert to date string
            runningSpeed: 15 + Math.random() * 3,
            endurance: 20 + Math.random() * 10,
            strength: 10 + Math.random() * 8,
            agility: 14 + Math.random() * 6,
            flexibility: 12 + Math.random() * 5,
            notes: "Regular assessment"
          });
          
          // Last week's record (for progress comparison)
          await db.insert(schema.fitnessRecords).values({
            playerId: player.id,
            recordDate: lastWeek.toISOString().split('T')[0], // Convert to date string
            runningSpeed: 14 + Math.random() * 3,
            endurance: 18 + Math.random() * 10,
            strength: 9 + Math.random() * 8,
            agility: 13 + Math.random() * 6,
            flexibility: 11 + Math.random() * 5,
            notes: "Previous assessment"
          });
        }
      }
    }

    // Create meal plans
    const mealPlanData = {
      ageGroup: "5-8 years" as const, // Use correct enum value
      title: "Weekly Nutrition Plan",
      weekStartDate: new Date().toISOString().split('T')[0], // Convert to date string
      weekEndDate: new Date(new Date().setDate(new Date().getDate() + 6)).toISOString().split('T')[0], // Convert to date string
      createdBy: coach.id,
      academyId: academyId
    };

    let mealPlanId;
    const mealPlanExists = await db.query.mealPlans.findFirst({
      where: (plans, { and, eq }) => and(
        eq(plans.ageGroup, mealPlanData.ageGroup),
        eq(plans.title, mealPlanData.title)
      )
    });

    if (!mealPlanExists) {
      const [newMealPlan] = await db.insert(schema.mealPlans).values(mealPlanData).returning({id: schema.mealPlans.id});
      mealPlanId = newMealPlan.id;
    } else {
      mealPlanId = mealPlanExists.id;
    }

    if (mealPlanId) {
      // Monday meals
      const mondayMeals = [
        {
          mealPlanId,
          dayOfWeek: 1, // Monday
          mealType: "Breakfast",
          items: ["Scrambled eggs with spinach", "Whole grain toast", "Fresh fruit", "Low-fat milk"],
          notes: "Provides protein and energy for morning training"
        },
        {
          mealPlanId,
          dayOfWeek: 1,
          mealType: "Pre-Training Snack",
          items: ["Banana", "Greek yogurt", "Handful of nuts"],
          notes: "Have 1-2 hours before training session"
        },
        {
          mealPlanId,
          dayOfWeek: 1,
          mealType: "Dinner",
          items: ["Grilled chicken breast", "Brown rice", "Steamed vegetables", "Fresh salad with olive oil dressing"],
          notes: "Recovery meal with balanced macronutrients"
        }
      ];

      for (const meal of mondayMeals) {
        const mealExists = await db.query.mealItems.findFirst({
          where: (items, { and, eq }) => and(
            eq(items.mealPlanId, meal.mealPlanId),
            eq(items.dayOfWeek, meal.dayOfWeek),
            eq(items.mealType, meal.mealType)
          )
        });

        if (!mealExists) {
          await db.insert(schema.mealItems).values(meal);
        }
      }
    }

    // Create sample announcements
    const announcementsData = [
      {
        title: "Tournament Registration Open",
        content: "Registration for the Summer Inter-Club Tournament is now open. Please register your interest by Friday. Limited spots available!",
        createdBy: coach.id,
        targetGroups: ["All"],
        academyId: academyId,
        createdAt: new Date(new Date().setDate(new Date().getDate() - 2)) // 2 days ago
      },
      {
        title: "Weekend Practice Relocated",
        content: "Due to maintenance work, this weekend's practice session will be held at Memorial Park instead of our usual grounds. Same timing applies.",
        createdBy: coach.id,
        targetGroups: ["Under 12s", "Under 14s"],
        academyId: academyId,
        createdAt: new Date(new Date().setDate(new Date().getDate() - 4)) // 4 days ago
      },
      {
        title: "New Nutrition Plan Available",
        content: "We've updated the nutrition plans for all age groups. Please check the meal plan section for detailed information. Nutritionist Q&A session next Tuesday.",
        createdBy: coach.id,
        targetGroups: ["All"],
        academyId: academyId,
        createdAt: new Date(new Date().setDate(new Date().getDate() - 7)) // 1 week ago
      }
    ];

    for (const announcement of announcementsData) {
      const announcementExists = await db.query.announcements.findFirst({
        where: (announcements, { and, eq }) => and(
          eq(announcements.title, announcement.title),
          eq(announcements.content, announcement.content)
        )
      });

      if (!announcementExists) {
        await db.insert(schema.announcements).values(announcement);
      }
    }

    // Create sample payments
    if (players.length > 0) {
      const paymentsData = [
        {
          playerId: players[1].id, // Maya Williams
          amount: "85.00", // Convert to string as per schema
          paymentType: "Monthly Fee",
          dueDate: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString().split('T')[0], // 3 days ago
          status: "pending",
          notes: "Monthly training fee",
          academyId: academyId
        },
        {
          playerId: players[3].id, // Jake Harrison
          amount: "45.00", // Convert to string as per schema
          paymentType: "Equipment Fee",
          dueDate: new Date().toISOString().split('T')[0], // Today
          status: "pending",
          notes: "Cricket gear purchase",
          academyId: academyId
        },
        {
          playerId: players[2].id, // Ethan Chen
          amount: "120.00", // Convert to string as per schema
          paymentType: "Tournament Fee",
          dueDate: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0], // 5 days from now
          status: "pending",
          notes: "Summer tournament registration",
          academyId: academyId
        }
      ];

      for (const payment of paymentsData) {
        const paymentExists = await db.query.payments.findFirst({
          where: (payments, { and, eq }) => and(
            eq(payments.playerId, payment.playerId),
            eq(payments.amount, payment.amount),
            eq(payments.paymentType, payment.paymentType)
          )
        });

        if (!paymentExists) {
          await db.insert(schema.payments).values(payment);
        }
      }
    }

    console.log("Database seeded successfully!");

  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seed();
