import { Express, Request, Response } from "express";
import { sendWelcomeParent, sendChildAdded, sendPaymentReminder, sendTestEmail } from "./services/email";

export function setupApiRoutes(app: Express) {
  // Players API
  app.get('/api/players', async (req: Request, res: Response) => {
    try {
      // Mock data for now - replace with actual database calls
      const players = [
        {
          id: 1,
          firstName: "John",
          lastName: "Doe",
          ageGroup: "Under 12s",
          playerType: "Batsman",
          parentEmail: "parent@example.com",
          parentName: "Jane Doe",
          dateOfBirth: "2010-05-15",
          emergencyContact: "555-0123",
          medicalInformation: "None",
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          firstName: "Sarah",
          lastName: "Smith",
          ageGroup: "Under 14s",
          playerType: "Bowler",
          parentEmail: "sarah.parent@example.com",
          parentName: "Mike Smith",
          dateOfBirth: "2008-03-22",
          emergencyContact: "555-0456",
          medicalInformation: "Asthma",
          createdAt: new Date().toISOString()
        }
      ];
      
      res.json(players);
    } catch (error) {
      console.error('Error fetching players:', error);
      res.status(500).json({ error: 'Failed to fetch players' });
    }
  });

  app.post('/api/players', async (req: Request, res: Response) => {
    try {
      const { firstName, lastName, dateOfBirth, ageGroup, playerType, emergencyContact, medicalInformation, parentEmail, parentName } = req.body;
      
      // Validate required fields
      if (!firstName || !lastName || !dateOfBirth || !ageGroup || !parentEmail || !parentName) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // Mock creation - replace with actual database insert
      const newPlayer = {
        id: Date.now(), // Mock ID
        firstName,
        lastName,
        dateOfBirth,
        ageGroup,
        playerType: playerType || 'Batsman',
        emergencyContact: emergencyContact || '',
        medicalInformation: medicalInformation || '',
        parentEmail,
        parentName,
        createdAt: new Date().toISOString()
      };
      
      // Send child added notification email
      try {
        await sendChildAdded(parentEmail, parentName, `${firstName} ${lastName}`);
      } catch (error) {
        console.error('Failed to send child added email:', error);
        // Don't fail the request if email fails
      }
      
      res.status(201).json(newPlayer);
    } catch (error) {
      console.error('Error creating player:', error);
      res.status(500).json({ error: 'Failed to create player' });
    }
  });

  // Sessions API
  app.get('/api/sessions', async (req: Request, res: Response) => {
    try {
      // Mock data for now - replace with actual database calls
      const sessions = [
        {
          id: 1,
          title: "Batting Practice",
          description: "Focus on technique and timing",
          startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
          location: "Main Ground",
          ageGroup: "Under 12s",
          sessionType: "Training",
          maxAttendees: 20,
          currentAttendees: 15,
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          title: "Fitness Session",
          description: "Cardio and strength training",
          startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(),
          location: "Gym",
          ageGroup: "Under 14s",
          sessionType: "Fitness",
          maxAttendees: 15,
          currentAttendees: 12,
          createdAt: new Date().toISOString()
        }
      ];
      
      res.json(sessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      res.status(500).json({ error: 'Failed to fetch sessions' });
    }
  });

  app.get('/api/sessions/today', async (req: Request, res: Response) => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
      
      // Mock data for today's sessions
      const todaySessions = [
        {
          id: 1,
          title: "Morning Training",
          startTime: new Date(today.getTime() + 9 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(today.getTime() + 11 * 60 * 60 * 1000).toISOString(),
          location: "Ground A",
          ageGroup: "Under 12s",
          sessionType: "Training",
          maxAttendees: 20,
          currentAttendees: 18
        }
      ];
      
      res.json(todaySessions);
    } catch (error) {
      console.error('Error fetching today\'s sessions:', error);
      res.status(500).json({ error: 'Failed to fetch today\'s sessions' });
    }
  });

  app.get('/api/sessions/upcoming', async (req: Request, res: Response) => {
    try {
      // Mock data for upcoming sessions
      const upcomingSessions = [
        {
          id: 2,
          title: "Weekend Match Practice",
          startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
          location: "Main Ground",
          ageGroup: "Under 14s",
          sessionType: "Practice Match",
          maxAttendees: 22,
          currentAttendees: 20
        }
      ];
      
      res.json(upcomingSessions);
    } catch (error) {
      console.error('Error fetching upcoming sessions:', error);
      res.status(500).json({ error: 'Failed to fetch upcoming sessions' });
    }
  });

  app.get('/api/sessions/all', async (req: Request, res: Response) => {
    try {
      // Mock data for all sessions
      const allSessions = [
        {
          id: 1,
          title: "Batting Practice",
          startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
          location: "Main Ground",
          ageGroup: "Under 12s",
          sessionType: "Training",
          maxAttendees: 20,
          currentAttendees: 15
        },
        {
          id: 2,
          title: "Fitness Session",
          startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000).toISOString(),
          location: "Gym",
          ageGroup: "Under 14s",
          sessionType: "Fitness",
          maxAttendees: 15,
          currentAttendees: 12
        }
      ];
      
      res.json(allSessions);
    } catch (error) {
      console.error('Error fetching all sessions:', error);
      res.status(500).json({ error: 'Failed to fetch all sessions' });
    }
  });

  app.post('/api/sessions', async (req: Request, res: Response) => {
    try {
      const { title, description, startTime, endTime, location, ageGroup, sessionType, maxAttendees } = req.body;
      
      // Validate required fields
      if (!title || !startTime || !endTime || !location || !ageGroup || !sessionType || !maxAttendees) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // Validate dates
      const start = new Date(startTime);
      const end = new Date(endTime);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
      }
      
      if (end <= start) {
        return res.status(400).json({ error: 'End time must be after start time' });
      }
      
      // Mock creation - replace with actual database insert
      const newSession = {
        id: Date.now(), // Mock ID
        title,
        description: description || '',
        startTime,
        endTime,
        location,
        ageGroup,
        sessionType,
        maxAttendees: parseInt(maxAttendees),
        currentAttendees: 0,
        createdAt: new Date().toISOString()
      };
      
      res.status(201).json(newSession);
    } catch (error) {
      console.error('Error creating session:', error);
      res.status(500).json({ error: 'Failed to create session' });
    }
  });

  // Payments API
  app.get('/api/payments', async (req: Request, res: Response) => {
    try {
      // Mock data for now - replace with actual database calls
      const payments = [
        {
          id: 1,
          playerId: 1,
          playerName: "John Doe",
          amount: 175,
          status: "pending",
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          description: "Monthly Training Fee",
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          playerId: 2,
          playerName: "Sarah Smith",
          amount: 175,
          status: "paid",
          dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          description: "Monthly Training Fee",
          paidAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString()
        }
      ];
      
      res.json(payments);
    } catch (error) {
      console.error('Error fetching payments:', error);
      res.status(500).json({ error: 'Failed to fetch payments' });
    }
  });

  app.get('/api/payments/pending', async (req: Request, res: Response) => {
    try {
      // Mock data for pending payments
      const pendingPayments = [
        {
          id: 1,
          playerId: 1,
          playerName: "John Doe",
          amount: 175,
          status: "pending",
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          description: "Monthly Training Fee",
          createdAt: new Date().toISOString()
        },
        {
          id: 3,
          playerId: 3,
          playerName: "Mike Johnson",
          amount: 200,
          status: "overdue",
          dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          description: "Equipment Fee",
          createdAt: new Date().toISOString()
        }
      ];
      
      res.json(pendingPayments);
    } catch (error) {
      console.error('Error fetching pending payments:', error);
      res.status(500).json({ error: 'Failed to fetch pending payments' });
    }
  });

  app.post('/api/payments', async (req: Request, res: Response) => {
    try {
      const { playerId, amount, description, dueDate } = req.body;
      
      // Validate required fields
      if (!playerId || !amount || !description) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // Mock creation - replace with actual database insert
      const newPayment = {
        id: Date.now(), // Mock ID
        playerId: parseInt(playerId),
        playerName: "Player Name", // Would be fetched from player data
        amount: parseFloat(amount),
        status: "pending",
        dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        description,
        createdAt: new Date().toISOString()
      };
      
      res.status(201).json(newPayment);
    } catch (error) {
      console.error('Error creating payment:', error);
      res.status(500).json({ error: 'Failed to create payment' });
    }
  });

  app.post('/api/payments/:id/remind', async (req: Request, res: Response) => {
    try {
      const paymentId = req.params.id;
      
      // Find the payment (mock data)
      const payment = {
        id: parseInt(paymentId),
        playerId: 1,
        playerName: "John Doe",
        amount: 175,
        status: "pending",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        description: "Monthly Training Fee",
        parentEmail: "parent@example.com",
        parentName: "Jane Doe"
      };
      
      if (!payment) {
        return res.status(404).json({ error: 'Payment not found' });
      }
      
      // Send payment reminder email
      try {
        await sendPaymentReminder(
          payment.parentEmail, 
          payment.parentName, 
          payment.amount, 
          payment.dueDate
        );
      } catch (error) {
        console.error('Failed to send payment reminder email:', error);
        // Don't fail the request if email fails
      }
      
      res.json({ 
        message: 'Payment reminder sent successfully',
        paymentId: parseInt(paymentId)
      });
    } catch (error) {
      console.error('Error sending payment reminder:', error);
      res.status(500).json({ error: 'Failed to send payment reminder' });
    }
  });

  // Additional API endpoints that the dashboard components expect
  app.get('/api/connection-requests', async (req: Request, res: Response) => {
    try {
      // Mock data for connection requests
      const requests = [
        {
          id: 1,
          playerName: "Alex Brown",
          parentName: "Lisa Brown",
          status: "pending",
          requestedAt: new Date().toISOString()
        }
      ];
      
      res.json(requests);
    } catch (error) {
      console.error('Error fetching connection requests:', error);
      res.status(500).json({ error: 'Failed to fetch connection requests' });
    }
  });

  app.get('/api/announcements/recent', async (req: Request, res: Response) => {
    try {
      // Mock data for recent announcements
      const announcements = [
        {
          id: 1,
          title: "Tournament Registration Open",
          message: "Registration for the summer tournament is now open. Please contact your coach for details.",
          createdAt: new Date().toISOString()
        }
      ];
      
      res.json(announcements);
    } catch (error) {
      console.error('Error fetching recent announcements:', error);
      res.status(500).json({ error: 'Failed to fetch recent announcements' });
    }
  });

  app.get('/api/fitness/team-progress', async (req: Request, res: Response) => {
    try {
      // Mock data for fitness team progress
      const progress = {
        period: "this_month",
        totalSessions: 12,
        averageAttendance: 85,
        topPerformers: [
          { name: "John Doe", improvement: "+15%" },
          { name: "Sarah Smith", improvement: "+12%" }
        ]
      };
      
      res.json(progress);
    } catch (error) {
      console.error('Error fetching fitness team progress:', error);
      res.status(500).json({ error: 'Failed to fetch fitness team progress' });
    }
  });

  app.get('/api/meal-plans/age-group/:ageGroup', async (req: Request, res: Response) => {
    try {
      const { ageGroup } = req.params;
      
      // Mock data for meal plans
      const mealPlan = {
        id: 1,
        ageGroup,
        name: `${ageGroup} Nutrition Plan`,
        description: "Balanced nutrition plan for optimal performance",
        meals: [
          { type: "Breakfast", description: "Oatmeal with fruits" },
          { type: "Lunch", description: "Grilled chicken with vegetables" },
          { type: "Dinner", description: "Fish with rice and salad" }
        ]
      };
      
      res.json(mealPlan);
    } catch (error) {
      console.error('Error fetching meal plan:', error);
      res.status(500).json({ error: 'Failed to fetch meal plan' });
    }
  });

  // Development test email endpoint
  if (process.env.NODE_ENV === 'development') {
    app.post('/api/dev/test-email', async (req: Request, res: Response) => {
      try {
        const success = await sendTestEmail();
        res.json({ 
          message: success ? 'Test email sent successfully' : 'Failed to send test email',
          success
        });
      } catch (error) {
        console.error('Error sending test email:', error);
        res.status(500).json({ error: 'Failed to send test email' });
      }
    });
  }
}
