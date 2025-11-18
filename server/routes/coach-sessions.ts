import { Router, Request, Response, NextFunction } from "express";
import { db } from "../../db/index.js";
import { sessions, sessionAvailability, users } from "../../shared/schema.js";
import { eq, gte, sql, and, desc, inArray } from "drizzle-orm";
import { z } from "zod";

const router = Router();

// Middleware to populate req.user from session
// This uses the same pattern as /api/session endpoint
router.use((req: Request, res: Response, next: NextFunction) => {
  // Populate req.user from session if not already set
  if (!req.user && req.session?.userId) {
    req.user = {
      id: req.session.userId,
      role: req.session.role || 'parent'
    };
  }
  next();
});

// Validation schema for creating a session
const createSessionSchema = z.object({
  title: z.string().min(1, "Title is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Start time must be in HH:MM format"),
  durationMinutes: z.number().min(30).max(240).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "End time must be in HH:MM format").optional(),
  location: z.enum(["Strongsville", "Solon"]),
  ageGroup: z.string().min(1, "Age group is required"),
  sessionType: z.string().default("training"),
  description: z.string().optional(),
  maxPlayers: z.number().optional(),
});

// GET /api/coach/sessions - Get upcoming sessions with availability counts
router.get("/sessions", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    // Only coaches and admins can access
    if (req.user.role !== "coach" && req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied. Coaches and admins only." 
      });
    }

    // Get upcoming sessions (next 4 weeks)
    const fourWeeksFromNow = new Date();
    fourWeeksFromNow.setDate(fourWeeksFromNow.getDate() + 28);

    const upcomingSessions = await db
      .select({
        id: sessions.id,
        title: sessions.title,
        description: sessions.description,
        sessionType: sessions.sessionType,
        ageGroup: sessions.ageGroup,
        location: sessions.location,
        startTime: sessions.startTime,
        endTime: sessions.endTime,
        coachId: sessions.coachId,
        maxPlayers: sessions.maxPlayers,
      })
      .from(sessions)
      .where(gte(sessions.startTime, new Date()))
      .orderBy(sessions.startTime)
      .limit(50);

    // Get coach names
    const coachIds = [...new Set(upcomingSessions.map(s => s.coachId))];
    const coaches = coachIds.length > 0 
      ? await db.select({ id: users.id, fullName: users.fullName })
          .from(users)
          .where(inArray(users.id, coachIds))
      : [];

    const coachMap = new Map(coaches.map(c => [c.id, c.fullName]));

    // Get availability counts for each session
    const sessionIds = upcomingSessions.map(s => s.id);
    
    const availabilityCounts = sessionIds.length > 0
      ? await db
          .select({
            sessionId: sessionAvailability.sessionId,
            status: sessionAvailability.status,
            count: sql<number>`count(*)::int`,
          })
          .from(sessionAvailability)
          .where(inArray(sessionAvailability.sessionId, sessionIds))
          .groupBy(sessionAvailability.sessionId, sessionAvailability.status)
      : [];

    // Build availability map
    const availabilityMap = new Map<number, { yesCount: number; noCount: number; maybeCount: number }>();
    
    for (const row of availabilityCounts) {
      if (!availabilityMap.has(row.sessionId)) {
        availabilityMap.set(row.sessionId, { yesCount: 0, noCount: 0, maybeCount: 0 });
      }
      const counts = availabilityMap.get(row.sessionId)!;
      if (row.status === "yes") counts.yesCount = row.count;
      if (row.status === "no") counts.noCount = row.count;
      if (row.status === "maybe") counts.maybeCount = row.count;
    }

    // Combine session data with availability counts
    const sessionsWithAvailability = upcomingSessions.map(session => ({
      ...session,
      coachName: coachMap.get(session.coachId) || "Unknown",
      yesCount: availabilityMap.get(session.id)?.yesCount || 0,
      noCount: availabilityMap.get(session.id)?.noCount || 0,
      maybeCount: availabilityMap.get(session.id)?.maybeCount || 0,
    }));

    return res.json({
      success: true,
      data: sessionsWithAvailability,
    });
  } catch (error) {
    console.error("Error fetching coach sessions:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to fetch sessions" 
    });
  }
});

// POST /api/coach/sessions - Create a new session
router.post("/sessions", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    // Only coaches and admins can create sessions
    if (req.user.role !== "coach" && req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied. Coaches and admins only." 
      });
    }

    // Validate request body
    const validation = createSessionSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid request data",
        errors: validation.error.errors,
      });
    }

    const data = validation.data;

    // Parse date and time to create timestamps
    const startDateTime = new Date(`${data.date}T${data.startTime}:00`);
    
    let endDateTime: Date;
    if (data.endTime) {
      endDateTime = new Date(`${data.date}T${data.endTime}:00`);
    } else if (data.durationMinutes) {
      endDateTime = new Date(startDateTime.getTime() + data.durationMinutes * 60000);
    } else {
      // Default to 90 minutes
      endDateTime = new Date(startDateTime.getTime() + 90 * 60000);
    }

    // Validate that end time is after start time
    if (endDateTime <= startDateTime) {
      return res.status(400).json({ 
        success: false, 
        message: "End time must be after start time" 
      });
    }

    const coachId = typeof req.user.id === 'string' ? parseInt(req.user.id) : req.user.id;

    // Create the session
    const [newSession] = await db
      .insert(sessions)
      .values({
        title: data.title,
        description: data.description || null,
        sessionType: data.sessionType,
        ageGroup: data.ageGroup,
        location: data.location,
        startTime: startDateTime,
        endTime: endDateTime,
        coachId: coachId,
        maxPlayers: data.maxPlayers || null,
      })
      .returning();

    return res.status(201).json({
      success: true,
      message: "Session created successfully",
      data: newSession,
    });
  } catch (error) {
    console.error("Error creating session:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to create session" 
    });
  }
});

export default router;
