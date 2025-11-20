import { Router } from "express";
import { db } from "../db";
import { payments, players } from "../../shared/schema";
import { eq, and, inArray } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";

const router = Router();

// GET /api/parent/payments - List all payments for parent's kids
router.get("/", requireAuth, async (req, res) => {
  try {
    const parentId = req.user!.id;

    // Get all kids for this parent
    const kids = await db
      .select()
      .from(players)
      .where(eq(players.parentId, parentId));

    if (kids.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const kidIds = kids.map(k => k.id);

    // Get all payments for these kids
    const allPayments = await db
      .select({
        payment: payments,
        player: players,
      })
      .from(payments)
      .innerJoin(players, eq(payments.playerId, players.id))
      .where(inArray(payments.playerId, kidIds))
      .orderBy(payments.dueDate);

    const result = allPayments.map(({ payment, player }) => ({
      ...payment,
      kidName: `${player.firstName} ${player.lastName}`,
      kidId: player.id,
    }));

    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Error fetching parent payments:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch payments" 
    });
  }
});

// GET /api/parent/payments/:id - Get single payment detail
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const parentId = req.user!.id;
    const paymentId = parseInt(req.params.id);

    if (isNaN(paymentId)) {
      return res.status(400).json({ 
        success: false, 
        error: "Invalid payment ID" 
      });
    }

    // Get payment with kid info
    const result = await db
      .select({
        payment: payments,
        player: players,
      })
      .from(payments)
      .innerJoin(players, eq(payments.playerId, players.id))
      .where(
        and(
          eq(payments.id, paymentId),
          eq(players.parentId, parentId)
        )
      )
      .limit(1);

    if (result.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: "Payment not found" 
      });
    }

    const { payment, player } = result[0];

    res.json({
      success: true,
      data: {
        ...payment,
        kidName: `${player.firstName} ${player.lastName}`,
        kidId: player.id,
      },
    });
  } catch (error: any) {
    console.error("Error fetching payment detail:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch payment detail" 
    });
  }
});

export default router;
