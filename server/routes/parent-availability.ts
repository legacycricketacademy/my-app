import { Router } from "express";
import { db } from "../../db";
import { sessions, sessionAvailability, players, users } from "../../shared/schema";
import { eq, and, gte, desc } from "drizzle-orm";
import { z } from "zod";

const router = Router();

// Validation schema for availability status
const availabilityStatusSchema = z.object({
  status: z.enum(["yes", "no", "maybe"]),
});

// GET /api/parent/kids/:kidId/sessions - Get upcoming sessions for a kid
router.get("/kids/:kidId/sessions", async (req, res) => {
  try {
    const kidId = parseInt(req.params.kidId);
    const parentId = req.user?.id;

    if (!parentId) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    // Verify the kid belongs to this parent
    const kid = await db.query.players.findFirst({
      where: and(
        eq(players.id, kidId),
        eq(players.parentId, parentId)
      ),
    });

    if (!kid) {
      return res.status(403).json({ 
        success: false, 
        message: "You don't have permission to view this kid's sessions" 
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
      })
      .from(sessions)
      .where(
        and(
          eq(sessions.ageGroup, kid.ageGroup),
          gte(sessions.startTime, new Date())
        )
      )
      .orderBy(sessions.startTime)
      .limit(20);

    // Get coach names
    const coachIds = [...new Set(upcomingSessions.map(s => s.coachId))];
    const coaches = await db.query.users.findMany({
      where: (users, { inArray }) => inArray(users.id, coachIds),
      columns: { id: true, fullName: true },
    });

    const coachMap = new Map(coaches.map(c => [c.id, c.fullName]));

    // Get availability status for each session
    const sessionIds = upcomingSessions.map(s => s.id);
    const availabilities = await db.query.sessionAvailability.findMany({
      where: and(
        (sessionAvailability, { inArray }) => inArray(sessionAvailability.sessionId, sessionIds),
        eq(sessionAvailability.playerId, kidId)
      ),
    });

    const availabilityMap = new Map(
      availabilities.map(a => [a.sessionId, a.status])
    );

    // Combine session data with availability
    const sessionsWithAvailability = upcomingSessions.map(session => ({
      ...session,
      coachName: coachMap.get(session.coachId) || "Unknown",
      availabilityStatus: availabilityMap.get(session.id) || null,
    }));

    return res.json({
      success: true,
      data: sessionsWithAvailability,
    });
  } catch (error) {
    console.error("Error fetching kid sessions:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to fetch sessions" 
    });
  }
});

// POST /api/parent/sessions/:sessionId/availability - Update availability for a session
router.post("/sessions/:sessionId/availability", async (req, res) => {
  try {
    const sessionId = parseInt(req.params.sessionId);
    const parentId = req.user?.id;
    const { playerId } = req.body;

    if (!parentId) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    // Validate request body
    const validation = availabilityStatusSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid status value. Must be 'yes', 'no', or 'maybe'" 
      });
    }

    const { status } = validation.data;

    if (!playerId) {
      return res.status(400).json({ 
        success: false, 
        message: "playerId is required" 
      });
    }

    // Verify the kid belongs to this parent
    const kid = await db.query.players.findFirst({
      where: and(
        eq(players.id, playerId),
        eq(players.parentId, parentId)
      ),
    });

    if (!kid) {
      return res.status(403).json({ 
        success: false, 
        message: "You don't have permission to update availability for this kid" 
      });
    }

    // Verify the session exists and matches the kid's age group
    const session = await db.query.sessions.findFirst({
      where: eq(sessions.id, sessionId),
    });

    if (!session) {
      return res.status(404).json({ 
        success: false, 
        message: "Session not found" 
      });
    }

    if (session.ageGroup !== kid.ageGroup) {
      return res.status(400).json({ 
        success: false, 
        message: "This session is not for your kid's age group" 
      });
    }

    // Check if availability record exists
    const existingAvailability = await db.query.sessionAvailability.findFirst({
      where: and(
        eq(sessionAvailability.sessionId, sessionId),
        eq(sessionAvailability.playerId, playerId)
      ),
    });

    if (existingAvailability) {
      // Update existing record
      await db
        .update(sessionAvailability)
        .set({
          status,
          respondedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(sessionAvailability.id, existingAvailability.id));
    } else {
      // Create new record
      await db.insert(sessionAvailability).values({
        sessionId,
        playerId,
        status,
        respondedAt: new Date(),
      });
    }

    return res.json({
      success: true,
      message: "Availability updated successfully",
      data: { status },
    });
  } catch (error) {
    console.error("Error updating availability:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to update availability" 
    });
  }
});

export default router;
