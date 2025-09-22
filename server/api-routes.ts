import { Express, Request, Response } from "express";
import { sendWelcomeParent, sendChildAdded, sendPaymentReminder, sendTestEmail } from "./services/email";
import { requireAuth, requireRole } from "./auth/verifyToken";

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

  app.post('/api/players', requireAuth, async (req: Request, res: Response) => {
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

  app.post('/api/sessions', requireAuth, async (req: Request, res: Response) => {
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

  app.post('/api/payments', requireAuth, async (req: Request, res: Response) => {
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

  app.post('/api/payments/:id/remind', requireAuth, async (req: Request, res: Response) => {
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

  // Send all payment reminders endpoint
  app.post('/api/payments/send-all-reminders', requireAuth, async (req: Request, res: Response) => {
    try {
      // Get all pending payments (mock data)
      const pendingPayments = [
        {
          id: 1,
          playerId: 1,
          playerName: "John Doe",
          amount: 175,
          status: "pending",
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          description: "Monthly Training Fee",
          parentEmail: "parent@example.com",
          parentName: "Jane Doe"
        },
        {
          id: 2,
          playerId: 2,
          playerName: "Sarah Smith",
          amount: 200,
          status: "pending",
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          description: "Monthly Training Fee",
          parentEmail: "sarah.parent@example.com",
          parentName: "Mike Smith"
        }
      ];
      
      const results = [];
      
      // Send reminders for all pending payments
      for (const payment of pendingPayments) {
        try {
          await sendPaymentReminder(
            payment.parentEmail, 
            payment.parentName, 
            payment.amount, 
            payment.dueDate
          );
          
          results.push({
            paymentId: payment.id,
            playerName: payment.playerName,
            parentEmail: payment.parentEmail,
            status: 'sent'
          });
        } catch (error) {
          console.error(`Failed to send reminder for payment ${payment.id}:`, error);
          results.push({
            paymentId: payment.id,
            playerName: payment.playerName,
            parentEmail: payment.parentEmail,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      const successCount = results.filter(r => r.status === 'sent').length;
      const failureCount = results.filter(r => r.status === 'failed').length;
      
      res.json({ 
        message: `Payment reminders sent: ${successCount} successful, ${failureCount} failed`,
        totalSent: successCount,
        totalFailed: failureCount,
        results
      });
    } catch (error) {
      console.error('Error sending all payment reminders:', error);
      res.status(500).json({ error: 'Failed to send payment reminders' });
    }
  });

  // Notifications endpoint for parents
  app.get('/api/notifications', requireAuth, async (req: Request, res: Response) => {
    try {
      // Get user from auth (mock for now)
      const userId = req.user?.id || '1';
      
      // Mock notifications data
      const notifications = [
        {
          id: 1,
          type: 'payment_reminder',
          title: 'Payment Reminder',
          message: 'Payment of $175 for John Doe is due in 7 days',
          isRead: false,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          actionUrl: '/payments'
        },
        {
          id: 2,
          type: 'session_reminder',
          title: 'Session Reminder',
          message: 'Practice session tomorrow at 4:00 PM',
          isRead: false,
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
          actionUrl: '/schedule'
        },
        {
          id: 3,
          type: 'payment_reminder',
          title: 'Payment Reminder',
          message: 'Payment of $200 for Sarah Smith is due in 3 days',
          isRead: true,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
          actionUrl: '/payments'
        }
      ];
      
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  });

  // Mark notification as read
  app.patch('/api/notifications/:id/read', requireAuth, async (req: Request, res: Response) => {
    try {
      const notificationId = req.params.id;
      
      // Mock: mark notification as read
      console.log(`Marking notification ${notificationId} as read`);
      
      res.json({ 
        message: 'Notification marked as read',
        notificationId: parseInt(notificationId)
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  });

  // Dashboard stats endpoint
  app.get('/api/dashboard/stats', async (req: Request, res: Response) => {
    try {
      // Return mock dashboard stats for now
      const stats = {
        playerCount: 25,
        sessionCount: 8,
        pendingPaymentsTotal: 1250.00,
        pendingPaymentsCount: 5,
        announcementCount: 3,
        lastAnnouncementDate: new Date().toISOString()
      };
      res.json(stats);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard stats' });
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

  // Schedule routes
  app.get('/api/schedule/parent', requireAuth, async (req: Request, res: Response) => {
    try {
      const { from, to, kidIds } = req.query;
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Mock schedule data with RSVP status - replace with actual database queries
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date(now);
      dayAfter.setDate(dayAfter.getDate() + 2);
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);

      const schedule = [
        {
          id: 1,
          type: 'practice',
          teamId: 1,
          teamName: 'Under 12s A',
          start: tomorrow.toISOString(),
          end: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000).toISOString(), // +2 hours
          location: 'Field 1',
          notes: 'Focus on batting technique',
          myKidsStatus: [
            { playerId: 1, status: 'going' },
            { playerId: 2, status: 'maybe' }
          ]
        },
        {
          id: 2,
          type: 'game',
          teamId: 1,
          teamName: 'Under 12s A',
          start: dayAfter.toISOString(),
          end: new Date(dayAfter.getTime() + 2 * 60 * 60 * 1000).toISOString(), // +2 hours
          location: 'Cricket Ground',
          opponent: 'Riverside CC',
          notes: 'League match',
          myKidsStatus: [
            { playerId: 1, status: 'going' },
            { playerId: 2, status: 'no' }
          ]
        },
        {
          id: 3,
          type: 'practice',
          teamId: 2,
          teamName: 'Under 14s B',
          start: nextWeek.toISOString(),
          end: new Date(nextWeek.getTime() + 2 * 60 * 60 * 1000).toISOString(), // +2 hours
          location: 'Field 2',
          notes: 'Bowling practice',
          myKidsStatus: []
        }
      ];
      
      res.json(schedule);
    } catch (error) {
      console.error('Error fetching parent schedule:', error);
      res.status(500).json({ error: 'Failed to fetch parent schedule' });
    }
  });

  app.get('/api/schedule/admin', requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const { from, to } = req.query;
      
      // Mock admin schedule data - replace with actual database queries
      const schedule = [
        {
          id: 1,
          type: 'practice',
          teamId: 1,
          teamName: 'Under 12s A',
          start: '2024-01-15T10:00:00Z',
          end: '2024-01-15T12:00:00Z',
          location: 'Field 1',
          notes: 'Focus on batting technique'
        },
        {
          id: 2,
          type: 'game',
          teamId: 1,
          teamName: 'Under 12s A',
          start: '2024-01-20T14:00:00Z',
          end: '2024-01-20T16:00:00Z',
          location: 'Cricket Ground',
          opponent: 'Riverside CC',
          notes: 'League match'
        },
        {
          id: 3,
          type: 'practice',
          teamId: 2,
          teamName: 'Under 14s B',
          start: '2024-01-16T16:00:00Z',
          end: '2024-01-16T18:00:00Z',
          location: 'Field 2',
          notes: 'Bowling practice'
        },
        {
          id: 4,
          type: 'game',
          teamId: 3,
          teamName: 'Under 16s A',
          start: '2024-01-18T10:00:00Z',
          end: '2024-01-18T12:00:00Z',
          location: 'Main Ground',
          opponent: 'City CC',
          notes: 'Friendly match'
        }
      ];
      
      res.json(schedule);
    } catch (error) {
      console.error('Error fetching admin schedule:', error);
      res.status(500).json({ error: 'Failed to fetch admin schedule' });
    }
  });

  // RSVP routes
  app.get('/api/rsvps', requireAuth, async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.query;
      const userId = req.user?.id;
      const userRole = req.user?.role;
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      if (!sessionId) {
        return res.status(400).json({ error: 'sessionId is required' });
      }

      // Mock RSVP data - replace with actual database queries
      const rsvpData = {
        sessionId: parseInt(sessionId as string),
        counts: {
          going: 8,
          maybe: 3,
          no: 2
        },
        byPlayer: userRole === 'admin' ? [
          { playerId: 1, playerName: 'John Doe', status: 'going', comment: 'Looking forward to it!' },
          { playerId: 2, playerName: 'Jane Smith', status: 'maybe', comment: 'Depends on weather' },
          { playerId: 3, playerName: 'Mike Johnson', status: 'no', comment: 'Family conflict' },
          { playerId: 4, playerName: 'Sarah Wilson', status: 'going' },
          { playerId: 5, playerName: 'Alex Brown', status: 'going' }
        ] : [
          { playerId: 1, playerName: 'John Doe', status: 'going', comment: 'Looking forward to it!' },
          { playerId: 2, playerName: 'Jane Smith', status: 'maybe', comment: 'Depends on weather' }
        ]
      };
      
      res.json(rsvpData);
    } catch (error) {
      console.error('Error fetching RSVPs:', error);
      res.status(500).json({ error: 'Failed to fetch RSVPs' });
    }
  });

  app.post('/api/rsvps', requireAuth, async (req: Request, res: Response) => {
    try {
      const { sessionId, playerId, status, comment } = req.body;
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Validate required fields
      if (!sessionId || !playerId || !status) {
        return res.status(400).json({ error: 'sessionId, playerId, and status are required' });
      }

      // Validate status enum
      if (!['going', 'maybe', 'no'].includes(status)) {
        return res.status(400).json({ error: 'status must be one of: going, maybe, no' });
      }

      // Mock authorization check - parent can only RSVP for their own kids
      // In real implementation, check family relationship table
      const allowedPlayerIds = [1, 2]; // Mock: parent can RSVP for players 1 and 2
      if (!allowedPlayerIds.includes(parseInt(playerId))) {
        return res.status(403).json({ error: 'Not authorized to RSVP for this player' });
      }

      // Mock RSVP upsert - replace with actual database operation
      const rsvp = {
        id: Date.now(),
        sessionId: parseInt(sessionId),
        playerId: parseInt(playerId),
        parentUserId: userId,
        status,
        comment: comment || null,
        updatedAt: new Date().toISOString()
      };
      
      res.json(rsvp);
    } catch (error) {
      console.error('Error creating/updating RSVP:', error);
      res.status(500).json({ error: 'Failed to create/update RSVP' });
    }
  });

  // Admin session CRUD routes
  app.get('/api/admin/sessions', requireRole('admin'), async (req: Request, res: Response) => {
    try {
      // Mock sessions data - replace with actual database queries
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date(now);
      dayAfter.setDate(dayAfter.getDate() + 2);
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);

      const sessions = [
        {
          id: 1,
          type: 'practice',
          teamId: 1,
          teamName: 'Under 12s A',
          start: tomorrow.toISOString(),
          end: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000).toISOString(),
          location: 'Field 1',
          notes: 'Focus on batting technique',
          createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 2,
          type: 'game',
          teamId: 1,
          teamName: 'Under 12s A',
          start: dayAfter.toISOString(),
          end: new Date(dayAfter.getTime() + 2 * 60 * 60 * 1000).toISOString(),
          location: 'Cricket Ground',
          opponent: 'Riverside CC',
          notes: 'League match',
          createdAt: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 3,
          type: 'practice',
          teamId: 2,
          teamName: 'Under 14s B',
          start: nextWeek.toISOString(),
          end: new Date(nextWeek.getTime() + 2 * 60 * 60 * 1000).toISOString(),
          location: 'Field 2',
          notes: 'Bowling practice',
          createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString()
        }
      ];
      
      res.json(sessions);
    } catch (error) {
      console.error('Error fetching admin sessions:', error);
      res.status(500).json({ error: 'Failed to fetch sessions' });
    }
  });

  app.post('/api/admin/sessions', requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const { type, teamId, teamName, start, end, location, opponent, notes } = req.body;
      
      // Validate required fields
      if (!type || !teamId || !teamName || !start || !end || !location) {
        return res.status(400).json({ error: 'type, teamId, teamName, start, end, and location are required' });
      }

      // Validate type enum
      if (!['practice', 'game'].includes(type)) {
        return res.status(400).json({ error: 'type must be either "practice" or "game"' });
      }

      // Mock session creation - replace with actual database operation
      const session = {
        id: Date.now(),
        type,
        teamId: parseInt(teamId),
        teamName,
        start,
        end,
        location,
        opponent: opponent || null,
        notes: notes || null,
        createdAt: new Date().toISOString()
      };
      
      res.status(201).json(session);
    } catch (error) {
      console.error('Error creating session:', error);
      res.status(500).json({ error: 'Failed to create session' });
    }
  });

  app.patch('/api/admin/sessions/:id', requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      // Mock session update - replace with actual database operation
      const session = {
        id: parseInt(id),
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      res.json(session);
    } catch (error) {
      console.error('Error updating session:', error);
      res.status(500).json({ error: 'Failed to update session' });
    }
  });

  app.delete('/api/admin/sessions/:id', requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Mock session deletion - replace with actual database operation
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting session:', error);
      res.status(500).json({ error: 'Failed to delete session' });
    }
  });

  // RSVP endpoints for parents
  app.post('/api/schedule/rsvp', requireAuth, async (req: Request, res: Response) => {
    try {
      const { sessionId, playerId, status } = req.body;
      
      // Validate required fields
      if (!sessionId || !playerId || !status) {
        return res.status(400).json({ error: 'Missing required fields: sessionId, playerId, status' });
      }
      
      // Validate status
      if (!['going', 'maybe', 'no'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Must be: going, maybe, or no' });
      }
      
      // Mock RSVP update - replace with actual database operation
      const rsvp = {
        sessionId: parseInt(sessionId),
        playerId: parseInt(playerId),
        status,
        updatedAt: new Date().toISOString()
      };
      
      console.log('RSVP updated:', rsvp);
      res.json({ success: true, rsvp });
    } catch (error) {
      console.error('Error updating RSVP:', error);
      res.status(500).json({ error: 'Failed to update RSVP' });
    }
  });

  // Admin-only routes
  app.get('/api/admin/users', requireRole('admin'), async (req: Request, res: Response) => {
    try {
      // Mock admin data - replace with actual database query
      const users = [
        {
          id: 1,
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'admin',
          lastLogin: new Date().toISOString(),
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          email: 'parent@example.com',
          name: 'Parent User',
          role: 'parent',
          lastLogin: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString()
        }
      ];
      
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  app.get('/api/admin/stats', requireRole('admin'), async (req: Request, res: Response) => {
    try {
      // Mock admin stats - replace with actual database queries
      const stats = {
        totalUsers: 150,
        totalPlayers: 75,
        totalSessions: 200,
        totalRevenue: 15000,
        activeSessions: 12,
        pendingPayments: 8
      };
      
      res.json(stats);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      res.status(500).json({ error: 'Failed to fetch admin stats' });
    }
  });

  app.post('/api/admin/announcements', requireRole('admin'), async (req: Request, res: Response) => {
    try {
      const { title, message, priority } = req.body;
      
      if (!title || !message) {
        return res.status(400).json({ error: 'Title and message are required' });
      }
      
      // Mock announcement creation
      const announcement = {
        id: Date.now(),
        title,
        message,
        priority: priority || 'normal',
        createdAt: new Date().toISOString(),
        createdBy: req.user?.id || 'unknown'
      };
      
      res.status(201).json(announcement);
    } catch (error) {
      console.error('Error creating announcement:', error);
      res.status(500).json({ error: 'Failed to create announcement' });
    }
  });

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
