import { Router, type Express } from "express";
import { db } from "@db";
import { players, sessions, sessionAttendances, fitnessRecords, users, sessionAvailability } from "@/shared/schema";
import { battingMetrics, bowlingMetrics, fieldingMetrics, disciplineMetrics, coachNotes } from "../../db/kid-metrics-schema";
import { eq, and, desc, gte, sql } from "drizzle-orm";

export const kidDashboardRouter = Router();

// Helper function to calculate age from date of birth
function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function registerKidDashboardRoutes(app: Express) {
  // GET /api/parent/kids - Get list of kids for current parent
  app.get("/api/parent/kids", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
      }

      // Only parents can access this endpoint
      if (req.user.role !== "parent") {
        return res.status(403).json({ success: false, message: "Access denied. Parents only." });
      }

      const parentId = req.user.id;

      // Get all kids for this parent
      const kids = await db
        .select({
          id: players.id,
          firstName: players.firstName,
          lastName: players.lastName,
          dateOfBirth: players.dateOfBirth,
          ageGroup: players.ageGroup,
          location: players.location,
          profileImage: players.profileImage,
        })
        .from(players)
        .where(eq(players.parentId, parentId));

      // Add calculated age to each kid
      const kidsWithAge = kids.map(kid => ({
        ...kid,
        age: calculateAge(new Date(kid.dateOfBirth)),
        fullName: `${kid.firstName} ${kid.lastName}`,
      }));

      return res.json({
        success: true,
        data: kidsWithAge,
      });
    } catch (error: any) {
      console.error("Error fetching kids:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch kids",
        error: error.message,
      });
    }
  });

  // GET /api/parent/kids/:kidId/dashboard - Get complete dashboard data for a specific kid
  app.get("/api/parent/kids/:kidId/dashboard", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
      }

      // Only parents can access this endpoint
      if (req.user.role !== "parent") {
        return res.status(403).json({ success: false, message: "Access denied. Parents only." });
      }

      const parentId = req.user.id;
      const kidId = parseInt(req.params.kidId);

      if (isNaN(kidId)) {
        return res.status(400).json({ success: false, message: "Invalid kid ID" });
      }

      // Verify this kid belongs to this parent
      const kid = await db
        .select()
        .from(players)
        .where(and(eq(players.id, kidId), eq(players.parentId, parentId)))
        .limit(1);

      if (kid.length === 0) {
        return res.status(404).json({ success: false, message: "Kid not found or access denied" });
      }

      const kidData = kid[0];

      // Get latest fitness metrics
      const latestFitness = await db
        .select()
        .from(fitnessRecords)
        .where(eq(fitnessRecords.playerId, kidId))
        .orderBy(desc(fitnessRecords.recordDate))
        .limit(1);

      // Get latest batting metrics
      const latestBatting = await db
        .select()
        .from(battingMetrics)
        .where(eq(battingMetrics.playerId, kidId))
        .orderBy(desc(battingMetrics.recordDate))
        .limit(1);

      // Get latest bowling metrics
      const latestBowling = await db
        .select()
        .from(bowlingMetrics)
        .where(eq(bowlingMetrics.playerId, kidId))
        .orderBy(desc(bowlingMetrics.recordDate))
        .limit(1);

      // Get latest fielding metrics
      const latestFielding = await db
        .select()
        .from(fieldingMetrics)
        .where(eq(fieldingMetrics.playerId, kidId))
        .orderBy(desc(fieldingMetrics.recordDate))
        .limit(1);

      // Get latest discipline metrics
      const latestDiscipline = await db
        .select()
        .from(disciplineMetrics)
        .where(eq(disciplineMetrics.playerId, kidId))
        .orderBy(desc(disciplineMetrics.recordDate))
        .limit(1);

      // Get attendance summary
      const attendanceData = await db
        .select({
          attended: sessionAttendances.attended,
        })
        .from(sessionAttendances)
        .where(eq(sessionAttendances.playerId, kidId));

      const totalSessions = attendanceData.length;
      const attendedSessions = attendanceData.filter(a => a.attended).length;
      const missedSessions = totalSessions - attendedSessions;

      // Get last session date
      const lastSession = await db
        .select({
          startTime: sessions.startTime,
        })
        .from(sessionAttendances)
        .innerJoin(sessions, eq(sessionAttendances.sessionId, sessions.id))
        .where(eq(sessionAttendances.playerId, kidId))
        .orderBy(desc(sessions.startTime))
        .limit(1);

      // Get upcoming sessions (next 4 weeks)
      const fourWeeksFromNow = new Date();
      fourWeeksFromNow.setDate(fourWeeksFromNow.getDate() + 28);

      const upcomingSessions = await db
        .select({
          id: sessions.id,
          title: sessions.title,
          description: sessions.description,
          sessionType: sessions.sessionType,
          location: sessions.location,
          startTime: sessions.startTime,
          endTime: sessions.endTime,
          coachName: users.fullName,
          availabilityStatus: sessionAvailability.status,
        })
        .from(sessions)
        .leftJoin(users, eq(sessions.coachId, users.id))
        .leftJoin(
          sessionAvailability,
          and(
            eq(sessionAvailability.sessionId, sessions.id),
            eq(sessionAvailability.playerId, kidId)
          )
        )
        .where(
          and(
            eq(sessions.ageGroup, kidData.ageGroup),
            gte(sessions.startTime, new Date())
          )
        )
        .orderBy(sessions.startTime)
        .limit(10);

      // Get recent coach notes (last 5)
      const recentNotes = await db
        .select({
          id: coachNotes.id,
          content: coachNotes.content,
          noteDate: coachNotes.noteDate,
          category: coachNotes.category,
          coachName: users.fullName,
        })
        .from(coachNotes)
        .leftJoin(users, eq(coachNotes.coachId, users.id))
        .where(eq(coachNotes.playerId, kidId))
        .orderBy(desc(coachNotes.noteDate))
        .limit(5);

      // Build response
      const dashboardData = {
        kid: {
          id: kidData.id,
          firstName: kidData.firstName,
          lastName: kidData.lastName,
          fullName: `${kidData.firstName} ${kidData.lastName}`,
          dateOfBirth: kidData.dateOfBirth,
          age: calculateAge(new Date(kidData.dateOfBirth)),
          ageGroup: kidData.ageGroup,
          location: kidData.location,
          profileImage: kidData.profileImage,
        },
        fitness: latestFitness[0] || null,
        batting: latestBatting[0] || null,
        bowling: latestBowling[0] || null,
        fielding: latestFielding[0] || null,
        discipline: latestDiscipline[0] || null,
        attendance: {
          total: totalSessions,
          attended: attendedSessions,
          missed: missedSessions,
          lastSessionDate: lastSession[0]?.startTime || null,
        },
        upcomingSessions: upcomingSessions,
        recentNotes: recentNotes,
      };

      return res.json({
        success: true,
        data: dashboardData,
      });
    } catch (error: any) {
      console.error("Error fetching kid dashboard:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch kid dashboard",
        error: error.message,
      });
    }
  });

  // POST /api/parent/kids/:kidId/sessions/:sessionId/availability - Update session availability
  app.post("/api/parent/kids/:kidId/sessions/:sessionId/availability", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: "Not authenticated" });
      }

      // Only parents can access this endpoint
      if (req.user.role !== "parent") {
        return res.status(403).json({ success: false, message: "Access denied. Parents only." });
      }

      const parentId = req.user.id;
      const kidId = parseInt(req.params.kidId);
      const sessionId = parseInt(req.params.sessionId);
      const { status } = req.body;

      if (isNaN(kidId) || isNaN(sessionId)) {
        return res.status(400).json({ success: false, message: "Invalid kid ID or session ID" });
      }

      if (!status || !["yes", "no", "maybe"].includes(status)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid status. Must be 'yes', 'no', or 'maybe'" 
        });
      }

      // Verify this kid belongs to this parent
      const kid = await db
        .select()
        .from(players)
        .where(and(eq(players.id, kidId), eq(players.parentId, parentId)))
        .limit(1);

      if (kid.length === 0) {
        return res.status(404).json({ success: false, message: "Kid not found or access denied" });
      }

      // Verify the session exists and matches the kid's age group
      const session = await db
        .select()
        .from(sessions)
        .where(eq(sessions.id, sessionId))
        .limit(1);

      if (session.length === 0) {
        return res.status(404).json({ success: false, message: "Session not found" });
      }

      if (session[0].ageGroup !== kid[0].ageGroup) {
        return res.status(400).json({ 
          success: false, 
          message: "Session does not match kid's age group" 
        });
      }

      // Check if availability record exists
      const existing = await db
        .select()
        .from(sessionAvailability)
        .where(
          and(
            eq(sessionAvailability.sessionId, sessionId),
            eq(sessionAvailability.playerId, kidId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // Update existing record
        await db
          .update(sessionAvailability)
          .set({
            status,
            respondedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(sessionAvailability.id, existing[0].id));
      } else {
        // Create new record
        await db.insert(sessionAvailability).values({
          sessionId,
          playerId: kidId,
          status,
          respondedAt: new Date(),
        });
      }

      return res.json({
        success: true,
        message: "Availability updated successfully",
        data: { status },
      });
    } catch (error: any) {
      console.error("Error updating availability:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to update availability",
        error: error.message,
      });
    }
  });

  console.log("Kid dashboard routes registered");
}
