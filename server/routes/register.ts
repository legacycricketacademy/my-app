import { Router } from "express";
import { sendEmail } from "../utils/email";
const router = Router();

router.post("/", async (req, res) => {
  const { parentName, email, phone, childName, ageGroup, notes } = req.body || {};
  const record = { parentName, email, phone, childName, ageGroup, notes, createdAt: new Date().toISOString() };

  // Try DB; if schema unknown, just continue (non-blocking)
  try {
    const { db } = await import("@/db");
    const { registrations } = await import("@/db/schema"); // if exists
    // @ts-ignore
    if (registrations) await db.insert(registrations).values(record);
  } catch { /* swallow for now */ }

  // Email notifications (flag-controlled)
  const admin = process.env.ADMIN_EMAIL || process.env.FROM_EMAIL;
  const summary = `New registration:\nParent: ${parentName}\nEmail: ${email}\nPhone: ${phone}\nChild: ${childName}\nAge: ${ageGroup}\nNotes: ${notes||'-'}`;
  if (admin) await sendEmail(admin, "New Legacy Registration", summary);

  if (email) await sendEmail(email, "Legacy Cricket Academy - Registration Received",
    `Hi ${parentName || 'Parent'},\n\nWe received your registration for ${childName}. We'll contact you shortly.\n\n- Legacy Cricket Academy`);

  return res.status(201).json({ ok: true });
});

export default router;
