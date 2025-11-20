import { db } from "../../server/db";
import { payments, players, users } from "../../shared/schema";
import { eq } from "drizzle-orm";

export interface PaymentFixture {
  id: number;
  playerId: number;
  amount: string;
  paymentType: string;
  month: string;
  dueDate: string;
  status: string;
}

export async function createPaymentForPlayer(
  playerId: number,
  overrides: Partial<PaymentFixture> = {}
): Promise<PaymentFixture> {
  const defaultPayment = {
    playerId,
    amount: "250.00",
    paymentType: "monthly_fee",
    month: "2024-01",
    dueDate: new Date("2024-01-15").toISOString(),
    status: "pending",
    ...overrides,
  };

  const [payment] = await db
    .insert(payments)
    .values(defaultPayment)
    .returning();

  return payment as PaymentFixture;
}

export async function createMultiplePaymentsForPlayer(
  playerId: number,
  count: number = 3
): Promise<PaymentFixture[]> {
  const paymentPromises = [];
  const currentDate = new Date();

  for (let i = 0; i < count; i++) {
    const month = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
    const monthStr = month.toISOString().slice(0, 7); // YYYY-MM format
    const dueDate = new Date(month.getFullYear(), month.getMonth(), 15);

    paymentPromises.push(
      createPaymentForPlayer(playerId, {
        month: monthStr,
        dueDate: dueDate.toISOString(),
        status: i === 0 ? "pending" : "paid",
        paidDate: i === 0 ? null : new Date(dueDate.getTime() + 86400000).toISOString(), // paid next day
      })
    );
  }

  return Promise.all(paymentPromises);
}

export async function getPaymentsForParent(parentId: number): Promise<any[]> {
  // Get all kids for this parent
  const kids = await db
    .select()
    .from(players)
    .where(eq(players.parentId, parentId));

  if (kids.length === 0) {
    return [];
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
    .where(eq(players.parentId, parentId));

  return allPayments.map(({ payment, player }) => ({
    ...payment,
    kidName: `${player.firstName} ${player.lastName}`,
    kidId: player.id,
  }));
}

export async function cleanupPayments(playerId?: number) {
  if (playerId) {
    await db.delete(payments).where(eq(payments.playerId, playerId));
  } else {
    // Clean up all test payments (be careful with this in production!)
    await db.delete(payments);
  }
}
